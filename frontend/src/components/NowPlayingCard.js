import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music2, Disc3, Sparkles } from 'lucide-react';

const confidenceTone = (c) => {
    if (c >= 0.75) return 'text-[hsl(var(--confidence-good))] border-[hsl(var(--confidence-good))]/40 bg-[hsl(var(--confidence-good))]/10';
    if (c >= 0.4)  return 'text-[hsl(var(--confidence-mid))] border-[hsl(var(--confidence-mid))]/40 bg-[hsl(var(--confidence-mid))]/10';
    return 'text-[hsl(var(--confidence-low))] border-[hsl(var(--confidence-low))]/40 bg-[hsl(var(--confidence-low))]/10';
};

const confidenceLabel = (c) => {
    if (c >= 0.75) return 'Alta';
    if (c >= 0.4) return 'Media';
    if (c > 0) return 'Bassa';
    return '—';
};

export const NowPlayingCard = ({ track, compact = false }) => {
    if (!track) return null;
    const { title, artist, album, target_lang, confidence = 0, source = 'recognition' } = track;
    return (
        <Card
            data-testid="now-playing-card"
            className="p-4 md:p-5 bg-card border border-border shadow-[0_10px_30px_rgba(0,0,0,0.18)] rounded-2xl"
        >
            <div className="flex items-center gap-4">
                <div className="shrink-0 h-14 w-14 md:h-16 md:w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border">
                    <Disc3 className="h-8 w-8 text-muted-foreground spin-slow" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                        <Music2 className="h-3.5 w-3.5" />
                        <span>Ora in ascolto</span>
                    </div>
                    <div
                        data-testid="now-playing-title"
                        className="font-display text-lg md:text-2xl font-semibold truncate text-foreground"
                    >
                        {title || 'Brano sconosciuto'}
                    </div>
                    <div
                        data-testid="now-playing-artist"
                        className="text-sm md:text-base text-muted-foreground truncate"
                    >
                        {artist || '—'}{album ? <> · <span className="opacity-80">{album}</span></> : null}
                    </div>
                </div>
            </div>
            {!compact && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        data-testid="now-playing-confidence"
                        className={`rounded-full border ${confidenceTone(confidence)}`}
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Confidenza: {confidenceLabel(confidence)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-secondary text-secondary-foreground">
                        Lingua: {target_lang || 'Italian'}
                    </Badge>
                    {source === 'manual' && (
                        <Badge variant="outline" className="rounded-full bg-accent/15 text-accent-foreground border-accent/30">
                            Input manuale
                        </Badge>
                    )}
                </div>
            )}
        </Card>
    );
};

export default NowPlayingCard;
