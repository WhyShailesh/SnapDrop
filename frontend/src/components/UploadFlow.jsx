import { useState } from 'react';
import UploadZone from './UploadZone';
import CodeDisplay from './CodeDisplay';
import { api } from '../lib/api';

export default function UploadFlow() {
  const [result, setResult] = useState(null); // { code, expiresAt, oneTime }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload({ file, text, oneTime, expiresInMinutes, expiresInHours }, useStreaming = false) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (useStreaming && file) {
        const { handleStreamUpload } = await import('../lib/streamUpload');
        const res = await handleStreamUpload(file, { oneTime, expiresInMinutes, expiresInHours });
        setResult(res);
        return;
      }
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('oneTime', oneTime ? 'true' : '');
        if (expiresInMinutes) form.append('expiresInMinutes', String(expiresInMinutes));
        if (expiresInHours) form.append('expiresInHours', String(expiresInHours));
        const { data } = await api.post('/drops/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setResult({ code: data.code, expiresAt: data.expiresAt, oneTime: data.oneTime });
        return;
      }
      const payload = {
        oneTime: !!oneTime,
        mimeType: 'text/plain',
        fileName: 'paste.txt',
      };
      if (expiresInMinutes) payload.expiresInMinutes = Number(expiresInMinutes);
      if (expiresInHours) payload.expiresInHours = Number(expiresInHours);
      if (text) {
        payload.text = text;
      } else {
        setError('Enter text or select a file.');
        return;
      }
      const { data } = await api.post('/drops', payload);
      setResult({ code: data.code, expiresAt: data.expiresAt, oneTime: data.oneTime });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-6">
      {!result ? (
        <UploadZone onUpload={handleUpload} loading={loading} error={error} />
      ) : (
        <CodeDisplay code={result.code} expiresAt={result.expiresAt} oneTime={result.oneTime} onReset={() => setResult(null)} />
      )}
    </div>
  );
}
