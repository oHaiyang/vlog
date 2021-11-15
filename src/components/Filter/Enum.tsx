import React, { useCallback } from 'react';
import { MenuItem, Classes, FormGroup, Checkbox } from '@blueprintjs/core';
import { MultiSelect, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
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

function EnumFilter(props: {
  items: string[];
  isLoading?: boolean;
  name: string;
  shouldSelect: boolean;
}) {
  const { isLoading, items, name, shouldSelect } = props;

  const renderEnumItem: ItemRenderer<string> = useCallback(
    (value: string, { handleClick, modifiers }) => {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      return (
        <MenuItem
          icon={false ? 'tick' : 'blank'}
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
    <FormGroup
      key={name}
      className="pr-6"
      label={name}
      labelInfo={
        <Checkbox
          className="mt-0"
          inline={true}
          onChange={() => {}}
          checked={false}
        />
      }
    >
      {shouldSelect && (
        <EnumSelect
          items={items}
          selectedItems={[]}
          onItemSelect={() => {}}
          className={cx(isLoading && Classes.SKELETON)}
          onRemove={() => {}}
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
