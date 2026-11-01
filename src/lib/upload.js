import { API_BASE_URL, UNAUTHORIZED_EVENT } from './api';
import { getToken } from './session';

// POST multipart form data with upload progress (fetch cannot report it).
// Resolves with the parsed JSON body; rejects with an Error carrying the server's message.
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => reject(new Error("Couldn't reach the server. Check your connection and try again."));
    xhr.onload = () => {
      let body = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
      if (xhr.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body);
      const err = new Error(body?.message || body?.error || `Upload failed (${xhr.status})`);
      err.status = xhr.status;
      reject(err);
    };
    xhr.send(formData);
  });
}

export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
