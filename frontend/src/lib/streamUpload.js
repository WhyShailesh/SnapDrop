/**
 * Real-time stream upload: send file in chunks over Socket.io.
 * Receiver can download while upload is in progress.
 */
import { getSocket } from './socket';

export function handleStreamUpload(file, options = {}) {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    socket.emit('create_stream_drop', {
      oneTime: options.oneTime,
      expiresInMinutes: options.expiresInMinutes,
      expiresInHours: options.expiresInHours,
      mimeType: file.type || 'application/octet-stream',
      fileName: file.name || 'file',
    }, (ack) => {
      if (ack?.error) {
        reject(new Error(ack.error));
        return;
      }
      const code = ack?.code;
      if (!code) {
        reject(new Error('No code received'));
        return;
      }

      const reader = file.stream().getReader();
      let offset = 0;

      function sendNext() {
        reader.read().then(({ done, value }) => {
          if (done) {
            socket.emit('stream_complete', { code }, (completeAck) => {
              if (completeAck?.error) reject(new Error(completeAck.error));
              else resolve({ code, expiresAt: ack.expiresAt, oneTime: ack.oneTime });
            });
            return;
          }
          const bytes = new Uint8Array(value);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          socket.emit('stream_chunk', { code, chunk: btoa(binary) });
          offset += value.length;
          sendNext();
        }).catch(reject);
      }

      sendNext();
    });
  });
}
