import React from 'react';
import { Tooltip2, Placement } from '@blueprintjs/popover2';
import { Icon } from '@blueprintjs/core';
import cx from 'classnames';

function HelpTip(props: {
  content: string | JSX.Element;
  children: React.ReactNode;
  className?: string;
  placement?: Placement;
}) {
  const { content, children, className, placement } = props;
  return (
    <Tooltip2 className={cx(className)} content={content} placement={placement}>
      <div className="flex items-center">
        {children}
        <Icon className="ml-1" icon="help" />
      </div>
    </Tooltip2>
  );
}

export default HelpTip;
