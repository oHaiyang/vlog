#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod store;

use rusqlite::{params, Connection, Result};
use std::fs::{create_dir_all, File};
use std::io::{self, BufRead};
use std::path::Path;
use store::{Col, PubData, PubPayload, PubTypes, Store};
use tauri::{Manager, State};

fn create_db(db_path: &str) -> Result<Connection> {
  let conn = Connection::open(db_path)?;

  conn.execute("DROP TABLE IF EXISTS log", [])?;

  conn.execute("CREATE TABLE log (entry TEXT)", [])?;

  Ok(conn)
}

fn insert_line(conn: &Connection, entry: String) -> Result<usize> {
  conn.execute("INSERT INTO log (entry) VALUES (?1)", params![entry])
}

fn read_columns(conn: &Connection) -> Result<Vec<Col>> {
  let mut stmt = conn.prepare("SELECT json_each.key AS key, json_each.type AS type FROM log, json_each(log.entry) group by key, type")?;
  let mut rows = Vec::new();
  let rows_iter = stmt.query_map([], |row| {
    Ok(Col {
      name: row.get(0)?,
      data_type: row.get(1)?,
    })
  })?;

  for col in rows_iter {
    rows.push(col?);
  }

  Ok(rows)
}

fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
  P: AsRef<Path>,
{
  let file = File::open(filename)?;
  Ok(io::BufReader::new(file).lines())
}

#[tauri::command]
fn parse_file(
  file_path: String,
  app_handle: tauri::AppHandle,
  state: State<Store>,
) -> Result<(), String> {
  let context = tauri::generate_context!();
  let app_name = context
    .config()
    .package
    .product_name
    .as_ref()
    .ok_or("Failed to get app name.")?;
  let file_stem = Path::new(&file_path)
    .file_stem()
    .ok_or("Invalid file path.")?;
  let mut db_path = tauri::api::path::data_dir().unwrap();
  db_path.push(app_name);
  let db_dir_path = db_path.as_path();
  create_dir_all(db_dir_path).expect("Failed to create database directory.");
  db_path.push(file_stem);
  db_path.set_extension("db");
  let db = create_db(db_path.to_str().unwrap()).expect("Failed to open DB");

  println!("got file_path: {}", file_path);
  println!("use db_path: {:?}", db_path);

  if let Ok(lines) = read_lines(&file_path) {
    for line in lines {
      if let Ok(entry) = line {
        insert_line(&db, entry).expect("Failed to insert log lines");
      }
    }
  }

  app_handle
    .emit_all(
      "state-update",
      PubPayload {
        pub_type: PubTypes::Progress,
        data: PubData::Progress {
          parsing_percent: 1.0,
        },
      },
    )
    .expect("Failed to broadcast state update");

  let rows = read_columns(&db).expect("Failed to get column meta");

  app_handle
    .emit_all(
      "state-update",
      PubPayload {
        pub_type: PubTypes::ColumnMeta,
        data: PubData::ColumnMeta { cols: rows },
      },
    )
    .expect("Failed to broadcast state update");

  Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![parse_file])
    .manage(Store(Default::default()))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
