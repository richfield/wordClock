import React, { ReactElement } from 'react';
import { ClockSettings, Number, Line } from '../../../types';

import { NumberLineClock } from './NumberLineClock';

const clockclock24NumberLine = {
  display: 'flex'
};
/**
 * Display a line of 2 clocks to form a number
 */
export const NumberLines: React.FC<{
  numberLines: Number;
  options: {
    clockSize: number;
  };
  settings: ClockSettings
}> = ({ numberLines, options, settings }): ReactElement => (
  <div>
    {numberLines.map((numberLine: Line, index: number) => (
      <div style={clockclock24NumberLine} key={index}>
        {numberLine.map((clock, indexC: number) => (
          <NumberLineClock
            clock={clock}
            options={options}
            key={index + indexC}
            settings={settings}
          />
        ))}
      </div>
    ))}
  </div>
);
