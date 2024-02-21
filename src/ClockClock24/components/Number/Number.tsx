import React from 'react';
import { ClockSettings } from '../../../types';
import { Number as NumberT } from '../../types';

import { NumberLines } from './NumberLines';
const clockclock24Number = {
  flex: '1'
};

/**
 * The number to display
 * @param {line} numberLines - Set of line to form the number
 * @param {Object} options  - Clocks options
 */
export const Number: React.FC<{
  numberLines: NumberT;
  options: {
    clockSize: number;
  };
  settings: ClockSettings
}> = ({ numberLines, options, settings }) => (
  <div style={clockclock24Number}>
    <div className="number">
      <NumberLines numberLines={numberLines} options={options} settings={settings} />
    </div>
  </div>
);
