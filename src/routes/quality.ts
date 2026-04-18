import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi } from '../sonarr-api.js';

export function qualityRoutes(app: FastifyInstance) {
  // Cutoff-unmet at the episode granularity (Sonarr's native view).
  app.get('/quality/cutoff-unmet', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { page = '1', pageSize = '20' } = request.query as Record<string, string>;
    return api.getCutoffUnmet(parseInt(page), parseInt(pageSize));
  });

  // Search upgrade for a single episode.
  app.post('/quality/search/:episodeId', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { episodeId } = request.params as { episodeId: string };
    await api.searchEpisode([parseInt(episodeId)]);
    return { ok: true };
  });

  // Batch search for multiple episodes.
  app.post('/quality/search-bulk', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { episodeIds } = request.body as { episodeIds: number[] };
    if (!episodeIds || episodeIds.length === 0) return { results: [] };
    try {
      const cmd = await api.searchEpisode(episodeIds);
      return { results: episodeIds.map((id) => ({ episodeId: id, ok: true })), commandId: cmd.id };
    } catch (err) {
      return { results: episodeIds.map((id) => ({ episodeId: id, ok: false, error: String(err) })) };
    }
  });
}
