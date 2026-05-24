import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

export const LanguagePicker = ({ onContinue, showContinue = true }) => {
    const { languages, language, setLanguage } = useApp();
    const [pick, setPick] = useState(language || 'Italian');

    return (
        <Card data-testid="language-picker" className="p-5 md:p-7 rounded-2xl border border-border bg-card shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
            <div className="mb-4">
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    Scegli la lingua di traduzione
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                    I testi delle canzoni verranno tradotti in questa lingua. Potrai cambiarla in qualsiasi momento.
                </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                {languages.map((l) => {
                    const isActive = pick === l.code;
                    return (
                        <button
                            key={l.code}
                            type="button"
                            data-testid="language-chip"
                            data-lang={l.code}
                            onClick={() => setPick(l.code)}
                            aria-pressed={isActive}
                            className={`group flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm md:text-base font-medium border transition-colors min-h-[56px] ${
                                isActive
                                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_8px_22px_rgba(0,0,0,0.18)]'
                                    : 'bg-secondary text-secondary-foreground hover:bg-muted border-border'
                            }`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                <span className="text-lg" aria-hidden>{l.flag}</span>
                                <span className="truncate">{l.label}</span>
                            </span>
                            {isActive && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                    );
                })}
            </div>
            {showContinue && (
                <div className="mt-5 flex justify-end">
                    <Button
                        data-testid="language-picker-continue-button"
                        className="rounded-xl h-12 px-6 text-base"
                        onClick={() => {
                            setLanguage(pick);
                            onContinue?.(pick);
                        }}
                        disabled={!pick}
                    >
                        Continua
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default LanguagePicker;
