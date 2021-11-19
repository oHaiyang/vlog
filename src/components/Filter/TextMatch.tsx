import React from 'react';
import {
  InputGroup,
  Icon,
  Tag,
  Intent,
  FormGroup,
  Checkbox,
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { useConfigSelect } from '../../hooks';

function TextMatch(props: { name: string; shouldSelect: boolean }) {
  const { name, shouldSelect } = props;
  const configSelect = useConfigSelect(name);

  return (
    <FormGroup
      key={name}
      className="pr-6"
      label={name}
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
        <InputGroup
          leftIcon="filter"
          placeholder="字符串匹配"
          rightElement={
            <div className="flex items-center">
              <Tooltip2 content="反向匹配">
                <Icon
                  icon="exclude-row"
                  className="mr-2 cursor-pointer"
                  onClick={() => {}}
                  intent={true ? Intent.PRIMARY : Intent.NONE}
                />
              </Tooltip2>
              <Tooltip2 content="使用正则表达式">
                <Tag
                  interactive
                  onClick={() => {}}
                  intent={false ? Intent.PRIMARY : Intent.NONE}
                >
                  Reg
                </Tag>
              </Tooltip2>
              <Tooltip2 content="是否大小写敏感">
                <Tag
                  interactive
                  onClick={() => {}}
                  intent={true ? Intent.PRIMARY : Intent.NONE}
                >
                  {true ? <del className="text-gray-600">Aa</del> : 'Aa'}
                </Tag>
              </Tooltip2>
            </div>
          }
          onChange={() => {}}
        />
      )}
    </FormGroup>
  );
}

export default TextMatch;
