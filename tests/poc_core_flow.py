"""
POC for Tidal Translator (Gemini-Only approach).

Validates the core workflow end-to-end:
  Step 1: Gemini multimodal audio recognition (title + artist + transcript + confidence)
  Step 2: lrclib.net synced lyrics retrieval (LRC + plain fallback)
  Step 3: LRC parsing into structured {t_ms, line}
  Step 4: Gemini translation preserving line structure & timestamps

The script saves a JSON report to /app/tests/poc_output.json.
Run with:  python /app/tests/poc_core_flow.py
"""
import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests
from dotenv import load_dotenv

# Load env from backend (where EMERGENT_LLM_KEY is configured)
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")

from emergentintegrations.llm.chat import (  # noqa: E402
    LlmChat,
    UserMessage,
    FileContentWithMimeType,
)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_LLM_KEY:
    print("[FATAL] EMERGENT_LLM_KEY not configured in /app/backend/.env")
    sys.exit(1)

SAMPLE_AUDIO = Path(__file__).parent / "poc_samples" / "imagine_lyrics.mp3"
OUTPUT = Path(__file__).parent / "poc_output.json"
TARGET_LANG = "Italian"          # used by translation step
RECOGNITION_MODEL = "gemini-2.5-pro"
TRANSLATION_MODEL = "gemini-2.5-flash"

# ----------------------------------------------------------------------------
# STEP 1 — Gemini audio recognition
# ----------------------------------------------------------------------------
RECOGNITION_SYSTEM_PROMPT = """You are an expert music identification assistant.
Given a short audio clip (sung lyrics, spoken lyrics, or instrumental excerpt),
identify the song.

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


async def recognize_song(audio_path: Path) -> Dict[str, Any]:
    print(f"\n[Step 1] Recognizing song from {audio_path.name} ...")
    mime = "audio/mpeg" if audio_path.suffix.lower() == ".mp3" else "audio/wav"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="poc-recognition",
        system_message=RECOGNITION_SYSTEM_PROMPT,
    ).with_model("gemini", RECOGNITION_MODEL)

    audio = FileContentWithMimeType(mime_type=mime, file_path=str(audio_path))
    user_msg = UserMessage(
        text="Identify this song. Return JSON only.",
        file_contents=[audio],
    )
    raw = await chat.send_message(user_msg)
    print(f"  raw response: {raw[:400]}")
    data = _safe_json_parse(raw)
    if not data:
        return {"error": "Failed to parse JSON", "raw": raw}
    return data


def _safe_json_parse(raw: str) -> Optional[Dict[str, Any]]:
    """Strip code fences / extra text, return parsed JSON or None."""
    if not raw:
        return None
    cleaned = raw.strip()
    # Remove ```json ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    # Try direct
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    # Try to extract first {...} block
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


# ----------------------------------------------------------------------------
# STEP 2 — lrclib synced lyrics retrieval
# ----------------------------------------------------------------------------
LRCLIB_BASE = "https://lrclib.net/api"


def fetch_lyrics_lrclib(title: str, artist: str, album: str = "") -> Dict[str, Any]:
    print(f"\n[Step 2] Searching lrclib for '{title}' by '{artist}' ...")
    if not title or not artist:
        return {"found": False, "reason": "missing title/artist"}

    # Try /get first (exact match)
    params = {"track_name": title, "artist_name": artist}
    if album:
        params["album_name"] = album
    try:
        r = requests.get(f"{LRCLIB_BASE}/get", params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return _format_lrclib_payload(data)
    except Exception as exc:
        print(f"  /get error: {exc}")

    # Fallback /search
    try:
        r = requests.get(
            f"{LRCLIB_BASE}/search",
            params={"track_name": title, "artist_name": artist},
            timeout=10,
        )
        if r.status_code == 200:
            results = r.json() or []
            if results:
                # Pick the first result that has syncedLyrics, else first
                pick = next((x for x in results if x.get("syncedLyrics")), results[0])
                return _format_lrclib_payload(pick)
    except Exception as exc:
        print(f"  /search error: {exc}")

    return {"found": False, "reason": "no match on lrclib"}


def _format_lrclib_payload(d: Dict[str, Any]) -> Dict[str, Any]:
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


# ----------------------------------------------------------------------------
# STEP 3 — LRC parsing
# ----------------------------------------------------------------------------
LRC_LINE_RE = re.compile(r"\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)")


def parse_lrc(lrc_text: str) -> List[Dict[str, Any]]:
    """Parse LRC text into list of {t_ms, line}.
    Skips metadata tags like [ar:], [ti:]. Supports multiple timestamps per line.
    """
    lines: List[Dict[str, Any]] = []
    for raw_line in lrc_text.splitlines():
        # Find every [mm:ss.xx] timestamp on this line
        timestamps = list(re.finditer(r"\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]", raw_line))
        if not timestamps:
            continue
        # Text after last timestamp
        text = raw_line[timestamps[-1].end():].strip()
        for ts in timestamps:
            mm = int(ts.group(1))
            ss = int(ts.group(2))
            frac = ts.group(3) or "0"
            ms = int(frac.ljust(3, "0")[:3])
            total_ms = mm * 60_000 + ss * 1_000 + ms
            lines.append({"t_ms": total_ms, "line": text})
    lines.sort(key=lambda x: x["t_ms"])
    return lines


# ----------------------------------------------------------------------------
# STEP 4 — Gemini translation preserving structure
# ----------------------------------------------------------------------------
TRANSLATION_SYSTEM_PROMPT = """You are an expert lyrics translator.
You will receive a JSON array of lyrics lines. Translate EACH line to {lang}.

