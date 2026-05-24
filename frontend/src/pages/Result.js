import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, PenLine, X as XIcon, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import NowPlayingCard from '@/components/NowPlayingCard';
import KaraokeLyricsViewer from '@/components/KaraokeLyricsViewer';
import SettingsPanel from '@/components/SettingsPanel';
import ManualEntryDialog from '@/components/ManualEntryDialog';
import { useApp } from '@/context/AppContext';
import { apiHistoryGet, apiResolveManual } from '@/lib/api';
import { toast } from 'sonner';

export default function Result() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentTrack, setCurrentTrack, carMode, setCarMode, language } = useApp();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchById = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const t = await apiHistoryGet(id);
                setCurrentTrack(t);
            } catch (e) {
                setError('Impossibile caricare il brano.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchById();
    }, [id, setCurrentTrack]);

    useEffect(() => {
        if (!id && !currentTrack) {
            navigate('/home', { replace: true });
        }
    }, [id, currentTrack, navigate]);

    const handleManualSubmit = async ({ title, artist }) => {
        setLoading(true);
        try {
            const t = await apiResolveManual({ title, artist, target_lang: language || 'Italian' });
            setCurrentTrack(t);
            setManualOpen(false);
            toast.success('Brano aggiornato.');
        } catch {
            toast.error('Impossibile trovare il brano.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentTrack && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-base text-muted-foreground">Nessun brano selezionato.</p>
                    <Button className="mt-4" onClick={() => navigate('/home')}>Torna alla home</Button>
                </div>
            </div>
        );
    }

    if (carMode) {
        return (
            <div data-testid="car-mode-screen" className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm md:text-base uppercase tracking-widest text-muted-foreground">Modalità Auto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                className="h-12 px-4 text-base"
                                onClick={() => setSettingsOpen(true)}
                                data-testid="settings-open-button"
                            >
                                Impostazioni
                            </Button>
                            <Button
                                data-testid="car-mode-exit-button"
                                variant="secondary"
                                className="h-12 px-4 text-base"
                                onClick={() => setCarMode(false)}
                            >
                                <Minimize2 className="h-4 w-4 mr-1.5" /> Esci
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <NowPlayingCard track={currentTrack} />
                            <Button
                                variant="secondary"
                                className="h-14 text-base"
                                onClick={() => navigate('/home')}
                            >
                                <ChevronLeft className="h-5 w-5 mr-1.5" /> Nuovo brano
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-14 text-base"
                                onClick={() => setManualOpen(true)}
                            >
                                <PenLine className="h-5 w-5 mr-1.5" /> Modifica brano
                            </Button>
                        </div>
                        <div className="lg:col-span-8">
                            <KaraokeLyricsViewer track={currentTrack} carMode />
                        </div>
                    </div>
                </div>
                <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
                <ManualEntryDialog
                    open={manualOpen}
                    onOpenChange={setManualOpen}
                    onSubmit={handleManualSubmit}
                    loading={loading}
                />
            </div>
        );
    }

    return (
        <div className="app-noise min-h-screen flex flex-col">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            <main className="app-shell flex-1 mx-auto w-full max-w-3xl px-4 md:px-6 py-4 md:py-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <Button variant="ghost" onClick={() => navigate('/home')} className="rounded-full">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setCarMode(true)}
                            className="rounded-full"
                            data-testid="car-mode-toggle-result"
                        >
                            <Maximize2 className="h-4 w-4 mr-1" /> Modalità Auto
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setManualOpen(true)}
                            className="rounded-full"
                            data-testid="result-manual-edit-button"
                        >
                            <PenLine className="h-4 w-4 mr-1" /> Modifica brano
                        </Button>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-4"
                >
                    <NowPlayingCard track={currentTrack} />
                    {!currentTrack?.lines?.length && currentTrack?.title ? (
                        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4 md:p-6 text-center">
                            <p className="text-base font-medium text-foreground">
                                Brano riconosciuto, ma testo non disponibile.
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Prova “Modifica brano” per cercare con titolo/artista alternativi.
                            </p>
                            <Button onClick={() => setManualOpen(true)} className="mt-3 rounded-full">
                                <PenLine className="h-4 w-4 mr-1" /> Cerca un altro titolo
                            </Button>
                        </div>
                    ) : (
                        <KaraokeLyricsViewer track={currentTrack} />
                    )}
                </motion.div>
            </main>
            <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
            <ManualEntryDialog
                open={manualOpen}
                onOpenChange={setManualOpen}
                onSubmit={handleManualSubmit}
                loading={loading}
            />
        </div>
    );
}
