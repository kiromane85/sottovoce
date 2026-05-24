"""Sottovoce backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://38d9b8b7-dd55-43ec-b445-2cc777e1b0f0.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TIMEOUT_LONG = 180
TIMEOUT_SHORT = 30


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    yield s
    s.close()


# Health
def test_root_health(session):
    r = session.get(f"{API}/", timeout=TIMEOUT_SHORT)
    assert r.status_code == 200
    j = r.json()
    assert "message" in j


# Languages
def test_languages_returns_12(session):
    r = session.get(f"{API}/languages", timeout=TIMEOUT_SHORT)
    assert r.status_code == 200
    data = r.json()
    assert "languages" in data
    langs = data["languages"]
    assert len(langs) == 12
    for l in langs:
        assert "code" in l and "label" in l and "flag" in l


# Lyrics endpoint
def test_lyrics_endpoint_imagine(session):
    r = session.post(f"{API}/lyrics", json={"title": "Imagine", "artist": "John Lennon"}, timeout=TIMEOUT_SHORT)
    assert r.status_code == 200
    data = r.json()
    assert data.get("found") is True
    assert data.get("title")
    assert data.get("artist")


# Translate endpoint
def test_translate_returns_same_length(session):
    lines = ["Hello world", "Good morning", "Goodbye"]
    r = session.post(f"{API}/translate", json={"lines": lines, "target_lang": "Italian"}, timeout=TIMEOUT_LONG)
    assert r.status_code == 200
    data = r.json()
    assert "translations" in data
    assert len(data["translations"]) == len(lines)
    assert data.get("target_lang") == "Italian"


# Manual track + history flow
class TestManualTrackHistory:
    track_id = None

    def test_track_manual_imagine(self, session):
        payload = {"title": "Imagine", "artist": "John Lennon", "target_lang": "Italian"}
        r = session.post(f"{API}/track/manual", json=payload, timeout=TIMEOUT_LONG)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"]
        assert data["artist"]
        assert data["source"] == "manual"
        assert data["target_lang"] == "Italian"
        assert isinstance(data["lines"], list)
        assert len(data["lines"]) > 0
        # Imagine should be synced on lrclib
        assert data["has_synced"] is True
        # check first line has both original and translated
        first = data["lines"][0]
        assert "original" in first
        assert "translated" in first
        TestManualTrackHistory.track_id = data["id"]

    def test_history_list_contains_track(self, session):
        r = session.get(f"{API}/history", timeout=TIMEOUT_SHORT)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(it["id"] == TestManualTrackHistory.track_id for it in items)

    def test_history_get_by_id(self, session):
        tid = TestManualTrackHistory.track_id
        assert tid
        r = session.get(f"{API}/history/{tid}", timeout=TIMEOUT_SHORT)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == tid
        assert len(data["lines"]) > 0

    def test_history_get_404(self, session):
        r = session.get(f"{API}/history/non-existent-id-zzz", timeout=TIMEOUT_SHORT)
        assert r.status_code == 404

    def test_history_delete_single(self, session):
        tid = TestManualTrackHistory.track_id
        r = session.delete(f"{API}/history/{tid}", timeout=TIMEOUT_SHORT)
        assert r.status_code == 200
        assert r.json().get("deleted") == 1
        # verify gone
        r2 = session.get(f"{API}/history/{tid}", timeout=TIMEOUT_SHORT)
        assert r2.status_code == 404

    def test_history_delete_all(self, session):
        # create another to ensure delete_all
        r = session.post(f"{API}/track/manual", json={"title": "Imagine", "artist": "John Lennon", "target_lang": "English"}, timeout=TIMEOUT_LONG)
        assert r.status_code == 200
        r2 = session.delete(f"{API}/history", timeout=TIMEOUT_SHORT)
        assert r2.status_code == 200
        assert "deleted" in r2.json()
        r3 = session.get(f"{API}/history", timeout=TIMEOUT_SHORT)
        assert r3.status_code == 200
        assert r3.json() == []


# Recognize endpoint with empty audio -> 400
def test_recognize_empty_audio(session):
    files = {"audio": ("empty.m4a", b"", "audio/m4a")}
    r = session.post(f"{API}/recognize", files=files, timeout=TIMEOUT_SHORT)
    assert r.status_code == 400
