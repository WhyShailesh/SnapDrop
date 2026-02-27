import { useState, useEffect } from 'react';
import { setApiBaseURL } from '../lib/api';

export default function Header({ tab, setTab }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lanUrl, setLanUrl] = useState('');

  useEffect(() => {
    try {
      setLanUrl(localStorage.getItem('codedrop_api_url') || '');
    } catch (_) {}
  }, []);

  const saveLanUrl = () => {
    setApiBaseURL(lanUrl.trim() || null);
    setSettingsOpen(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/50">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="font-sans font-bold text-xl text-sky-400 tracking-tight">CodeDrop</h1>
        <nav className="flex gap-1 items-center">
          <button
            onClick={() => setTab('send')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'send' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Send
          </button>
          <button
            onClick={() => setTab('receive')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${tab === 'receive' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Receive
          </button>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200"
            title="Settings (LAN server)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </nav>
      </div>
      {settingsOpen && (
        <div className="max-w-2xl mx-auto px-4 pb-4 flex flex-wrap gap-2 items-center border-t border-slate-800 pt-3">
          <label className="text-slate-400 text-sm">LAN server URL (same WiFi):</label>
          <input
            type="text"
            value={lanUrl}
            onChange={(e) => setLanUrl(e.target.value)}
            placeholder="http://192.168.1.100:3001"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
          <button onClick={saveLanUrl} className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-900 text-sm font-medium">
            Save
          </button>
          <span className="text-slate-500 text-xs">Leave empty for same host.</span>
        </div>
      )}
    </header>
  );
}
