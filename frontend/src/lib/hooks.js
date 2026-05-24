import { useEffect, useState, useCallback, useRef } from 'react';

export const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    });
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* ignore quota errors */
        }
    }, [key, value]);
    return [value, setValue];
};

/**
 * useAudioRecorder  records short audio clips via MediaRecorder.
 * Returns: { state, error, start(), stop(), elapsedMs, durationLimitMs }
 * - state: 'idle' | 'recording' | 'stopping'
 * - start(): begins recording, auto-stops at durationLimitMs (default 9000)
 * - stop(): manually stops, resolves with Blob
 */
export const useAudioRecorder = ({ durationLimitMs = 9000 } = {}) => {
    const [state, setState] = useState('idle');
    const [error, setError] = useState(null);
    const [elapsedMs, setElapsedMs] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const startTsRef = useRef(0);
    const tickRef = useRef(null);
    const stopPromiseRef = useRef(null);
    const autoTimerRef = useRef(null);

    const cleanup = useCallback(() => {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
        if (autoTimerRef.current) {
            clearTimeout(autoTimerRef.current);
            autoTimerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        mediaRecorderRef.current = null;
    }, []);

    const stop = useCallback(() => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            return Promise.resolve(null);
        }
        setState('stopping');
        return new Promise((resolve) => {
            stopPromiseRef.current = resolve;
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                resolve(null);
            }
        });
    }, []);

    const start = useCallback(async () => {
        if (state !== 'idle') return null;
        setError(null);
        setElapsedMs(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const candidates = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4;codecs=mp4a.40.2',
                'audio/mp4',
                'audio/ogg;codecs=opus',
                'audio/ogg',
            ];
            let mime = '';
            for (const c of candidates) {
                if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
                    mime = c;
                    break;
                }
            }
            const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                cleanup();
                setState('idle');
                setElapsedMs(0);
                if (stopPromiseRef.current) {
                    stopPromiseRef.current(blob);
                    stopPromiseRef.current = null;
                }
            };
            recorder.start();
            startTsRef.current = Date.now();
            setState('recording');
            tickRef.current = setInterval(() => {
                setElapsedMs(Date.now() - startTsRef.current);
            }, 100);
            autoTimerRef.current = setTimeout(() => {
                stop();
            }, durationLimitMs);
            return true;
        } catch (e) {
            console.error(e);
            setError(e?.message || 'Microphone permission denied');
            cleanup();
            setState('idle');
            return false;
        }
    }, [state, durationLimitMs, cleanup, stop]);

    useEffect(() => () => cleanup(), [cleanup]);

    return { state, error, start, stop, elapsedMs, durationLimitMs };
};
