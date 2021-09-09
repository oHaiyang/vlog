use std::sync::Mutex;
use strum_macros::Display;

#[derive(Default, Debug)]
pub struct InnerStore {
  pub file_name: String,
  pub label: String,
  pub log_names: Vec<String>,
  pub loading: bool,
  pub parsing_percent: f32,
  pub active_log_name: String,
  pub file_label: String,
}

#[derive(Clone, Display, Debug, serde::Serialize)]
pub enum PubTypes {
  Progress,
}

#[derive(Clone, serde::Serialize)]
pub enum PubData {
  Progress { parsing_percent: f32 },
}

// the payload type must implement `Serialize`.
#[derive(Clone, serde::Serialize)]
pub struct PubPayload {
  pub pub_type: PubTypes,
  pub data: PubData,
}

#[derive(Default, Debug)]
pub struct Store(pub Mutex<InnerStore>);

// the payload type must implement `Serialize`.
#[derive(serde::Serialize)]
struct ParsingPercent {
  pub parsing_percent: f32,
}

impl Store {
  fn publish(&self) {}

  fn set() {}
}
