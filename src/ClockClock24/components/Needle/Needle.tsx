import React from 'react';
import { ClockSettings } from '../../../types';

const Needle: React.FC<{
  height: number;
  width: number;
  settings: ClockSettings
}> = ({ height, width, settings }) => {
  const style = {
    height,
    width,
    backgroundColor: settings.foreGroundColor,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.6)'
  };
  return <div className="needle" style={style} />;
};

export default Needle;
