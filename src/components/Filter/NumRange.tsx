import React from 'react';
import { NumericInput, FormGroup, Checkbox } from '@blueprintjs/core';
import { useConfigSelect } from '../../hooks';

function NumRange(props: {
  min: number;
  max: number;
  name: string;
  shouldSelect: boolean;
}) {
  const { min, max, name, shouldSelect } = props;
  const configSelect = useConfigSelect(name);

  return (
    <FormGroup
      key={name}
      className="pr-6 w-64"
      label={name}
      contentClassName="flex"
      labelInfo={
        <Checkbox
          className="mt-0"
          inline={true}
          onChange={() => configSelect(!shouldSelect)}
          checked={shouldSelect}
        />
      }
    >
      {shouldSelect && (
        <>
          <NumericInput
            onValueChange={() => {}}
            value={min}
            leftIcon="greater-than-or-equal-to"
            className="mr-2"
            fill
          />
          <NumericInput
            onValueChange={() => {}}
            value={max}
            leftIcon="less-than-or-equal-to"
            fill
          />
        </>
      )}
    </FormGroup>
  );
}

export default NumRange;
