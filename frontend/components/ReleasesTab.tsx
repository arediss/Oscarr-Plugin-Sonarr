import React, { useState, useEffect, useCallback } from 'react';

interface Release {
  guid: string;
  quality: { quality: { id: number; name: string; resolution?: number } };
  age: number;
  ageHours: number;
  ageMinutes: number;
  size: number;
  indexer: string;
  indexerId?: number;
  title: string;
  approved: boolean;
  rejections: string[];
  seeders?: number;
  leechers?: number;
  protocol: string;
  seasonNumber?: number;
  fullSeason?: boolean;
}

interface BlocklistItem {
  id: number;
  seriesId: number;
  sourceTitle: string;
  date: string;
  quality: { quality: { id: number; name: string } };
  series?: { title: string; year?: number };
}

interface SeriesSummary {
  id: number;
  title: string;
  year: number;
}

interface Episode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDateUtc?: string | null;
  hasFile: boolean;
  monitored: boolean;
}

interface SeasonSummary {
  seasonNumber: number;
  monitored: boolean;
  episodeCount: number;
  episodeFileCount: number;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatAge(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function epTag(s: number, e: number): string {
  return `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}`;
}

type Scope = 'episode' | 'season';

export function ReleasesTab() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [seriesResults, setSeriesResults] = useState<SeriesSummary[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<SeriesSummary | null>(null);
  const [searchingSeries, setSearchingSeries] = useState(false);

  // Scope picker (episode by default to match the B granularity choice)
  const [scope, setScope] = useState<Scope>('episode');
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [loadingSeasonsEpisodes, setLoadingSeasonsEpisodes] = useState(false);

  // Release results
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [grabbing, setGrabbing] = useState<string | null>(null);

  // Blocklist
  const [blocklist, setBlocklist] = useState<BlocklistItem[]>([]);
  const [blocklistTotal, setBlocklistTotal] = useState(0);
  const [blocklistPage, setBlocklistPage] = useState(1);
  const [loadingBlocklist, setLoadingBlocklist] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Search series by title.
  const handleSearchSeries = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchingSeries(true);
    setSeriesResults([]);
    setSelectedSeries(null);
    setReleases([]);
    setSeasons([]);
    setEpisodes([]);

    try {
      const r = await fetch(`/api/plugins/sonarr/series?search=${encodeURIComponent(searchQuery.trim())}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const list = Array.isArray(data?.series) ? data.series : [];
      setSeriesResults(list.slice(0, 20));
    } catch {
      showMessage('Failed to search series', 'error');
    }
    setSearchingSeries(false);
  }, [searchQuery]);

  // When a series is picked, load seasons + all episodes to let the user drill.
  const handlePickSeries = async (series: SeriesSummary) => {
    setSelectedSeries(series);
    setReleases([]);
    setSelectedSeason(null);
    setSelectedEpisodeId(null);
    setLoadingSeasonsEpisodes(true);
    try {
      const [seasonsRes, episodesRes] = await Promise.all([
        fetch(`/api/plugins/sonarr/series/${series.id}/seasons`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : { seasons: [] })),
        fetch(`/api/plugins/sonarr/series/${series.id}/episodes`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : { episodes: [] })),
      ]);
      setSeasons(Array.isArray(seasonsRes?.seasons) ? seasonsRes.seasons : []);
      setEpisodes(Array.isArray(episodesRes?.episodes) ? episodesRes.episodes : []);
    } catch {
      showMessage('Failed to load seasons/episodes', 'error');
    }
    setLoadingSeasonsEpisodes(false);
  };

  // Fetch releases based on current scope selection.
  const fetchReleases = async () => {
    if (!selectedSeries) return;
    setLoadingReleases(true);
    setReleases([]);
    try {
      let url: string;
      if (scope === 'episode' && selectedEpisodeId !== null) {
        url = `/api/plugins/sonarr/releases?episodeId=${selectedEpisodeId}`;
      } else if (scope === 'season' && selectedSeason !== null) {
        url = `/api/plugins/sonarr/releases?seriesId=${selectedSeries.id}&seasonNumber=${selectedSeason}`;
      } else {
        setLoadingReleases(false);
        return;
      }
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setReleases(Array.isArray(data) ? data : []);
    } catch {
      showMessage('Failed to load releases', 'error');
    }
    setLoadingReleases(false);
  };

  // Grab a release.
  const handleGrab = async (release: Release) => {
    setGrabbing(release.guid);
    try {
      const r = await fetch('/api/plugins/sonarr/releases/grab', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guid: release.guid, indexerId: release.indexerId || 0 }),
      });
      if (!r.ok) throw new Error('Grab failed');
      showMessage('Release grabbed', 'success');
    } catch {
      showMessage('Failed to grab release', 'error');
    }
    setGrabbing(null);
  };

  // Blocklist
  const fetchBlocklist = useCallback(async () => {
    setLoadingBlocklist(true);
    try {
      const r = await fetch(`/api/plugins/sonarr/blocklist?page=${blocklistPage}&pageSize=20`, { credentials: 'include' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setBlocklist(Array.isArray(data?.records) ? data.records : []);
      setBlocklistTotal(data?.totalRecords || 0);
    } catch {
      showMessage('Failed to load blocklist', 'error');
    }
    setLoadingBlocklist(false);
  }, [blocklistPage]);

  useEffect(() => { fetchBlocklist(); }, [fetchBlocklist]);

  const handleRemoveBlocklistItem = async (id: number) => {
    setRemovingId(id);
    try {
      const r = await fetch(`/api/plugins/sonarr/blocklist/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error('Remove failed');
      setBlocklist((prev) => prev.filter((item) => item.id !== id));
      setBlocklistTotal((prev) => prev - 1);
      showMessage('Blocklist item removed', 'success');
    } catch {
      showMessage('Failed to remove blocklist item', 'error');
    }
    setRemovingId(null);
  };

  const blocklistTotalPages = Math.max(1, Math.ceil(blocklistTotal / 20));

  const episodesOfSelectedSeason = selectedSeason !== null
    ? episodes.filter((e) => e.seasonNumber === selectedSeason).sort((a, b) => a.episodeNumber - b.episodeNumber)
    : [];

  return (
    <div className="space-y-8">
      {message && (
        <div className={
          'px-4 py-2 rounded-lg text-sm font-medium ' +
          (message.type === 'success' ? 'bg-ndp-success/15 text-ndp-success' : 'bg-ndp-error/15 text-ndp-error')
        }>
          {message.text}
        </div>
      )}

      {/* Release Search */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ndp-text">Release Search</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by series title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSeries(); }}
            className="input flex-1 text-sm"
          />
          <button
            onClick={handleSearchSeries}
            disabled={searchingSeries || !searchQuery.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {searchingSeries ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Searching
              </span>
            ) : 'Search'}
          </button>
        </div>

        {/* Series results */}
        {seriesResults.length > 0 && !selectedSeries && (
          <div className="card overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-xs text-ndp-text-dim">Select a series to browse releases</p>
            </div>
            {seriesResults.map((s) => (
              <button
                key={s.id}
                onClick={() => handlePickSeries(s)}
                className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-sm text-ndp-text font-medium">{s.title}</span>
                {s.year ? <span className="text-sm text-ndp-text-dim ml-2">({s.year})</span> : null}
              </button>
            ))}
          </div>
        )}

        {/* Selected series — scope + episode/season picker */}
        {selectedSeries && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ndp-text">
                Releases for <span className="font-semibold">{selectedSeries.title}{selectedSeries.year ? ` (${selectedSeries.year})` : ''}</span>
              </p>
              <button
                onClick={() => { setSelectedSeries(null); setReleases([]); setSeasons([]); setEpisodes([]); }}
                className="text-xs text-ndp-text-dim hover:text-ndp-text transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Scope toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setScope('episode'); setReleases([]); }}
                className={
                  'text-xs rounded-lg px-3 py-1.5 transition-colors ' +
                  (scope === 'episode' ? 'bg-ndp-accent text-white' : 'bg-white/5 text-ndp-text-dim hover:bg-white/10')
                }
              >
                Episode
              </button>
              <button
                onClick={() => { setScope('season'); setReleases([]); setSelectedEpisodeId(null); }}
                className={
                  'text-xs rounded-lg px-3 py-1.5 transition-colors ' +
                  (scope === 'season' ? 'bg-ndp-accent text-white' : 'bg-white/5 text-ndp-text-dim hover:bg-white/10')
                }
              >
                Season
              </button>
            </div>

            {/* Season picker */}
            {loadingSeasonsEpisodes ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {seasons.map((s) => {
                  const active = selectedSeason === s.seasonNumber;
                  return (
                    <button
                      key={s.seasonNumber}
                      onClick={() => { setSelectedSeason(s.seasonNumber); setSelectedEpisodeId(null); setReleases([]); }}
                      className={
                        'text-xs rounded-lg px-3 py-1.5 transition-colors ' +
                        (active ? 'bg-ndp-accent/25 text-ndp-accent' : 'bg-white/5 text-ndp-text-dim hover:bg-white/10')
                      }
                    >
                      {s.seasonNumber === 0 ? 'Specials' : `Season ${s.seasonNumber}`}
                      <span className="ml-1.5 text-[10px] text-ndp-text-dim">
                        {s.episodeFileCount}/{s.episodeCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Episode picker — only in episode scope */}
            {scope === 'episode' && selectedSeason !== null && (
              <div className="card max-h-72 overflow-y-auto">
                {episodesOfSelectedSeason.map((ep) => {
                  const active = selectedEpisodeId === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => { setSelectedEpisodeId(ep.id); setReleases([]); }}
                      className={
                        'w-full text-left px-4 py-2 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors ' +
                        (active ? 'bg-ndp-accent/10' : 'hover:bg-white/[0.03]')
                      }
                    >
                      <span className="text-xs font-mono text-ndp-text-dim">{epTag(ep.seasonNumber, ep.episodeNumber)}</span>
                      <span className="text-sm text-ndp-text truncate flex-1">{ep.title || '—'}</span>
                      {ep.hasFile && <span className="text-[10px] text-ndp-success">File</span>}
                      {!ep.monitored && <span className="text-[10px] text-ndp-text-dim">Unmonitored</span>}
                    </button>
                  );
                })}
                {episodesOfSelectedSeason.length === 0 && (
                  <p className="text-xs text-ndp-text-dim text-center py-4">No episodes in this season</p>
                )}
              </div>
            )}

            {/* Fetch releases button */}
            <div className="flex justify-end">
              <button
                onClick={fetchReleases}
                disabled={
                  loadingReleases ||
                  (scope === 'episode' && selectedEpisodeId === null) ||
                  (scope === 'season' && selectedSeason === null)
                }
                className="btn-primary text-sm disabled:opacity-50"
              >
                {loadingReleases ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Fetching releases
                  </span>
                ) : 'Fetch releases'}
              </button>
            </div>

            {/* Release list */}
            {releases.length > 0 && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-ndp-text-dim font-medium">Title</th>
                        <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px]">Quality</th>
                        <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]">Size</th>
                        <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[100px]">Indexer</th>
                        <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[60px]">Age</th>
                        <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[70px]">S/L</th>
                        <th className="text-center px-4 py-3 text-ndp-text-dim font-medium w-[80px]">Status</th>
                        <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {releases.map((release) => (
                        <tr key={release.guid} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2">
                            <span className="text-ndp-text text-xs break-all line-clamp-2">{release.title}</span>
                            {release.fullSeason && (
                              <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">
                                Full Season
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-ndp-text-dim">{release.quality?.quality?.name || '-'}</td>
                          <td className="px-4 py-2 text-right text-xs text-ndp-text-dim">{formatSize(release.size)}</td>
                          <td className="px-4 py-2 text-xs text-ndp-text-dim">{release.indexer || '-'}</td>
                          <td className="px-4 py-2 text-right text-xs text-ndp-text-dim">{formatAge(release.age)}</td>
                          <td className="px-4 py-2 text-right text-xs text-ndp-text-dim">
                            {release.protocol === 'torrent'
                              ? (release.seeders !== undefined ? `${release.seeders}/${release.leechers ?? '-'}` : '-')
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {release.approved ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-success/15 text-ndp-success">
                                Approved
                              </span>
                            ) : (
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-error/15 text-ndp-error cursor-help"
                                title={release.rejections?.join(', ') || 'Rejected'}
                              >
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => handleGrab(release)}
                              disabled={grabbing === release.guid}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors disabled:opacity-50"
                            >
                              {grabbing === release.guid ? (
                                <span className="w-2.5 h-2.5 border border-ndp-accent border-t-transparent rounded-full animate-spin inline-block" />
                              ) : 'Grab'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loadingReleases && releases.length === 0 && (scope === 'episode' ? selectedEpisodeId !== null : selectedSeason !== null) && (
              <div className="card p-6 text-center text-ndp-text-dim text-sm">
                Click "Fetch releases" to search.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5" />

      {/* Blocklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ndp-text">Blocklist</h2>
          <span className="text-sm text-ndp-text-dim">{blocklistTotal} item{blocklistTotal !== 1 ? 's' : ''}</span>
        </div>

        {loadingBlocklist ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blocklist.length === 0 ? (
          <div className="card p-6 text-center text-ndp-text-dim text-sm">Blocklist is empty</div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-ndp-text-dim font-medium">Source Title</th>
                      <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[180px]">Series</th>
                      <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[110px]">Date</th>
                      <th className="text-left px-4 py-3 text-ndp-text-dim font-medium w-[100px]">Quality</th>
                      <th className="text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocklist.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2">
                          <span className="text-ndp-text text-xs break-all line-clamp-2">{item.sourceTitle}</span>
                        </td>
                        <td className="px-4 py-2 text-xs text-ndp-text-dim">
                          {item.series ? `${item.series.title}${item.series.year ? ` (${item.series.year})` : ''}` : `ID ${item.seriesId}`}
                        </td>
                        <td className="px-4 py-2 text-xs text-ndp-text-dim">{formatDate(item.date)}</td>
                        <td className="px-4 py-2 text-xs text-ndp-text-dim">{item.quality?.quality?.name || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleRemoveBlocklistItem(item.id)}
                            disabled={removingId === item.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors disabled:opacity-50"
                          >
                            {removingId === item.id ? (
                              <span className="w-2.5 h-2.5 border border-ndp-error border-t-transparent rounded-full animate-spin inline-block" />
                            ) : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {blocklistTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-ndp-text-dim">Page {blocklistPage} of {blocklistTotalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBlocklistPage((p) => Math.max(1, p - 1))}
                    disabled={blocklistPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setBlocklistPage((p) => Math.min(blocklistTotalPages, p + 1))}
                    disabled={blocklistPage >= blocklistTotalPages}
                    className="px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
