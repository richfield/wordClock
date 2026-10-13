import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepVideoPlaying } from './videoWakeLock';

class FakeElement extends EventTarget {
  attributes = new Map<string, string>();
  children: FakeElement[] = [];
  style: Record<string, string> = {};
  constructor(public tagName: string) {
    super();
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }
  remove = vi.fn();
}

class FakeVideo extends FakeElement {
  muted = false;
  loop = false;
  playsInline = false;
  disableRemotePlayback = false;
  paused = true;
  play = vi.fn(async () => {
    this.paused = false;
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  });
}

describe('video screen wake fallback', () => {
  let page: EventTarget & { visibilityState: string, body: FakeElement, createElement: (tag: string) => FakeElement };
  let browser: EventTarget;
  let video: FakeVideo;
  let cleanup: (() => void) | undefined;
  const errorLog = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    video = new FakeVideo('video');
    page = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
      body: new FakeElement('body'),
      createElement: (tag: string) => tag === 'video' ? video : new FakeElement(tag),
    });
    browser = Object.assign(new EventTarget(), { setInterval, clearInterval });
    vi.stubGlobal('document', page);
    vi.stubGlobal('window', browser);
    errorLog.mockClear();
    vi.spyOn(console, 'error').mockImplementation(errorLog);
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('plays a muted, inline, looping video large enough for Chrome to keep the screen on', () => {
    cleanup = keepVideoPlaying();
    expect(page.body.children).toContain(video);
    expect(video).toMatchObject({ muted: true, loop: true, playsInline: true });
    expect(video.attributes.get('muted')).toBe('');
    expect(video.attributes.get('playsinline')).toBe('');
    expect(video.style).toMatchObject({ position: 'fixed', width: '100vw', height: '100vh', pointerEvents: 'none' });
    expect(video.children.map(source => (source as unknown as { type: string }).type)).toEqual([ 'video/webm', 'video/mp4' ]);
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('retries playback after a refused autoplay and logs the error', async () => {
    const error = new Error('NotAllowedError');
    video.play.mockRejectedValueOnce(error);
    cleanup = keepVideoPlaying();
    await vi.advanceTimersByTimeAsync(0);
    expect(errorLog).toHaveBeenCalledWith('Failed to play screen wake video', error);
    await vi.advanceTimersByTimeAsync(10000);
    expect(video.play).toHaveBeenCalledTimes(2);
  });

  it('resumes when the browser pauses the video while visible', async () => {
    cleanup = keepVideoPlaying();
    await vi.advanceTimersByTimeAsync(0);
    video.paused = true;
    video.dispatchEvent(new Event('pause'));
    expect(video.play).toHaveBeenCalledTimes(2);
  });

  it('waits until the PWA is visible again', async () => {
    page.visibilityState = 'hidden';
    cleanup = keepVideoPlaying();
    await vi.advanceTimersByTimeAsync(10000);
    expect(video.play).not.toHaveBeenCalled();
    page.visibilityState = 'visible';
    page.dispatchEvent(new Event('visibilitychange'));
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('stops, removes the video and does not restart after cleanup', async () => {
    cleanup = keepVideoPlaying();
    await vi.advanceTimersByTimeAsync(0);
    cleanup();
    cleanup = undefined;
    expect(video.pause).toHaveBeenCalledOnce();
    expect(video.remove).toHaveBeenCalledOnce();
    page.dispatchEvent(new Event('visibilitychange'));
    browser.dispatchEvent(new Event('pageshow'));
    await vi.advanceTimersByTimeAsync(30000);
    expect(video.play).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
