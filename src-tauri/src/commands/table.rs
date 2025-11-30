use crate::db::pool::PoolManager;
use crate::db::schema::get_table_schema;
use crate::models::TableSchema;
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
    use crate::commands::connection::get_connections_storage;

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
pub struct GetTableSchemaRequest {
    pub connection_id: String,
    pub schema: String,
    pub table: String,
}

#[tauri::command]
pub async fn get_table_schema_cmd(
    request: GetTableSchemaRequest,
) -> Result<TableSchema, String> {
    let client = get_client_for_connection(&request.connection_id).await?;
    get_table_schema(&client, &request.schema, &request.table)
        .await
        .map_err(|e| format!("Failed to get table schema: {}", e))
}

#[derive(Debug, Deserialize)]
pub struct GetTableDataRequest {
    pub connection_id: String,
    pub schema: String,
    pub table: String,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[tauri::command]
pub async fn get_table_data(request: GetTableDataRequest) -> Result<crate::models::QueryResult, String> {
    use crate::commands::query::execute_query;
    use crate::commands::query::ExecuteQueryRequest;

    let limit = request.limit.unwrap_or(100);
    let offset = request.offset.unwrap_or(0);

    let query = format!(
        "SELECT * FROM {}.{} LIMIT {} OFFSET {}",
        request.schema, request.table, limit, offset
    );

    execute_query(ExecuteQueryRequest {
        connection_id: request.connection_id,
        query,
    })
    .await
}

#[derive(Debug, Deserialize)]
pub struct UpdateTableDataRequest {
    pub connection_id: String,
    pub schema: String,
    pub table: String,
    pub updates: Vec<TableUpdate>,
}

#[derive(Debug, Deserialize)]
pub struct TableUpdate {
    pub r#type: String, // "INSERT", "UPDATE", "DELETE"
    pub data: serde_json::Value,
    pub where_clause: Option<String>,
}

#[tauri::command]
pub async fn update_table_data(request: UpdateTableDataRequest) -> Result<usize, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    let mut affected_rows = 0;

    for update in request.updates {
        match update.r#type.as_str() {
            "INSERT" => {
                // This is a simplified version - in production, you'd want proper SQL building
                let query = format!("INSERT INTO {}.{} DEFAULT VALUES", request.schema, request.table);
                let rows = client
                    .execute(&query, &[])
                    .await
                    .map_err(|e| format!("INSERT failed: {}", e))?;
                affected_rows += rows as usize;
            }
            "UPDATE" => {
                let where_clause = update.where_clause.unwrap_or_else(|| "1=0".to_string());
                let query = format!("UPDATE {}.{} SET ... WHERE {}", request.schema, request.table, where_clause);
                let rows = client
                    .execute(&query, &[])
                    .await
                    .map_err(|e| format!("UPDATE failed: {}", e))?;
                affected_rows += rows as usize;
            }
            "DELETE" => {
                let where_clause = update.where_clause.unwrap_or_else(|| "1=0".to_string());
                let query = format!("DELETE FROM {}.{} WHERE {}", request.schema, request.table, where_clause);
                let rows = client
                    .execute(&query, &[])
                    .await
                    .map_err(|e| format!("DELETE failed: {}", e))?;
                affected_rows += rows as usize;
            }
            _ => return Err("Invalid update type".to_string()),
        }
    }

    Ok(affected_rows)
}

#[derive(Debug, Deserialize)]
pub struct GetSchemasRequest {
    pub connection_id: String,
}

#[derive(Debug, serde::Serialize)]
pub struct SchemaInfo {
    pub name: String,
}

#[tauri::command]
pub async fn get_schemas(request: GetSchemasRequest) -> Result<Vec<SchemaInfo>, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    let query = r#"
        SELECT DISTINCT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
    "#;

    let rows = client
        .query(query, &[])
        .await
        .map_err(|e| format!("Failed to query schemas: {}", e))?;

    let schemas: Vec<SchemaInfo> = rows
        .iter()
        .map(|row| SchemaInfo {
            name: row.get("schema_name"),
        })
        .collect();

    Ok(schemas)
}

#[derive(Debug, Deserialize)]
pub struct GetTablesRequest {
    pub connection_id: String,
    pub schema: String,
}

#[derive(Debug, serde::Serialize)]
pub struct TableInfo {
    pub name: String,
    pub schema: String,
}

#[tauri::command]
pub async fn get_tables(request: GetTablesRequest) -> Result<Vec<TableInfo>, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    let query = r#"
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    "#;

    let rows = client
        .query(query, &[&request.schema])
        .await
        .map_err(|e| format!("Failed to query tables: {}", e))?;

    let tables: Vec<TableInfo> = rows
        .iter()
        .map(|row| TableInfo {
            name: row.get("table_name"),
            schema: request.schema.clone(),
        })
        .collect();

    Ok(tables)
}
