import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Car, Languages, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiHistoryClear } from '@/lib/api';
import { toast } from 'sonner';

export const SettingsPanel = ({ open, onOpenChange, onHistoryCleared }) => {
    const { languages, language, setLanguage, carMode, setCarMode } = useApp();

    const clearHistory = async () => {
        try {
            const { deleted } = await apiHistoryClear();
            toast.success(`Cronologia cancellata (${deleted} elementi).`);
            onHistoryCleared?.();
        } catch (e) {
            toast.error('Errore durante la cancellazione.');
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent data-testid="settings-panel" side="right" className="w-full sm:max-w-[420px]">
                <SheetHeader>
                    <SheetTitle className="font-display text-xl flex items-center gap-2">
                        Impostazioni
                    </SheetTitle>
                    <SheetDescription>Personalizza la tua esperienza Sottovoce.</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <section className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Languages className="h-4 w-4" /> Lingua di traduzione
                        </Label>
                        <Select value={language || ''} onValueChange={(v) => { setLanguage(v); toast.success('Lingua aggiornata.'); }}>
                            <SelectTrigger data-testid="settings-language-select" className="h-12">
                                <SelectValue placeholder="Seleziona lingua" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((l) => (
                                    <SelectItem key={l.code} value={l.code} data-testid="settings-language-option">
                                        <span className="mr-2" aria-hidden>{l.flag}</span> {l.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </section>

                    <section className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                        <div className="flex items-center gap-3">
                            <Car className="h-5 w-5 text-primary" />
                            <div>
                                <div className="text-sm font-medium text-foreground">Modalità Auto</div>
                                <div className="text-xs text-muted-foreground">Tipografia ampia e alto contrasto.</div>
                            </div>
                        </div>
                        <Switch
                            data-testid="settings-car-mode-switch"
                            checked={!!carMode}
                            onCheckedChange={(v) => setCarMode(!!v)}
                        />
                    </section>

                    <section className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Dati e cronologia</Label>
                        <Button
                            data-testid="settings-clear-history-button"
                            variant="destructive"
                            className="w-full justify-start"
                            onClick={clearHistory}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Cancella tutta la cronologia
                        </Button>
                    </section>

                    <section className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground flex gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                            Sottovoce identifica il brano tramite Gemini (audio) e recupera i testi sincronizzati da lrclib. Traduzione AI in tempo reale.
                        </span>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SettingsPanel;
