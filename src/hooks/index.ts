import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { Col, Condition, Row } from '../typings';
import produce from 'immer';
import { dialog } from '@tauri-apps/api';

export function useSelectFile() {
  return useCallback(async () => {
    let filePath = await dialog.open({
      filters: [
        {
          extensions: ['json', 'log', 'zip'],
          name: 'Log File, Json File',
        },
      ],
    });
    if (Array.isArray(filePath)) filePath = filePath[0];

    await invoke('parse_file', { filePath });
  }, []);
}

export function useConfigSelect(col_name: string) {
  const configSelect = useCallback(
    async (should_select: boolean, condition?: Condition) => {
      await invoke('config_select', {
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
    await invoke('config_limit', {
      limit: Number(limit) || 0,
    });
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
    const unlisten = listen('state-update', (event) => {
      const { payload } = event;
      const { pub_type, data } = payload as {
        pub_type: string;
        data: { [key: string]: T };
      };
      if (pub_type === pub_key) {
        setState(updater ? updater(data[pub_key]) : data[pub_key]);
        // console.log('[state-update]', pub_key, event, updater ? updater(data[pub_key]) : data[pub_key]);
      }
    });

    (async () => {
      const data = await invoke<{ [key: string]: T }>('get_state', {
        pubType: pub_key,
      });
      setState(data[pub_key]);
    })();

    return () => {
      (async () => {
        const fn = await unlisten;
        fn();
      })();
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

      return draft;
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
  const limit = useAppState<number>('Limit', 50);

  return limit;
}

export function useRows(): [Row[], boolean, () => void] {
  const [selecting, setSelecting] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const select = useCallback(() => {
    (async () => {
      setSelecting(true);
      try {
        const rows: Row[] = await invoke('select', {
          limit: 10,
        });
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
