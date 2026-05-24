import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stateLabels = {
    idle: 'Tocca per ascoltare',
    recording: 'In ascolto…',
    processing: 'Riconoscimento…',
    error: 'Riprova',
};

export const MicCaptureButton = ({
    state = 'idle',
    onStart,
    onStop,
    elapsedMs = 0,
    durationLimitMs = 9000,
    size = 'lg',
}) => {
    const isRecording = state === 'recording';
    const isProcessing = state === 'processing';
    const isDisabled = isProcessing;
    const onClick = () => {
        if (isProcessing) return;
        if (isRecording) onStop?.();
        else onStart?.();
    };
    const diameter = size === 'xl' ? 'h-36 w-36 md:h-44 md:w-44' : 'h-28 w-28 md:h-32 md:w-32';
    const iconSize = size === 'xl' ? 'h-12 w-12' : 'h-9 w-9';
    const ringPercent = Math.min(100, Math.round((elapsedMs / durationLimitMs) * 100));

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                {/* progress ring while recording */}
                {isRecording && (
                    <svg
                        className="absolute inset-0 -m-2"
                        viewBox="0 0 100 100"
                        aria-hidden="true"
                    >
                        <circle cx="50" cy="50" r="46" fill="none" stroke="hsla(var(--karaoke-active),0.18)" strokeWidth="3" />
                        <motion.circle
                            cx="50" cy="50" r="46" fill="none"
                            stroke="hsl(var(--karaoke-active))"
                            strokeWidth="3"
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{
                                strokeDasharray: 2 * Math.PI * 46,
                                strokeDashoffset: (2 * Math.PI * 46) * (1 - ringPercent / 100),
                                transition: 'stroke-dashoffset 100ms linear',
                            }}
                        />
                    </svg>
                )}
                <Button
                    data-testid="mic-capture-button"
                    aria-pressed={isRecording}
                    aria-busy={isProcessing}
                    aria-label={isRecording ? 'Ferma registrazione' : 'Inizia registrazione'}
                    onClick={onClick}
                    disabled={isDisabled}
                    className={`${diameter} rounded-full bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(0,0,0,0.35)] hover:bg-primary/90 active:scale-[0.97] transition-[transform,background-color] ${
                        isRecording ? 'mic-pulse' : ''
                    }`}
                >
                    {isProcessing ? (
                        <Loader2 className={`${iconSize} animate-spin`} />
                    ) : isRecording ? (
                        <Square className={`${iconSize}`} fill="currentColor" />
                    ) : (
                        <Mic className={`${iconSize}`} />
                    )}
                </Button>
            </div>
            <div
                data-testid="mic-capture-state-label"
                className="text-sm md:text-base text-muted-foreground tracking-wide"
            >
                {state === 'error' ? 'Errore microfono. Riprova.' : stateLabels[state] || ''}
                {isRecording && (
                    <span className="ml-2 font-mono text-foreground">
                        {(elapsedMs / 1000).toFixed(1)}s
                    </span>
                )}
            </div>
        </div>
    );
};

export default MicCaptureButton;
