import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';

const tidalLinkRegex = /tidal\.com\//i;

export const ManualEntryDialog = ({ open, onOpenChange, onSubmit, loading = false }) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [link, setLink] = useState('');
    const canSubmit = title.trim() && artist.trim() && !loading;

    const submit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit?.({ title: title.trim(), artist: artist.trim(), link: link.trim() || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent data-testid="manual-entry-dialog" className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl">Inserisci il brano manualmente</DialogTitle>
                    <DialogDescription>
                        Inserisci titolo e artista. Puoi anche incollare un link Tidal per riferimento.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-1.5">
                        <Label htmlFor="manual-title">Titolo</Label>
                        <Input
                            id="manual-title"
                            data-testid="manual-entry-title-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Imagine"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="manual-artist">Artista</Label>
                        <Input
                            id="manual-artist"
                            data-testid="manual-entry-artist-input"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="John Lennon"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="manual-link" className="flex items-center gap-1.5">
                            <LinkIcon className="h-3.5 w-3.5" /> Link Tidal (opzionale)
                        </Label>
                        <Input
                            id="manual-link"
                            data-testid="manual-entry-tidal-link-input"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://tidal.com/browse/track/..."
                            inputMode="url"
                        />
                        {link && !tidalLinkRegex.test(link) && (
                            <p className="text-xs text-muted-foreground">Non sembra un link Tidal, ma lo userai solo come riferimento.</p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
                            Annulla
                        </Button>
                        <Button
                            type="submit"
                            data-testid="manual-entry-submit-button"
                            disabled={!canSubmit}
                        >
                            {loading ? 'Sto cercando…' : 'Trova testo'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ManualEntryDialog;
