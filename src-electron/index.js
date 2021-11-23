const { BrowserWindow, app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const state = {
  cols: [],
  parsing_percent: 0,
  limit: 50,
};

function normalizeMergedType(merged_type) {
  let types = merged_type.split(',').filter((t) => t !== 'null');

  if (types.includes('text')) {
    return 'text';
  }

  if (types.every((t) => ['true', 'false'].includes(t))) {
    return 'bool';
  }

  if (types.every((t) => ['real', 'interger'].includes(t))) {
    return 'real';
  }

  if (types.every((t) => ['array', 'object'].includes(t))) {
    return 'json';
  }

  return 'text';
}

function setState(type, data, win) {
  switch (type) {
    case 'ColumnMeta':
      {
        if (state.cols.length === 0) {
          state.cols = data.cols;
        } else {
          for (const col of data.cols) {
            const name = col.name;
            const idx = state.cols.findIndex((c) => c.name === name);
            Object.assign(state.cols[idx], col);
          }
        }
      }
      break;
    case 'Progress':
      state.parsing_percent = data.parsing_percent;
      break;
    case 'Limit':
      state.limit = data.limit;
      break;
  }

  win.webContents.send('state-update', {
    pub_type: type,
    data: {
      [type]: data,
    },
  });
}
function getState(type) {
  switch (type) {
    case 'ColumnMeta': {
      return { cols: state.cols };
    }
    case 'Progress':
      return { parsing_percent: state.parsing_percent };
    case 'Limit':
      return { limit: state.limit };
  }
}

let db = null;

async function processLineByLine(filePath, handler) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    handler(line);
  }
}

app.once('ready', () => {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      nodeIntegrationInSubFrames: true,
      contextIsolation: false,
    },
  });

  win.loadURL('http://localhost:3000');

  win.webContents.openDevTools();

  ipcMain.on('select-and-parse-file', async () => {
    const { filePaths } = await dialog.showOpenDialog();
    const filePath = filePaths[0];
    const dbPath = path.resolve(app.getPath('userData'), 'test.db');

    db = require('better-sqlite3')(dbPath);

    console.log('filePath', filePath);
    console.log('dbPath', dbPath);
    console.log('db', db);

    db.exec('DROP TABLE IF EXISTS log');
    db.exec('CREATE TABLE log (entry TEXT)');
    db.function('parse_to_ts_ify', (timeStr) => {
      const ts = Date.parse(timeStr);
      if (Number.isNaN(ts)) return 0;
      return ts;
    });
    const stmt = db.prepare('INSERT INTO log (entry) VALUES (?)');

    await processLineByLine(filePath, (line) => {
      stmt.run(line);
    });

    setState(
      'Progress',
      {
        parsing_percent: 1,
      },
      win
    );

    const parseStatment = db.prepare(
      `SELECT json_each.key AS name,
            group_concat(DISTINCT json_each.type) AS merged_type,
            CASE json_each.type WHEN 'text' THEN group_concat(distinct json_each.value) ELSE '' END AS vals,
            CASE json_each.type WHEN 'array' THEN true WHEN 'object' THEN true ELSE false END AS is_json,
            CASE json_each.key WHEN 'logTime' THEN true ELSE false END AS is_datetime,
            MAX(CASE json_each.type 
                WHEN 'real' THEN json_each.value 
                WHEN 'integer' THEN json_each.value 
                WHEN 'text' THEN parse_to_ts_ify(json_each.value)
                ELSE 0 END) AS [max],
            MIN(CASE json_each.type 
                WHEN 'real' THEN json_each.value 
                WHEN 'integer' THEN json_each.value 
                WHEN 'text' THEN parse_to_ts_ify(json_each.value)
                ELSE 0 END) AS [min]
        FROM log, json_each(log.entry) 
        GROUP BY name;`
    );

    const cols = parseStatment.all();

    setState(
      'ColumnMeta',
      {
        cols: cols.map((c) => ({
          ...c,
          vals: typeof c.vals === 'string' ? c.vals.split(',') : c.vals,
          data_type: normalizeMergedType(c.merged_type),
          should_select: !!c.is_datetime
        })),
      },
      win
    );
  });

  ipcMain.handle('get-state', (_, type) => {
    return getState(type);
  });

  ipcMain.on('config-limit', (_, limit) => {
    setState(
      'Limit',
      {
        limit,
      },
      win
    );
  });

  ipcMain.on('config-select', (_, { colName, shouldSelect }) => {
    setState(
      'ColumnMeta',
      {
        cols: [
          {
            name: colName,
            should_select: shouldSelect,
          },
        ],
      },
      win
    );
  });

  ipcMain.handle('select', () => {
    const col_clause = state.cols
      .filter((c) => c.should_select)
      .map((c) => `json_extract(entry, '$.${c.name}') AS ${c.name} `)
      .join(',');
    if (!col_clause) return [];
    const SQL = 'SELECT ' + col_clause + `FROM log LIMIT ${state.limit}`;
    return db.prepare(SQL).all();
  });
});
