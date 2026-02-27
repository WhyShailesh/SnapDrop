import { useState } from 'react';
import CodeEntry from './CodeEntry';
import DownloadView from './DownloadView';
import { api } from '../lib/api';
import { decrypt } from '../lib/crypto';
import { receiveStream } from '../lib/streamReceive';

export default function ReceiveFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decrypted, setDecrypted] = useState(null); // { blob, mimeType, fileName }

  async function handleFetch(code) {
    setError(null);
    setDecrypted(null);
    setLoading(true);
    try {
      const streamResult = await receiveStream(code);
      if (streamResult?.blob) {
        setDecrypted(streamResult);
        setLoading(false);
        return;
      }
      const { data } = await api.get(`/drops/${encodeURIComponent(code)}`);
      const ab = await decrypt(
        { encrypted: data.encrypted, salt: data.salt, iv: data.iv, authTag: data.authTag },
        code
      );
      const blob = new Blob([ab], { type: data.mimeType || 'application/octet-stream' });
      setDecrypted({ blob, mimeType: data.mimeType, fileName: data.fileName || 'file' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-6">
      {!decrypted ? (
        <CodeEntry onFetch={handleFetch} loading={loading} error={error} />
      ) : (
        <DownloadView {...decrypted} onReset={() => setDecrypted(null)} />
      )}
    </div>
  );
}
