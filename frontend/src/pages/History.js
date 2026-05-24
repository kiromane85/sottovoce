import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import HistoryList from '@/components/HistoryList';
import SettingsPanel from '@/components/SettingsPanel';
import { apiHistoryDelete, apiHistoryList } from '@/lib/api';
import { toast } from 'sonner';

export default function History() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await apiHistoryList();
            setItems(data);
        } catch {
            toast.error('Impossibile caricare la cronologia.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const handleDelete = async (item) => {
        try {
            await apiHistoryDelete(item.id);
            setItems((arr) => arr.filter((x) => x.id !== item.id));
            toast.success('Brano rimosso dalla cronologia.');
        } catch {
            toast.error('Errore durante la rimozione.');
        }
    };

    return (
        <div className="app-noise min-h-screen flex flex-col">
            <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
            <main className="app-shell flex-1 mx-auto w-full max-w-2xl px-4 md:px-6 py-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <Button variant="ghost" onClick={() => navigate('/home')} className="rounded-full">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                    </Button>
                    <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">Cronologia</h1>
                    <span className="opacity-0">.</span>
                </div>
                {loading ? (
                    <div className="text-sm text-muted-foreground">Carico…</div>
                ) : (
                    <HistoryList
                        items={items}
                        onOpen={(it) => navigate(`/result/${it.id}`)}
                        onDelete={handleDelete}
                        emptyAction={
                            <Button onClick={() => navigate('/home')} className="rounded-full">
                                Ascolta ora
                            </Button>
                        }
                    />
                )}
            </main>
            <SettingsPanel
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                onHistoryCleared={load}
            />
        </div>
    );
}
