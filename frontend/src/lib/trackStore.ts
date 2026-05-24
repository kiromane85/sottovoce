// In-memory holder for the current track payload to share between screens
// without serializing to query params.
import { TrackResolveResponse } from "@/src/lib/types";

let currentTrack: TrackResolveResponse | null = null;

export const trackStore = {
  set(t: TrackResolveResponse | null) {
    currentTrack = t;
  },
  get(): TrackResolveResponse | null {
    return currentTrack;
  },
};
