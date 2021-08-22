#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn parse_file(file_path: String) -> String {
  println!("Got file_path: {}", file_path);

  file_path
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![parse_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
