use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use strum_macros::Display;
use tauri::{AppHandle, Manager};

struct ColMetaFileds {}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(untagged)]
pub enum CellData {
  Bool(bool),
  Text(String),
  Real(f64),
  JSON(String),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum Condition {
  NumRange(f64, f64),
  Select {
    items: Vec<String>,
    reverse: bool,
  },
  TextMatch {
    term: String,
    reverse: bool,
    case: bool,
    regex: bool,
  },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum DataType {
  #[serde(rename = "bool")]
  Bool,
  #[serde(rename = "text")]
  Text,
  #[serde(rename = "real")]
  Real,
  #[serde(rename = "json")]
  JSON,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(untagged)]
pub enum ColFields {
  Meta {
    data_type: DataType,
    vals: Vec<String>,
    is_datetime: bool,
    is_json: bool,
    max: f64,
    min: f64,
  },
  Filter {
    should_select: bool,
    condition: Option<Condition>,
  },
}

#[derive(Clone, Debug, serde::Serialize)]
pub struct Col {
  pub name: String,

  #[serde(flatten)]
  pub meta: Option<ColFields>,
  #[serde(flatten)]
  pub filter: Option<ColFields>,
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

  // TODO: use hashmap to improve update performance
  pub cols: Vec<Col>,
  pub rows: HashMap<String, CellData>,

  pub parsing_percent: f32,
  pub loading: bool,
}

pub struct Store {
  pub inner: RwLock<AppState>,
}

impl Store {
  pub fn new() -> Self {
    Self {
      inner: RwLock::new(AppState::default()),
    }
  }
  // pulish to local and remote
  pub fn publish(&self, data: PubData, app_handle: &AppHandle) {
    use PubData::*;
    let mut s = self.inner.write().unwrap();
    let pub_type = match data.clone() {
      ColumnMeta { cols } => {
        if s.cols.is_empty() {
          s.cols = cols;
        } else {
          let mut cols_map: HashMap<String, Col> =
            cols.iter().map(|c| (c.name.clone(), c.clone())).collect();
          for c in s.cols.iter_mut() {
            if cols_map.contains_key(&c.name) {
              let next_col = cols_map.get_mut(&c.name).unwrap();
              if let Some(filter) = next_col.filter.take() {
                c.filter = Some(filter);
              }
              if let Some(meta) = next_col.meta.take() {
                c.meta = Some(meta);
              }
            }
          }
        }
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
        cols: self.inner.read().unwrap().cols.clone(),
      },
      Progress => PubData::Progress {
        parsing_percent: self.inner.read().unwrap().parsing_percent.clone(),
      },
    }
  }
}
