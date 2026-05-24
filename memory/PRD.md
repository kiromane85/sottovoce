# Sottovoce — PRD (Mobile Expo App)

## Vision
Sottovoce è l'app mobile (Expo + React Native) che riconosce le canzoni in riproduzione tramite microfono e mostra in tempo reale i testi originali + tradotti, ottimizzata per uso a mano e Modalità Auto. Ricostruita a partire dalla PWA esistente, riutilizzando il backend FastAPI.

## User flow
1. **Onboarding** → scelta lingua di traduzione (12 lingue, persistente).
2. **Home** → grande pulsante microfono (~9s registrazione) + "Inserisci manualmente".
3. **Recording** → permessi microfono → cattura audio → barra progresso 9s → upload.
4. **Backend pipeline**: Gemini 2.5 Pro (riconoscimento audio) → lrclib.net (lyrics sync) → Gemini 2.5 Flash (traduzione preservando timestamp).
5. **Result** → TrackCard + KaraokeViewer con tabs (Originale / Entrambi / Traduzione) + controlli play/pause/offset/speed.
6. **Modalità Auto** → font 40px, sfondo nero, contrasto massimo per uso in auto.
7. **Cronologia** → lista brani con apertura rapida e swipe/long-press per eliminare.
8. **Settings** → tema chiaro/scuro/auto + lingua traduzione.

## Tech stack
- **Backend**: FastAPI + Motor (MongoDB) + emergentintegrations (Gemini via Emergent Universal Key) + requests (link scrape).
- **Mobile**: Expo SDK 54, expo-router, react-native-reanimated, expo-audio, expo-haptics, expo-screen-orientation, @expo/vector-icons.
- **Integrazioni**: Gemini 2.5 Pro (recognition), Gemini 2.5 Flash (translate), lrclib.net (lyrics), Spotify/Tidal/Apple/YouTube Music link scraping.

## Aggiornamenti recenti (v1.1)
- Durata registrazione audio: **9s → 30s** per riconoscimento più accurato
- **Modalità Auto persistente**: toggle in Settings + chip rapido in Home; quando attiva lock landscape + tema scuro su tutte le schermate
- **Link Tidal/Spotify**: nuovo endpoint `POST /api/track/from_link` che estrae titolo+artista da link Spotify (funziona bene) / Tidal (fallback manuale, scraping bloccato lato server) / Apple Music / YouTube Music via Open Graph meta. UI: campo "Link al brano" nella schermata `manual.tsx` con pulsante "Risolvi".

## API surface (riutilizzato dal repo originale)
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

## Schermate Expo Router
- `app/_layout.tsx` — Stack + AppProvider + icon font loader
- `app/index.tsx` — Home con MicButton, pill lingua, header icone
- `app/language.tsx` — Picker lingua (anche onboarding iniziale)
- `app/recording.tsx` — Registrazione 9s + permessi + retry
- `app/manual.tsx` — Input titolo/artista
- `app/result.tsx` — Karaoke + Car Mode toggle + controlli
- `app/history.tsx` — Cronologia con delete
- `app/settings.tsx` — Tema + lingua

## Stato fasi
- [x] **Phase 1** — Backend portato e funzionante (testato con manual + langs).
- [x] **Phase 2** — App mobile Expo: tutte le schermate, recording, karaoke, history, settings, tema light/dark/auto.
- [ ] **Phase 3** — Roadmap: parser link Tidal/Spotify, riconoscimento offline, condivisione testo, sync cronologia cross-device (Google Auth opzionale).

## Note importanti
- **Riconoscimento audio**: richiede permesso microfono. Su Expo Go funziona; su web il microfono richiede HTTPS.
- **Modalità Auto**: implementata come tema visivo full-contrast (font 40px attivo, sfondo nero). L'orientamento landscape forzato richiede expo-screen-orientation (non incluso in V1 mobile).
- **Universal Key**: configurata in `/app/backend/.env` come EMERGENT_LLM_KEY.
