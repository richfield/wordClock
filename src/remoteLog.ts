/* eslint-disable no-console -- wrapping the console is the purpose of this module */
type Level = 'error' | 'warn' | 'info';
export interface Entry { level: Level, time: string, message: string }

const FLUSH_DELAY_MS = 3000;
const MAX_BUFFER = 50;
const MAX_PER_MINUTE = 40;

export const formatArgument = (value: unknown): string => {
    if (value instanceof Error) {
        return `${value.name}: ${value.message}`;
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
};

export const formatArguments = (args: unknown[]): string => args.map(formatArgument).join(' ');

let send: ((entries: Entry[]) => Promise<unknown>) | undefined;
let buffer: Entry[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let windowStart = 0;
let sentInWindow = 0;

const flush = () => {
    timer = undefined;
    if (!send || buffer.length === 0) {
        return;
    }
    const entries = buffer;
    buffer = [];
    // A failing log request must never log again, or it would loop
    send(entries).catch(() => undefined);
};

export const log = (level: Level, message: string): void => {
    if (!send) {
        return;
    }
    const now = Date.now();
    if (now - windowStart > 60000) {
        windowStart = now;
        sentInWindow = 0;
    }
    if (sentInWindow >= MAX_PER_MINUTE || buffer.length >= MAX_BUFFER) {
        return;
    }
    sentInWindow++;
    buffer.push({ level, time: new Date(now).toISOString(), message });
    if (level === 'error') {
        flush();
    } else if (!timer) {
        timer = setTimeout(flush, FLUSH_DELAY_MS);
    }
};

/** Diagnostic events from the app itself, ignored until remote logging is installed. */
export const logInfo = (message: string): void => log('info', message);

const describeEnvironment = (): string => formatArguments([ {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    wakeLockSupported: 'wakeLock' in navigator,
    visibility: document.visibilityState,
    screen: `${window.screen.width}x${window.screen.height}`,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches,
    userAgent: navigator.userAgent
} ]);

/**
 * Sends console errors and warnings, uncaught errors and some diagnostics to the server.
 * Returns a function that restores the original behaviour.
 */
export const installRemoteLogging = (sender: (entries: Entry[]) => Promise<unknown>): (() => void) => {
    send = sender;
    const { error, warn } = console;

    console.error = (...args: unknown[]) => {
        error.apply(console, args);
        log('error', formatArguments(args));
    };
    console.warn = (...args: unknown[]) => {
        warn.apply(console, args);
        log('warn', formatArguments(args));
    };
    const onError = (event: ErrorEvent) =>
        log('error', `Uncaught: ${event.message} (${event.filename}:${event.lineno}:${event.colno})`);
    const onRejection = (event: PromiseRejectionEvent) =>
        log('error', `Unhandled rejection: ${formatArgument(event.reason)}`);
    const onVisibility = () => logInfo(`Visibility changed to ${document.visibilityState}`);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    document.addEventListener('visibilitychange', onVisibility);
    logInfo(`App started ${describeEnvironment()}`);

    return () => {
        console.error = error;
        console.warn = warn;
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
        document.removeEventListener('visibilitychange', onVisibility);
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        buffer = [];
        send = undefined;
    };
};
