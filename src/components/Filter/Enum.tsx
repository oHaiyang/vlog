import React, { useCallback } from 'react';
import {
  MenuItem,
  Classes,
} from '@blueprintjs/core';
import { MultiSelect, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { EnumCol, actions as colActions } from '../../store/v2/indexedCols';
import { useAppDispatch, useAppSelector } from '../../store/v2';
import makeTuple from '../../utils/makeTuple';
import cx from 'classnames';

const EnumSelect = MultiSelect.ofType<string>();

const filterEnum: ItemPredicate<string> = (
  query: string,
  value: string,
  _index,
  exactMatch
) => {
  const normalizedValue = value?.toLowerCase?.();
  const normalizedQuery = query?.toLowerCase?.();

  if (exactMatch) {
    return normalizedValue === normalizedQuery;
  } else {
    return normalizedValue?.indexOf?.(normalizedQuery) >= 0;
  }
};


function useEnumFilterUpdater (colName: string) {
  const dispatch = useAppDispatch();
  const currentLog = useAppSelector(state => state.app.currentLogName)
  const add = useCallback((item: string) => {
    dispatch(colActions.addToEnumFilter({
      name: colName,
      item,
      logName: currentLog,
    }));
  }, [dispatch, colName, currentLog]);
  const remove = useCallback((item: string) => {
    dispatch(colActions.removeFromEnumFilter({
      name: colName,
      item,
      logName: currentLog,
    }));
  }, [dispatch, colName, currentLog]);
  return makeTuple(add, remove);
}

function EnumFilter(props: { col: EnumCol, isLoading?: boolean }) {
  const { col, isLoading } = props;

  const [add, remove] = useEnumFilterUpdater(col.name);

  const renderEnumItem = useCallback(
    (col: Readonly<EnumCol>): ItemRenderer<string> => (
      value: string,
      { handleClick, modifiers }
    ) => {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      return (
        <MenuItem
          icon={
            col.filter.includes(value) ? 'tick' : 'blank'
          }
          active={modifiers.active}
          disabled={modifiers.disabled}
          key={value}
          onClick={handleClick}
          text={value}
        />
      );
    },
    []
  );

  return (
    <EnumSelect
      items={Array.from(col.set).sort()}
      selectedItems={col.filter}
      onItemSelect={add}
      className={cx(isLoading && Classes.SKELETON)}
      onRemove={remove}
      resetOnSelect
      itemRenderer={renderEnumItem(col)}
      tagRenderer={(text: string) => text}
      popoverProps={{ minimal: true }}
      itemPredicate={filterEnum}
    />
  );
}

export default EnumFilter;
