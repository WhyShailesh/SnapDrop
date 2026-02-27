import { useState, useCallback } from 'react';

const DEFAULT_EXPIRY = 60; // minutes

export default function UploadZone({ onUpload, loading, error }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [oneTime, setOneTime] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState(DEFAULT_EXPIRY);
  const [useStreaming, setUseStreaming] = useState(true);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleFileInput = (e) => {
    const f = e.target?.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpload(
      { file, text: text.trim() || undefined, oneTime, expiresInMinutes, expiresInHours: expiresInMinutes / 60 },
      useStreaming && !!file
    );
  };

  const hasInput = file || text.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${drag ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}
      >
        <input
          type="file"
          id="file"
          className="hidden"
          onChange={handleFileInput}
        />
        <label htmlFor="file" className="cursor-pointer block">
          {file ? (
            <p className="text-sky-400 font-medium">{file.name}</p>
          ) : (
            <p className="text-slate-400">Drag & drop a file here, or click to browse</p>
          )}
        </label>
        <p className="text-slate-500 text-sm mt-2">Or paste text below</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to share..."
        className="w-full h-32 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
        disabled={!!file}
      />

      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={oneTime} onChange={(e) => setOneTime(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-sky-500" />
          <span className="text-slate-300 text-sm">Delete after one download</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={useStreaming} onChange={(e) => setUseStreaming(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-sky-500" />
          <span className="text-slate-300 text-sm">Real-time transfer (receiver can download while uploading)</span>
        </label>
      </div>

      <div className="flex gap-3 items-center">
        <label className="text-slate-400 text-sm">Expires in</label>
        <select
          value={expiresInMinutes}
          onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <option value={15}>15 minutes</option>
          <option value={60}>1 hour</option>
          <option value={360}>6 hours</option>
          <option value={1440}>24 hours</option>
        </select>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!hasInput || loading}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-900 transition"
      >
        {loading ? 'Creating…' : 'Create drop & get code'}
      </button>
    </form>
  );
}
