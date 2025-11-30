use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    // Password is stored encrypted, not in this struct
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableSchema {
    pub name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ERDNode {
    pub id: String,
    pub label: String,
    pub schema: String,
    pub table: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ERDEdge {
    pub from: String,
    pub to: String,
    pub label: String,
    pub from_column: String,
    pub to_column: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ERDData {
    pub nodes: Vec<ERDNode>,
    pub edges: Vec<ERDEdge>,
}
