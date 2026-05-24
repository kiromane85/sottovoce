{
  "visual_direction": {
    "theme_name": "Sottovoce — Cinematic Lyrics Companion",
    "mood": [
      "premium",
      "calmo",
      "music-first",
      "cinematico",
      "glanceable (car-safe)",
      "alto contrasto senza essere aggressivo"
    ],
    "style_fusion": {
      "layout_principle": "TIDAL-adjacent minimal grid + bottom-sheet patterns (shadcn Sheet/Drawer)",
      "typography_principle": "Swiss-ish hierarchy (tight headings, generous leading for lyrics)",
      "surface_principle": "soft-elevation cards (no transparency), subtle noise texture, restrained gradients (decorative only)"
    },
    "inspiration_links": {
      "tidal_design_guidelines": "https://developer.tidal.com/documentation/guidelines/guidelines-design-guidelines",
      "dribbble_karaoke_search": "https://dribbble.com/search/karaoke-lyrics",
      "dribbble_music_app": "https://dribbble.com/search/music-app-ui",
      "behance_lyrics_interface": "https://www.behance.net/gallery/68858731/ApP-Music-Lyric-Interface"
    },
    "brand_attributes": [
      "affidabile (in auto)",
      "sofisticato",
      "discreto",
      "veloce",
      "leggibile"
    ]
  },

  "design_tokens": {
    "notes": [
      "Non usare sfondi trasparenti: tutte le superfici devono essere solid.",
      "Evitare gradienti scuri/saturi (regola globale). Usare solo gradienti molto lievi come overlay decorativo in hero/splash (<=20% viewport).",
      "Default: dark mode (per ascolto). Light mode opzionale per uso diurno fuori auto.",
      "Car Mode: palette dedicata ad altissimo contrasto e tipografia ~2x."
    ],

    "css_variables": {
      "implementation": "Aggiornare /app/frontend/src/index.css in @layer base :root e .dark. Aggiungere anche .car (classe sul body o root wrapper) per Car Mode.",
      "root_light": {
        "--background": "36 33% 98%",
        "--foreground": "222 22% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "222 22% 12%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "222 22% 12%",
        "--primary": "196 84% 38%",
        "--primary-foreground": "0 0% 100%",
        "--secondary": "210 20% 96%",
        "--secondary-foreground": "222 22% 12%",
        "--muted": "210 20% 96%",
        "--muted-foreground": "215 16% 40%",
        "--accent": "28 92% 56%",
        "--accent-foreground": "222 22% 12%",
        "--destructive": "0 72% 52%",
        "--destructive-foreground": "0 0% 100%",
        "--border": "214 18% 90%",
        "--input": "214 18% 90%",
        "--ring": "196 84% 38%",
        "--radius": "0.75rem",

        "--brand-ink": "222 22% 12%",
        "--brand-surface-2": "210 20% 97%",
        "--brand-surface-3": "210 18% 94%",
        "--brand-glow": "196 84% 38%",
        "--karaoke-active": "196 84% 38%",
        "--karaoke-next": "222 22% 12%",
        "--karaoke-dim": "215 16% 45%",
        "--confidence-good": "160 60% 35%",
        "--confidence-mid": "43 90% 50%",
        "--confidence-low": "0 72% 52%"
      },

      "root_dark_default": {
        "--background": "222 22% 7%",
        "--foreground": "0 0% 98%",
        "--card": "222 22% 10%",
        "--card-foreground": "0 0% 98%",
        "--popover": "222 22% 10%",
        "--popover-foreground": "0 0% 98%",
        "--primary": "196 84% 45%",
        "--primary-foreground": "222 22% 10%",
        "--secondary": "222 18% 14%",
        "--secondary-foreground": "0 0% 98%",
        "--muted": "222 18% 14%",
        "--muted-foreground": "215 18% 70%",
        "--accent": "28 92% 58%",
        "--accent-foreground": "222 22% 10%",
        "--destructive": "0 62% 42%",
        "--destructive-foreground": "0 0% 98%",
        "--border": "222 16% 18%",
        "--input": "222 16% 18%",
        "--ring": "196 84% 45%",
        "--radius": "0.75rem",

        "--brand-ink": "0 0% 98%",
        "--brand-surface-2": "222 18% 12%",
        "--brand-surface-3": "222 16% 16%",
        "--brand-glow": "196 84% 45%",
        "--karaoke-active": "196 84% 45%",
        "--karaoke-next": "0 0% 98%",
        "--karaoke-dim": "215 18% 70%",
        "--confidence-good": "160 55% 45%",
        "--confidence-mid": "43 90% 55%",
        "--confidence-low": "0 62% 52%"
      },

      "car_mode": {
        "how_to_apply": "Aggiungere classe .car sul body o su un wrapper root quando Car Mode è attivo. In .car forzare palette e scale tipografica.",
        "--background": "222 30% 4%",
        "--foreground": "0 0% 100%",
        "--card": "222 26% 7%",
        "--card-foreground": "0 0% 100%",
        "--primary": "196 92% 52%",
        "--primary-foreground": "222 30% 6%",
        "--accent": "28 96% 60%",
        "--accent-foreground": "222 30% 6%",
        "--border": "222 18% 14%",
        "--ring": "196 92% 52%",
        "--karaoke-active": "196 92% 52%",
        "--karaoke-next": "0 0% 100%",
        "--karaoke-dim": "215 18% 78%",
        "--karaoke-bg-active": "196 92% 52%",
        "--karaoke-bg-active-alpha": "0.12"
      },

      "shadows": {
        "--shadow-soft": "0 10px 30px rgba(0,0,0,0.25)",
        "--shadow-card": "0 8px 24px rgba(0,0,0,0.22)",
        "--shadow-focus": "0 0 0 4px rgba(34,211,238,0.22)"
      },

      "gradients_restrained": {
        "allowed_usage": "Solo overlay decorativi su splash/header (<=20% viewport). Mai su aree di lettura lyrics.",
        "gradient_1": "radial-gradient(900px circle at 20% 10%, rgba(34,211,238,0.18), transparent 55%)",
        "gradient_2": "radial-gradient(700px circle at 80% 0%, rgba(251,146,60,0.14), transparent 60%)"
      },

      "texture": {
        "noise_css": "background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.06%22/%3E%3C/svg%3E');",
        "usage": "Applicare come pseudo-elemento ::before su layout root (pointer-events none) per evitare flatness."
      }
    }
  },

  "typography": {
    "font_pairing": {
      "heading": {
        "family": "Space Grotesk",
        "google_fonts": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
        "usage": "Titoli, Now Playing, label principali"
      },
      "body": {
        "family": "Figtree",
        "google_fonts": "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
        "usage": "Testi UI, lyrics, impostazioni"
      },
      "mono_optional": {
        "family": "Roboto Mono",
        "usage": "Timestamp/debug/ID (se necessario)"
      }
    },
    "tailwind_mapping": {
      "implementation": "In index.css impostare body font-family a var(--font-body) e headings con utility class. In alternativa importare i font in index.html e usare className per font.",
      "classes": {
        "heading": "font-[\"Space Grotesk\"] tracking-tight",
        "body": "font-[\"Figtree\"]"
      }
    },
    "scale_regular": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm sm:text-base",
      "small": "text-xs sm:text-sm",
      "lyrics_current": "text-2xl sm:text-3xl leading-snug",
      "lyrics_other": "text-base sm:text-lg leading-relaxed"
    },
    "scale_car_mode": {
      "rule": "~2x rispetto al regular; mantenere poche righe visibili.",
      "lyrics_current": "text-4xl md:text-5xl leading-tight",
      "lyrics_translation": "text-2xl md:text-3xl leading-snug",
      "meta": "text-xl md:text-2xl",
      "buttons": "text-lg md:text-xl"
    },
    "line_length": {
      "lyrics_max_width": "max-w-[72ch] (regular), max-w-[56ch] (car mode)"
    }
  },

  "layout_grid": {
    "mobile_first": {
      "container": "mx-auto w-full max-w-xl px-4",
      "safe_areas": "Usare padding top/bottom extra per notch e gesture bar (pt-4 pb-6).",
      "spacing": {
        "section_gap": "gap-6",
        "card_gap": "gap-3",
        "touch_targets": "min-h-[56px] min-w-[56px]"
      }
    },
    "landscape_car_display": {
      "container": "mx-auto w-full max-w-5xl px-6",
      "split_layout": "In landscape: colonna sinistra Now Playing + controlli; colonna destra Lyrics (ScrollArea).",
      "grid": "grid grid-cols-12 gap-6",
      "left": "col-span-4",
      "right": "col-span-8"
    }
  },

  "component_system": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx"
    },

    "custom_components_to_build": {
      "MicCaptureButton": {
        "purpose": "CTA principale: avvia registrazione 8–10s; mostra waveform/pulse; stati idle/recording/processing/error.",
        "base": "Button (variant custom) + div overlay per pulse",
        "data_testids": [
          "mic-capture-button",
          "mic-capture-state-label"
        ]
      },
      "NowPlayingCard": {
        "purpose": "Mostra brano riconosciuto + confidence + artwork.",
        "base": "Card + Avatar/AspectRatio",
        "data_testids": [
          "now-playing-card",
          "now-playing-title",
          "now-playing-artist",
          "now-playing-confidence"
        ]
      },
      "KaraokeLyricsViewer": {
        "purpose": "Viewer dual-line (originale + traduzione) con highlight riga corrente e auto-scroll.",
        "base": "ScrollArea + list virtualizzata (opzionale) + motion",
        "data_testids": [
          "karaoke-lyrics-viewer",
          "karaoke-current-line",
          "karaoke-current-translation"
        ]
      },
      "LanguagePicker": {
        "purpose": "Selezione lingua target al primo avvio + modificabile in Settings.",
        "base": "Select o ToggleGroup (chips)",
        "data_testids": [
          "language-picker",
          "language-picker-continue-button"
        ]
      },
      "HistoryList": {
        "purpose": "Lista brani tradotti con riapertura rapida.",
        "base": "Card list + Button ghost",
        "data_testids": [
          "history-list",
          "history-item"
        ]
      },
      "SettingsPanel": {
        "purpose": "Drawer/Sheet con lingua, car mode, clear history, info.",
        "base": "Sheet (mobile) / Drawer (car) + Switch",
        "data_testids": [
          "settings-open-button",
          "settings-panel",
          "settings-language-select",
          "settings-car-mode-switch",
          "settings-clear-history-button"
        ]
      }
    },

    "button_variants": {
      "primary": {
        "shape": "rounded-xl",
        "tailwind": "rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion": "hover:brightness-[1.02] active:scale-[0.98]"
      },
      "secondary": {
        "tailwind": "rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        "motion": "active:scale-[0.98]"
      },
      "ghost": {
        "tailwind": "rounded-xl hover:bg-accent/10 text-foreground",
        "motion": "active:scale-[0.98]"
      },
      "danger": {
        "tailwind": "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "motion": "active:scale-[0.98]"
      }
    },

    "chips_language": {
      "use": "ToggleGroup (type=single) per chips lingua (più veloce del Select in car mode).",
      "tailwind": "rounded-full px-4 py-2 text-sm border border-border bg-card hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
      "data_testids": [
        "language-chip"
      ]
    },

    "karaoke_line_states": {
      "container": "relative",
      "line_base": "px-3 py-3 rounded-xl",
      "line_prev_next": "text-[hsl(var(--karaoke-dim))]",
      "line_current": "bg-[hsla(var(--karaoke-active),0.10)] text-[hsl(var(--karaoke-next))] ring-1 ring-[hsla(var(--karaoke-active),0.25)]",
      "original_text": "font-[\"Figtree\"]",
      "translation_text": "mt-1 text-[hsl(var(--karaoke-dim))]",
      "car_mode_adjust": "In .car aumentare padding (py-5) e radius (rounded-2xl)."
    },

    "confidence_indicator": {
      "pattern": "Badge + mini bar (Progress)",
      "mapping": {
        "high": "bg-[hsl(var(--confidence-good))]/15 text-[hsl(var(--confidence-good))]",
        "mid": "bg-[hsl(var(--confidence-mid))]/15 text-[hsl(var(--confidence-mid))]",
        "low": "bg-[hsl(var(--confidence-low))]/15 text-[hsl(var(--confidence-low))]"
      }
    }
  },

  "motion_microinteractions": {
    "library": {
      "recommendation": "framer-motion",
      "why": "Animazioni fluide per pulse mic, transizioni tra stati, highlight lyrics senza jank.",
      "install": "npm i framer-motion"
    },
    "principles": [
      "Durate brevi: 160–240ms per hover/press; 280–420ms per transizioni di schermata.",
      "Easing: cubic-bezier(0.2, 0.8, 0.2, 1) per feel premium.",
      "Ridurre motion se prefers-reduced-motion: disabilitare pulse e auto-scroll animato (scroll immediato)."
    ],
    "mic_button_states": {
      "idle": "Glow leggero (box-shadow soft) + hover brightness.",
      "recording": "Pulse radiale (scale 1 -> 1.08) + ring accent; label 'In ascolto…'.",
      "processing": "Waveform che si attenua + spinner; label 'Riconoscimento…'.",
      "error": "Shake leggero 120ms + toast sonner."
    },
    "karaoke_scroll": {
      "behavior": "Auto-scroll centrando la riga corrente (scrollIntoView({block:'center', behavior:'smooth'})).",
      "highlight": "Transizione background-color 220ms + font-weight 500->600 (no transition: all)."
    },
    "screen_transitions": {
      "pattern": "Crossfade + slight slide (y: 8px) tra Home -> Result.",
      "avoid": "No parallax pesante in car mode."
    }
  },

  "iconography": {
    "library": {
      "recommendation": "lucide-react",
      "usage": "Mic, Settings, History, Car, Link, Search, Alert."
    },
    "stroke": "2px (regular), 2.5px (car mode)",
    "sizes": {
      "regular": "20-24",
      "car": "28-32"
    }
  },

  "imagery": {
    "policy": [
      "Artwork album: se disponibile, mostrarlo in NowPlayingCard (AspectRatio 1:1).",
      "Non alterare/croppare artwork se proviene da provider con linee guida (se si usa contenuto TIDAL, evitare overlay testo sull'artwork).",
      "Se artwork non disponibile: usare placeholder astratto (noise + icona)."
    ],
    "image_urls": [
      {
        "category": "splash_background",
        "description": "Texture astratta scura, cinematica (usare come background image con overlay scuro).",
        "url": "https://images.unsplash.com/photo-1636953056323-9c09fdd74fa6?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "car_mode_ambient_reference",
        "description": "Bokeh notturno da auto (solo come reference/mood, non necessario in UI finale).",
        "url": "https://images.pexels.com/photos/67088/pexels-photo-67088.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "warm_accent_texture",
        "description": "Texture calda per piccoli accenti (non come gradient grande).",
        "url": "https://images.unsplash.com/photo-1525783826280-5a6e928544c3?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "accessibility": {
    "requirements": [
      "WCAG AA: contrasto testo/sfondo >= 4.5:1 (car mode puntare a 7:1).",
      "Hit targets >= 56px (car mode >= 64px).",
      "Focus visibile: ring con offset su tutti i controlli.",
      "Supporto prefers-reduced-motion.",
      "In car mode: evitare scroll manuale come requisito; auto-scroll deve mantenere la riga corrente centrata."
    ],
    "aria": [
      "Mic button: aria-pressed durante recording; aria-busy durante processing.",
      "Lyrics: aria-live='polite' solo per cambi riga (attenzione a non spam)."
    ]
  },

  "page_by_page": {
    "splash_language_picker": {
      "layout": "Full-screen con header minimal + card centrale. Background: solid dark + overlay gradient lieve + noise.",
      "components": [
        "Card",
        "ToggleGroup (chips) o Select",
        "Button primary"
      ],
      "wireframe": [
        "Top: logo/nome app (Sottovoce)",
        "Middle: 'Scegli la lingua di traduzione' + chips",
        "Bottom: CTA 'Continua'"
      ],
      "data_testids": [
        "language-picker",
        "language-picker-continue-button"
      ]
    },

    "home_listen": {
      "layout": "Stack verticale: NowPlayingCard (se presente) + MicCaptureButton gigante + scorciatoia Cronologia.",
      "key_interactions": [
        "Tap mic: avvia recording",
        "Swipe up o button: apri manual entry",
        "Settings icon: apre Sheet"
      ],
      "wireframe": [
        "Top bar: titolo + Settings (icon button)",
        "Card: ultimo brano riconosciuto (se esiste)",
        "Center: MicCaptureButton (diametro 96–120px)",
        "Bottom: 'Cronologia' (Button secondary)"
      ],
      "data_testids": [
        "mic-capture-button",
        "settings-open-button",
        "history-open-button"
      ]
    },

    "recognition_flow": {
      "layout": "Stessa schermata Home, ma mic entra in stato recording/processing con overlay.",
      "states": [
        "Recording: timer 0:08 + waveform",
        "Processing: spinner + testo",
        "Error: toast + fallback manual entry"
      ],
      "data_testids": [
        "recognition-status",
        "recognition-timer"
      ]
    },

    "result_karaoke": {
      "layout": "Portrait: NowPlayingCard sticky top + KaraokeLyricsViewer sotto (ScrollArea).",
      "controls": "Top-right: Car Mode toggle + Settings. Bottom: 'Modifica brano' (manual entry) ghost.",
      "wireframe": [
        "Header: back + titolo",
        "NowPlayingCard: artwork + titolo/artista + confidence",
        "Tabs: 'Testo' | 'Traduzione' | 'Entrambi' (default Entrambi)",
        "Lyrics viewer: 5–7 righe visibili, current centrata"
      ],
      "data_testids": [
        "now-playing-card",
        "karaoke-lyrics-viewer",
        "car-mode-toggle"
      ]
    },

    "car_mode": {
      "layout": "Full-screen, landscape-first. Split 4/8: sinistra meta + controlli grandi; destra lyrics enormi.",
      "rules": [
        "Ridurre chrome: niente liste lunghe, niente elementi piccoli.",
        "Mostrare solo: titolo/artista, stato, toggle lingua (se necessario), pulsante uscita car mode.",
        "Auto-scroll sempre attivo; manual scroll opzionale con Slider grande."
      ],
      "wireframe": [
        "Left: artwork grande (opzionale) + titolo/artista + badge lingua",
        "Left bottom: pulsanti grandi: 'Esci' + 'Impostazioni'",
        "Right: lyrics current + translation sotto"
      ],
      "data_testids": [
        "car-mode-screen",
        "car-mode-exit-button"
      ]
    },

    "history": {
      "layout": "Lista cards con titolo/artista + lingua + timestamp. Search opzionale.",
      "wireframe": [
        "Top: 'Cronologia' + back",
        "List: HistoryList items",
        "Empty state: illustrazione astratta + CTA 'Ascolta ora'"
      ],
      "data_testids": [
        "history-list",
        "history-item"
      ]
    },

    "settings": {
      "layout": "Sheet (mobile) / Drawer (car).",
      "sections": [
        "Lingua di traduzione",
        "Modalità Auto (switch)",
        "Cancella cronologia (danger)",
        "Info app"
      ],
      "data_testids": [
        "settings-panel",
        "settings-language-select",
        "settings-car-mode-switch",
        "settings-clear-history-button"
      ]
    },

    "manual_track_entry": {
      "layout": "Dialog con Input per titolo/artista + Input per link Tidal (opzionale).",
      "components": [
        "Dialog",
        "Input",
        "Button primary"
      ],
      "data_testids": [
        "manual-entry-dialog",
        "manual-entry-title-input",
        "manual-entry-artist-input",
        "manual-entry-tidal-link-input",
        "manual-entry-submit-button"
      ]
    }
  },

  "pwa_guidance": {
    "manifest": {
      "name": "Sottovoce",
      "short_name": "Sottovoce",
      "display": "standalone",
      "orientation": "any",
      "theme_color": "#0B0D10",
      "background_color": "#0B0D10",
      "icons_style": "Icona semplice: rombo/onda sonora minimal in monocromia (bianco su nero). Evitare gradienti."
    },
    "splash": {
      "style": "Sfondo near-black + wordmark + piccolo accento ciano (solo 1 elemento).",
      "note": "Non usare immagini pesanti; preferire SVG + noise leggero."
    },
    "service_worker": {
      "strategy": "Cache-first per assets statici; network-first per /api/*; fallback offline: mostra ultima cronologia salvata."
    }
  },

  "implementation_notes_tailwind": {
    "global_background": {
      "pattern": "bg-background text-foreground",
      "decorative_overlay": "relative before:content-[''] before:fixed before:inset-0 before:pointer-events-none before:opacity-100 before:[background-image:var(--app-overlay)]",
      "how": "Definire --app-overlay come combinazione di gradient_1 + gradient_2 + noise (ma mantenere overlay leggero)."
    },
    "avoid": [
      "Non usare transition: all.",
      "Non centrare tutto con .App { text-align:center }.",
      "Non usare viola per AI/chat (qui non usiamo viola).",
      "Non usare gradienti scuri/saturi o su aree testo."
    ]
  },

  "instructions_to_main_agent": [
    "Aggiornare i token in /app/frontend/src/index.css: sostituire palette default shadcn con i valori sopra (light + dark) e aggiungere .car.",
    "Rimuovere/ignorare gli stili CRA demo in App.css (App-header centrato).",
    "Implementare layout mobile-first con container max-w-xl e spacing generoso; in landscape usare grid 12 colonne per car mode.",
    "Creare componenti custom: MicCaptureButton, NowPlayingCard, KaraokeLyricsViewer, SettingsPanel, HistoryList, LanguagePicker (tutti in .js).",
    "Integrare framer-motion per pulse mic e transizioni; rispettare prefers-reduced-motion.",
    "Usare shadcn Sheet/Drawer/Dialog/ScrollArea/Tabs/Switch/Select; usare sonner per toast.",
    "Aggiungere data-testid a tutti gli elementi interattivi e info chiave (vedi liste sopra).",
    "Karaoke: auto-scroll centrando la riga corrente; evidenziare riga corrente con bg tint + ring; mostrare traduzione sotto in tono dim.",
    "Car Mode: full-screen, tipografia ~2x, controlli minimi e grandi (>=64px), contrasto massimo."
  ],

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
