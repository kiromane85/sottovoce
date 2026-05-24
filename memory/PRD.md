# Sottovoce — PRD

## Vision
PWA che riconosce le canzoni in riproduzione e mostra in tempo reale i testi originali + tradotti, ottimizzata sia per uso a mano sia per il display dell'auto (Modalità Auto full-screen).

## User flow (V1 implementato)
1. Splash → scelta lingua di traduzione (12 lingue).
2. Home → pulsante microfono grande (≈9s registrazione) o "Inserisci manualmente".
3. Riconoscimento (Gemini 2.5 Pro multimodale) → titolo + artista + confidence.
4. Recupero lyrics sincronizzati da lrclib.net (con fallback plain text).
5. Traduzione AI (Gemini 2.5 Flash) preservando struttura e timestamp.
6. Schermata risultato: NowPlayingCard + KaraokeLyricsViewer (Entrambi/Originale/Traduzione).
7. Modalità Auto attivabile: layout landscape, font ~2x, alto contrasto, controlli ≥56px.
8. Cronologia automatica con eliminazione singola/totale e riapertura rapida.

## Tech stack
- **Backend**: FastAPI + Motor (MongoDB) + emergentintegrations (Gemini).
- **Frontend**: React 19 + react-router 7 + Tailwind + shadcn/ui + framer-motion.
- **Integrazioni**: Gemini 2.5 Pro (recognition), Gemini 2.5 Flash (translate) tramite Emergent Universal LLM Key; lrclib.net (lyrics).
- **PWA**: manifest.json, theme-color, standalone display.

## API surface
| Method | Path | Scopo |
|---|---|---|
| GET | `/api/` | health |
| GET | `/api/languages` | lingue supportate |
| POST | `/api/lyrics` | cerca lyrics su lrclib |
| POST | `/api/translate` | traduzione array di righe |
| POST | `/api/recognize` | riconoscimento audio (multipart) |
| POST | `/api/track/resolve` | pipeline completa da audio |
| POST | `/api/track/manual` | pipeline da titolo/artista |
| GET | `/api/history` | lista cronologia |
| GET | `/api/history/{id}` | dettaglio brano |
| DELETE | `/api/history/{id}` | elimina singolo |
| DELETE | `/api/history` | svuota cronologia |

## Stato fasi
- [x] **Phase 1 POC** — audio recognition + lrclib + translation validati end-to-end.
- [x] **Phase 2 V1 App** — backend completo, PWA frontend, Car Mode, History; test 100% pass.
- [ ] **Phase 3 Espansione** (su richiesta utente): parser link/share Tidal, regolazione offset karaoke, ricerca cronologia, sync con artwork.
- [ ] **Phase 4 Hardening**: auth opzionale, export LRC, multi-provider recognition.

## Note importanti
- **Android Auto nativo non disponibile** (richiede app nativa); soluzione attuale = PWA + Modalità Auto + UI ottimizzata per display auto via mirroring/browser.
- **Riconoscimento brani** basato su Gemini multimodale (capisce lyrics udite), non su audio fingerprinting: funziona bene con voce/parlato chiaro, può fallire su strumentali o brani poco noti — in tal caso fallback all'inserimento manuale.
- **Limite proxy LLM**: occasionali errori transitori "budget exceeded" sul proxy Emergent; il backend non implementa retry automatico (può essere aggiunto in fase 3 se necessario).
