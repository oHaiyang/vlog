import React, { useState, useCallback } from 'react';
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

export const AppToaster = Toaster.create({
  position: Position.TOP,
});

function App() {
  const [recentFiles] = useState<
    Array<[string, File]>
  >([]);
  const [recentMenuOpen, setRecentMenuOpen] = useState(false);
  const handleSelect = useCallback(async () => {
    const filePath = await dialog.open({
      filters: [{
        extensions: ['json', 'log', 'zip'],
        name: 'Log File, Json File',
      }]
    });
    console.log('filePath: ', filePath);
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
      {/* currentHandle && (
        <Main
          currentHandle={currentHandle as FileSystemFileHandle}
          currentLabel={currentLabel}
          columns={columns}
          dispatch={dispatch}
          sortConfig={sortConfig}
          colsSort={colsSort}
        />
      ) */}
      <section className="flex flex-row items-center justify-center h-full">
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
      </section>
    </main>
  );
}

export default App;
