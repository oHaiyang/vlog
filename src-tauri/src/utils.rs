use crate::store::DataType;
use std::collections::HashSet;
use std::iter::FromIterator;

// The "type" column is an SQL text value taken from ('null', 'true', 'false', 'integer', 'real', 'text', 'array', 'object') according to the type of the current JSON element.
// from: https://www.sqlite.org/json1.html#jeach
const BOOL_TYPES: [&str; 2] = ["true", "false"];
const NUMBER_TYPES: [&str; 2] = ["integer", "real"];
const JSON_TYPES: [&str; 2] = ["array", "object"];

pub fn normalize_json_each_types(merged_type: String) -> DataType {
  let mut type_set = HashSet::from_iter(merged_type.split(','));

  // We don't count on "null" type
  if type_set.contains("null") {
    type_set.remove("null");
  }

  if type_set.contains("text") {
    return DataType::Text;
  }

  if type_set.is_subset(&HashSet::from(BOOL_TYPES)) {
    return DataType::Bool;
  }

  if type_set.is_subset(&HashSet::from(NUMBER_TYPES)) {
    return DataType::Real;
  }

  if type_set.is_subset(&HashSet::from(JSON_TYPES)) {
    return DataType::JSON;
  }

  return DataType::Text;
}
