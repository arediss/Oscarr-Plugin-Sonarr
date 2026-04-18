import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi } from '../sonarr-api.js';

export function seasonsRoutes(app: FastifyInstance) {
  // Season summary for a series — derived from the series object itself.
  app.get('/series/:id/seasons', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const series = await api.getSeries(parseInt(id));
    return {
      seriesId: series.id,
      seasons: (series.seasons || [])
        .slice()
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((s) => ({
          seasonNumber: s.seasonNumber,
          monitored: s.monitored,
          episodeCount: s.statistics?.episodeCount ?? 0,
          totalEpisodeCount: s.statistics?.totalEpisodeCount ?? 0,
          episodeFileCount: s.statistics?.episodeFileCount ?? 0,
          sizeOnDisk: s.statistics?.sizeOnDisk ?? 0,
          percentOfEpisodes: s.statistics?.percentOfEpisodes ?? 0,
        })),
    };
  });

  app.put('/series/:id/seasons/:season/monitored', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id, season } = request.params as { id: string; season: string };
    const { monitored } = request.body as { monitored: boolean };
    await api.setSeasonMonitored(parseInt(id), parseInt(season), monitored);
    return { ok: true };
  });

  app.post('/series/:id/seasons/:season/search', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id, season } = request.params as { id: string; season: string };
    const result = await api.searchSeason(parseInt(id), parseInt(season));
    return { ok: true, commandId: result.id };
  });

  // Episodes for a series (optional seasonNumber filter).
  app.get('/series/:id/episodes', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const { seasonNumber } = request.query as Record<string, string>;
    const episodes = await api.getEpisodes(
      parseInt(id),
      seasonNumber !== undefined ? parseInt(seasonNumber) : undefined,
    );
    return { episodes };
  });

  app.get('/episodes/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const episode = await api.getEpisode(parseInt(id));
    return { episode };
  });

  app.put('/episodes/monitor', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { episodeIds, monitored } = request.body as { episodeIds: number[]; monitored: boolean };
    await api.monitorEpisodes(episodeIds, monitored);
    return { ok: true };
  });

  app.post('/episodes/search', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { episodeIds } = request.body as { episodeIds: number[] };
    const result = await api.searchEpisode(episodeIds);
    return { ok: true, commandId: result.id };
  });
}
