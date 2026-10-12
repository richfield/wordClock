import { describe, expect, it } from 'vitest';
import { Clock, Timer } from '../../types';
import {
  computeSequences,
  resetClock,
  resetTimer,
  rotate,
  rotateClock,
  rotateReverse,
  setClockDelay,
  Sequence,
} from './engine';

const mod360 = (value: number) => ((value % 360) + 360) % 360;
const angles = [ 0, 45, 90, 135, 180, 225, 270, 315, 360, 450, 720, -90, -270 ];
const targets = [ 0, 45, 90, 180, 270, 360 ];

const clock = (hours: number, minutes: number): Clock => ({ hours, minutes, animationTime: 0, animationDelay: 0 });
const makeTimer = (hours: number, minutes: number): Timer =>
  Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => [ clock(hours, minutes), clock(hours, minutes) ])) as unknown as Timer;

describe('rotate', () => {
  it('turns clockwise by at least half a rotation', () => {
    expect(rotate(0, 90)).toBe(450);
  });

  it.each(angles)('always ends on the target angle and moves forward from %i', (start) => {
    targets.forEach((end) => {
      const result = rotate(start, end);
      expect(mod360(result)).toBe(mod360(end));
      expect(result).toBeGreaterThan(start);
    });
  });
});

describe('rotateReverse', () => {
  it('turns counter-clockwise', () => {
    expect(rotateReverse(0, 90)).toBe(-270);
  });

  it.each(angles)('always ends on the target angle and moves backward from %i', (start) => {
    targets.forEach((end) => {
      const result = rotateReverse(start, end);
      expect(mod360(result)).toBe(mod360(end));
      expect(result).toBeLessThan(start);
    });
  });
});

describe('setClockDelay', () => {
  it('delays by column and shortens the animation so all columns finish together', () => {
    const result = setClockDelay(clock(10, 20), 2, 1000, 300);
    expect(result.animationDelay).toBe(600);
    expect(result.animationTime).toBe(1000 + 4 * 300 - 600);
    expect(result.hours).toBe(10);
    expect(result.minutes).toBe(20);
  });

  it('applies no delay by default', () => {
    const result = setClockDelay(clock(0, 0), 3, 500);
    expect(result.animationDelay).toBe(0);
    expect(result.animationTime).toBe(500);
  });
});

describe('resetClock / resetTimer', () => {
  it('normalizes angles and clears animation values', () => {
    expect(resetClock({ hours: 450, minutes: 725, animationTime: 900, animationDelay: 100 })).toEqual({
      hours: 90,
      minutes: 5,
      animationTime: 0,
      animationDelay: 0,
    });
  });

  it('resets every clock of a timer', () => {
    const reset = resetTimer(makeTimer(400, 500));
    reset.flat(2).forEach((c) => {
      expect(c).toEqual({ hours: 40, minutes: 140, animationTime: 0, animationDelay: 0 });
    });
  });
});

describe('rotateClock', () => {
  it('rotates hours and minutes from the current position', () => {
    const result = rotateClock(clock(90, 90), clock(0, 0));
    expect(result.hours).toBe(rotate(0, 90));
    expect(result.minutes).toBe(rotate(0, 90));
  });

  it('reverses the minute hand when requested', () => {
    const result = rotateClock(clock(90, 90), clock(0, 0), true);
    expect(result.hours).toBe(rotate(0, 90));
    expect(result.minutes).toBe(rotateReverse(0, 90));
  });
});

describe('computeSequences', () => {
  const start = makeTimer(0, 0);

  it('returns one timer per sequence', () => {
    const sequences: Sequence[] = [
      { timer: makeTimer(90, 90), type: 'shape', animationTime: 1000 },
      { timer: makeTimer(180, 180), type: 'time', animationTime: 1000 },
    ];
    expect(computeSequences(sequences, start)).toHaveLength(2);
    expect(computeSequences([], start)).toEqual([]);
  });

  it('chains each sequence from the previous result', () => {
    const [ first, second ] = computeSequences([
      { timer: makeTimer(90, 90), type: 'shape', animationTime: 1000 },
      { timer: makeTimer(180, 180), type: 'shape', animationTime: 1000 },
    ], start);
    expect(first[0][0][0].hours).toBe(rotate(0, 90));
    expect(second[0][0][0].hours).toBe(rotate(first[0][0][0].hours, 180));
  });

  it('keeps the angles and applies the animation time on a wait sequence', () => {
    const [ waited ] = computeSequences([
      { timer: start, type: 'wait', animationTime: 3000 },
    ], makeTimer(90, 270));
    waited.flat(2).forEach((c) => {
      expect(c.hours).toBe(90);
      expect(c.minutes).toBe(270);
      expect(c.animationTime).toBe(3000);
    });
  });

  it('tags clocks with the animation type', () => {
    const [ result ] = computeSequences([
      { timer: makeTimer(90, 90), type: 'shape', animationTime: 1000, animationType: 'start' },
    ], start);
    result.flat(2).forEach((c) => expect(c.animationType).toBe('start'));
  });

  it('staggers clocks left to right with a delay', () => {
    const [ result ] = computeSequences([
      { timer: makeTimer(90, 90), type: 'shape', animationTime: 1000, delay: 100, ltr: false },
    ], start);
    expect(result[0][0][0].animationDelay).toBe(0);
    expect(result[1][0][0].animationDelay).toBe(200);
    expect(result[3][0][1].animationDelay).toBe(700);
  });
});
