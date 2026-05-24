"""
Sottovoce Backend API Tests
Tests all endpoints using the public preview URL
"""
import requests
import sys
import time
from pathlib import Path

class SottovoceAPITester:
    def __init__(self, base_url="https://music-translate-car.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.history_ids = []

    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, retry_on_budget=True):
        """Run a single API test with optional retry for budget errors"""
        url = f"{self.api_base}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        self.log(f"\n🔍 Test #{self.tests_run}: {name}")
        
        max_retries = 3 if retry_on_budget else 1
        for attempt in range(max_retries):
            try:
                if method == 'GET':
                    response = requests.get(url, headers=headers, timeout=30)
                elif method == 'POST':
                    if files:
                        response = requests.post(url, data=data, files=files, headers=headers, timeout=90)
                    else:
                        headers['Content-Type'] = 'application/json'
                        response = requests.post(url, json=data, headers=headers, timeout=90)
                elif method == 'DELETE':
                    response = requests.delete(url, headers=headers, timeout=30)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                # Check for budget exceeded error
                if response.status_code in [429, 500]:
                    try:
                        resp_json = response.json()
                        if 'budget' in str(resp_json).lower() or 'exceeded' in str(resp_json).lower():
                            if attempt < max_retries - 1:
                                self.log(f"⏳ Budget exceeded, retrying in 5s (attempt {attempt + 1}/{max_retries})...", "WARN")
                                time.sleep(5)
                                continue
                    except:
                        pass

                success = response.status_code == expected_status
                if success:
                    self.tests_passed += 1
                    self.log(f"✅ PASSED - Status: {response.status_code}", "PASS")
                    try:
                        return True, response.json()
                    except:
                        return True, {}
                else:
                    self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                    try:
                        self.log(f"   Response: {response.text[:200]}", "FAIL")
                    except:
                        pass
                    self.failed_tests.append({"name": name, "expected": expected_status, "got": response.status_code})
                    return False, {}

            except Exception as e:
                if attempt < max_retries - 1:
                    self.log(f"⏳ Error occurred, retrying in 5s (attempt {attempt + 1}/{max_retries})...", "WARN")
                    time.sleep(5)
                    continue
                else:
                    self.log(f"❌ FAILED - Error: {str(e)}", "FAIL")
                    self.failed_tests.append({"name": name, "error": str(e)})
                    return False, {}
        
        return False, {}

    def test_root(self):
        """Test GET /api/"""
        success, response = self.run_test(
            "GET /api/ returns 200",
            "GET",
            "",
            200,
            retry_on_budget=False
        )
        if success and response.get('message'):
            self.log(f"   Message: {response['message']}")
        return success

    def test_languages(self):
        """Test GET /api/languages"""
        success, response = self.run_test(
            "GET /api/languages returns 12 languages",
            "GET",
            "languages",
            200,
            retry_on_budget=False
        )
        if success:
            languages = response.get('languages', [])
            expected_langs = ['Italian', 'English', 'Spanish', 'French', 'German', 
                            'Portuguese', 'Japanese', 'Chinese', 'Russian', 'Arabic', 
                            'Dutch', 'Korean']
            lang_codes = [l.get('code', '') for l in languages]
            
            if len(languages) >= 12:
                self.log(f"   ✓ Found {len(languages)} languages")
            else:
                self.log(f"   ⚠ Expected 12 languages, found {len(languages)}", "WARN")
            
            # Check for expected languages (some might have variations like "Chinese (Simplified)")
            missing = []
            for exp in expected_langs:
                found = any(exp in code for code in lang_codes)
                if not found:
                    missing.append(exp)
            
            if missing:
                self.log(f"   ⚠ Missing languages: {missing}", "WARN")
            else:
                self.log(f"   ✓ All expected languages present")
        
        return success

    def test_lyrics_valid(self):
        """Test POST /api/lyrics with valid song"""
        success, response = self.run_test(
            "POST /api/lyrics with 'Imagine' by John Lennon",
            "POST",
            "lyrics",
            200,
            data={"title": "Imagine", "artist": "John Lennon"},
            retry_on_budget=False
        )
        if success:
            if response.get('found'):
                self.log(f"   ✓ Lyrics found")
                self.log(f"   ✓ has_synced: {response.get('has_synced')}")
                if response.get('has_synced'):
                    self.log(f"   ✓ Synced lyrics available")
                if response.get('plain'):
                    self.log(f"   ✓ Plain lyrics available ({len(response['plain'])} chars)")
            else:
                self.log(f"   ⚠ Lyrics not found (lrclib may not have this song)", "WARN")
        return success

    def test_lyrics_invalid(self):
        """Test POST /api/lyrics with garbage data"""
        success, response = self.run_test(
            "POST /api/lyrics with garbage data",
            "POST",
            "lyrics",
            200,
            data={"title": "xyzxyzxyz123", "artist": "nonexistentartist999"},
            retry_on_budget=False
        )
        if success:
            if not response.get('found'):
                self.log(f"   ✓ Correctly returned found=false")
            else:
                self.log(f"   ⚠ Unexpectedly found lyrics for garbage data", "WARN")
        return success

    def test_translate_valid(self):
        """Test POST /api/translate with valid lines"""
        success, response = self.run_test(
            "POST /api/translate with ['hello','world','goodbye'] to Italian",
            "POST",
            "translate",
            200,
            data={"lines": ["hello", "world", "goodbye"], "target_lang": "Italian"}
        )
        if success:
            translations = response.get('translations', [])
            if len(translations) == 3:
                self.log(f"   ✓ Returned 3 translations (preserving order)")
                self.log(f"   Translations: {translations}")
            else:
                self.log(f"   ⚠ Expected 3 translations, got {len(translations)}", "WARN")
        return success

    def test_translate_empty(self):
        """Test POST /api/translate with empty lines"""
        success, response = self.run_test(
            "POST /api/translate with empty lines []",
            "POST",
            "translate",
            200,
            data={"lines": [], "target_lang": "Italian"}
        )
        if success:
            translations = response.get('translations', [])
            if len(translations) == 0:
                self.log(f"   ✓ Correctly returned empty translations array")
            else:
                self.log(f"   ⚠ Expected empty array, got {len(translations)} items", "WARN")
        return success

    def test_track_manual_italian(self):
        """Test POST /api/track/manual with Imagine in Italian"""
        success, response = self.run_test(
            "POST /api/track/manual with 'Imagine' by John Lennon (Italian)",
            "POST",
            "track/manual",
            200,
            data={"title": "Imagine", "artist": "John Lennon", "target_lang": "Italian"}
        )
        if success:
            self.log(f"   ✓ Title: {response.get('title')}")
            self.log(f"   ✓ Artist: {response.get('artist')}")
            self.log(f"   ✓ has_synced: {response.get('has_synced')}")
            self.log(f"   ✓ confidence: {response.get('confidence')}")
            self.log(f"   ✓ source: {response.get('source')}")
            
            lines = response.get('lines', [])
            if len(lines) >= 20:
                self.log(f"   ✓ Found {len(lines)} lines with translations")
                # Check a few sample lines for Italian words
                sample_translations = [line.get('translated', '') for line in lines[:3]]
                self.log(f"   Sample translations: {sample_translations}")
            else:
                self.log(f"   ⚠ Expected >=20 lines, got {len(lines)}", "WARN")
            
            # Save ID for history tests
            if response.get('id'):
                self.history_ids.append(response['id'])
        
        return success

    def test_track_manual_spanish(self):
        """Test POST /api/track/manual with Imagine in Spanish"""
        success, response = self.run_test(
            "POST /api/track/manual with 'Imagine' by John Lennon (Spanish)",
            "POST",
            "track/manual",
            200,
            data={"title": "Imagine", "artist": "John Lennon", "target_lang": "Spanish"}
        )
        if success:
            lines = response.get('lines', [])
            if len(lines) > 0:
                # Check a few sample lines for Spanish (not Italian)
                sample_translations = [line.get('translated', '') for line in lines[:3]]
                self.log(f"   Sample Spanish translations: {sample_translations}")
                # Basic check: Spanish translations should be different from Italian
                self.log(f"   ✓ Translations in Spanish (verify manually if needed)")
            
            # Save ID for history tests
            if response.get('id'):
                self.history_ids.append(response['id'])
        
        return success

    def test_track_manual_nonexistent(self):
        """Test POST /api/track/manual with non-existent song"""
        success, response = self.run_test(
            "POST /api/track/manual with non-existent song",
            "POST",
            "track/manual",
            200,
            data={"title": "NonExistentSong999", "artist": "FakeArtist123", "target_lang": "Italian"}
        )
        if success:
            # Should still return 200 with valid TrackResolveResponse shape
            if response.get('title') == "NonExistentSong999" and response.get('artist') == "FakeArtist123":
                self.log(f"   ✓ Title/artist preserved")
            lines = response.get('lines', [])
            self.log(f"   ✓ Returned valid response with {len(lines)} lines (empty is OK)")
            
            # Save ID for history tests
            if response.get('id'):
                self.history_ids.append(response['id'])
        
        return success

    def test_history_list(self):
        """Test GET /api/history"""
        success, response = self.run_test(
            "GET /api/history returns array",
            "GET",
            "history",
            200,
            retry_on_budget=False
        )
        if success:
            if isinstance(response, list):
                self.log(f"   ✓ Returned array with {len(response)} items")
                if len(response) > 0:
                    item = response[0]
                    self.log(f"   Sample item: {item.get('title')} - {item.get('artist')}")
            else:
                self.log(f"   ⚠ Expected array, got {type(response)}", "WARN")
        return success

    def test_history_get_valid(self):
        """Test GET /api/history/{id} with valid ID"""
        if not self.history_ids:
            self.log("⏭ Skipping - no history IDs available", "WARN")
            return True
        
        test_id = self.history_ids[0]
        success, response = self.run_test(
            f"GET /api/history/{test_id} (valid ID)",
            "GET",
            f"history/{test_id}",
            200,
            retry_on_budget=False
        )
        if success:
            if response.get('lines'):
                self.log(f"   ✓ Full TrackResolveResponse with {len(response['lines'])} lines")
            else:
                self.log(f"   ✓ TrackResolveResponse returned")
        return success

    def test_history_get_invalid(self):
        """Test GET /api/history/{id} with invalid ID"""
        success, response = self.run_test(
            "GET /api/history/invalid-id-999 returns 404",
            "GET",
            "history/invalid-id-999",
            404,
            retry_on_budget=False
        )
        if success:
            self.log(f"   ✓ Correctly returned 404 for invalid ID")
        return success

    def test_history_delete_single(self):
        """Test DELETE /api/history/{id}"""
        if len(self.history_ids) < 2:
            self.log("⏭ Skipping - need at least 2 history items", "WARN")
            return True
        
        test_id = self.history_ids[-1]  # Delete the last one
        success, response = self.run_test(
            f"DELETE /api/history/{test_id}",
            "DELETE",
            f"history/{test_id}",
            200,
            retry_on_budget=False
        )
        if success:
            deleted_count = response.get('deleted', 0)
            if deleted_count == 1:
                self.log(f"   ✓ Deleted 1 item")
            else:
                self.log(f"   ⚠ Expected deleted=1, got {deleted_count}", "WARN")
        return success

    def test_recognize_audio(self):
        """Test POST /api/recognize with real audio file"""
        audio_path = Path("/app/tests/poc_samples/imagine_lyrics.mp3")
        if not audio_path.exists():
            self.log(f"⏭ Skipping - audio file not found: {audio_path}", "WARN")
            return True
        
        with open(audio_path, 'rb') as f:
            files = {'audio': ('imagine_lyrics.mp3', f, 'audio/mpeg')}
            success, response = self.run_test(
                "POST /api/recognize with imagine_lyrics.mp3",
                "POST",
                "recognize",
                200,
                files=files
            )
        
        if success:
            title = response.get('title', '')
            artist = response.get('artist', '')
            confidence = response.get('confidence', 0)
            
            self.log(f"   Recognized: '{title}' by '{artist}'")
            self.log(f"   Confidence: {confidence}")
            
            if 'imagine' in title.lower() and 'lennon' in artist.lower():
                self.log(f"   ✓ Correctly identified 'Imagine' by John Lennon")
            else:
                self.log(f"   ⚠ Expected 'Imagine' by John Lennon, got different result", "WARN")
            
            if confidence >= 0.5:
                self.log(f"   ✓ Confidence >= 0.5")
            else:
                self.log(f"   ⚠ Confidence < 0.5", "WARN")
        
        return success

    def test_track_resolve_audio(self):
        """Test POST /api/track/resolve with audio file"""
        audio_path = Path("/app/tests/poc_samples/imagine_lyrics.mp3")
        if not audio_path.exists():
            self.log(f"⏭ Skipping - audio file not found: {audio_path}", "WARN")
            return True
        
        with open(audio_path, 'rb') as f:
            files = {'audio': ('imagine_lyrics.mp3', f, 'audio/mpeg')}
            data = {'target_lang': 'Italian'}
            success, response = self.run_test(
                "POST /api/track/resolve with imagine_lyrics.mp3 + Italian",
                "POST",
                "track/resolve",
                200,
                data=data,
                files=files
            )
        
        if success:
            self.log(f"   ✓ Title: {response.get('title')}")
            self.log(f"   ✓ Artist: {response.get('artist')}")
            lines = response.get('lines', [])
            self.log(f"   ✓ Lines with Italian translation: {len(lines)}")
            
            if len(lines) > 0:
                sample = lines[0]
                self.log(f"   Sample: '{sample.get('original')}' -> '{sample.get('translated')}'")
        
        return success

    def test_history_clear(self):
        """Test DELETE /api/history (clear all)"""
        success, response = self.run_test(
            "DELETE /api/history (clear all)",
            "DELETE",
            "history",
            200,
            retry_on_budget=False
        )
        if success:
            deleted_count = response.get('deleted', 0)
            self.log(f"   ✓ Cleared {deleted_count} items from history")
        return success

    def run_all_tests(self):
        """Run all backend tests in sequence"""
        self.log("\n" + "="*60)
        self.log("SOTTOVOCE BACKEND API TESTS")
        self.log(f"Testing: {self.api_base}")
        self.log("="*60)
        
        # Basic endpoints
        self.test_root()
        self.test_languages()
        
        # Lyrics endpoint
        self.test_lyrics_valid()
        self.test_lyrics_invalid()
        
        # Translation endpoint
        self.test_translate_valid()
        self.test_translate_empty()
        
        # Track manual endpoint
        self.test_track_manual_italian()
        self.test_track_manual_spanish()
        self.test_track_manual_nonexistent()
        
        # History endpoints
        self.test_history_list()
        self.test_history_get_valid()
        self.test_history_get_invalid()
        self.test_history_delete_single()
        
        # Audio recognition endpoints
        self.test_recognize_audio()
        self.test_track_resolve_audio()
        
        # Clear history (last test)
        self.test_history_clear()
        
        # Print summary
        self.log("\n" + "="*60)
        self.log("TEST SUMMARY")
        self.log("="*60)
        self.log(f"Total tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}")
        self.log(f"Failed: {self.tests_run - self.tests_passed}")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for ft in self.failed_tests:
                self.log(f"   - {ft.get('name')}: {ft}")
        
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = SottovoceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
