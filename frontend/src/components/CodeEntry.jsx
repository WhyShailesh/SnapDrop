import { useState } from 'react';

export default function CodeEntry({ onFetch, loading, error }) {
  const [code, setCode] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const normalized = code.toUpperCase().replace(/\s/g, '').trim();
    if (normalized) onFetch(normalized);
  };

  return (
    <form onSubmit={submit} className="w-full space-y-4">
      <label className="block text-slate-400 text-sm font-medium">Enter the code</label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g. ABC12XYZ"
        maxLength={12}
        className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xl tracking-widest text-center placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!code.trim() || loading}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 font-medium text-slate-900 transition"
      >
        {loading ? 'Loading…' : 'Access content'}
      </button>
    </form>
  );
}
