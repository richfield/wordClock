import { useState, useEffect } from 'react';
import { ClockComponentProps } from '../types';
// import './FlipClock.scss';
interface CountdownTrackerProps {
  label: string;
  value: number;
}

function CountdownTracker({ label, value }: CountdownTrackerProps) {
  const [ currentValue, setCurrentValue ] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [ value ]);

  const formattedValue = ('0' + currentValue).slice(-2);

  return (
    <span className="flip-clock__piece">
      <b className="flip-clock__card card">
        <b className="card__top">{formattedValue}</b>
        <b className="card__bottom" data-value={formattedValue}></b>
        <b className="card__back">
          <b className="card__bottom" data-value={formattedValue}></b>
        </b>
      </b>
      <span className="flip-clock__slot">{label}</span>
    </span>
  );
}

function Clock({ time }: ClockComponentProps) {
  const [ trackers, setTrackers ] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const updateClock = () => {
      const t = {
        Hours: time.getHours(),
        Minutes: time.getMinutes(),
        Seconds: time.getSeconds(),
      };

      const updatedTrackers: JSX.Element[] = [];
      for (const [ key, value ] of Object.entries(t)) {
        if (key === 'Total') continue;
        updatedTrackers.push(<CountdownTracker key={key} label={key} value={value} />);
      }
      setTrackers(updatedTrackers);
    };

    let intervalId = setInterval(updateClock, 500);
    return () => clearInterval(intervalId);
  }, [ time ]);

  return <div className="flip-clock">{trackers}</div>;
}

export default Clock;