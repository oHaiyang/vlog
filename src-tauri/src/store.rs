use std::sync::RwLock;
use strum_macros::Display;
use tauri::{AppHandle, Manager};

#[derive(Clone, Debug, serde::Serialize)]
pub struct Col {
  pub name: String,
  pub data_type: String,
  pub vals: Vec<String>,
  pub is_datetime: bool,
  pub is_json: bool,
  pub should_select: bool,
  pub max: f64,
  pub min: f64,
}

#[derive(Clone, Display, Debug, serde::Serialize, serde::Deserialize)]
pub enum PubTypes {
  Progress,
  ColumnMeta,
}

#[derive(Clone, serde::Serialize)]
pub enum PubData {
  Progress { parsing_percent: f32 },
  ColumnMeta { cols: Vec<Col> },
}

// the payload type must implement `Serialize`.
#[derive(Clone, serde::Serialize)]
pub struct PubPayload {
  pub pub_type: PubTypes,
  pub data: PubData,
}

#[derive(Default, Debug)]
pub struct AppState {
  pub file_name: String,
  pub label: String,
  pub log_names: Vec<String>,
  pub active_log_name: String,
  pub file_label: String,

  pub cols: Vec<Col>,

  pub parsing_percent: f32,
  pub loading: bool,
}

pub struct Store {
  pub state: RwLock<AppState>,
}

impl Store {
  pub fn new() -> Self {
    Self {
      state: RwLock::new(AppState::default()),
    }
  }
  // pulish to local and remote
  pub fn publish(&self, data: PubData, app_handle: &AppHandle) {
    use PubData::*;
    let mut s = self.state.write().unwrap();
    let pub_type = match data.clone() {
      ColumnMeta { cols } => {
        s.cols = cols;
        PubTypes::ColumnMeta
      }
      Progress { parsing_percent } => {
        s.parsing_percent = parsing_percent;
        PubTypes::Progress
      }
    };

    app_handle
      .emit_all("state-update", PubPayload { pub_type, data })
      .expect("Failed to pub app state.");
  }

  pub fn get(&self, pub_type: PubTypes) -> PubData {
    use PubTypes::*;
    match pub_type {
      ColumnMeta => PubData::ColumnMeta {
        cols: self.state.read().unwrap().cols.clone(),
      },
      Progress => PubData::Progress {
        parsing_percent: self.state.read().unwrap().parsing_percent.clone(),
      },
    }
  }
}
