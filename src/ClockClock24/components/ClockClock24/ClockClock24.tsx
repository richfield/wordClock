import { last } from 'ramda';
import React, { Component } from 'react';
import ReactGA from 'react-ga';

import { Timer } from '../../../types';
import {
  NB_COLUMN_CLOCKS,
  ANIMATION_TIME,
  CLOCK_PADDING,
  CLOCK_MAX_SIZE,
  GLOBAL_PADDING_CLOCK,
  GLOBAL_PADDING_MOBILE_CLOCK,
} from '../../config';

import './clockClock24.css';

import {
  startimeout,
  runSequences,
  getMaxAnimationTime,
  Timeout,
} from '../../utils';
import { run, resetTimer } from '../../utils/engine';
import { getTimeTimer } from '../../utils/timers';

import { Number } from './../Number/Number';
import { ClockComponentProps } from '../../../types';

const ONE_MILLI = 1000;
const ONE_MINUTES_IN_MILLI = 60 * ONE_MILLI;

/**
 * Get the remaining time before the time change
 * @return Remaining time
 */
const getRemainingTime = (): number => {
  const secondsInMilli = new Date().getSeconds() * ONE_MILLI;
  return ONE_MINUTES_IN_MILLI - secondsInMilli;
};

type ClockClock24State = {
  timer: Timer;
  animationTime: number;
  clockSize: number;
  clockPadding: number;
  isRunning: boolean;
};

const getClockSize = (): number => {
  const { clientWidth } = document.body;
  const paddingClock =
    clientWidth >= 1100 ? GLOBAL_PADDING_CLOCK : GLOBAL_PADDING_MOBILE_CLOCK;
  const screenClockSize: number =
    (document.body.clientWidth -
      2 * paddingClock -
      2 * CLOCK_PADDING * NB_COLUMN_CLOCKS) /
    NB_COLUMN_CLOCKS;
  return screenClockSize < CLOCK_MAX_SIZE ? screenClockSize : CLOCK_MAX_SIZE;
};


export default class ClockClock24 extends Component<
  ClockComponentProps,
  ClockClock24State
> {
  private timeout?: Timeout;
  state: ClockClock24State = {
    timer: getTimeTimer(),
    clockSize: getClockSize(),
    clockPadding: CLOCK_PADDING,
    animationTime: ANIMATION_TIME,
    isRunning: false,
  };

  componentDidMount(): void {
    this.startNextCycle(1000);

    document.addEventListener(
      'keydown',
      ({ keyCode }) => {
        const isSpaceKey = keyCode === 32;
        if (isSpaceKey) {
          this.startCycle();
        }
      },
      false,
    );
    document.body.style.backgroundColor = this.props.clockSettings.backgroundColor;

    window.addEventListener('resize', () => {
      ReactGA.event({
        category: 'Window',
        action: 'Resize',
      });
      this.setState({ clockSize: getClockSize() });
    });
  }

  componentWillUnmount(): void {
    this.cancelTimeout();
  }

  startNextCycle(time: number) {
    this.timeout = startimeout(time);

    this.timeout.promise.then(() => this.startCycle());
  }

  animateTimer(timer: Timer): Promise<unknown> {
    const animationTime = getMaxAnimationTime(timer);

    this.setState({ timer });
    this.timeout = startimeout(animationTime);

    return this.timeout.promise;
  }

  startCycle(): void {
    if (this.state.isRunning) {
      return;
    }

    const { animationTime } = this.state;

    this.cancelTimeout();
    this.setState({ isRunning: true });

    const sequences = run(this.state.timer, { animationTime });
    const sequencesPromise = sequences.map((timer: Timer) => () =>
      this.animateTimer(timer),
    );

    runSequences(sequencesPromise)
      .then(() => {
        const lastTimer = last(sequences);
        if (!lastTimer) {
          return null;
        }

        const clearTimer = resetTimer(lastTimer);
        this.setState({ timer: clearTimer });

        return this.nextTime();
      })
      .then(() => {
        this.setState({ isRunning: false });
      });
  }

  nextTime(): void {
    this.startNextCycle(getRemainingTime());
  }

  cancelTimeout(): void {
    if (this.timeout) {
      this.timeout.cancel();
    }
  }

  clockclock24 = {
    display: 'flex',
    padding: 'var(--clock-padding)',
    backgroundColor: this.props.clockSettings.backgroundColor,
    backgroundImage: `radial-gradient(ellipse, ${this.props.clockSettings.foreGroundColor} 0%, ${this.props.clockSettings.backgroundColor} 60%)`,
    boxShadow: '-30px -3px 21px 10px rgba(0, 0, 0, 0.15)'
  };

  render() {
    const { timer, clockSize } = this.state;
    const { clockSettings: { sizeFactor, topDistance } } = this.props;
    const scale = sizeFactor/100;
    const clockClockStyle: React.CSSProperties = {
      paddingTop: topDistance,
      display: 'flex',
      transform: `scale(${scale})`,
      justifyContent: 'center'
    };

    return (
      <div style={clockClockStyle}>
        <div style={this.clockclock24}>
          {timer.map((number, index) => (
            <Number key={index} numberLines={number} options={{ clockSize }} settings={this.props.clockSettings}/>
          ))}
        </div>
      </div>
    );
  }
}
