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
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
    backgroundColor: settings.foreGroundColor,
    boxShadow: 'inset 1px 0px 0px 0px rgba(0, 0, 0, 0.4)'
  };
  return <div className="needle" style={style} />;
};

export default Needle;
