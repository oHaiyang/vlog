import { useState, useCallback, useEffect } from 'react';
import { Col, Condition, Row } from '../typings';
import produce from 'immer';
const { ipcRenderer } = require('electron');

export function useSelectFile() {
  return useCallback(async () => {
    ipcRenderer.send('select-and-parse-file');
  }, []);
}

export function useConfigSelect(col_name: string) {
  const configSelect = useCallback(
    async (should_select: boolean, condition?: Condition) => {
      await ipcRenderer.send('config-select', {
        colName: col_name,
        shouldSelect: should_select,
        condition,
      });
    },
    [col_name]
  );

  return configSelect;
}

export function useConfigLimit() {
  const configSelect = useCallback(async (limit: number) => {
    await ipcRenderer.send('config-limit', Number(limit) || 0);
  }, []);

  return configSelect;
}

export function useAppState<T>(
  pub_key: string,
  initial_value: T,
  updater?: (paylaod: T) => (state: T) => T
) {
  const [state, setState] = useState<T>(initial_value);
  useEffect(() => {
    ipcRenderer.on('state-update', (event: any, payload: any) => {
      const { pub_type, data } = payload as {
        pub_type: string;
        data: { [key: string]: T };
      };
      if (pub_type === pub_key) {
        setState(updater ? updater(data[pub_key]) : data[pub_key]);
      }
    });

    (async () => {
      const data = await ipcRenderer.invoke('get-state', pub_key);
      console.log('get-state', data);
      setState(data);
    })();

    return () => {
      ipcRenderer.removeAllListeners('state-update');
    };
  }, []);

  return state;
}

const colsUpdater =
  (payload: { cols: Array<Col> }) => (state: { cols: Array<Col> }) => {
    return produce(state, (draft) => {
      const { cols } = payload;
      for (const col of cols) {
        const idx = draft.cols.findIndex((c) => c.name === col.name);
        if (idx >= 0) {
          Object.assign(draft.cols[idx], col);
        } else {
          draft.cols.push(col);
        }
      }
    });
  };

export function useColsState(onlyShouldSelect: boolean = false) {
  const { cols } = useAppState<{ cols: Array<Col> }>(
    'ColumnMeta',
    {
      cols: [],
    },
    colsUpdater
  );

  if (onlyShouldSelect) return cols.filter((col) => col.should_select);
  return cols;
}

export function useLimitState() {
  const { limit } = useAppState<{ limit: number }>('Limit', { limit: 50 });

  return limit;
}

export function useRows(): [Row[], boolean, () => void] {
  const [selecting, setSelecting] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const select = useCallback(() => {
    (async () => {
      setSelecting(true);
      try {
        const rows: Row[] = await ipcRenderer.invoke('select');
        console.log('selected rows: ', rows)
        setRows(rows);
      } catch (error) {
      } finally {
        setSelecting(false);
      }
    })();
  }, []);

  useEffect(select, []);

  return [rows, selecting, select];
}
