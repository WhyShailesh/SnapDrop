import { useRef, useState, useEffect } from 'react';

export default function DownloadView({ blob, mimeType, fileName, onReset }) {
  const anchor = useRef(null);
  const url = URL.createObjectURL(blob);
  const [textPreview, setTextPreview] = useState(null);

  const isImage = mimeType?.startsWith('image/');
  const isText = mimeType === 'text/plain' || mimeType?.startsWith('text/');

  useEffect(() => {
    if (isText && blob) {
      const r = new FileReader();
      r.onload = () => setTextPreview(r.result);
      r.readAsText(blob);
    }
    return () => URL.revokeObjectURL(url);
  }, [blob, isText, url]);

  const download = () => {
    if (anchor.current) {
      anchor.current.href = url;
      anchor.current.download = fileName || 'file';
      anchor.current.click();
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6 space-y-4">
      <p className="text-slate-400 text-sm">Content ready. Preview or download.</p>
      {isImage && (
        <div className="rounded-lg overflow-hidden bg-slate-800">
          <img src={url} alt={fileName} className="max-h-64 w-full object-contain" />
        </div>
      )}
      {isText && textPreview != null && (
        <div className="rounded-lg bg-slate-800 p-4 max-h-48 overflow-auto">
          <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">{textPreview}</pre>
        </div>
      )}
      <div className="flex gap-3">
        <a ref={anchor} href={url} download={fileName} className="hidden" />
        <button onClick={download} className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 font-medium text-slate-900">
          Download
        </button>
        <button onClick={onReset} className="px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 font-medium">
          Enter another code
        </button>
      </div>
    </div>
  );
}
