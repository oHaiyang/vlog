enum DataType {
  bool = 'bool',
  text = 'text',
  json = 'json',
  real = 'real',
}

export type NumRangeCondition = [number, number];
export type SelectCondition = {
  items: string[];
  reverse: boolean;
};
export type TextMatchCondition = {
  term: string;
  reverse: boolean;
  case: boolean;
  regex: boolean;
};

export type Condition = NumRangeCondition | SelectCondition | TextMatchCondition;

export type Col = {
  name: string;
  data_type: DataType;
  vals: string[];
  is_datetime: boolean;
  is_json: boolean;
  should_select: boolean;
  max: number;
  min: number;
  condition: Condition;
};

export type Row = {
  // which from sqlite
  __rowid: string;
  [key: string]: string | boolean | number;
};
