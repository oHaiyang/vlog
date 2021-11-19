import React from 'react';
import { FormGroup, Checkbox } from '@blueprintjs/core';
import { useConfigSelect } from '../../hooks';

function JSONCol(props: { name: string; shouldSelect: boolean }) {
  const { name, shouldSelect } = props;
  const configSelect = useConfigSelect(name);

  return (
    <FormGroup
      className="pr-6"
      label={<code className="mr-2">{name}</code>}
      labelInfo={
        <Checkbox
          className="mt-0"
          inline={true}
          onChange={() => configSelect(!shouldSelect)}
          checked={shouldSelect}
        />
      }
    />
  );
}

export default JSONCol;
