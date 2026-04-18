import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi, SonarrSeries } from '../sonarr-api.js';

// In-memory cache to avoid re-fetching the whole series list on every page request.
let seriesCache: { data: SonarrSeries[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

async function getCachedSeries(api: SonarrPluginApi): Promise<SonarrSeries[]> {
  const now = Date.now();
  if (seriesCache && now - seriesCache.timestamp < CACHE_TTL) {
    return seriesCache.data;
  }
  const data = await api.getAllSeries();
  seriesCache = { data, timestamp: now };
  return data;
}

function mapSeries(s: SonarrSeries) {
  const stats = s.statistics;
  const episodeCount = stats?.episodeCount ?? 0;
  const fileCount = stats?.episodeFileCount ?? 0;
  const complete = episodeCount > 0 && fileCount >= episodeCount;
  return {
    id: s.id,
    title: s.title,
    year: s.year,
    tvdbId: s.tvdbId,
    monitored: s.monitored,
    status: s.status,
    seriesType: s.seriesType,
    network: s.network || null,
    qualityProfileId: s.qualityProfileId,
    rootFolderPath: s.rootFolderPath,
    added: s.added,
    sizeOnDisk: stats?.sizeOnDisk ?? 0,
    episodeFileCount: fileCount,
    episodeCount,
    totalEpisodeCount: stats?.totalEpisodeCount ?? 0,
    percentOfEpisodes: stats?.percentOfEpisodes ?? 0,
    hasFile: fileCount > 0,
    complete,
    poster: s.images?.find((i) => i.coverType === 'poster')?.remoteUrl || null,
  };
}

export function libraryRoutes(app: FastifyInstance) {
  // Paginated, filtered series list (cache-backed).
  app.get('/series', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const {
      search, status, qualityProfileId, rootFolderPath, seriesType,
      page = '1', pageSize = '50',
    } = request.query as Record<string, string>;

    let series = await getCachedSeries(api);

    if (search) {
      const q = search.toLowerCase();
      series = series.filter((s) => s.title.toLowerCase().includes(q));
    }

    // status filter — applied on derived state (not raw Sonarr status)
    if (status === 'complete') {
      series = series.filter((s) => {
        const ec = s.statistics?.episodeCount ?? 0;
        const fc = s.statistics?.episodeFileCount ?? 0;
        return ec > 0 && fc >= ec;
      });
    } else if (status === 'missing') {
      series = series.filter((s) => {
        const ec = s.statistics?.episodeCount ?? 0;
        const fc = s.statistics?.episodeFileCount ?? 0;
        return s.monitored && ec > fc;
      });
    } else if (status === 'unmonitored') {
      series = series.filter((s) => !s.monitored);
    } else if (status === 'continuing') {
      series = series.filter((s) => s.status === 'continuing');
    } else if (status === 'ended') {
      series = series.filter((s) => s.status === 'ended');
    }

    if (qualityProfileId) series = series.filter((s) => s.qualityProfileId === parseInt(qualityProfileId));
    if (rootFolderPath) series = series.filter((s) => s.rootFolderPath === rootFolderPath);
    if (seriesType) series = series.filter((s) => s.seriesType === seriesType);

    const total = series.length;
    const p = Math.max(1, parseInt(page));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
    const start = (p - 1) * ps;
    const slice = series.slice(start, start + ps);

    return {
      total,
      page: p,
      pageSize: ps,
      hasMore: start + ps < total,
      series: slice.map(mapSeries),
    };
  });

  app.post('/series/invalidate-cache', async () => {
    seriesCache = null;
    return { ok: true };
  });

  // Single series detail (raw Sonarr series + derived stats).
  app.get('/series/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const series = await api.getSeries(parseInt(id));
    return { series };
  });

  app.put('/series/:id/monitored', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const { monitored } = request.body as { monitored: boolean };
    await api.editSeries(parseInt(id), { monitored });
    seriesCache = null;
    return { ok: true };
  });

  app.put('/series/:id/tags', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const { tags } = request.body as { tags: number[] };
    await api.editSeries(parseInt(id), { tags });
    seriesCache = null;
    return { ok: true };
  });

  app.post('/series/:id/search', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const result = await api.searchSeries(parseInt(id));
    return { ok: true, commandId: result.id };
  });

  app.post('/series/:id/refresh', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    await api.refreshSeries(parseInt(id));
    return { ok: true };
  });

  app.post('/series/:id/rename', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    await api.renameSeries(parseInt(id));
    return { ok: true };
  });

  app.delete('/series/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const { deleteFiles } = request.query as Record<string, string>;
    await api.deleteSeries(parseInt(id), deleteFiles === 'true');
    seriesCache = null;
    return { ok: true };
  });

  app.get('/series/:id/history', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const items = await api.getSeriesHistory(parseInt(id));
    return { items };
  });

  app.get('/series/:id/queue', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const items = await api.getQueueForSeries(parseInt(id));
    return { items };
  });

  app.get('/series/:id/blocklist', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const items = await api.getBlocklistForSeries(parseInt(id));
    return { items };
  });

  app.get('/tags', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    return api.getTags();
  });

  app.get('/profiles', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    return api.getQualityProfiles();
  });

  app.get('/rootfolders', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    return api.getRootFolders();
  });

  app.get('/command/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    return api.getCommandStatus(parseInt(id));
  });
}
