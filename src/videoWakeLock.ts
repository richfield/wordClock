import media from 'nosleep.js/src/media.js';
import { logInfo } from './remoteLog';

const reportVideoError = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to play screen wake video', error);
};

// Chrome keeps the screen on for a playing muted video only when it is mostly visible
// and covers at least 20% of the viewport, so it is stretched behind the clock.
export const keepVideoPlaying = (): (() => void) => {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.disableRemotePlayback = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  Object.assign(video.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  for (const [ type, src ] of [ [ 'webm', media.webm ], [ 'mp4', media.mp4 ] ]) {
    const source = document.createElement('source');
    source.type = `video/${type}`;
    source.src = src;
    video.appendChild(source);
  }

  let stopped = false;
  const playWhenVisible = () => {
    if (!stopped && document.visibilityState === 'visible' && video.paused) {
      video.play()?.catch(reportVideoError);
    }
  };

  document.body.appendChild(video);
  video.addEventListener('playing', () => logInfo('Wake video is playing'));
  video.addEventListener('pause', () => logInfo('Wake video paused'));
  video.addEventListener('pause', playWhenVisible);
  video.addEventListener('ended', playWhenVisible);
  document.addEventListener('visibilitychange', playWhenVisible);
  document.addEventListener('pointerdown', playWhenVisible);
  document.addEventListener('keydown', playWhenVisible);
  window.addEventListener('pageshow', playWhenVisible);
  window.addEventListener('focus', playWhenVisible);
  const retry = window.setInterval(playWhenVisible, 10000);
  playWhenVisible();

  return () => {
    stopped = true;
    window.clearInterval(retry);
    video.removeEventListener('pause', playWhenVisible);
    video.removeEventListener('ended', playWhenVisible);
    document.removeEventListener('visibilitychange', playWhenVisible);
    document.removeEventListener('pointerdown', playWhenVisible);
    document.removeEventListener('keydown', playWhenVisible);
    window.removeEventListener('pageshow', playWhenVisible);
    window.removeEventListener('focus', playWhenVisible);
    video.pause();
    video.remove();
  };
};
