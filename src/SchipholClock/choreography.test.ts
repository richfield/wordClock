import { describe, expect, it } from 'vitest';
import { ARM_LENGTH, DURATION, TIME_SCALE, FLOOR, frameAt, handSegment, poseAt } from './choreography';
import { HOUR_LENGTH, spiralPoint } from './hands';

const angles = { hour: 90, minute: 180 };
const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('frameAt', () => {
    it('starts with the old hands in place and ends with the new hands painted', () => {
        expect(frameAt(0, angles)).toMatchObject({ wipe: 0, hour: 0, minute: 0, opacity: 0, engage: 0 });
        expect(frameAt(DURATION, angles)).toMatchObject({ wipe: 1, hour: 1, minute: 1, opacity: 0, engage: 0 });
    });

    it('follows the spiral while wiping', () => {
        const middle = frameAt(2600 * TIME_SCALE, angles);
        expect(middle.wipe).toBeGreaterThan(-50);
        expect(middle.wipe).toBeLessThan(1);
        expect(distance(middle.hand, spiralPoint(middle.wipe))).toBeLessThan(1e-6);
    });

    it('paints the hour hand before the minute hand, ending at the tip', () => {
        const hourDone = frameAt(5100 * TIME_SCALE, angles);
        expect(hourDone.hour).toBe(1);
        expect(hourDone.minute).toBe(0);
        expect(distance(hourDone.hand, handSegment(90, HOUR_LENGTH).tip)).toBeLessThan(1e-6);
        expect(frameAt(6500 * TIME_SCALE, angles).minute).toBe(1);
    });

    it('is fully at work between walking in and walking out', () => {
        expect(frameAt(DURATION / 2, angles)).toMatchObject({ opacity: 1, engage: 1 });
    });
});

describe('poseAt', () => {
    const cases = [ { hour: 90, minute: 180 }, { hour: 0, minute: 0 }, { hour: 300, minute: 270 }, { hour: 180, minute: 355 }, { hour: 30, minute: 90 } ];

    it('keeps the working hand on the cloth and the brush the whole time it works', () => {
        cases.forEach(testAngles => {
            for (let elapsed = 0; elapsed <= DURATION; elapsed += 50) {
                const frame = frameAt(elapsed, testAngles);
                if (frame.engage === 1) {
                    const pose = poseAt(elapsed, frame);
                    expect(distance(pose.working.hand, frame.hand)).toBeLessThan(0.5);
                }
            }
        });
    });

    it('keeps the rigid arms exactly the same length', () => {
        for (let elapsed = 0; elapsed <= DURATION; elapsed += 100) {
            const pose = poseAt(elapsed, frameAt(elapsed, angles));
            [ pose.working, pose.resting ].forEach(arm => {
                expect(distance(arm.shoulder, arm.hand)).toBeCloseTo(ARM_LENGTH, 4);
            });
        }
    });
    it('keeps the feet on the floor while working', () => {
        const pose = poseAt(DURATION / 2, frameAt(DURATION / 2, angles));
        pose.feet.forEach(foot => expect(foot.y).toBe(FLOOR));
    });

    it('does not slide sideways further than needed: he is on the dial while working', () => {
        for (let elapsed = 1500 * TIME_SCALE; elapsed <= 6500 * TIME_SCALE; elapsed += 100) {
            const pose = poseAt(elapsed, frameAt(elapsed, angles));
            expect(pose.hip.x).toBeGreaterThan(-50);
            expect(pose.hip.x).toBeLessThan(360);
        }
    });
});

