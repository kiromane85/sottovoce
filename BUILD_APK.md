# Build APK con EAS — Sottovoce

Guida step-by-step per ottenere un file `.apk` installabile sul tuo Android,
**senza pubblicare sul Play Store**, completo di:
- ✅ Microfono nativo (recording 30s)
- ✅ Share Extension (Sottovoce nel menu Condividi di Spotify/Tidal/ecc.)
- ✅ Widget home screen con pulsante mic
- ✅ Modalità Auto con landscape lock
- ✅ Tutte le altre feature

## 1. Salva il progetto su GitHub
Nell'interfaccia di Emergent, clicca **"Save to GitHub"** (icona in alto).
Crea il repo, esempio: `sottovoce-mobile`.

## 2. Sul tuo computer (Mac/Linux/Windows)

### 2.1 Requisiti
- **Node.js** 20+ (https://nodejs.org)
- **Git**
- **Account Expo** gratuito → registrati su https://expo.dev/signup
  (basta email + password, **non serve** carta di credito)

### 2.2 Clona e installa
```bash
git clone https://github.com/<tuo-username>/sottovoce-mobile.git
cd sottovoce-mobile/frontend
npm install --legacy-peer-deps   # oppure: yarn install
```

### 2.3 Installa EAS CLI globalmente
```bash
npm install -g eas-cli
```

### 2.4 Login
```bash
eas login
# inserisci email + password Expo
```

### 2.5 Inizializza il progetto su Expo
Questo crea un Project ID associato al tuo account:
```bash
eas init
```
Quando chiede "Create new project?" → **yes**. Il comando aggiorna
automaticamente `app.json` con `extra.eas.projectId`.

### 2.6 Configura le credenziali Android
```bash
eas credentials
# Scegli: Android → preview profile → "Set up a new keystore"
# EAS genera e gestisce automaticamente la keystore per te.
```

## 3. Build dell'APK 🚀

```bash
eas build --platform android --profile preview
```

Cosa succede:
1. EAS carica il codice sui server Expo
2. Compila tutto (incluso Share Intent + Widget nativi)
3. Dopo **10–20 minuti** ottieni un link diretto all'APK
4. Il link rimane attivo per 30 giorni

Il piano gratuito EAS ti dà **30 build Android al mese**. Più che sufficienti.

## 4. Installa sul telefono

### Opzione A — dal link (più semplice)
- Apri il link EAS sul telefono → tocca "Install"
- Android chiederà di abilitare "**Installa da sorgenti sconosciute**" → consenti
- L'APK si installa automaticamente

### Opzione B — adb
```bash
adb install Sottovoce.apk
```

## 5. Aggiorna l'app

Per il **codice JavaScript**, basta un OTA update (no rebuild):
```bash
eas update --branch preview --message "Fix bug X"
```
Apri l'app sul telefono → riceve aggiornamento al lancio (instantaneo).

Per **cambiamenti nativi** (es. nuovi permessi, plugin), serve un nuovo APK:
```bash
eas build --platform android --profile preview
```

## ⚠️ Cosa controllare prima del build

### Il backend deve essere raggiungibile da Internet
Ora `frontend/.env` punta a:
```
EXPO_PUBLIC_BACKEND_URL=https://...preview.emergentagent.com
```
Questo URL **funziona finché Emergent tiene online la preview**. Se in futuro
preferisci, deploya il backend su Emergent (pulsante Deploy nella UI) o su un
altro hosting (Railway/Render/Fly.io) e aggiorna l'env prima di rifare il build.

### Verifica `app.json`
Dopo `eas init` controlla che ci sia:
```json
"extra": {
  "eas": {
    "projectId": "<uuid generato da eas init>"
  }
}
```

## 🆘 Problemi comuni

**Build fallisce su Gradle / autolinking**
→ EAS mostra il log completo nel link risultato. 90% delle volte è un peer
dep mancante: vedi se serve aggiungere il modulo a `package.json` e rifai il
build.

**Widget non appare nel cassetto widget**
→ Dopo l'installazione, su alcuni device serve riavviare il launcher
(Settings → App → Launcher → Restart) o riavviare il telefono una volta.

**Share Sottovoce non appare nel menu Condividi**
→ Apri "Impostazioni → App → Sottovoce → Apri di default" e verifica
che le impostazioni link siano consentite.
