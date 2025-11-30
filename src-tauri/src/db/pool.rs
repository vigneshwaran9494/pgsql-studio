use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio_postgres::{Client, NoTls};

type ConnectionPool = Arc<RwLock<HashMap<String, Arc<Client>>>>;

pub struct PoolManager {
    pools: ConnectionPool,
}

impl PoolManager {
    pub fn new() -> Self {
        Self {
            pools: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn get_client(
        &self,
        connection_id: &str,
        host: &str,
        port: u16,
        database: &str,
        username: &str,
        password: &str,
    ) -> Result<Arc<Client>> {
        let mut pools = self.pools.write().await;

        if let Some(client) = pools.get(connection_id) {
            // Test if connection is still alive
            match client.simple_query("SELECT 1").await {
                Ok(_) => return Ok(Arc::clone(client)),
                Err(_) => {
                    // Connection is dead, remove it
                    pools.remove(connection_id);
                }
            }
        }

        // Create new connection
        let (client, connection) = tokio_postgres::connect(
            &format!(
                "host={} port={} dbname={} user={} password={}",
                host, port, database, username, password
            ),
            NoTls,
        )
        .await?;

        // Spawn connection task
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });

        let client_arc = Arc::new(client);
        pools.insert(connection_id.to_string(), Arc::clone(&client_arc));

        Ok(client_arc)
    }

    pub async fn remove_connection(&self, connection_id: &str) {
        let mut pools = self.pools.write().await;
        pools.remove(connection_id);
    }
}

impl Default for PoolManager {
    fn default() -> Self {
        Self::new()
    }
}
