#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod store;

use chrono::prelude::*;
use rusqlite::functions::{Aggregate, Context, FunctionFlags};
use rusqlite::{params, Connection, Result};
use std::fs::{create_dir_all, File};
use std::io::{self, BufRead};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use store::{Col, PubData, PubPayload, PubTypes, Store};
use tauri::{Manager, State};

struct MayIsDatetime();

impl Aggregate<AtomicBool, bool> for MayIsDatetime {
  fn init(&self, _ctx: &mut Context<'_>) -> Result<AtomicBool> {
    Ok(AtomicBool::new(true))
  }

  fn step(&self, ctx: &mut Context<'_>, is_datetime: &mut AtomicBool) -> Result<()> {
    let v = ctx.get::<String>(0);
    let current = is_datetime.load(Ordering::Relaxed);
    if current
      && (v.is_err()
        || (v.is_ok() && v.as_ref().unwrap().parse::<DateTime<Utc>>().is_err())
        || v.as_ref().unwrap().is_empty())
    {
      is_datetime.store(false, Ordering::Relaxed);
    }

    Ok(())
  }

  fn finalize(&self, _ctx: &mut Context<'_>, is_datetime: Option<AtomicBool>) -> Result<bool> {
    Ok(is_datetime.map_or(false, |ab| ab.load(Ordering::Relaxed)))
  }
}

type BoxError = Box<dyn std::error::Error + Send + Sync + 'static>;
fn create_db(db_path: &str) -> Result<Connection> {
  let conn = Connection::open(db_path)?;

  conn.execute("DROP TABLE IF EXISTS log", [])?;

  conn.execute("CREATE TABLE log (entry TEXT)", [])?;

  conn.create_scalar_function(
    "parse_to_ts_ify",
    1,
    FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
    move |ctx| {
      assert_eq!(ctx.len(), 1, "called with unexpected number of arguments");
      let ts = ctx.get_or_create_aux(0, |vr| -> Result<i64, BoxError> {
        Ok(
          vr.as_str()?
            .parse::<DateTime<Utc>>()
            .map_or(0, |d| d.timestamp_millis()),
        )
      })?;

      Ok(ts)
    },
  )?;

  // parse 下，尝试解析部分字段，看看是不是都是 datetime 类型
  conn.create_aggregate_function(
    "may_is_datetime",
    1,
    FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
    MayIsDatetime(),
  )?;

  Ok(conn)
}

fn insert_line(conn: &Connection, entry: String) -> Result<usize> {
  conn.execute("INSERT INTO log (entry) VALUES (?1)", params![entry])
}

fn read_columns(conn: &Connection) -> Result<Vec<Col>> {
  let mut stmt = conn.prepare(
        "SELECT json_each.key AS key,
            json_each.type AS type, 
            CASE json_each.type WHEN 'text' THEN group_concat(distinct json_each.value) ELSE '' END AS vals,
            CASE json_each.type WHEN 'array' THEN true WHEN 'object' THEN true ELSE false END AS is_json,
            CASE json_each.type WHEN 'text' THEN may_is_datetime(json_each.value) ELSE false END AS is_datetime,
            MAX(CASE json_each.type 
                WHEN 'real' THEN json_each.value 
                WHEN 'integer' THEN json_each.value 
                WHEN 'text' THEN parse_to_ts_ify(json_each.value)
                ELSE 0 END) AS max_val,
            MIN(CASE json_each.type 
                WHEN 'real' THEN json_each.value 
                WHEN 'integer' THEN json_each.value 
                WHEN 'text' THEN parse_to_ts_ify(json_each.value)
                ELSE 0 END) AS min_val
        FROM log, json_each(log.entry) 
        GROUP BY key, type;"
    )?;
  let mut rows = Vec::new();
  let rows_iter = stmt.query_map([], |row| {
    Ok(Col {
      name: row.get(0)?,
      data_type: row.get(1)?,
      vals: row.get(2)?,
      is_json: row.get(3)?,
      is_datetime: row.get(4)?,
      max: row.get(5)?,
      min: row.get(6)?,
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

fn write_entires(file_path: &String, db: &Connection, app_handle: &tauri::AppHandle) -> Result<()> {
  if let Ok(lines) = read_lines(&file_path) {
    for line in lines {
      if let Ok(entry) = line {
        insert_line(&db, entry).expect("Failed to insert log lines");
      }
    }
  }

  app_handle.state::<Store>().publish(
    PubData::Progress {
      parsing_percent: 1.0,
    },
    app_handle,
  );

  Ok(())
}

fn query_and_send_col_meta(db: &Connection, app_handle: &tauri::AppHandle) {
  let cols = read_columns(&db).expect("Failed to get column meta");

  app_handle
    .state::<Store>()
    .publish(PubData::ColumnMeta { cols }, app_handle);
}

fn make_db_path(
  app_name: &String,
  file_path: &String,
) -> std::result::Result<std::path::PathBuf, BoxError> {
  let file_stem = Path::new(&file_path)
    .file_stem()
    .ok_or("Invalid file path.")?;
  let mut db_path = tauri::api::path::data_dir().unwrap();
  println!("use db_path: {:?}", db_path);
  db_path.push(app_name);
  let db_dir_path = db_path.as_path();
  create_dir_all(db_dir_path).expect("Failed to create database directory.");
  db_path.push(file_stem);
  db_path.set_extension("db");

  Ok(db_path)
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

  println!("got file_path: {}", file_path);
  let db_path = make_db_path(app_name, &file_path).expect("Failed to make database path.");
  let db = create_db(db_path.to_str().unwrap()).expect("Failed to open database");

  write_entires(&file_path, &db, &app_handle).expect("Failed to insert entries.");
  query_and_send_col_meta(&db, &app_handle);

  Ok(())
}

#[tauri::command]
fn get_state(
  pub_type: PubTypes,
  state: State<Store>,
) -> Result<PubData, String> {
  Ok(state.get(pub_type))
}

fn main() {
  let builder = tauri::Builder::default();

  builder
    .setup(|app| {
      app.handle();
      app.manage(Store::new());

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![parse_file, get_state])
    .run(tauri::generate_context!())
    .expect("Error while running tauri application");
}
