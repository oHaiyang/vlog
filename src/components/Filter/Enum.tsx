import React, { useCallback, useMemo } from 'react';
import { MenuItem, Classes, FormGroup, Checkbox } from '@blueprintjs/core';
import { MultiSelect, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import cx from 'classnames';
import { useConfigSelect } from '../../hooks';
import produce from 'immer';

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

function EnumFilter(props: {
  items: string[];
  isLoading?: boolean;
  name: string;
  shouldSelect: boolean;
  selected: string[];
}) {
  const { isLoading, items, name, shouldSelect, selected } = props;
  console.log('[EnumFilter][selected]', selected);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const configSelect = useConfigSelect(name);

  const renderEnumItem: ItemRenderer<string> = useCallback(
    (value: string, { handleClick, modifiers }) => {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      return (
        <MenuItem
          icon={selectedSet.has(value) ? 'tick' : 'blank'}
          active={modifiers.active}
          disabled={modifiers.disabled}
          key={value}
          onClick={handleClick}
          text={value}
        />
      );
    },
    [selectedSet]
  );

  const handleSelect = useCallback(
    (value: string) => {
      const nextItems = produce(selectedSet, draft => {
        if (draft.has(value)) {
          draft.delete(value);
        } else {
          draft.add(value);
        }
      });
      configSelect(shouldSelect, {
        items: Array.from(nextItems),
        reverse: false,
      });
    },
    [configSelect, shouldSelect, selectedSet]
  );
  const handleRemove = useCallback(
    (value: string) => {
      configSelect(shouldSelect, {
        items: selected.filter((item) => item !== value),
        reverse: false,
      });
    },
    [configSelect, shouldSelect, selected]
  );

  return (
    <FormGroup
      key={name}
      className="pr-6"
      label={name}
      labelInfo={
        <Checkbox
          className="mt-0"
          inline={true}
          onChange={() =>
            configSelect(!shouldSelect, {
              items: selected,
              reverse: false,
            })
          }
          checked={shouldSelect}
        />
      }
    >
      {shouldSelect && (
        <EnumSelect
          items={items}
          selectedItems={selected}
          onItemSelect={handleSelect}
          className={cx(isLoading && Classes.SKELETON)}
          onRemove={handleRemove}
          resetOnSelect
          itemRenderer={renderEnumItem}
          tagRenderer={(text: string) => text}
          popoverProps={{ minimal: true }}
          itemPredicate={filterEnum}
        />
      )}
    </FormGroup>
  );
}

export default EnumFilter;
