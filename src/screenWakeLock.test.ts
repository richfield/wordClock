import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepScreenAwake } from './screenWakeLock';

class Sentinel extends EventTarget {
  released = false;
  release = vi.fn(async () => {
    this.released = true;
    this.dispatchEvent(new Event('release'));
  });
}

describe('screen wake lock lifecycle', () => {
  let page: EventTarget & { visibilityState: string };
  let browser: EventTarget;
  let sentinel: Sentinel;
  let cleanup: (() => void) | undefined;
  const request = vi.fn();
  const errorLog = vi.fn();
  const warningLog = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    browser = Object.assign(new EventTarget(), { setInterval, clearInterval });
    sentinel = new Sentinel();
    request.mockReset().mockResolvedValue(sentinel);
    vi.stubGlobal('navigator', { wakeLock: { request } });
    vi.stubGlobal('document', page);
    vi.stubGlobal('window', browser);
    errorLog.mockClear();
    warningLog.mockClear();
    vi.spyOn(console, 'error').mockImplementation(errorLog);
    vi.spyOn(console, 'warn').mockImplementation(warningLog);
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests a lock on each load and releases it on unmount', async () => {
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledWith('screen');
    cleanup();
    expect(sentinel.release).toHaveBeenCalledOnce();

    request.mockResolvedValue(new Sentinel());
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('retries a refused first request within 10 seconds and logs the error', async () => {
    const error = new Error('NotAllowedError');
    request.mockRejectedValueOnce(error);
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(9999);
    expect(request).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith('Failed to maintain screen wake lock', error);
    await vi.advanceTimersByTimeAsync(1);
    expect(request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(20000);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('immediately reacquires a lock released while visible', async () => {
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    const next = new Sentinel();
    request.mockResolvedValue(next);
    await sentinel.release();
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not request while hidden and reacquires on returning', async () => {
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    page.visibilityState = 'hidden';
    await sentinel.release();
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(20000);
    expect(request).toHaveBeenCalledOnce();
    request.mockResolvedValue(new Sentinel());
    page.visibilityState = 'visible';
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('waits for visibility if the PWA starts hidden', async () => {
    page.visibilityState = 'hidden';
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(10000);
    expect(request).not.toHaveBeenCalled();
    page.visibilityState = 'visible';
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledOnce();
  });

  it.each([ 'pageshow', 'focus', 'pointerdown', 'keydown' ])('retries on %s after a failure', async event => {
    request.mockRejectedValueOnce(new Error('NotAllowedError'));
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    const target = event === 'pageshow' || event === 'focus' ? browser : page;
    target.dispatchEvent(new Event(event));
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('prevents overlapping requests during startup', async () => {
    request.mockReturnValue(new Promise<Sentinel>(() => undefined));
    cleanup = keepScreenAwake();
    page.dispatchEvent(new Event('visibilitychange'));
    browser.dispatchEvent(new Event('pageshow'));
    await vi.advanceTimersByTimeAsync(30000);
    expect(request).toHaveBeenCalledOnce();
  });

  it('retains locks on older Chrome without a released property', async () => {
    const legacySentinel = Object.assign(new EventTarget(), {
      release: vi.fn(async () => undefined),
    });
    request.mockResolvedValue(legacySentinel);
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(30000);
    expect(request).toHaveBeenCalledOnce();
    cleanup();
    expect(legacySentinel.release).toHaveBeenCalledOnce();
  });

  it('retries a sentinel that was already released when the request resolved', async () => {
    sentinel.released = true;
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    request.mockResolvedValue(new Sentinel());
    await vi.advanceTimersByTimeAsync(10000);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not let a stale StrictMode request release the new mount lock', async () => {
    let resolve!: (value: Sentinel) => void;
    request.mockReturnValueOnce(new Promise<Sentinel>(done => { resolve = done; }));
    const stopFirstMount = keepScreenAwake();
    stopFirstMount();
    const current = new Sentinel();
    request.mockResolvedValue(current);
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    resolve(sentinel);
    await vi.advanceTimersByTimeAsync(10000);
    expect(sentinel.release).toHaveBeenCalledOnce();
    expect(current.release).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it.each([ 'unmount', 'hide' ])('releases a request that completes after %s', async action => {
    let resolve!: (value: Sentinel) => void;
    request.mockReturnValue(new Promise<Sentinel>(done => { resolve = done; }));
    cleanup = keepScreenAwake();
    if (action === 'unmount') {
      cleanup();
    } else {
      page.visibilityState = 'hidden';
    }
    resolve(sentinel);
    await vi.advanceTimersByTimeAsync(0);
    expect(sentinel.release).toHaveBeenCalledOnce();
  });

  it('removes listeners and retries on cleanup without reacquiring', async () => {
    cleanup = keepScreenAwake();
    await vi.advanceTimersByTimeAsync(0);
    cleanup();
    page.dispatchEvent(new Event('visibilitychange'));
    page.dispatchEvent(new Event('pointerdown'));
    page.dispatchEvent(new Event('keydown'));
    browser.dispatchEvent(new Event('focus'));
    browser.dispatchEvent(new Event('pageshow'));
    await vi.advanceTimersByTimeAsync(30000);
    expect(request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports browsers without wake-lock support', () => {
    vi.stubGlobal('navigator', {});
    cleanup = keepScreenAwake();
    expect(warningLog).toHaveBeenCalledWith('Screen wake lock is not supported by this browser');
    expect(request).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
