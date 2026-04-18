import React, { useState, useEffect, useMemo } from 'react';

interface SeriesSummary {
  id: number;
  title: string;
  year: number;
  sizeOnDisk: number;
  episodeFileCount: number;
  hasFile: boolean;
}

interface EpisodeFile {
  id: number;
  seriesId: number;
  seasonNumber: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: { quality: { id: number; name: string } };
  mediaInfo?: {
    videoCodec?: string;
    audioCodec?: string;
    audioChannels?: number;
    resolution?: string;
  };
}

interface FileRow {
  fileId: number;
  seriesId: number;
  seriesTitle: string;
  seasonNumber: number;
  path: string;
  size: number;
  qualityName: string;
  videoCodec: string;
  audioCodec: string;
  resolution: string;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

type SortKey = 'seriesTitle' | 'path' | 'size' | 'qualityName' | 'videoCodec' | 'audioCodec' | 'resolution';
type SortDir = 'asc' | 'desc';

export function FilesTab() {
  const [series, setSeries] = useState<SeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<FileRow[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filterSeriesId, setFilterSeriesId] = useState<string>('all');

  const [sortKey, setSortKey] = useState<SortKey>('seriesTitle');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Load series list.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/plugins/sonarr/series?pageSize=100', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data?.series) ? data.series : [];
          setSeries(list.filter((s: SeriesSummary) => s.hasFile));
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load series'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch episode files for one series at a time when filter changes.
  // Default: show the first 5 series to avoid hammering Sonarr on load.
  useEffect(() => {
    const targets: SeriesSummary[] = filterSeriesId === 'all'
      ? series.slice(0, 5)
      : series.filter((s) => String(s.id) === filterSeriesId);

    if (targets.length === 0) {
      setFileRows([]);
      return;
    }

    let cancelled = false;
    setLoadingFiles(true);

    (async () => {
      const rows: FileRow[] = [];
      for (const s of targets) {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/plugins/sonarr/series/${s.id}/files`, { credentials: 'include' });
          if (!r.ok) continue;
          const raw = await r.json();
          const files: EpisodeFile[] = Array.isArray(raw) ? raw : [];
          for (const f of files) {
            rows.push({
              fileId: f.id,
              seriesId: s.id,
              seriesTitle: s.title,
              seasonNumber: f.seasonNumber,
              path: f.path || f.relativePath || '-',
              size: f.size || 0,
              qualityName: f.quality?.quality?.name || '-',
              videoCodec: f.mediaInfo?.videoCodec || '-',
              audioCodec: f.mediaInfo?.audioCodec
                ? `${f.mediaInfo.audioCodec}${f.mediaInfo.audioChannels ? ` ${f.mediaInfo.audioChannels}ch` : ''}`
                : '-',
              resolution: f.mediaInfo?.resolution || '-',
            });
          }
        } catch {
          // skip on failure; render what we have
        }
      }
      if (!cancelled) {
        setFileRows(rows);
        setLoadingFiles(false);
      }
    })();

    return () => { cancelled = true; };
  }, [series, filterSeriesId]);

  const sortedRows = useMemo(() => {
    const result = [...fileRows];
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'size') {
        cmp = a.size - b.size;
      } else {
        const aVal = String(a[sortKey]).toLowerCase();
        const bVal = String(b[sortKey]).toLowerCase();
        cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [fileRows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (row: FileRow) => {
    setDeletingId(row.fileId);
    try {
      const r = await fetch(`/api/plugins/sonarr/episodefile/${row.fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Delete failed');
      setFileRows((prev) => prev.filter((x) => x.fileId !== row.fileId));
      setConfirmDeleteId(null);
      showMessage(`Deleted episode file from ${row.seriesTitle}`, 'success');
    } catch {
      showMessage('Failed to delete file', 'error');
    }
    setDeletingId(null);
  };

  const handleRename = async (seriesId: number, title: string) => {
    setRenamingId(seriesId);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/rename`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Rename failed');
      showMessage(`Rename command sent for ${title}`, 'success');
    } catch {
      showMessage('Failed to rename files', 'error');
    }
    setRenamingId(null);
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-ndp-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ndp-text">File Management</h2>
          <p className="text-sm text-ndp-text-dim mt-0.5">
            {sortedRows.length} file{sortedRows.length !== 1 ? 's' : ''}
            {filterSeriesId === 'all' && series.length > 5 && ' (showing first 5 series — pick one below for a focused view)'}
            {loadingFiles && ' (loading...)'}
          </p>
        </div>
        <select
          value={filterSeriesId}
          onChange={(e) => setFilterSeriesId(e.target.value)}
          className="input text-sm min-w-[220px]"
        >
          <option value="all">First 5 series</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>{s.title}{s.year ? ` (${s.year})` : ''}</option>
          ))}
        </select>
      </div>

      {message && (
        <div className={
          'px-4 py-2 rounded-lg text-sm font-medium ' +
          (message.type === 'success' ? 'bg-ndp-success/15 text-ndp-success' : 'bg-ndp-error/15 text-ndp-error')
        }>
          {message.text}
        </div>
      )}

      {sortedRows.length === 0 && !loadingFiles ? (
        <div className="card p-6 text-center text-ndp-text-dim text-sm">No episode files found</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('seriesTitle')}
                  >
                    Series{sortIndicator('seriesTitle')}
                  </th>
                  <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[60px]">Season</th>
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('path')}
                  >
                    File Path{sortIndicator('path')}
                  </th>
                  <th
                    className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('size')}
                  >
                    Size{sortIndicator('size')}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px] cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('qualityName')}
                  >
                    Quality{sortIndicator('qualityName')}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('videoCodec')}
                  >
                    Video{sortIndicator('videoCodec')}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px] cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('audioCodec')}
                  >
                    Audio{sortIndicator('audioCodec')}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none"
                    onClick={() => handleSort('resolution')}
                  >
                    Res{sortIndicator('resolution')}
                  </th>
                  <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.fileId} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2">
                      <span className="text-ndp-text font-medium">{row.seriesTitle}</span>
                    </td>
                    <td className="px-4 py-2 text-ndp-text-dim text-xs">S{String(row.seasonNumber).padStart(2, '0')}</td>
                    <td className="px-4 py-2">
                      <span className="text-ndp-text-dim text-xs break-all line-clamp-2">{row.path}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-ndp-text-dim">{formatSize(row.size)}</td>
                    <td className="px-4 py-2 text-ndp-text-dim">{row.qualityName}</td>
                    <td className="px-4 py-2 text-ndp-text-dim text-xs">{row.videoCodec}</td>
                    <td className="px-4 py-2 text-ndp-text-dim text-xs">{row.audioCodec}</td>
                    <td className="px-4 py-2 text-ndp-text-dim text-xs">{row.resolution}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRename(row.seriesId, row.seriesTitle)}
                          disabled={renamingId === row.seriesId}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-ndp-text-dim hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                          {renamingId === row.seriesId ? (
                            <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                          ) : 'Rename'}
                        </button>

                        {confirmDeleteId === row.fileId ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(row)}
                              disabled={deletingId === row.fileId}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-ndp-error text-white hover:bg-ndp-error/80 transition-colors disabled:opacity-50"
                            >
                              {deletingId === row.fileId ? 'Deleting' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-ndp-text-dim hover:bg-white/10 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(row.fileId)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
