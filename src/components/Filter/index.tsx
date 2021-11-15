import React, { useCallback, useState } from 'react';
import {
  Collapse,
  Divider,
  Button,
  ButtonGroup,
  Classes,
} from '@blueprintjs/core';
import { Placement } from '@blueprintjs/popover2';
import { Col } from '../../typings';
import { useDBState } from '../../App';
import Datetime from './Datetime';
import Enum from './Enum';
import NumRange from './NumRange';
import cx from 'classnames';
import HelpTip from '../HelpTip';
import TextMatch from './TextMatch';
import JSONItem from './JSONItem';

type FilterProps = {
  className?: string;
};

function Item(props: {
  className?: string;
  tip: string;
  name: string;
  children: React.ReactNode;
  tipPlacement?: Placement;
}) {
  const { className, tip, name, children } = props;
  return (
    <div className={cx('flex', className)}>
      <HelpTip
        className="flex-shrink-0 mb-0 mr-4 bp3-heading"
        content={tip}
        placement="right-start"
      >
        <span>{name}</span>
      </HelpTip>
      <div className="flex flex-wrap">{children}</div>
    </div>
  );
}

function Filter(props: FilterProps) {
  const [collapsed, setCollapsed] = useState(true);
  const { cols } = useDBState<{ cols: Array<Col> }>('ColumnMeta', { cols: [] });
  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  console.log('[Filter][cols]', cols);

  return (
    <section
      className={cx('flex flex-col px-4 py-8 relative', props.className)}
    >
      <Collapse isOpen={collapsed} keepChildrenMounted>
        <Item
          tip="如果某个字段在所有日志条目中，始终只有一个取值，则会被罗列在此处"
          name="固定字段"
          tipPlacement="right-start"
          className={Classes.RUNNING_TEXT}
        >
          {cols
            .filter(
              (col) => !col.is_json && !col.is_datetime && col.vals.length === 1
            )
            .map((col) => (
              <code
                key={`${col.name}.${col.data_type}`}
                className="mr-2 mb-2"
              >{`${col.name}: ${col.vals[0]}`}</code>
            ))}
        </Item>
        <Item
          tip="自动识别的，值类型可以解析为时间的字符串字段，会被罗列在此处"
          tipPlacement="right-start"
          name="时间字段"
        >
          {cols
            .filter((col) => col.is_datetime)
            .map((col) => (
              <Datetime
                key={`${col.name}.${col.data_type}`}
                max={col.max}
                min={col.min}
              />
            ))}
        </Item>
        <Item
          tip="取值范围是一个数量较少的集合，可以方便的下拉筛选的字段，会被罗列在此处"
          tipPlacement="right-start"
          name="枚举字段"
        >
          {cols
            .filter(
              (col) =>
                col.data_type === 'text' &&
                !col.is_json &&
                !col.is_datetime &&
                col.vals.length > 1 &&
                col.vals.length < 30
            )
            .map((col) => (
              <Enum
                key={`${col.name}.${col.data_type}`}
                isLoading={false}
                items={col.vals}
                name={col.name}
                shouldSelect={col.should_select}
              />
            ))}
        </Item>
        <Item
          tip="如果某个字段的值都是数字，会被罗列此处，可以通过输入数字范围来筛选"
          tipPlacement="right-start"
          name="数值字段"
        >
          {cols
            .filter(
              (col) => col.data_type === 'real' || col.data_type === 'integer'
            )
            .map((col) => (
              <NumRange
                key={`${col.name}.${col.data_type}`}
                min={0}
                max={100}
                name={col.name}
                shouldSelect={col.should_select}
              />
            ))}
        </Item>
        <Item
          tip="如果某个字符串字段的可选值范围很大，不适用下拉筛选，则会被罗列此处，支持字符串匹配筛选"
          tipPlacement="right-start"
          name="文本字段"
        >
          {cols
            .filter(
              (col) =>
                col.data_type === 'text' &&
                !col.is_json &&
                !col.is_datetime &&
                col.vals.length >= 30
            )
            .map((col) => (
              <TextMatch
                key={`${col.name}.${col.data_type}`}
                name={col.name}
                shouldSelect={col.should_select}
              />
            ))}
        </Item>
        <Item
          tip={`字段为 JSON Object/Array，或者可以解析为 JSON，可以用 "添加索引" 功能抽取出其中的某些字段，作为单独的列来查看、筛选`}
          tipPlacement="right-start"
          className={Classes.RUNNING_TEXT}
          name="JSON 字段"
        >
          {cols
            .filter((col) => col.is_json)
            .map((col) => (
              <JSONItem key={col.name} name={col.name} />
            ))}
        </Item>
        <Divider />
      </Collapse>
      <div className="flex justify-between w-full">
        <span>{0 ? `共计日志 ${0} 条，筛选出前 ${0} 条` : '...'}</span>
        <ButtonGroup>
          <Button icon="add-to-artifact" text="添加索引列" onClick={() => {}} />
          <Button icon="search-template" text="筛选" onClick={() => {}} />
        </ButtonGroup>
        <Button
          icon={collapsed ? 'double-chevron-up' : 'double-chevron-down'}
          text={collapsed ? 'Fold' : 'Unfold'}
          onClick={toggleCollapsed}
        />
      </div>
      <Divider />
    </section>
  );
}

export default Filter;
