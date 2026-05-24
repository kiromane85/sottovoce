import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    timeout: 90_000,
});

export const apiGetLanguages = async () => {
    const { data } = await api.get('/languages');
    return data.languages;
};

export const apiResolveAudio = async (blob, targetLang) => {
    const fd = new FormData();
    const filename = blob.type.includes('webm') ? 'capture.webm' :
                     blob.type.includes('mp4')  ? 'capture.m4a'  :
                     blob.type.includes('ogg')  ? 'capture.ogg'  : 'capture.bin';
    fd.append('audio', blob, filename);
    fd.append('target_lang', targetLang);
    const { data } = await api.post('/track/resolve', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const apiResolveManual = async ({ title, artist, target_lang, album }) => {
    const { data } = await api.post('/track/manual', { title, artist, target_lang, album });
    return data;
};

export const apiHistoryList = async () => {
    const { data } = await api.get('/history');
    return data;
};

export const apiHistoryGet = async (id) => {
    const { data } = await api.get(`/history/${id}`);
    return data;
};

export const apiHistoryDelete = async (id) => {
    const { data } = await api.delete(`/history/${id}`);
    return data;
};

export const apiHistoryClear = async () => {
    const { data } = await api.delete('/history');
    return data;
};

export default api;
