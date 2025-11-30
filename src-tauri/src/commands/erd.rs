use crate::commands::connection::get_connections_storage;
use crate::db::pool::PoolManager;
use crate::models::{ERDData, ERDEdge, ERDNode};
use crate::security::keyring;
use anyhow::Result;
use serde::Deserialize;
use std::sync::Arc;

async fn get_pool_manager() -> Arc<PoolManager> {
    static POOL_MANAGER: tokio::sync::OnceCell<Arc<PoolManager>> =
        tokio::sync::OnceCell::const_new();
    POOL_MANAGER
        .get_or_init(|| async { Arc::new(PoolManager::new()) })
        .await
        .clone()
}

async fn get_client_for_connection(connection_id: &str) -> Result<Arc<tokio_postgres::Client>, String> {
    let connections = get_connections_storage().await;
    let conns = connections.read().await;

    let config = conns
        .iter()
        .find(|c| c.id == connection_id)
        .ok_or_else(|| "Connection not found".to_string())?;

    let password = keyring::get_password(connection_id)
        .map_err(|e| format!("Failed to get password: {}", e))?;

    let pool_manager = get_pool_manager().await;
    pool_manager
        .get_client(
            connection_id,
            &config.host,
            config.port,
            &config.database,
            &config.username,
            &password,
        )
        .await
        .map_err(|e| format!("Failed to get client: {}", e))
}

#[derive(Debug, Deserialize)]
pub struct GetERDDataRequest {
    pub connection_id: String,
    pub schema: Option<String>,
}

#[tauri::command]
pub async fn get_erd_data(request: GetERDDataRequest) -> Result<ERDData, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    // Get all tables
    let schema_filter = request
        .schema
        .as_ref()
        .map(|s| format!("AND table_schema = '{}'", s))
        .unwrap_or_else(|| "".to_string());

    let tables_query = format!(
        r#"
        SELECT DISTINCT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
        {}
        ORDER BY table_schema, table_name
    "#,
        schema_filter
    );

    let table_rows = client
        .query(&tables_query, &[])
        .await
        .map_err(|e| format!("Failed to query tables: {}", e))?;

    let mut nodes = Vec::new();
    let mut node_ids = std::collections::HashMap::new();

    for row in table_rows {
        let schema: String = row.get("table_schema");
        let table: String = row.get("table_name");
        let node_id = format!("{}.{}", schema, table);
        node_ids.insert(node_id.clone(), nodes.len());
        nodes.push(ERDNode {
            id: node_id.clone(),
            label: table.clone(),
            schema: schema.clone(),
            table: table.clone(),
        });
    }

    // Get foreign key relationships
    let fk_query = format!(
        r#"
        SELECT
            tc.table_schema AS from_schema,
            tc.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.table_schema AS to_schema,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        {}
        ORDER BY tc.table_schema, tc.table_name
    "#,
        schema_filter
    );

    let fk_rows = client
        .query(&fk_query, &[])
        .await
        .map_err(|e| format!("Failed to query foreign keys: {}", e))?;

    let mut edges = Vec::new();

    for row in fk_rows {
        let from_schema: String = row.get("from_schema");
        let from_table: String = row.get("from_table");
        let from_column: String = row.get("from_column");
        let to_schema: String = row.get("to_schema");
        let to_table: String = row.get("to_table");
        let to_column: String = row.get("to_column");

        let from_id = format!("{}.{}", from_schema, from_table);
        let to_id = format!("{}.{}", to_schema, to_table);

        if node_ids.contains_key(&from_id) && node_ids.contains_key(&to_id) {
            edges.push(ERDEdge {
                from: from_id,
                to: to_id,
                label: format!("{} -> {}", from_column, to_column),
                from_column,
                to_column,
            });
        }
    }

    Ok(ERDData { nodes, edges })
}
