// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;
mod security;


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::connection::test_connection,
            commands::connection::save_connection,
            commands::connection::get_connections,
            commands::connection::get_connection_password,
            commands::connection::delete_connection,
            commands::query::execute_query,
            commands::query::explain_query,
            commands::table::get_table_schema_cmd,
            commands::table::get_table_data,
            commands::table::update_table_data,
            commands::erd::get_erd_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
