import React, { useCallback, useState } from 'react';
import {
  Collapse,
  Divider,
  Button,
  ButtonGroup,
} from '@blueprintjs/core';
import { Col } from '../../typings';
import { useDBState } from '../../App';
import Datetime from './Datetime';
import cx from 'classnames';

type FilterProps = {
  className?: string;
};

function Filter(props: FilterProps) {
  const [collapsed, setCollapsed] = useState(true);
  const cols = useDBState<Array<Col>>('ColumnMeta', []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  console.log('[Filter][cols]', cols);

  return (
    <section className={cx("flex flex-col px-4 py-8 relative", props.className)}>
      <Collapse isOpen={collapsed} keepChildrenMounted>
        <div className="flex">
          <h6 className="flex-shrink-0 mb-0 mr-4 bp3-heading">时间字段</h6>
          <div className="flex flex-wrap">
            {cols
              .filter(col => col.is_datetime)
              .map(col => (<Datetime
                max={col.max}
                min={col.min}
              />))}
          </div>
        </div>
        <Divider />
      </Collapse>
      <div className="flex justify-between w-full">
        <span>
          {0
            ? `共计日志 ${0} 条，筛选出前 ${0} 条`
            : '...'}
        </span>
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
};

export default Filter;
