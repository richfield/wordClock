/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Entry, formatArguments, installRemoteLogging, log, logInfo } from './remoteLog';

describe('remote logging', () => {
  let page: EventTarget & { visibilityState: string };
  let browser: EventTarget & { isSecureContext: boolean, location: { protocol: string }, screen: { width: number, height: number } };
  let sender: Mock<[ Entry[] ], Promise<unknown>>;
  let uninstall: (() => void) | undefined;
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    vi.useFakeTimers();
    page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    browser = Object.assign(new EventTarget(), {
      isSecureContext: false,
      location: { protocol: 'http:' },
      screen: { width: 800, height: 1280 }
    });
    vi.stubGlobal('document', page);
    vi.stubGlobal('window', browser);
    vi.stubGlobal('navigator', { userAgent: 'Android 10 test' });
    sender = vi.fn<[ Entry[] ], Promise<unknown>>().mockResolvedValue(undefined);
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  const startAndFlush = () => {
    const remove = installRemoteLogging(sender);
    vi.advanceTimersByTime(3000);
    sender.mockClear();
    return remove;
  };

  afterEach(() => {
    uninstall?.();
    uninstall = undefined;
    console.error = originalError;
    console.warn = originalWarn;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('does nothing until installed', () => {
    logInfo('ignored');
    vi.advanceTimersByTime(10000);
    expect(sender).not.toHaveBeenCalled();
  });

  it('reports the environment on start, which shows an insecure context', () => {
    uninstall = installRemoteLogging(sender);
    vi.advanceTimersByTime(3000);
    const message = sender.mock.calls[ 0 ][ 0 ][ 0 ].message;
    expect(message).toContain('"secureContext":false');
    expect(message).toContain('"wakeLockSupported":false');
    expect(message).toContain('Android 10 test');
  });

  it('sends console errors straight away and still prints them', () => {
    const original = console.error;
    uninstall = startAndFlush();
    console.error('Failed to maintain screen wake lock', new Error('NotAllowedError'));
    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender.mock.calls[ 0 ][ 0 ].at(-1)).toMatchObject({
      level: 'error',
      message: 'Failed to maintain screen wake lock Error: NotAllowedError'
    });
    expect(original).toHaveBeenCalled();
  });

  it('batches warnings and info messages', () => {
    uninstall = startAndFlush();
    console.warn('careful');
    logInfo('hello');
    expect(sender).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender.mock.calls[ 0 ][ 0 ].map(entry => entry.level)).toEqual([ 'warn', 'info' ]);
  });

  it('reports uncaught errors and unhandled rejections', () => {
    uninstall = startAndFlush();
    const error = Object.assign(new Event('error'), { message: 'boom', filename: 'a.js', lineno: 1, colno: 2 });
    browser.dispatchEvent(error);
    const rejection = Object.assign(new Event('unhandledrejection'), { reason: new Error('nope') });
    browser.dispatchEvent(rejection);
    const messages = sender.mock.calls.flatMap(call => call[ 0 ]).map(entry => entry.message);
    expect(messages).toContain('Uncaught: boom (a.js:1:2)');
    expect(messages).toContain('Unhandled rejection: Error: nope');
  });

  it('reports visibility changes', () => {
    uninstall = startAndFlush();
    page.visibilityState = 'hidden';
    page.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(3000);
    expect(sender.mock.calls[ 0 ][ 0 ][ 0 ].message).toBe('Visibility changed to hidden');
  });

  it('limits the number of messages per minute', () => {
    uninstall = startAndFlush();
    for (let i = 0; i < 200; i++) {
      log('error', `error ${i}`);
    }
    const sent = sender.mock.calls.flatMap(call => call[ 0 ]).length;
    expect(sent).toBeLessThanOrEqual(40);
    vi.advanceTimersByTime(61000);
    log('error', 'later');
    expect(sender.mock.calls.flatMap(call => call[ 0 ]).at(-1)?.message).toBe('later');
  });

  it('does not loop when sending fails', async () => {
    sender.mockRejectedValue(new Error('offline'));
    uninstall = startAndFlush();
    console.error('first');
    await vi.advanceTimersByTimeAsync(5000);
    expect(sender).toHaveBeenCalledTimes(1);
  });

  it('restores the console when uninstalled', () => {
    const before = console.error;
    const remove = installRemoteLogging(sender);
    expect(console.error).not.toBe(before);
    remove();
    expect(console.error).toBe(before);
  });
});

describe('formatArguments', () => {
  it('formats errors, strings and objects, even circular ones', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatArguments([ 'a', new TypeError('b'), { c: 1 }, circular ])).toBe('a TypeError: b {"c":1} [object Object]');
  });
});
