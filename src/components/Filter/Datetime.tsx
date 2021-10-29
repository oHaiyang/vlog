import React, { useMemo, useState } from 'react';
import {
  FormGroup,
  Icon,
} from '@blueprintjs/core';
import { format, parse } from 'date-fns';
import { TimePrecision, DateInput } from '@blueprintjs/datetime';
import cx from 'classnames';

type TimestampInMs = number;

export const LOG_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS xx';

function Datetime(props: { className?: string, min: TimestampInMs, max: TimestampInMs }) {
  const { className, min, max } = props;
  const minDate = useMemo(() => new Date(min), [min]);
  const maxDate = useMemo(() => new Date(max), [max]);
  const [start, setStart] = useState(minDate)
  const [end, setEnd] = useState(maxDate);

  return (
    <FormGroup
      label="logTime"
      labelFor="text-input"
      inline={true}
      className={cx("mb-0 mr-4", className)}
    >
      <DateInput
        inputProps={{
          className: cx('w-64'),
        }}
        canClearSelection={false}
        closeOnSelection={false}
        value={start ?? minDate}
        formatDate={(date: Date) => format(date, LOG_TIME_FORMAT)}
        parseDate={(str: string) => parse(str, LOG_TIME_FORMAT, new Date())}
        maxDate={maxDate}
        minDate={minDate}
        timePrecision={TimePrecision.SECOND}
        timePickerProps={{
          showArrowButtons: true,
        }}
        onChange={setStart}
      />
      <Icon icon="arrow-right" className="mx-4" />
      <DateInput
        inputProps={{
          className: cx('w-64'),
        }}
        canClearSelection={false}
        closeOnSelection={false}
        value={end ?? maxDate}
        formatDate={(date: Date) => format(date, LOG_TIME_FORMAT)}
        parseDate={(str: string) => parse(str, LOG_TIME_FORMAT, new Date())}
        maxDate={maxDate}
        minDate={minDate}
        timePrecision={TimePrecision.SECOND}
        timePickerProps={{
          showArrowButtons: true,
        }}
        onChange={setEnd}
      />
    </FormGroup>
  );
}

export default Datetime;

