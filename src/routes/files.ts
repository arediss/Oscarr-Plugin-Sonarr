import type { FastifyInstance } from 'fastify';
import type { SonarrPluginApi } from '../sonarr-api.js';

export function filesRoutes(app: FastifyInstance) {
  // Episode files for a series.
  app.get('/series/:seriesId/files', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { seriesId } = request.params as { seriesId: string };
    return api.getEpisodeFiles(parseInt(seriesId));
  });

  // Delete a single episode file.
  app.delete('/episodefile/:fileId', async (request) => {
    const api: SonarrPluginApi = (request as any).sonarrApi;
    const { fileId } = request.params as { fileId: string };
    await api.deleteEpisodeFile(parseInt(fileId));
    return { ok: true };
  });
}
