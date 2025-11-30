use crate::db::pool::PoolManager;
use crate::models::ConnectionConfig;
use crate::security::keyring;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

static POOL_MANAGER: tokio::sync::OnceCell<Arc<PoolManager>> = tokio::sync::OnceCell::const_new();
static CONNECTIONS: tokio::sync::OnceCell<Arc<RwLock<Vec<ConnectionConfig>>>> =
    tokio::sync::OnceCell::const_new();

async fn get_pool_manager() -> Arc<PoolManager> {
    POOL_MANAGER
        .get_or_init(|| async { Arc::new(PoolManager::new()) })
        .await
        .clone()
}

pub(crate) async fn get_connections_storage() -> Arc<RwLock<Vec<ConnectionConfig>>> {
    CONNECTIONS
        .get_or_init(|| async { Arc::new(RwLock::new(Vec::new())) })
        .await
        .clone()
}

#[derive(Debug, Deserialize)]
pub struct TestConnectionRequest {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct TestConnectionResponse {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn test_connection(request: TestConnectionRequest) -> Result<TestConnectionResponse, String> {
    let (client, connection) = tokio_postgres::connect(
        &format!(
            "host={} port={} dbname={} user={} password={}",
            request.host, request.port, request.database, request.username, request.password
        ),
        tokio_postgres::NoTls,
    )
    .await
    .map_err(|e| format!("Connection failed: {}", e))?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    client
        .simple_query("SELECT 1")
        .await
        .map_err(|e| format!("Query failed: {}", e))?;

    Ok(TestConnectionResponse {
        success: true,
        message: "Connection successful".to_string(),
    })
}

#[derive(Debug, Deserialize)]
pub struct SaveConnectionRequest {
    pub id: Option<String>,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: Option<String>,
}

#[tauri::command]
pub async fn save_connection(request: SaveConnectionRequest) -> Result<String, String> {
    let is_editing = request.id.is_some();
    let connection_id = request.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    // Handle password: if provided, save it; if editing and not provided, keep existing
    if let Some(password) = request.password {
        if !password.is_empty() {
            keyring::save_password(&connection_id, &password)
                .map_err(|e| format!("Failed to save password: {}", e))?;
        } else if is_editing {
            // Editing but password is empty - keep existing password (don't update)
            // This allows editing other fields without requiring password re-entry
        } else {
            // New connection but password is empty - error
            return Err("Password is required for new connections".to_string());
        }
    } else if !is_editing {
        // New connection but no password provided - error
        return Err("Password is required for new connections".to_string());
    }

    // Save connection config
    let config = ConnectionConfig {
        id: connection_id.clone(),
        name: request.name,
        host: request.host,
        port: request.port,
        database: request.database,
        username: request.username,
    };

    let connections = get_connections_storage().await;
    let mut conns = connections.write().await;

    if let Some(existing) = conns.iter_mut().find(|c| c.id == connection_id) {
        *existing = config;
    } else {
        conns.push(config);
    }

    Ok(connection_id)
}

#[tauri::command]
pub async fn get_connections() -> Result<Vec<ConnectionConfig>, String> {
    let connections = get_connections_storage().await;
    let conns = connections.read().await;
    Ok(conns.clone())
}

#[derive(Debug, Deserialize)]
pub struct DeleteConnectionRequest {
    pub id: String,
}

#[tauri::command]
pub async fn get_connection_password(id: String) -> Result<String, String> {
    keyring::get_password(&id)
        .map_err(|e| format!("Failed to get password: {}", e))
}

#[tauri::command]
pub async fn delete_connection(id: String) -> Result<(), String> {
    // Remove from keyring
    keyring::delete_password(&id).ok();

    // Remove from storage
    let connections = get_connections_storage().await;
    let mut conns = connections.write().await;
    conns.retain(|c| c.id != id);

    // Remove from pool
    let pool_manager = get_pool_manager().await;
    pool_manager.remove_connection(&id).await;

    Ok(())
}
