import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi } from '../sonarr-api.js';

export function releasesRoutes(app: FastifyInstance) {
  // Manual release search — episode (default) or season.
  app.get('/releases', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { episodeId, seriesId, seasonNumber } = request.query as Record<string, string>;
    if (episodeId) return api.getReleasesForEpisode(parseInt(episodeId));
    if (seriesId && seasonNumber !== undefined) {
      return api.getReleasesForSeason(parseInt(seriesId), parseInt(seasonNumber));
    }
    return [];
  });

  app.post('/releases/grab', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { guid, indexerId } = request.body as { guid: string; indexerId: number };
    await api.grabRelease(guid, indexerId);
    return { ok: true };
  });

  app.get('/blocklist', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { page = '1', pageSize = '20' } = request.query as Record<string, string>;
    return api.getBlocklist(parseInt(page), parseInt(pageSize));
  });

  app.delete('/blocklist/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    await api.deleteBlocklistItem(parseInt(id));
    return { ok: true };
  });
}
