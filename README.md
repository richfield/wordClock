# WordClock
Webapplication to show a clock
* Ability to create a user and manage settings such as:
 * Schedule a clock on a given timespan
 * Set a countdown timer for a given amount of time or scheduled
 * Change size of the clock and position to the top
 * Change clock colors

## Keeping the screen awake

The clock page requests a screen wake lock on every load, including forced and
hourly reloads. It reacquires a released lock when visible, retries refused
requests every 10 seconds, and retries when returning to the PWA or interacting
with the clock. Refreshing clock settings does not release the lock.

This requires HTTPS (or localhost) and a browser supporting the Screen Wake Lock
API. Android battery saver or browser/device policies can still refuse or release
the lock; request failures are logged in the browser console. A wake lock cannot
keep the screen awake while the PWA is hidden or wake a screen that is already off.
