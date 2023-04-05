import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import './FlipClock.sass';
import { AnimatedCardProps, FlipClockState, FlipUnitContainerProps, StaticCardProps } from './FlipClock.types';
import { lightenDarkenColor } from '../helpers';

const AnimatedCard: React.FC<AnimatedCardProps> = ({ animation, digit, style }) => {
  return (
    <div className={`flipCard ${animation}`} style={style}>
      <span style={style}>{digit}</span>
    </div>
  );
};
const StaticCard: React.FC<StaticCardProps> = ({ position, digit, style }) => {
  return (
    <div className={position} style={style}>
      <span style={style}>{digit}</span>
    </div>
  );
};
const FlipUnitContainer: React.FC<FlipUnitContainerProps> = ({
  digit,
  shuffle,
  unit,
  style
}) => {
  // assign digit values
  let currentDigit: string = digit.toString();
  let previousDigit: string = (digit - 1).toString();

  // to prevent a negative value
  if (unit !== 'hours') {
    previousDigit = previousDigit === '-1' ? '59' : previousDigit;
  } else {
    previousDigit = previousDigit === '-1' ? '23' : previousDigit;
  }

  // add zero
  if (parseInt(currentDigit) < 10) {
    currentDigit = `0${currentDigit}`;
  }
  if (parseInt(previousDigit) < 10) {
    previousDigit = `0${previousDigit}`;
  }

  // shuffle digits
  const digit1 = shuffle ? previousDigit : currentDigit;
  const digit2 = !shuffle ? previousDigit : currentDigit;

  // shuffle animations
  const animation1 = shuffle ? 'fold' : 'unfold';
  const animation2 = !shuffle ? 'fold' : 'unfold';

  return (
    <div className={'flipUnitContainer'} style={style}>
      <StaticCard position={'upperCard'} digit={currentDigit} style={style} />
      <StaticCard position={'lowerCard'} digit={previousDigit} style={style} />
      <AnimatedCard digit={digit1} animation={animation1} style={style} />
      <AnimatedCard digit={digit2} animation={animation2} style={style} />
    </div>
  );
};

const FlipClock: React.FC<ClockComponentProps> = (props) => {
  const { time, clockSettings: { showSeconds = false, sizeFactor, backgroundColor } } = props;
  const [ state, setState ] = useState<FlipClockState>({
    hours: 0,
    hoursShuffle: true,
    minutes: 0,
    minutesShuffle: true,
    seconds: 0,
    secondsShuffle: true,
  });

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  if (hours !== state.hours) {
    const hoursShuffle = !state.hoursShuffle;
    setState((prevState) => ({ ...prevState, hours, hoursShuffle }));
  }
  if (minutes !== state.minutes) {
    const minutesShuffle = !state.minutesShuffle;
    setState((prevState) => ({ ...prevState, minutes, minutesShuffle }));
  }
  if (seconds !== state.seconds) {
    const secondsShuffle = !state.secondsShuffle;
    setState((prevState) => ({ ...prevState, seconds, secondsShuffle }));
  }

  const {
    hoursShuffle,
    minutesShuffle,
    secondsShuffle,
  } = state;

  const clockWidth = showSeconds ? 500 : 325;
  const scale = showSeconds ? (window.innerWidth / 625) * (sizeFactor / 100) : (window.innerWidth / 400) * (sizeFactor / 100);
  const flipClockStyle: React.CSSProperties = {
    paddingTop: props.clockSettings.topDistance,
    display: 'flex',
    transform: `scale(${scale})`,
    width: `${clockWidth}px`
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: props.clockSettings.shadeColor,
    color: props.clockSettings.foreGroundColor,
    borderColor: lightenDarkenColor(props.clockSettings.shadeColor, 200, true),
    fontFamily: 'Oswald',
    fontSize: '100px'
  };
  document.body.style.backgroundColor = backgroundColor;
  return (
    <Container fluid style={{ display: 'flex', justifyContent: 'center' }}>
      <div className={'flipClock'} style={flipClockStyle}>
        <FlipUnitContainer
          unit={'hours'}
          digit={hours}
          shuffle={hoursShuffle}
          style={containerStyle}
        />
        <FlipUnitContainer
          unit={'minutes'}
          digit={minutes}
          shuffle={minutesShuffle}
          style={containerStyle}
        />
        {
          showSeconds &&
          <FlipUnitContainer
            unit={'seconds'}
            digit={seconds}
            shuffle={secondsShuffle}
            style={containerStyle}
          />
        }
      </div>
    </Container>
  );
};

export default FlipClock;
