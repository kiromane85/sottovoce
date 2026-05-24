import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, History as HistoryIcon, Car, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/context/AppContext';

export const AppHeader = ({ onOpenSettings }) => {
    const navigate = useNavigate();
    const { carMode, setCarMode } = useApp();
    return (
        <header className="w-full sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border">
            <div className="mx-auto max-w-5xl px-4 md:px-6 py-3 flex items-center gap-3">
                <Link to="/home" className="flex items-center gap-2 group" aria-label="Sottovoce home">
                    <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                        <AudioLines className="h-4 w-4" />
                    </span>
                    <span className="font-display text-lg md:text-xl font-semibold tracking-tight text-foreground">Sottovoce</span>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-full border border-border bg-secondary/60">
                        <Car className="h-4 w-4" />
                        <span className="text-xs font-medium">Auto</span>
                        <Switch
                            checked={!!carMode}
                            onCheckedChange={(v) => setCarMode(!!v)}
                            data-testid="car-mode-toggle"
                            aria-label="Modalità Auto"
                        />
                    </div>
                    <Button
                        data-testid="history-open-button"
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/history')}
                        aria-label="Cronologia"
                        className="h-10 w-10"
                    >
                        <HistoryIcon className="h-5 w-5" />
                    </Button>
                    <Button
                        data-testid="settings-open-button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenSettings?.()}
                        aria-label="Impostazioni"
                        className="h-10 w-10"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
