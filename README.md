# Oscarr Plugin — Sonarr Manager

Advanced Sonarr management for [Oscarr](https://github.com/arediss/Oscarr). Browse your Sonarr library, drill into seasons and episodes, run manual searches, view history + queue + blocklist per series — from the Oscarr admin panel.

## Features

- **Library browser** — series list with search, status, network, quality profile filters.
- **Series modal** with season / episode drill-down: availability per episode, manual search, refresh, monitor/unmonitor toggles at series + season level.
- **Releases** with rejection reasons always visible.
- **History + Queue + Blocklist** per series.
- **Analytics** — disk space, episode completion stats, quality distribution.

## Requirements

- **Oscarr core** ≥ 0.6.0 with plugin API `v1`.
- A configured Sonarr service in Oscarr (Settings → Services).
- **Node 20+**.

## Install

From Oscarr admin:
1. **Admin → Plugins → Discover** → find "Sonarr Manager" → **Install**
2. Review the capabilities consent prompt (requests `services:sonarr`)
3. Toggle the plugin on in **Installed**

Or manually:
```bash
cd packages/plugins
git clone https://github.com/arediss/Oscarr-Plugin-Sonarr.git sonarr
```
Then restart Oscarr.

## Manifest declarations

```jsonc
{
  "services": ["sonarr"],
  "capabilities": [],
  "engines": { "oscarr": ">=0.6.0 <1.0.0", "testedAgainst": ["0.6.3"] }
}
```

## Development

```bash
npm install
npm run dev
```

## License

MIT.
