"""Sottovoce — Backend (FastAPI).

Endpoints under /api:
  - POST /api/recognize          (multipart audio) -> identify song via Gemini
  - POST /api/lyrics             ({title, artist}) -> fetch lyrics from lrclib
  - POST /api/translate          ({lines, target_lang}) -> translate via Gemini
  - POST /api/track/resolve      (multipart audio + target_lang) -> full pipeline
  - POST /api/track/manual       ({title, artist, target_lang}) -> skip recognition
  - GET  /api/history            list previous tracks
  - DELETE /api/history          clear all history
  - DELETE /api/history/{id}     delete single item
  - GET  /api/languages          list supported translation languages
"""
import asyncio
import json
import logging
import os
import re
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

from emergentintegrations.llm.chat import (
    FileContentWithMimeType,
    LlmChat,
    UserMessage,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_LLM_KEY:
    raise RuntimeError("EMERGENT_LLM_KEY missing in backend/.env")

RECOGNITION_MODEL = os.environ.get("RECOGNITION_MODEL", "gemini-2.5-pro")
TRANSLATION_MODEL = os.environ.get("TRANSLATION_MODEL", "gemini-2.5-flash")

LRCLIB_BASE = "https://lrclib.net/api"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("sottovoce")

# ---------------------------------------------------------------------------
# Mongo
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------------------------------------------------------------------
# App / Router
# ---------------------------------------------------------------------------
app = FastAPI(title="Sottovoce API")
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class LyricsRequest(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None


class TranslateRequest(BaseModel):
    lines: List[str]
    target_lang: str = "Italian"


class ManualTrackRequest(BaseModel):
    title: str
    artist: str
    target_lang: str = "Italian"
    album: Optional[str] = None


class LyricsLine(BaseModel):
    t_ms: Optional[int] = None
    original: str
    translated: str = ""


class TrackResolveResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    artist: str
    album: Optional[str] = None
    artwork_url: Optional[str] = None
    duration: Optional[float] = None
    language: Optional[str] = None
    confidence: float = 0.0
    target_lang: str = "Italian"
    source: str = "recognition"  # 'recognition' | 'manual'
    has_synced: bool = False
    lines: List[LyricsLine] = []
    plain_lyrics: str = ""
    plain_translation: str = ""
    recognized_meta: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    artist: str
    album: Optional[str] = None
    artwork_url: Optional[str] = None
    target_lang: str = "Italian"
    has_synced: bool = False
    source: str = "recognition"
    created_at: datetime


# ---------------------------------------------------------------------------
# Helpers — JSON safe parse
# ---------------------------------------------------------------------------
def safe_json_parse(raw: str) -> Optional[Dict[str, Any]]:
    if not raw:
        return None
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


def mongo_friendly(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    for k, v in doc.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def from_mongo(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    out.pop("_id", None)
    if isinstance(out.get("created_at"), str):
        try:
            out["created_at"] = datetime.fromisoformat(out["created_at"])
        except Exception:
            pass
    return out


# ---------------------------------------------------------------------------
# Gemini — recognition
# ---------------------------------------------------------------------------
RECOGNITION_SYSTEM_PROMPT = """You are an expert music identification assistant.
Given a short audio clip (sung lyrics, spoken lyrics, or instrumental excerpt) you must identify the song.

Return STRICTLY a JSON object with these keys:
- title: string (song title; empty string if unknown)
- artist: string (primary artist name; empty string if unknown)
- album: string (album name; empty string if unknown)
- language: string (BCP-47 like "en", "it", "es" - language of the lyrics)
- confidence: number from 0.0 to 1.0
- transcript: string (verbatim lyrics/words you heard; may include partial words)
- reasoning: string (1 short sentence why you matched this song)

Rules:
- If you are not confident, set confidence < 0.5 and you may leave title/artist empty.
- NEVER invent songs. If unsure, be honest.
- Output JSON only. No code fences, no commentary.
"""


async def gemini_recognize(audio_path: str, mime_type: str) -> Dict[str, Any]:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recognize-{uuid.uuid4()}",
        system_message=RECOGNITION_SYSTEM_PROMPT,
    ).with_model("gemini", RECOGNITION_MODEL)
    audio = FileContentWithMimeType(mime_type=mime_type, file_path=audio_path)
    user_msg = UserMessage(
        text="Identify this song. Return JSON only.",
        file_contents=[audio],
    )
    raw = await chat.send_message(user_msg)
    parsed = safe_json_parse(raw)
    if not parsed:
        return {
            "title": "",
            "artist": "",
            "album": "",
            "language": "",
            "confidence": 0,
            "transcript": "",
            "reasoning": "unparsable response",
            "raw": raw,
        }
    parsed.setdefault("title", "")
    parsed.setdefault("artist", "")
    parsed.setdefault("album", "")
    parsed.setdefault("language", "")
    try:
        parsed["confidence"] = float(parsed.get("confidence", 0) or 0)
    except Exception:
        parsed["confidence"] = 0.0
    return parsed


# ---------------------------------------------------------------------------
# lrclib lookup
# ---------------------------------------------------------------------------
def fetch_lyrics_lrclib(title: str, artist: str, album: str = "") -> Dict[str, Any]:
    if not title or not artist:
        return {"found": False, "reason": "missing title/artist"}

    headers = {"User-Agent": "Sottovoce/1.0 (lyrics translator)"}

    # try /get
    try:
        params = {"track_name": title, "artist_name": artist}
        if album:
            params["album_name"] = album
        r = requests.get(f"{LRCLIB_BASE}/get", params=params, timeout=10, headers=headers)
        if r.status_code == 200:
            return _format_lrclib(r.json())
    except Exception as exc:
        logger.warning("lrclib /get error: %s", exc)

    # fallback /search
    try:
        r = requests.get(
            f"{LRCLIB_BASE}/search",
            params={"track_name": title, "artist_name": artist},
            timeout=10,
            headers=headers,
        )
        if r.status_code == 200:
            results = r.json() or []
            if results:
                pick = next((x for x in results if x.get("syncedLyrics")), results[0])
                return _format_lrclib(pick)
    except Exception as exc:
        logger.warning("lrclib /search error: %s", exc)

    return {"found": False, "reason": "no match on lrclib"}


def _format_lrclib(d: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "found": True,
        "id": d.get("id"),
        "title": d.get("trackName") or d.get("name"),
        "artist": d.get("artistName"),
        "album": d.get("albumName"),
        "duration": d.get("duration"),
        "synced": d.get("syncedLyrics") or "",
        "plain": d.get("plainLyrics") or "",
        "has_synced": bool(d.get("syncedLyrics")),
    }


LRC_LINE_RE = re.compile(r"\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]")


def parse_lrc(lrc_text: str) -> List[Dict[str, Any]]:
    """Parse LRC text -> sorted list of {t_ms, line}."""
    result: List[Dict[str, Any]] = []
    for raw_line in lrc_text.splitlines():
        timestamps = list(LRC_LINE_RE.finditer(raw_line))
        if not timestamps:
            continue
        text = raw_line[timestamps[-1].end():].strip()
        for ts in timestamps:
            mm = int(ts.group(1))
            ss = int(ts.group(2))
            frac = ts.group(3) or "0"
            ms = int(frac.ljust(3, "0")[:3])
            total_ms = mm * 60_000 + ss * 1_000 + ms
            result.append({"t_ms": total_ms, "line": text})
    result.sort(key=lambda x: x["t_ms"])
    return result


# ---------------------------------------------------------------------------
# Gemini — translation
# ---------------------------------------------------------------------------
TRANSLATION_SYSTEM_PROMPT = (
    "You are an expert lyrics translator.\n"
    "You will receive a JSON object with a 'lines' array. Translate EACH line to {lang}.\n\n"
    "CRITICAL RULES:\n"
    "- Preserve the SAME order and SAME number of lines.\n"
    "- Keep empty lines as empty strings.\n"
    "- Translate naturally (idioms ok), but keep concise so a single line stays a single line.\n"
    "- Do NOT add commentary, explanations, or extra lines.\n"
    "- Return STRICTLY a JSON object: {\"translations\": [\"...\", \"...\", ...]}\n"
    "- The length of 'translations' MUST equal the length of the input array.\n"
)


async def gemini_translate(lines: List[str], target_lang: str) -> List[str]:
    if not lines:
        return []
    sys_prompt = TRANSLATION_SYSTEM_PROMPT.replace("{lang}", target_lang)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"translate-{uuid.uuid4()}",
        system_message=sys_prompt,
    ).with_model("gemini", TRANSLATION_MODEL)
    payload = json.dumps({"lines": lines}, ensure_ascii=False)
    raw = await chat.send_message(UserMessage(text=payload))
    data = safe_json_parse(raw)
    if not data or "translations" not in data:
        return ["" for _ in lines]
    translations = data.get("translations") or []
    if len(translations) < len(lines):
        translations += [""] * (len(lines) - len(translations))
    return translations[: len(lines)]


# ---------------------------------------------------------------------------
# Resolve full pipeline
# ---------------------------------------------------------------------------
async def resolve_track(
    title: str,
    artist: str,
    target_lang: str,
    album: Optional[str] = None,
    recognized_meta: Optional[Dict[str, Any]] = None,
    source: str = "recognition",
) -> TrackResolveResponse:
    lyrics = fetch_lyrics_lrclib(title, artist, album or "")
    if not lyrics.get("found"):
        # Build empty payload so frontend can still show the recognition + ask user to retry/manual.
        return TrackResolveResponse(
            id=str(uuid.uuid4()),
            title=title,
            artist=artist,
            album=album,
            target_lang=target_lang,
            source=source,
            recognized_meta=recognized_meta,
            has_synced=False,
            lines=[],
            plain_lyrics="",
            plain_translation="",
            confidence=float((recognized_meta or {}).get("confidence", 0)),
        )

    has_synced = lyrics.get("has_synced", False)
    if has_synced:
        parsed = parse_lrc(lyrics["synced"])
        line_texts = [p["line"] for p in parsed]
    else:
        plain = lyrics.get("plain") or ""
        line_texts = [ln.strip() for ln in plain.splitlines()]
        parsed = [{"t_ms": None, "line": ln} for ln in line_texts]

    translations = await gemini_translate(line_texts, target_lang)

    merged_lines = [
        LyricsLine(
            t_ms=parsed[i]["t_ms"],
            original=parsed[i]["line"],
            translated=translations[i] if i < len(translations) else "",
        )
        for i in range(len(parsed))
    ]
    plain_translation = "\n".join(translations)

    return TrackResolveResponse(
        id=str(uuid.uuid4()),
        title=lyrics.get("title") or title,
        artist=lyrics.get("artist") or artist,
        album=lyrics.get("album") or album,
        duration=lyrics.get("duration"),
        target_lang=target_lang,
        has_synced=has_synced,
        lines=merged_lines,
        plain_lyrics=lyrics.get("plain") or "",
        plain_translation=plain_translation,
        recognized_meta=recognized_meta,
        source=source,
        confidence=float((recognized_meta or {}).get("confidence", 1.0)),
    )


async def save_history(track: TrackResolveResponse) -> None:
    doc = track.model_dump()
    doc = mongo_friendly(doc)
    try:
        await db.history.insert_one(doc)
    except Exception as exc:
        logger.warning("history insert error: %s", exc)


LANG_OPTIONS = [
    {"code": "Italian", "label": "Italiano", "flag": "\U0001F1EE\U0001F1F9"},
    {"code": "English", "label": "English", "flag": "\U0001F1EC\U0001F1E7"},
    {"code": "Spanish", "label": "Espa\u00f1ol", "flag": "\U0001F1EA\U0001F1F8"},
    {"code": "French", "label": "Fran\u00e7ais", "flag": "\U0001F1EB\U0001F1F7"},
    {"code": "German", "label": "Deutsch", "flag": "\U0001F1E9\U0001F1EA"},
    {"code": "Portuguese", "label": "Portugu\u00eas", "flag": "\U0001F1F5\U0001F1F9"},
    {"code": "Japanese", "label": "\u65E5\u672C\u8A9E", "flag": "\U0001F1EF\U0001F1F5"},
    {"code": "Chinese (Simplified)", "label": "\u4e2d\u6587", "flag": "\U0001F1E8\U0001F1F3"},
    {"code": "Russian", "label": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", "flag": "\U0001F1F7\U0001F1FA"},
    {"code": "Arabic", "label": "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", "flag": "\U0001F1F8\U0001F1E6"},
    {"code": "Dutch", "label": "Nederlands", "flag": "\U0001F1F3\U0001F1F1"},
    {"code": "Korean", "label": "\ud55c\uad6d\uc5b4", "flag": "\U0001F1F0\U0001F1F7"},
]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Sottovoce API up"}


@api_router.get("/languages")
async def languages() -> Dict[str, Any]:
    return {"languages": LANG_OPTIONS}


@api_router.post("/lyrics")
async def lyrics_endpoint(req: LyricsRequest) -> Dict[str, Any]:
    data = fetch_lyrics_lrclib(req.title, req.artist, req.album or "")
    return data


@api_router.post("/translate")
async def translate_endpoint(req: TranslateRequest) -> Dict[str, Any]:
    translations = await gemini_translate(req.lines, req.target_lang)
    return {"translations": translations, "target_lang": req.target_lang}


@api_router.post("/recognize")
async def recognize_endpoint(audio: UploadFile = File(...)) -> Dict[str, Any]:
    suffix = ".webm"
    mime = audio.content_type or "audio/webm"
    if mime in ("audio/mpeg", "audio/mp3"):
        suffix = ".mp3"
    elif mime in ("audio/wav", "audio/x-wav"):
        suffix = ".wav"
    elif mime == "audio/ogg":
        suffix = ".ogg"
    elif mime in ("audio/mp4", "audio/m4a"):
        suffix = ".m4a"
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        result = await gemini_recognize(path, mime)
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass
    return result


@api_router.post("/track/resolve", response_model=TrackResolveResponse)
async def track_resolve(
    audio: UploadFile = File(...),
    target_lang: str = Form("Italian"),
) -> TrackResolveResponse:
    suffix = ".webm"
    mime = audio.content_type or "audio/webm"
    if mime in ("audio/mpeg", "audio/mp3"):
        suffix = ".mp3"
    elif mime in ("audio/wav", "audio/x-wav"):
        suffix = ".wav"
    elif mime == "audio/ogg":
        suffix = ".ogg"
    elif mime in ("audio/mp4", "audio/m4a"):
        suffix = ".m4a"
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        recognized = await gemini_recognize(path, mime)
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass

    title = (recognized.get("title") or "").strip()
    artist = (recognized.get("artist") or "").strip()
    confidence = float(recognized.get("confidence", 0) or 0)
    if not title or not artist or confidence < 0.4:
        # Return what we have so frontend can ask user for manual entry
        return TrackResolveResponse(
            id=str(uuid.uuid4()),
            title=title,
            artist=artist,
            target_lang=target_lang,
            source="recognition",
            recognized_meta=recognized,
            confidence=confidence,
            has_synced=False,
            lines=[],
            plain_lyrics="",
            plain_translation="",
        )

    track = await resolve_track(
        title=title,
        artist=artist,
        target_lang=target_lang,
        album=recognized.get("album") or None,
        recognized_meta=recognized,
        source="recognition",
    )
    await save_history(track)
    return track


@api_router.post("/track/manual", response_model=TrackResolveResponse)
async def track_manual(req: ManualTrackRequest) -> TrackResolveResponse:
    track = await resolve_track(
        title=req.title,
        artist=req.artist,
        target_lang=req.target_lang,
        album=req.album,
        recognized_meta={"confidence": 1.0, "manual": True},
        source="manual",
    )
    await save_history(track)
    return track


@api_router.get("/history", response_model=List[HistoryItem])
async def history_list() -> List[HistoryItem]:
    cursor = db.history.find({}, {"lines": 0, "plain_lyrics": 0, "plain_translation": 0})
    docs = await cursor.sort("created_at", -1).to_list(200)
    out: List[HistoryItem] = []
    for d in docs:
        d = from_mongo(d)
        try:
            out.append(HistoryItem(**d))
        except Exception as exc:
            logger.warning("bad history doc skipped: %s", exc)
    return out


@api_router.get("/history/{item_id}", response_model=TrackResolveResponse)
async def history_get(item_id: str) -> TrackResolveResponse:
    doc = await db.history.find_one({"id": item_id})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return TrackResolveResponse(**from_mongo(doc))


@api_router.delete("/history/{item_id}")
async def history_delete(item_id: str) -> Dict[str, Any]:
    res = await db.history.delete_one({"id": item_id})
    return {"deleted": res.deleted_count}


@api_router.delete("/history")
async def history_clear() -> Dict[str, Any]:
    res = await db.history.delete_many({})
    return {"deleted": res.deleted_count}


# ---------------------------------------------------------------------------
# Final wiring
# ---------------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
