/**
 * Receive content via real-time stream (when sender is still uploading).
 * Join socket room by code; buffer chunks; on stream_complete build blob.
 */
import { getSocket } from './socket';

function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/**
 * Try to receive via stream. Resolves with { blob, mimeType, fileName } or null if not streaming.
 */
export function receiveStream(code) {
  return new Promise((resolve) => {
    const normalized = (code || '').toUpperCase().trim();
    if (!normalized) {
      resolve(null);
      return;
    }
    const socket = getSocket();
    const chunks = [];
    let meta = { mimeType: 'application/octet-stream', fileName: 'file' };

    const cleanup = () => {
      socket.off('stream_chunk', onChunk);
      socket.off('stream_complete', onComplete);
      if (tid) clearTimeout(tid);
    };

    const onChunk = (payload) => {
      if (payload?.chunk) chunks.push(base64ToUint8Array(payload.chunk));
    };

    const onComplete = () => {
      cleanup();
      const blob = new Blob(chunks, { type: meta.mimeType });
      resolve({ blob, mimeType: meta.mimeType, fileName: meta.fileName || 'file' });
    };

    let tid = setTimeout(() => {
      tid = null;
      cleanup();
      resolve(null);
    }, 120000);

    socket.on('stream_chunk', onChunk);
    socket.on('stream_complete', onComplete);

    socket.emit('join_drop', normalized, (ack) => {
      if (!ack?.joined) {
        cleanup();
        resolve(null);
        return;
      }
      if (ack.existingChunks) chunks.push(base64ToUint8Array(ack.existingChunks));
      if (ack.meta) meta = ack.meta;
      if (!ack.existingChunks && !ack.meta) {
        cleanup();
        resolve(null);
        return;
      }
    });
  });
}
