import { logInfo } from './remoteLog';

const reportWakeLockError = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to maintain screen wake lock', error);
};

export const keepScreenAwake = (): (() => void) => {
  if (!('wakeLock' in navigator)) {
    // eslint-disable-next-line no-console
    console.warn('Screen wake lock is not supported by this browser');
    return () => undefined;
  }

  let lock: WakeLockSentinel | undefined;
  let requesting = false;
  let stopped = false;

  const release = (sentinel: WakeLockSentinel) => {
    sentinel.release().catch(reportWakeLockError);
  };

  const requestWhenVisible = async () => {
    if (stopped || requesting || lock || document.visibilityState !== 'visible') {
      return;
    }

    requesting = true;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (stopped || document.visibilityState !== 'visible') {
        release(sentinel);
        return;
      }

      // Older Chrome versions can omit the sentinel's released property.
      if (sentinel.released === true) {
        return;
      }
      lock = sentinel;
      logInfo('Screen wake lock acquired');
      sentinel.addEventListener('release', () => {
        logInfo(`Screen wake lock released (visibility ${document.visibilityState})`);
        if (lock === sentinel) {
          lock = undefined;
          void requestWhenVisible();
        }
      }, { once: true });
    } catch (error) {
      reportWakeLockError(error);
    } finally {
      requesting = false;
    }
  };

  document.addEventListener('visibilitychange', requestWhenVisible);
  document.addEventListener('pointerdown', requestWhenVisible);
  document.addEventListener('keydown', requestWhenVisible);
  window.addEventListener('pageshow', requestWhenVisible);
  window.addEventListener('focus', requestWhenVisible);
  // Retry failed startup requests before a typical short Android screen timeout.
  const retry = window.setInterval(requestWhenVisible, 10000);
  void requestWhenVisible();

  return () => {
    stopped = true;
    window.clearInterval(retry);
    document.removeEventListener('visibilitychange', requestWhenVisible);
    document.removeEventListener('pointerdown', requestWhenVisible);
    document.removeEventListener('keydown', requestWhenVisible);
    window.removeEventListener('pageshow', requestWhenVisible);
    window.removeEventListener('focus', requestWhenVisible);
    if (lock) {
      const sentinel = lock;
      lock = undefined;
      release(sentinel);
    }
  };
};
