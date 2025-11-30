use crate::models::{ColumnInfo, TableSchema};
use anyhow::Result;
use tokio_postgres::Client;

pub async fn get_table_schema(client: &Client, schema: &str, table: &str) -> Result<TableSchema> {
    let query = r#"
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
    "#;

    let rows = client.query(query, &[&schema, &table]).await?;

    let columns: Vec<ColumnInfo> = rows
        .iter()
        .map(|row| ColumnInfo {
            name: row.get("column_name"),
            data_type: row.get("data_type"),
            is_nullable: row.get::<_, String>("is_nullable") == "YES",
            default_value: row.get("column_default"),
        })
        .collect();

    Ok(TableSchema {
        name: format!("{}.{}", schema, table),
        columns,
    })
}
