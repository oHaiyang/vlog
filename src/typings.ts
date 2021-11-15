export type Col = {
  name: string,
  data_type: string,
  vals: string[],
  is_datetime: boolean,
  is_json: boolean,
  should_select: boolean,
  max: number,
  min: number,
}

export type Row = {
  // which from sqlite 
  __rowid: string;
  [key: string]: string | boolean | number;
}
