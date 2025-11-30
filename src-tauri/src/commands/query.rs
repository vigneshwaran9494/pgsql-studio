use crate::db::pool::PoolManager;
use crate::models::QueryResult;
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
pub struct ExecuteQueryRequest {
    pub connection_id: String,
    pub query: String,
}

#[tauri::command]
pub async fn execute_query(request: ExecuteQueryRequest) -> Result<QueryResult, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    let rows = client
        .query(&request.query, &[])
        .await
        .map_err(|e| format!("Query execution failed: {}", e))?;

    if rows.is_empty() {
        return Ok(QueryResult {
            columns: vec![],
            rows: vec![],
            row_count: 0,
        });
    }

    let columns: Vec<String> = rows[0]
        .columns()
        .iter()
        .map(|c| c.name().to_string())
        .collect();

    let result_rows: Vec<Vec<serde_json::Value>> = rows
        .iter()
        .map(|row| {
            columns
                .iter()
                .enumerate()
                .map(|(i, _)| {
                    let value: serde_json::Value = match row.try_get::<_, String>(i) {
                        Ok(v) => serde_json::Value::String(v),
                        Err(_) => {
                            // Try other types
                            if let Ok(v) = row.try_get::<_, i32>(i) {
                                serde_json::Value::Number(v.into())
                            } else if let Ok(v) = row.try_get::<_, i64>(i) {
                                serde_json::Value::Number(v.into())
                            } else if let Ok(v) = row.try_get::<_, f64>(i) {
                                serde_json::Value::Number(
                                    serde_json::Number::from_f64(v).unwrap_or(0.into())
                                )
                            } else if let Ok(v) = row.try_get::<_, bool>(i) {
                                serde_json::Value::Bool(v)
                            } else {
                                serde_json::Value::Null
                            }
                        }
                    };
                    value
                })
                .collect()
        })
        .collect();

    let row_count = result_rows.len();

    Ok(QueryResult {
        columns,
        rows: result_rows,
        row_count,
    })
}

#[tauri::command]
pub async fn explain_query(request: ExecuteQueryRequest) -> Result<String, String> {
    let client = get_client_for_connection(&request.connection_id).await?;

    let explain_query = format!("EXPLAIN ANALYZE {}", request.query);

    let rows = client
        .query(&explain_query, &[])
        .await
        .map_err(|e| format!("EXPLAIN query failed: {}", e))?;

    let result: String = rows
        .iter()
        .map(|row| {
            row.get::<_, String>(0)
        })
        .collect::<Vec<_>>()
        .join("\n");

    Ok(result)
}
