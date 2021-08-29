#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
  P: AsRef<Path>,
{
  let file = File::open(filename)?;
  Ok(io::BufReader::new(file).lines())
}

#[tauri::command]
fn parse_file(file_path: String) -> Result<(), String> {
  let context = tauri::generate_context!();
  let app_name = context.config().package.product_name.as_ref().ok_or("Failed to get app name.")?;
  let file_stem = Path::new(&file_path).file_stem().ok_or("Invalid file path.")?;
  let mut db_path = tauri::api::path::data_dir().unwrap();
  db_path.push(app_name);
  db_path.push(file_stem);
  db_path.set_extension("db");

  println!("got file_path: {}", file_path);
  println!("use db_path: {:?}", db_path);

  if let Ok(lines) = read_lines(&file_path) {
    for line in lines {
      if let Ok(entry) = line {
        // println!("{}", entry);
      }
    }
  }

  Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![parse_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
