import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Grid, AutoSizer, ScrollSync } from 'react-virtualized';
import { useColsState } from '../hooks';
import { Row } from '../typings';
import cx from 'classnames';
import { Text, Intent, Icon, Colors, Classes } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';

const rowControlWidth = 24; //px

function Detail(props: {
  className?: string;
  rows: Row[];
  selecting: boolean;
}) {
  const { className, rows, selecting } = props;
  const [hoveringRowId, setHoverringRowId] = useState<string | null>(null);
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065#issuecomment-446425911
  const headerGridRef = useRef<Grid | null>(null);
  const gridRef = useRef<Grid | null>(null);

  const cols = useColsState(true);
  const refreshGrid = useCallback(() => {
    setTimeout(() => headerGridRef.current?.recomputeGridSize(), 0);
    setTimeout(() => gridRef.current?.recomputeGridSize(), 0);
  }, []);

  useEffect(refreshGrid, [rows?.length]);

  const headerGridCellRenderer = useCallback(
    ({ columnIndex, key, style }) => {
      const col = cols[columnIndex];
      let child = (
        <Text ellipsize className="font-bold">
          {col.name}
        </Text>
      );

      if (columnIndex === 0) {
        child = (
          <div className="relative" style={{ paddingLeft: rowControlWidth }}>
            <Text ellipsize>{child}</Text>
          </div>
        );
      }

      const sortHandler = () => {};
      const liftCol = () => {};
      const lowerCol = () => {};
      const sortTip = true
        ? true
          ? 'Switch to DESC'
          : 'Switch to ASC'
        : 'Sort by ASC';

      return (
        <div
          key={key}
          style={style}
          className="flex flex-row items-center pr-8 whitespace-no-wrap"
        >
          {child}
          <Tooltip2 content={sortTip} className="leading-none">
            <Icon
              onClick={sortHandler}
              iconSize={14}
              color={true ? undefined : Colors.GRAY3}
              className="ml-1 cursor-pointer"
              intent={true ? Intent.SUCCESS : Intent.NONE}
              icon={true ? (true ? 'arrow-up' : 'arrow-down') : 'arrow-up'}
            />
          </Tooltip2>
          <Icon
            onClick={liftCol}
            iconSize={14}
            color={Colors.GRAY3}
            className="ml-1 cursor-pointer"
            icon="double-chevron-left"
          />
          <Icon
            onClick={lowerCol}
            iconSize={14}
            color={Colors.GRAY3}
            className="ml-1 cursor-pointer"
            icon="double-chevron-right"
          />
        </div>
      );
    },
    [cols]
  );
  const cellRenderer = useCallback(
    ({ columnIndex, key, rowIndex, style }) => {
      const col = cols[columnIndex];
      const colKey = col.name;
      const rowData = rows[rowIndex];
      const cellData = rowData[colKey];

      let child = (
        <Text className={selecting ? Classes.SKELETON : ''} ellipsize>
          {cellData}
        </Text>
      );

      if (columnIndex === 0) {
        child = (
          <div className="relative" style={{ paddingLeft: rowControlWidth }}>
            {true && (
              <div className="absolute left-0 flex">
                <Tooltip2 content="View as JSON">
                  <Icon
                    icon="code-block"
                    className="cursor-pointer"
                    onClick={() => {}}
                  />
                </Tooltip2>
              </div>
            )}
            <Text ellipsize>{child}</Text>
          </div>
        );
      }

      return (
        <div
          key={key}
          style={{ ...style, ...(col.is_json ? { cusor: 'pointer' } : {}) }}
          className="pr-8 whitespace-no-wrap"
          onClick={col.is_json ? () => {} : () => {}}
          onMouseEnter={setHoverringRowId.bind(null, rowData.__rowid)}
          onMouseLeave={setHoverringRowId.bind(null, null)}
        >
          {child}
        </div>
      );
    },
    [rows, cols, hoveringRowId, selecting]
  );

  return (
    <div className={cx(className, 'flex-grow w-full px-4 flex flex-col')}>
      <ScrollSync>
        {({ scrollLeft, onScroll }) => (
          <>
            <div className="flex-shrink-0" style={{ height: 30 }}>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <Grid
                    ref={headerGridRef}
                    scrollLeft={scrollLeft}
                    className="overflow-hidden"
                    rowCount={1}
                    estimatedColumnSize={100}
                    columnCount={cols.length}
                    width={width}
                    height={30}
                    columnWidth={400}
                    rowClassName="flex flex-row"
                    rowHeight={30}
                    cellRenderer={headerGridCellRenderer}
                  />
                )}
              </AutoSizer>
            </div>
            <div className="flex-grow">
              <AutoSizer>
                {({ width, height }) => (
                  <Grid
                    ref={gridRef}
                    width={width}
                    height={height}
                    rowCount={rows.length}
                    estimatedColumnSize={100}
                    columnCount={cols.length}
                    columnWidth={400}
                    onScroll={onScroll}
                    rowClassName="flex flex-row"
                    rowHeight={30}
                    cellRenderer={cellRenderer}
                  />
                )}
              </AutoSizer>
            </div>
          </>
        )}
      </ScrollSync>
    </div>
  );
}

export default React.memo(Detail);
