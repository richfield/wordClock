import React from 'react';
import { ClockSettings, Clock as ClockT } from '../../../types';

import { Clock } from '../Clock/Clock';

const clockclock24NumberLineClock = {
  flex: '1',
  padding: 'var(--clock-small-padding)'
};


/**
 * Display a single clock block
 * @param {Array} clocks - Set of clocks that compose the line
 * @param { Object } options - Clocks Options
 */
export const NumberLineClock: React.FC<{
  clock: ClockT;
  options: {
    clockSize: number;
  };
  settings: ClockSettings
}> = ({ clock, options, settings }) => (
  <div style={clockclock24NumberLineClock}>
    <Clock
      clock={clock}
      size={options.clockSize}
      settings={settings}
    />
  </div>
);
