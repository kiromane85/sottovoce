import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronRight, Music2 } from 'lucide-react';

const formatDate = (val) => {
    if (!val) return '';
    try {
        const d = typeof val === 'string' ? new Date(val) : val;
        return d.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return String(val);
    }
};

export const HistoryList = ({ items = [], onOpen, onDelete, emptyAction }) => {
    if (!items.length) {
        return (
            <Card data-testid="history-list" className="p-6 md:p-8 text-center rounded-2xl border border-dashed border-border bg-secondary/30">
                <Music2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-base font-medium text-foreground">Nessun brano in cronologia</p>
                <p className="text-sm text-muted-foreground mt-1">I brani che ascolti compariranno qui.</p>
                {emptyAction && <div className="mt-4">{emptyAction}</div>}
            </Card>
        );
    }
    return (
        <div data-testid="history-list" className="flex flex-col gap-2.5">
            {items.map((it) => (
                <Card
                    key={it.id}
                    data-testid="history-item"
                    className="p-3 md:p-4 rounded-2xl border border-border bg-card hover:bg-secondary/40 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onOpen?.(it)}
                            className="flex-1 min-w-0 text-left"
                            aria-label={`Apri ${it.title} di ${it.artist}`}
                            data-testid="history-item-open"
                        >
                            <div className="font-display text-base md:text-lg font-semibold text-foreground truncate">{it.title || '—'}</div>
                            <div className="text-sm text-muted-foreground truncate">
                                {it.artist || '—'} · {it.target_lang} · {formatDate(it.created_at)}
                            </div>
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => onOpen?.(it)} className="shrink-0" aria-label="Apri">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete?.(it)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label="Elimina"
                            data-testid="history-item-delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default HistoryList;
