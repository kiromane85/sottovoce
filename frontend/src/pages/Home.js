import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, History as HistoryIcon, Mic2, PenLine, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import MicCaptureButton from '@/components/MicCaptureButton';
import NowPlayingCard from '@/components/NowPlayingCard';
import SettingsPanel from '@/components/SettingsPanel';
import ManualEntryDialog from '@/components/ManualEntryDialog';
import { useApp } from '@/context/AppContext';
import { useAudioRecorder } from '@/lib/hooks';
import { apiResolveAudio, apiResolveManual, apiHistoryList } from '@/lib/api';

export default function Home() {
    const navigate = useNavigate();
    const { language, languages, carMode, currentTrack, setCurrentTrack } = useApp();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [submitState, setSubmitState] = useState('idle'); // idle | processing | error
    const [recent, setRecent] = useState([]);

    const recorder = useAudioRecorder({ durationLimitMs: 9000 });

    useEffect(() => {
        if (!language) navigate('/', { replace: true });
    }, [language, navigate]);

    const langMeta = useMemo(
        () => languages.find((l) => l.code === language) || { label: language, flag: '🌐' },
        [languages, language]
    );

    const refreshRecent = async () => {
        try {
            const items = await apiHistoryList();
            setRecent(items.slice(0, 3));
        } catch {
            /* ignore */
        }
    };
    useEffect(() => { refreshRecent(); }, []);

    const startCapture = async () => {
        const ok = await recorder.start();
        if (!ok) {
            toast.error('Microfono non disponibile. Concedi i permessi e riprova.');
        }
    };

    const stopAndRecognize = async () => {
        const blob = await recorder.stop();
        if (!blob) return;
        setSubmitState('processing');
        try {
            const track = await apiResolveAudio(blob, language || 'Italian');
            if (!track.title || !track.artist) {
                toast.warning('Non sono riuscito a riconoscere il brano. Inseriscilo manualmente.');
                setCurrentTrack(track);
                setManualOpen(true);
            } else if (!track.lines || track.lines.length === 0) {
                toast.info(`Brano riconosciuto (${track.title}) ma testo non disponibile.`);
                setCurrentTrack(track);
                navigate('/result');
            } else {
                setCurrentTrack(track);
                toast.success(`Trovato: ${track.title}  ${track.artist}`);
                navigate('/result');
                refreshRecent();
            }
        } catch (e) {
            console.error(e);
            toast.error('Errore di rete o di riconoscimento. Riprova.');
            setSubmitState('error');
        } finally {
            setSubmitState('idle');
        }
    };

    // Auto-recognition when recording stops on its own (timer)
    useEffect(() => {
        const id = setInterval(() => {
            if (recorder.state === 'idle' && recorder.elapsedMs === 0) {
                // nothing
            }
        }, 200);
        return () => clearInterval(id);
    }, [recorder.state, recorder.elapsedMs]);

    // When user manually stops via button, stopAndRecognize is called; when timer auto-stops,
    // we still need to push the resulting blob. Simplest: intercept via custom flow:
    const onMicAction = () => {
        if (recorder.state === 'recording') {
            stopAndRecognize();
        } else if (recorder.state === 'idle') {
            // Also wire timer auto-stop -> recognize: poll via observer
            startCapture().then(async () => {
                // wait for the auto-stop fired by hook by polling state
                const wait = () => new Promise((resolve) => {
                    const t = setInterval(() => {
                        // when state becomes 'stopping' triggered by timer, the recorder's stop() resolves the blob in promise we already control via stopAndRecognize.
                        clearInterval(t);
                        resolve();
                    }, 50);
                });
                await wait();
            });
        }
    };

    // Better: listen for end via durationLimit  use effect that stops on time externally.
    useEffect(() => {
        if (recorder.state === 'recording' && recorder.elapsedMs >= recorder.durationLimitMs - 80) {
            stopAndRecognize();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recorder.elapsedMs, recorder.state]);

    const handleManualSubmit = async ({ title, artist }) => {
        setSubmitState('processing');
        try {
            const track = await apiResolveManual({ title, artist, target_lang: language || 'Italian' });
            setCurrentTrack(track);
            setManualOpen(false);
            toast.success(`Caricato: ${title}  ${artist}`);
            navigate('/result');
            refreshRecent();
        } catch (e) {
            toast.error('Impossibile trovare il brano. Verifica titolo/artista.');
        } finally {
            setSubmitState('idle');
        }
    };

    const micState = submitState === 'processing' ? 'processing'
                   : recorder.state === 'recording' ? 'recording'
                   : 'idle';

    return (
        <div className="app-noise min-h-screen flex flex-col">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            <main className="app-shell flex-1 mx-auto w-full max-w-2xl px-4 md:px-6 py-6 md:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap items-center gap-2 mb-6"
                >
                    <Badge variant="outline" className="rounded-full bg-secondary text-secondary-foreground">
                        <span aria-hidden className="mr-1">{langMeta.flag}</span> Traduci in {langMeta.label}
                    </Badge>
                    {carMode && (
                        <Badge variant="outline" className="rounded-full bg-accent/15 text-accent-foreground border-accent/30">
                            Modalità Auto attiva
                        </Badge>
                    )}
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="flex flex-col items-center text-center mt-2 md:mt-6"
                >
                    <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground max-w-prose">
                        Cosa stai ascoltando?
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-prose">
                        Avvicina il telefono alla sorgente musicale e tocca il microfono. Catturerò ≈9 secondi e tradurrò i testi.
                    </p>

                    <div className="mt-10">
                        <MicCaptureButton
                            state={micState}
                            elapsedMs={recorder.elapsedMs}
                            durationLimitMs={recorder.durationLimitMs}
                            onStart={onMicAction}
                            onStop={onMicAction}
                            size="xl"
                        />
                    </div>

                    {recorder.error && (
                        <div className="mt-4 text-sm text-destructive flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" /> {recorder.error}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                        <Button
                            data-testid="manual-entry-open-button"
                            variant="secondary"
                            className="rounded-full h-11 px-4"
                            onClick={() => setManualOpen(true)}
                        >
                            <PenLine className="h-4 w-4 mr-1.5" /> Inserisci manualmente
                        </Button>
                        <Button
                            variant="ghost"
                            className="rounded-full h-11 px-4"
                            onClick={() => navigate('/history')}
                        >
                            <HistoryIcon className="h-4 w-4 mr-1.5" /> Cronologia
                        </Button>
                    </div>
                </motion.section>

                {currentTrack && (currentTrack.title || currentTrack.artist) && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10"
                    >
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                            Ultimo riconosciuto
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/result')}
                            className="w-full text-left"
                            aria-label="Apri ultimo brano riconosciuto"
                        >
                            <NowPlayingCard track={currentTrack} compact />
                            <div className="mt-2 flex items-center justify-end text-xs text-primary">
                                Apri risultato <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </div>
                        </button>
                    </motion.section>
                )}

                {recent.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">Recenti</div>
                            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/history')}>Vedi tutto</Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {recent.map((it) => (
                                <button
                                    key={it.id}
                                    type="button"
                                    data-testid="home-recent-item"
                                    onClick={() => navigate(`/result/${it.id}`)}
                                    className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/60 transition-colors"
                                >
                                    <div className="font-display text-base font-semibold truncate text-foreground">{it.title}</div>
                                    <div className="text-sm text-muted-foreground truncate">{it.artist}  {it.target_lang}</div>
                                </button>
                            ))}
                        </div>
                    </motion.section>
                )}
            </main>
            <SettingsPanel
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                onHistoryCleared={refreshRecent}
            />
            <ManualEntryDialog
                open={manualOpen}
                onOpenChange={setManualOpen}
                onSubmit={handleManualSubmit}
                loading={submitState === 'processing'}
            />
        </div>
    );
}