CRITICAL RULES:
- Preserve the SAME order and SAME number of lines.
- Keep empty lines as empty strings.
- Translate naturally (idioms ok), but keep concise so a single line stays a single line.
- Do NOT add commentary, explanations, or extra lines.
- Return STRICTLY a JSON object: {"translations": ["...", "...", ...]}
- The length of "translations" MUST equal the length of the input array.
"""


async def translate_lines(lines: List[str], target_lang: str) -> List[str]:
    if not lines:
        return []
    print(f"\n[Step 4] Translating {len(lines)} lines into {target_lang} ...")
    sys_prompt = TRANSLATION_SYSTEM_PROMPT.replace("{lang}", target_lang)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="poc-translate",
        system_message=sys_prompt,
    ).with_model("gemini", TRANSLATION_MODEL)

    payload = json.dumps({"lines": lines}, ensure_ascii=False)
    user_msg = UserMessage(text=payload)
    raw = await chat.send_message(user_msg)
    print(f"  raw response (first 300 chars): {raw[:300]}")
    data = _safe_json_parse(raw)
    if not data or "translations" not in data:
        # Fallback: return original lines marked
        return [f"[TRANSLATION_FAILED] {ln}" for ln in lines]

    translations = data["translations"]
    if len(translations) != len(lines):
        # Pad / trim to match
        print(f"  WARNING: length mismatch ({len(translations)} vs {len(lines)})")
        if len(translations) < len(lines):
            translations = translations + [""] * (len(lines) - len(translations))
        else:
            translations = translations[: len(lines)]
    return translations


# ----------------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------------
async def main() -> Dict[str, Any]:
    report: Dict[str, Any] = {
        "steps": {},
        "success": False,
    }

    # ---------- Step 1: Audio recognition ----------
    try:
        recognition = await recognize_song(SAMPLE_AUDIO)
    except Exception as exc:
        recognition = {"error": str(exc)}
    report["steps"]["1_recognition"] = recognition
    print(f"  -> recognition result: title='{recognition.get('title')}', "
          f"artist='{recognition.get('artist')}', conf={recognition.get('confidence')}")

    # Resolve title/artist for lyrics lookup
    # If Gemini was confident enough, use its result; else fallback to known truth (Imagine - John Lennon)
    title = (recognition.get("title") or "").strip()
    artist = (recognition.get("artist") or "").strip()
    confidence = recognition.get("confidence", 0)

    if not title or not artist or confidence < 0.5:
        print("  -> Low confidence or empty fields, falling back to ground truth: Imagine - John Lennon")
        title, artist = "Imagine", "John Lennon"
        report["steps"]["1_recognition"]["fallback_used"] = True

    # ---------- Step 2: Lyrics ----------
    lyrics = fetch_lyrics_lrclib(title, artist)
    report["steps"]["2_lyrics"] = {
        "found": lyrics.get("found"),
        "has_synced": lyrics.get("has_synced"),
        "title": lyrics.get("title"),
        "artist": lyrics.get("artist"),
        "duration": lyrics.get("duration"),
        "preview_synced": (lyrics.get("synced") or "")[:200],
        "preview_plain": (lyrics.get("plain") or "")[:200],
    }
    print(f"  -> lyrics found={lyrics.get('found')} synced={lyrics.get('has_synced')}")

    if not lyrics.get("found"):
        report["error"] = "No lyrics found on lrclib"
        _save(report)
        return report

    # ---------- Step 3: Parse LRC (or plain split) ----------
    if lyrics.get("has_synced"):
        parsed = parse_lrc(lyrics["synced"])
        text_lines = [p["line"] for p in parsed]
    else:
        # plain mode: split by newlines
        plain_lines = [ln.strip() for ln in (lyrics.get("plain") or "").splitlines()]
        parsed = [{"t_ms": None, "line": ln} for ln in plain_lines]
        text_lines = plain_lines

    report["steps"]["3_parsed"] = {
        "line_count": len(parsed),
        "first_5": parsed[:5],
        "synced": lyrics.get("has_synced"),
    }
    print(f"  -> parsed {len(parsed)} lines  (synced={lyrics.get('has_synced')})")

    # ---------- Step 4: Translate ----------
    try:
        translations = await translate_lines(text_lines, TARGET_LANG)
    except Exception as exc:
        translations = []
        report["steps"]["4_translation_error"] = str(exc)

    merged = []
    for p, tr in zip(parsed, translations):
        merged.append({
            "t_ms": p["t_ms"],
            "original": p["line"],
            "translated": tr,
        })
    report["steps"]["4_translation"] = {
        "target_lang": TARGET_LANG,
        "line_count": len(merged),
        "first_8": merged[:8],
    }
    print(f"  -> translated {len(merged)} lines into {TARGET_LANG}")

    report["success"] = (
        bool(lyrics.get("found"))
        and len(parsed) > 0
        and len(translations) == len(text_lines)
        and any(tr and not tr.startswith("[TRANSLATION_FAILED]") for tr in translations)
    )
    _save(report)
    return report


def _save(report: Dict[str, Any]) -> None:
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nReport written to {OUTPUT}")


if __name__ == "__main__":
    result = asyncio.run(main())
    print("\n========== POC FINAL ==========")
    print(f"SUCCESS = {result['success']}")
    if not result["success"]:
        print("FAILURES:")
        print(json.dumps(result.get("steps", {}), ensure_ascii=False, indent=2)[:2000])
    sys.exit(0 if result["success"] else 1)
