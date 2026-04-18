import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi } from '../sonarr-api.js';

export function downloadsRoutes(app: FastifyInstance) {
  app.get('/queue', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { page = '1', pageSize = '20' } = request.query as Record<string, string>;
    return api.getQueue(parseInt(page), parseInt(pageSize));
  });

  app.delete('/queue/:id', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { id } = request.params as { id: string };
    const { removeFromClient, blocklist } = request.query as Record<string, string>;
    await api.removeQueueItem(parseInt(id), {
      removeFromClient: removeFromClient === 'true',
      blocklist: blocklist === 'true',
    });
    return { ok: true };
  });
}
