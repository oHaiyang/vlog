import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import { Grid, AutoSizer, InfiniteLoader, ScrollSync } from 'react-virtualized';
import { useAppState, useColsState } from '../hooks';
import { Col, Row } from '../typings';
import cx from 'classnames';
import { Text, Intent, Icon, Colors } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';

type DetailProps = {
  className: string;
  previewingIdx: number;
};

const rowControlWidth = 24; //px

const Detail: React.FC<DetailProps> = (props) => {
  const {
    className,
    previewingIdx,
  } = props;
  const [sliceCursor, setSliceCursor] = useState(200);
  const [hoveringRowId, setHoverringRowId] = useState<string | null>(null);
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065#issuecomment-446425911
  const headerGridRef = useRef<Grid | null>(null);
  const gridRef = useRef<Grid | null>(null);

  const cols = useColsState();
  const lines: Row[] = [];
  const handleLoadMoreRows = useCallback(async ({ startIndex, stopIndex }) => {
    setSliceCursor(stopIndex);
  }, []);
  const handleIsRowLoaded = useCallback(({ index }) => index < sliceCursor, [
    sliceCursor,
  ]);
  const refreshGrid = useCallback(() => {
    setTimeout(() => headerGridRef.current?.recomputeGridSize(), 0);
    setTimeout(() => gridRef.current?.recomputeGridSize(), 0);
  }, []);
  const showPreview = useCallback(
    (idx: number, dataKey: DataKey) => {},
    []
  );

  useEffect(refreshGrid, [lines?.length]);

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
        ? sortConfig.asc
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
              icon={
                true
                  ? sortConfig.asc
                    ? 'arrow-up'
                    : 'arrow-down'
                  : 'arrow-up'
              }
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
    [cols, sortConfig]
  );
  const cellRenderer = useCallback(
    ({ columnIndex, key, rowIndex, style, parent }) => {
      let child;
      const col = cols[columnIndex];
      const colKey = col.name;
      const rowData = lines[rowIndex];
      const cellData = rowData[colKey];

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
    [lines, cols, hoveringRowId, showPreview, previewingIdx]
  );

  return (
    <div className={cx(className, 'flex-grow w-full px-4 flex flex-col')}>
      <ScrollSync>
        {({ scrollLeft, onScroll }) => (
          <>
            <div className="flex-shrink-0" style={{ height: 30 }}>
              <AutoSizer>
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
                    columnWidth={() => 20}
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
                  <InfiniteLoader
                    loadMoreRows={handleLoadMoreRows}
                    isRowLoaded={handleIsRowLoaded}
                    rowCount={lines.length}
                  >
                    {({ onRowsRendered, registerChild }) => (
                      <Grid
                        ref={(ref) => {
                          registerChild(ref);
                          gridRef.current = ref;
                        }}
                        width={width}
                        height={height}
                        rowCount={lines.length}
                        estimatedColumnSize={100}
                        columnCount={cols.length}
                        columnWidth={() => 20}
                        onScroll={onScroll}
                        rowClassName="flex flex-row"
                        rowHeight={30}
                        cellRenderer={cellRenderer}
                        onSectionRendered={({
                          columnStartIndex,
                          columnStopIndex,
                          rowStartIndex,
                          rowStopIndex,
                        }) => {
                          const startIndex =
                            rowStartIndex * cols.length +
                            columnStartIndex;
                          const stopIndex =
                            rowStopIndex * cols.length +
                            columnStopIndex;

                          onRowsRendered({
                            startIndex,
                            stopIndex,
                          });
                        }}
                      />
                    )}
                  </InfiniteLoader>
                )}
              </AutoSizer>
            </div>
          </>
        )}
      </ScrollSync>
    </div>
  );
};

export default React.memo(Detail);

