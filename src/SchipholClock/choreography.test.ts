import { describe, expect, it } from 'vitest';
import { ARM_LENGTH, DURATION, frameAt, handSegment, poseFor } from './choreography';
import { HOUR_LENGTH, spiralPoint } from './hands';

const angles = { hour: 90, minute: 180 };

describe('frameAt', () => {
    it('starts with the old hands in place and ends with the new hands painted', () => {
        const start = frameAt(0, angles);
        expect(start).toMatchObject({ wipe: 0, hour: 0, minute: 0, opacity: 0 });
        const end = frameAt(DURATION, angles);
        expect(end).toMatchObject({ wipe: 1, hour: 1, minute: 1, opacity: 0 });
    });

    it('follows the spiral while wiping', () => {
        const middle = frameAt(2400, angles);
        expect(middle.wipe).toBeGreaterThan(0);
        expect(middle.wipe).toBeLessThan(1);
        const spiral = spiralPoint(middle.wipe);
        expect(middle.hand.x).toBeCloseTo(spiral.x, 5);
        expect(middle.hand.y).toBeCloseTo(spiral.y, 5);
    });

    it('paints the hour hand before the minute hand, ending at the tip', () => {
        const hourDone = frameAt(4900, angles);
        expect(hourDone.hour).toBe(1);
        expect(hourDone.minute).toBe(0);
        expect(hourDone.hand.x).toBeCloseTo(handSegment(90, HOUR_LENGTH).tip.x, 5);
        expect(frameAt(6300, angles).minute).toBe(1);
    });

    it('is visible while working', () => {
        expect(frameAt(DURATION / 2, angles).opacity).toBe(1);
    });
});

describe('poseFor', () => {
    it('keeps the arm the same length wherever the hand has to go', () => {
        [ { x: 70, y: 262 }, { x: 200, y: 50 }, { x: 330, y: 200 }, { x: 205, y: 205 } ].forEach(target => {
            const pose = poseFor(target);
            const length = Math.hypot(pose.hand.x - pose.shoulder.x, pose.hand.y - pose.shoulder.y);
            expect(length).toBeCloseTo(ARM_LENGTH, 5);
        });
    });

    it('moves the body so the hand ends up on the target', () => {
        const target = { x: 310, y: 120 };
        const pose = poseFor(target);
        expect(pose.body.x + pose.hand.x).toBeCloseTo(target.x, 5);
        expect(pose.body.y + pose.hand.y).toBeCloseTo(target.y, 5);
    });
});
