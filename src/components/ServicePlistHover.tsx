'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface Props {
  label: string;
}

export default function ServicePlistHover({ label }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ path: string | null; contents: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlist = async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/services/plist?label=${encodeURIComponent(label)}`);
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err?.error || 'Failed to fetch plist');
      }
      const json = await resp.json();
      setData({ path: json.path ?? null, contents: json.contents ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => { setOpen(true); fetchPlist(); }}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="mr-3 inline-flex items-center">
        <Info className="h-4 w-4 text-slate-500 hover:text-slate-700" />
      </div>

      {open && (
        <div className="absolute z-50 -left-2 top-6 w-96 max-w-[32rem] bg-white dark:bg-slate-800 border shadow-lg p-4 rounded">
          <div className="text-sm text-muted-foreground mb-2">Plist Info</div>
          {loading && <div className="text-sm">Loading...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && data && (
            <div className="text-xs font-mono whitespace-pre-wrap max-h-60 overflow-auto">
              <div className="mb-2"><strong>Path:</strong> <span className="text-sm">{data.path ?? 'Not Found'}</span></div>
              <div className="border-t pt-2">
                {data.contents ? (
                  <pre className="text-[11px] leading-snug">{data.contents}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground">No contents available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
