import { useState } from 'react';

export default function CodeDisplay({ code, expiresAt, oneTime, onReset }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-8 text-center space-y-6">
      <p className="text-slate-400 text-sm">Share this code. Anyone with the code can access the content.</p>
      <div className="flex items-center justify-center gap-3">
        <span className="font-mono text-3xl md:text-4xl font-bold tracking-widest text-sky-400 select-all">{code}</span>
        <button
          onClick={copy}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-slate-500 text-sm">
        Expires {expiresAt ? new Date(expiresAt).toLocaleString() : '—'}
        {oneTime && ' · One-time download'}
      </p>
      <button onClick={onReset} className="text-sky-400 hover:text-sky-300 text-sm font-medium">
        Send another
      </button>
    </div>
  );
}
