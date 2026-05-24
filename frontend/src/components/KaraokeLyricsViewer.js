import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Languages, Type, Layers } from 'lucide-react';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const Mode = {
    BOTH: 'both',
    ORIGINAL: 'original',
    TRANSLATION: 'translation',
};

export const KaraokeLyricsViewer = ({ track, carMode = false }) => {
    const lines = useMemo(() => (track?.lines || []).map((l, i) => ({ ...l, _i: i })), [track]);
    const hasSynced = !!track?.has_synced && lines.some((l) => l.t_ms !== null && l.t_ms !== undefined);
    const duration = (track?.duration && track.duration > 0)
        ? track.duration * 1000
        : (lines.length ? (lines[lines.length - 1].t_ms || 0) + 4000 : 60_000);

    const [playing, setPlaying] = useState(false);
    const [posMs, setPosMs] = useState(0);
    const [mode, setMode] = useState(Mode.BOTH);
    const tickRef = useRef(null);
    const startedAtRef = useRef(0);
    const baseRef = useRef(0);
    const lineRefs = useRef([]);

    // Auto-play timer (purely synthetic clock for sync visualization)
    useEffect(() => {
        if (!playing) {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
            return;
        }
        startedAtRef.current = Date.now();
        tickRef.current = setInterval(() => {
            const dt = Date.now() - startedAtRef.current;
            setPosMs((p) => {
                const next = baseRef.current + dt;
                if (next >= duration) {
                    setPlaying(false);
                    return duration;
                }
                return next;
            });
        }, 80);
        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
        };
    }, [playing, duration]);

    const togglePlay = () => {
        if (!playing) {
            baseRef.current = posMs;
        }
        setPlaying((p) => !p);
    };
    const restart = () => {
        setPlaying(false);
        baseRef.current = 0;
        setPosMs(0);
    };

    // Determine current line index
    const currentIdx = useMemo(() => {
        if (!hasSynced) return 0;
        let idx = 0;
        for (let i = 0; i < lines.length; i++) {
            const t = lines[i].t_ms;
            if (t == null) continue;
            if (t <= posMs) idx = i;
            else break;
        }
        return idx;
    }, [posMs, lines, hasSynced]);

    // Auto-scroll current line into view
    useEffect(() => {
        const el = lineRefs.current[currentIdx];
        if (!el) return;
        const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        try {
            el.scrollIntoView({ block: 'center', behavior: prefersReduce ? 'auto' : 'smooth' });
        } catch {
            el.scrollIntoView();
        }
    }, [currentIdx]);

    if (!lines.length) {
        return (
            <div data-testid="karaoke-lyrics-viewer" className="text-center text-muted-foreground py-12">
                <p className="text-base">Nessun testo trovato per questo brano.</p>
                <p className="text-sm mt-1">Prova con “Modifica brano” o riascolta un'altra porzione.</p>
            </div>
        );
    }

    const lyricsCurrentSize = carMode
        ? 'text-3xl md:text-5xl leading-tight'
        : 'text-xl md:text-2xl leading-snug';
    const lyricsOtherSize = carMode
        ? 'text-2xl md:text-3xl leading-snug'
        : 'text-base md:text-lg leading-relaxed';
    const translationCurrent = carMode
        ? 'text-xl md:text-3xl leading-snug'
        : 'text-base md:text-lg leading-snug';
    const padY = carMode ? 'py-5' : 'py-3';

    return (
        <div data-testid="karaoke-lyrics-viewer" className="w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {hasSynced && (
                    <>
                        <Button
                            data-testid="karaoke-play-button"
                            variant="secondary"
                            className="rounded-full h-10"
                            onClick={togglePlay}
                        >
                            {playing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                            {playing ? 'Pausa' : 'Avvia karaoke'}
                        </Button>
                        <Button
                            data-testid="karaoke-restart-button"
                            variant="ghost"
                            className="rounded-full h-10"
                            onClick={restart}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Da capo
                        </Button>
                        <div className="font-mono text-xs md:text-sm text-muted-foreground ml-auto">
                            {fmtMs(posMs)} / {fmtMs(duration)}
                        </div>
                    </>
                )}
                {!hasSynced && (
                    <div className="text-xs md:text-sm text-muted-foreground">
                        Testo non sincronizzato — mostrato in versione lineare.
                    </div>
                )}
            </div>

            {/* mode tabs */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-secondary/60 mb-3" data-testid="karaoke-mode-tabs">
                <ModeButton active={mode === Mode.BOTH} onClick={() => setMode(Mode.BOTH)} icon={<Layers className="h-3.5 w-3.5" />} label="Entrambi" testId="karaoke-mode-both" />
                <ModeButton active={mode === Mode.ORIGINAL} onClick={() => setMode(Mode.ORIGINAL)} icon={<Type className="h-3.5 w-3.5" />} label="Originale" testId="karaoke-mode-original" />
                <ModeButton active={mode === Mode.TRANSLATION} onClick={() => setMode(Mode.TRANSLATION)} icon={<Languages className="h-3.5 w-3.5" />} label="Traduzione" testId="karaoke-mode-translation" />
            </div>

            <ScrollArea className={`rounded-2xl border border-border bg-card ${carMode ? 'h-[58vh] md:h-[68vh]' : 'h-[44vh] md:h-[52vh]'} no-scrollbar`}>
                <div className={`px-4 md:px-6 ${carMode ? 'py-10' : 'py-6'} max-w-[72ch]`}>
                    {lines.map((line, i) => {
                        const isCurrent = hasSynced ? i === currentIdx : false;
                        const isPast = hasSynced ? i < currentIdx : false;
                        const baseLine = `${padY} px-3 rounded-xl transition-colors`;
                        const stateLine = isCurrent
                            ? 'bg-[hsla(var(--karaoke-active),0.10)] ring-1 ring-[hsla(var(--karaoke-active),0.35)]'
                            : '';
                        const orig = (line.original || '').trim();
                        const trad = (line.translated || '').trim();
                        return (
                            <div
                                key={i}
                                ref={(el) => { lineRefs.current[i] = el; }}
                                data-testid={isCurrent ? 'karaoke-current-line' : undefined}
                                className={`${baseLine} ${stateLine}`}
                                aria-current={isCurrent ? 'true' : undefined}
                            >
                                {mode !== Mode.TRANSLATION && (
                                    <p
                                        className={`font-display font-medium ${
                                            isCurrent ? `${lyricsCurrentSize} text-foreground` :
                                            isPast    ? `${lyricsOtherSize} text-muted-foreground/60` :
                                                        `${lyricsOtherSize} text-muted-foreground`
                                        }`}
                                    >
                                        {orig || ' '}
                                    </p>
                                )}
                                {mode !== Mode.ORIGINAL && (
                                    <p
                                        data-testid={isCurrent ? 'karaoke-current-translation' : undefined}
                                        className={`${mode === Mode.TRANSLATION ? '' : 'mt-1'} ${
                                            isCurrent ? `${translationCurrent} text-[hsl(var(--karaoke-active))] font-medium` :
                                            isPast    ? `${lyricsOtherSize} text-muted-foreground/50` :
                                                        `${lyricsOtherSize} text-muted-foreground`
                                        }`}
                                    >
                                        {trad || ' '}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

const ModeButton = ({ active, onClick, icon, label, testId }) => (
    <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${
            active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
        }`}
    >
        {icon}{label}
    </button>
);

const fmtMs = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default KaraokeLyricsViewer;
