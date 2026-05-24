# plan.md

## 1) Objectives
- Validare end-to-end il **core workflow**: microfono (5–10s) → riconoscimento brano (AudD/ACRCloud) → lyrics sincronizzati (lrclib LRC) → traduzione LLM preservando timestamp → rendering karaoke.
- Consegnare una **PWA** (React) con **Car Mode** full-screen + UI responsive per display auto/mirroring.
- Supportare 2 ingressi: **audio recognition** e **Tidal share/link** (best-effort parsing + fallback).
- Gestire fallback: lyrics non sincronizzati / non trovati, rate limit AudD, errori rete.
- Salvare **storico** traduzioni (MongoDB) e permettere riapertura rapida.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation) 
**Goal:** non procedere alla UI finché le integrazioni non funzionano insieme.

**User stories (POC)**
1. Come utente, voglio dare in input un file audio di test e ottenere titolo+artista affidabili.
2. Come utente, voglio ottenere lyrics sincronizzati (LRC) quando disponibili.
3. Come utente, voglio ottenere fallback a lyrics plain text quando LRC non esiste.
4. Come utente, voglio tradurre i testi nella lingua scelta preservando i timestamp (se presenti).
5. Come utente, voglio vedere un output unico JSON con metadata brano + righe timestampate + traduzione.

**Steps**
- Web research (best practice):
  - AudD/ACRCloud: formati audio accettati, limiti, parametri e gestione errori.
  - lrclib: endpoint corretti, matching title/artist, gestione varianti.
  - LRC parsing: robustezza (offset, multiple timestamps, tag).
- Script Python `poc_core_flow.py`:
  - Input: `sample.wav` + `target_lang`.
  - Step A: call AudD (o ACRCloud) → `title/artist/album/isrc/artwork`.
  - Step B: query lrclib (title+artist) → LRC; se fail → fallback LyricsOVH (plain).
  - Step C: parse LRC → array `{t_ms, line}`.
  - Step D: call Emergent LLM translate:
    - Se LRC: tradurre per-linea mantenendo stessa struttura `{t_ms, translated_line}`.
    - Se plain: tradurre blocco testo.
  - Output: salvare `poc_output.json`.
- Iterare “fix until works”:
  - Matching title/artist (normalizzazione: lower, remove feat., punctuation).
  - Re-try/backoff su rate limit.
  - Prompt traduzione: preservare righe vuote, non cambiare ordine, non aggiungere testo.

**Deliverable POC**
- Script + README minimale + `poc_output.json` valido su 2–3 brani diversi (almeno 1 con LRC).

---

### Phase 2 — V1 App Development (MVP PWA)
**Goal:** costruire l’app attorno al core provato; niente auth inizialmente.

**User stories (V1)**
1. Come utente, all’apertura voglio selezionare la lingua target (e ricordarla).
2. Come utente, voglio premere “Ascolta brano” e registrare 5–10 secondi dal microfono.
3. Come utente, voglio vedere il brano riconosciuto (titolo, artista, copertina se disponibile).
4. Come utente, voglio vedere lyrics originali + tradotte in modalità karaoke sincronizzata.
5. Come utente, voglio attivare/disattivare Car Mode (font grandi, contrasto alto, tap target grandi).

**Backend (FastAPI)**
- Endpoints:
  - `POST /api/recognize` (audio upload multipart) → track metadata.
  - `POST /api/lyrics` ({title, artist}) → `{source, lrc|plain}`.
  - `POST /api/translate` ({lines/plain, target_lang}) → translated.
  - `POST /api/track/resolve` (unifica recognize→lyrics→translate) → payload pronto UI.
  - `GET /api/history` / `POST /api/history`.
- MongoDB collections:
  - `history`: track_id/hash, title, artist, lang, createdAt, lyrics_payload.
- Config:
  - Env vars: `AUDD_API_KEY` (o ACRCloud keys), `EMERGENT_KEY`, Mongo URI.
- Hardening:
  - Rate limit handling (429), error envelopes coerenti.
  - Caching opportunistico: (title+artist+lang) → traduzione.

**Frontend (React + Tailwind + shadcn/ui, PWA)**
- Views:
  - Landing: language picker + “Start”.
  - Listen: big mic button, recording state, permission errors.
  - Result: track card + karaoke panel (original/translated toggle).
  - History: lista brani tradotti + riapri.
- Karaoke sync:
  - Timer locale (0…audio_length) + highlight linea in base a `t_ms`.
  - Scroll-into-view della riga corrente.
- Car Mode:
  - Full-screen layout, typography scalata, high contrast theme.
- PWA:
  - `manifest.json`, service worker (Vite/CRA plugin), offline shell (no offline translate).

**End-to-end test (Phase 2 close)**
- 1 round manuale: HTTPS mic permission → recognize → lyrics → translate → karaoke → save history.

---

### Phase 3 — Feature Expansion (post-V1)

**User stories (Phase 3)**
1. Come utente, voglio incollare un link Tidal o usare “Condividi” per precompilare titolo+artista.
2. Come utente, voglio scegliere tra “Solo traduzione” e “Originale+Traduzione” in split view.
3. Come utente, voglio regolare offset karaoke (+/- ms) se la sync è leggermente fuori.
4. Come utente, voglio poter cancellare elementi dallo storico.
5. Come utente, voglio riprovare il riconoscimento rapidamente se il brano cambia.

**Steps**
- Tidal share/link:
  - Parser URL (estrarre track id se presente) + best-effort metadata (se ottenibile) o UI “incolla titolo/artista”.
- Karaoke improvements:
  - Offset control, supporto `[offset:]`, gestione righe con doppio timestamp.
- History:
  - Delete, search, pin recent.
- Performance:
  - Debounce scroll, virtualized list per lyrics lunghi.

**End-to-end test (Phase 3 close)**
- Test: link/share → resolve → karaoke; offset; history CRUD.

---

### Phase 4 — Production hardening + optional Auth

**User stories (Phase 4)**
1. Come utente, voglio opzionalmente un account per sincronizzare storico tra dispositivi.
2. Come utente, voglio che l’app gestisca in modo chiaro limiti AudD (messaggi + retry).
3. Come utente, voglio esportare una traduzione (testo/LRC) da condividere.
4. Come utente, voglio scegliere provider recognition (AudD vs ACRCloud) se uno fallisce.
5. Come utente, voglio log diagnostici (privacy-safe) per segnalare problemi.

**Steps**
- Auth (solo se approvata): email magic link o JWT semplice.
- Observability: structured logs, correlation id.
- Privacy: minimizzare retention audio (non salvare audio, solo hash/metadati).
- CI smoke tests per endpoints.

---

## 3) Next Actions
1. Ottenere e configurare `AUDD_API_KEY` (o scegliere ACRCloud) + definire formato audio target (wav/webm).
2. Preparare 2–3 sample audio (10s) per POC (almeno 1 brano molto noto).
3. Eseguire Phase 1: script POC unico e stabilizzare matching lrclib + prompt traduzione.
4. Solo dopo POC verde: scaffold FastAPI + React PWA e implementare endpoint `track/resolve`.

---

## 4) Success Criteria
- POC: per ≥2 brani diversi, output JSON include track metadata + (LRC o plain) + traduzione corretta nella lingua scelta.
- V1: su mobile HTTPS, microfono funziona, riconoscimento <15s, karaoke scorre e evidenzia righe, Car Mode leggibile a distanza.
- Robustezza: messaggi chiari su (no match, no lyrics, rate limit), fallback funzionanti.
- Storico: almeno 20 elementi gestibili senza degradare UX.
