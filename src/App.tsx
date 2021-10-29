import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Elevation,
  Colors,
  Tag,
  Intent,
  Button,
  Menu,
  MenuItem,
  Toaster,
  Position,
} from '@blueprintjs/core';
import { Popover2 } from "@blueprintjs/popover2";
import { dialog } from '@tauri-apps/api';
import './App.css';
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import Main from './components/Main';

export const AppToaster = Toaster.create({
  position: Position.TOP,
});

export function useDBState<T>(pub_key: string, initial_value: T) {
  const [state, setState] = useState<T>(initial_value);
  useEffect(() => {
    const unlisten = listen('state-update', event => {
      const { payload } = event;
      const { pub_type, data } = payload as { pub_type: string, data: { [key: string]: T } };
      if (pub_type === pub_key) {
        setState(data[pub_key]);
        console.log('[state-update]', pub_key, event);
      }
    })

    return () => {
      (async () => { const fn = await unlisten; fn(); })();
    }
  }, []);

  return state;
}

function App() {
  const [recentFiles] = useState<
    Array<[string, File]>
  >([]);
  const { parsing_percent } = useDBState('Progress', { parsing_percent: 0 });
  const [recentMenuOpen, setRecentMenuOpen] = useState(false);
  const handleSelect = useCallback(async () => {
    let filePath = await dialog.open({
      filters: [{
        extensions: ['json', 'log', 'zip'],
        name: 'Log File, Json File',
      }]
    });
    if (Array.isArray(filePath)) filePath = filePath[0];

    console.log('filePath: ', filePath);

    const ret = await invoke('parse_file', { filePath });

    console.log('ret: ', ret);
  }, []);


  const recentMenu = (
    <Menu>
      {recentFiles.map(([label, handle]: [string, File]) => {
        return (
          <MenuItem
            text={label}
            key={handle.name}
            label={handle.name}
            onClick={async (event: React.MouseEvent) => {
              event.stopPropagation();
            }}
          />
        );
      })}
    </Menu>
  );

  return (
    <main
      className="w-screen h-screen bp3-dark"
      style={{ backgroundColor: Colors.DARK_GRAY3 }}
    >
      {parsing_percent === 1 && (
        <Main />
      )}
      {parsing_percent < 1 && <section className="flex flex-row items-center justify-center h-full">
          <Card
            interactive={true}
            elevation={Elevation.TWO}
            onClick={handleSelect}
            className="relative flex flex-col items-center justify-center w-2/5 h-64"
          >
            {recentFiles.length > 0 && (
              <Popover2
                isOpen={recentMenuOpen}
                content={recentMenu}
                position="right-top"
                className="absolute top-0 left-0 mt-4 ml-4"
                onClose={() => {
                  setRecentMenuOpen(false);
                }}
              >
                <Button
                  minimal
                  intent={Intent.SUCCESS}
                  icon="menu-open"
                  text="Recent Files"
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setRecentMenuOpen(true);
                  }}
                />
              </Popover2>
            )}
            <h2 className="mb-3 text-3xl text-current">
              点击选择
              <span className="line-through bp3-text-disabled">或拖拽</span>
              上传
            </h2>

            <p
              className="flex items-center bp3-text-large"
              style={{ color: Colors.GRAY3 }}
            >
              支持
              <Tag minimal intent={Intent.WARNING} className="mx-1">
                .zip
              </Tag>
              日志包
            </p>
          </Card>
      </section>}
    </main>
  );
}

export default App;
