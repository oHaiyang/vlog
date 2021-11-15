import React from 'react';
import { FormGroup, Checkbox } from '@blueprintjs/core';

function JSONCol(props: { name: string }) {
  const { name } = props;
  return (
    <FormGroup
      className="pr-6"
      label={<code className="mr-2">{name}</code>}
      labelInfo={
        <Checkbox
          className="mt-0"
          inline={true}
          onChange={() => {}}
          checked={false}
        />
      }
    />
  );
}

export default JSONCol;
