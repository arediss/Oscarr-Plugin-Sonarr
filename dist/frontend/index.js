// frontend/index.tsx
import { useState as useState9 } from "react";

// frontend/components/LibraryTab.tsx
import { useState as useState3, useEffect as useEffect3, useRef as useRef2, useCallback as useCallback3, useMemo } from "react";

// frontend/components/SeriesModal.tsx
import { useState as useState2, useEffect as useEffect2, useRef, useCallback as useCallback2 } from "react";

// frontend/components/SeasonEpisodesView.tsx
import { useEffect, useState, useCallback } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function formatAirDate(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
}
function epTag(s, e) {
  return `S${String(s).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
}
function SeasonEpisodesView({ seriesId, seasonNumber, onBack, showMessage }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [busy, setBusy] = useState("none");
  const loadEpisodes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/plugins/sonarr/series/${seriesId}/episodes?seasonNumber=${seasonNumber}`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error();
      const data = await r.json();
      const raw = Array.isArray(data?.episodes) ? data.episodes : [];
      const list = [...raw].sort((a, b) => a.episodeNumber - b.episodeNumber);
      setEpisodes(list);
    } catch {
      showMessage("Failed to load episodes", "error");
    }
    setLoading(false);
  }, [seriesId, seasonNumber, showMessage]);
  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);
  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === episodes.length) return /* @__PURE__ */ new Set();
      return new Set(episodes.map((e) => e.id));
    });
  };
  const searchSelected = async () => {
    if (selected.size === 0) return;
    setBusy("search");
    try {
      const r = await fetch("/api/plugins/sonarr/episodes/search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeIds: [...selected] })
      });
      if (!r.ok) throw new Error();
      showMessage(`Search sent for ${selected.size} episode${selected.size !== 1 ? "s" : ""}`, "success");
    } catch {
      showMessage("Search command failed", "error");
    }
    setBusy("none");
  };
  const setMonitored = async (monitored) => {
    if (selected.size === 0) return;
    setBusy(monitored ? "monitor" : "unmonitor");
    try {
      const r = await fetch("/api/plugins/sonarr/episodes/monitor", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeIds: [...selected], monitored })
      });
      if (!r.ok) throw new Error();
      setEpisodes(
        (prev) => prev.map((e) => selected.has(e.id) ? { ...e, monitored } : e)
      );
      showMessage(`${selected.size} episode${selected.size !== 1 ? "s" : ""} ${monitored ? "monitored" : "unmonitored"}`, "success");
    } catch {
      showMessage("Failed to toggle monitoring", "error");
    }
    setBusy("none");
  };
  const searchSingle = async (episodeId) => {
    try {
      const r = await fetch("/api/plugins/sonarr/episodes/search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeIds: [episodeId] })
      });
      if (!r.ok) throw new Error();
      showMessage("Search sent", "success");
    } catch {
      showMessage("Search failed", "error");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  const allSelected = selected.size === episodes.length && episodes.length > 0;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onBack,
          className: "text-xs text-ndp-text-dim hover:text-ndp-text transition-colors inline-flex items-center gap-1",
          children: [
            /* @__PURE__ */ jsx("span", { children: "\u2190" }),
            " Back to seasons"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-ndp-text-dim", children: [
        seasonNumber === 0 ? "Specials" : `Season ${seasonNumber}`,
        " \xB7 ",
        episodes.length,
        " episode",
        episodes.length !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-xs text-ndp-text-dim cursor-pointer", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: allSelected, onChange: toggleAll, className: "accent-ndp-accent" }),
        "Select all"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-ndp-text-dim", children: [
        selected.size,
        " selected"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex gap-1.5", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: searchSelected,
            disabled: selected.size === 0 || busy !== "none",
            className: "text-xs font-medium rounded-lg bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors disabled:opacity-40 px-3 py-1.5",
            children: busy === "search" ? "Searching\u2026" : "Search"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setMonitored(true),
            disabled: selected.size === 0 || busy !== "none",
            className: "text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-ndp-text transition-colors disabled:opacity-40 px-3 py-1.5",
            children: "Monitor"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setMonitored(false),
            disabled: selected.size === 0 || busy !== "none",
            className: "text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-ndp-text-dim transition-colors disabled:opacity-40 px-3 py-1.5",
            children: "Unmonitor"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5", children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 w-[36px]" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 text-ndp-text-dim font-medium w-[80px]", children: "Episode" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 text-ndp-text-dim font-medium", children: "Title" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 text-ndp-text-dim font-medium w-[110px]", children: "Air date" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 text-ndp-text-dim font-medium w-[80px]", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 text-ndp-text-dim font-medium w-[110px]", children: "Quality" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 text-ndp-text-dim font-medium w-[80px]", children: "Size" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 text-ndp-text-dim font-medium w-[90px]" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        episodes.map((ep) => {
          const quality = ep.episodeFile?.quality?.quality?.name || "-";
          const size = ep.episodeFile?.size || 0;
          const checked = selected.has(ep.id);
          return /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked,
                onChange: () => toggleSelected(ep.id),
                className: "accent-ndp-accent"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs font-mono text-ndp-text-dim", children: epTag(ep.seasonNumber, ep.episodeNumber) }),
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 text-ndp-text", children: [
              ep.title || "\u2014",
              !ep.monitored && /* @__PURE__ */ jsx("span", { className: "ml-2 text-[10px] text-ndp-text-dim", children: "(unmonitored)" })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-ndp-text-dim", children: formatAirDate(ep.airDateUtc) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: ep.hasFile ? /* @__PURE__ */ jsx("span", { className: "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-success/15 text-ndp-success", children: "On disk" }) : ep.monitored ? /* @__PURE__ */ jsx("span", { className: "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-error/15 text-ndp-error", children: "Missing" }) : /* @__PURE__ */ jsx("span", { className: "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-ndp-text-dim", children: "Skipped" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-ndp-text-dim", children: quality }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-ndp-text-dim", children: size > 0 ? formatSize(size) : "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => searchSingle(ep.id),
                className: "text-xs px-2.5 py-1 rounded-lg bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors",
                children: "Search"
              }
            ) })
          ] }, ep.id);
        }),
        episodes.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-4 py-8 text-center text-sm text-ndp-text-dim", children: "No episodes in this season." }) })
      ] })
    ] }) }) })
  ] });
}

// frontend/components/SeriesModal.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function formatSize2(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function formatRelativeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 6e4);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
}
function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return null;
  return `${minutes}m / ep`;
}
function epTag2(ep) {
  if (!ep) return "";
  return `S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;
}
var EVENT_META = {
  grabbed: { label: "Grabbed", color: "text-sky-300", bg: "bg-sky-500/15" },
  downloadFolderImported: { label: "Imported", color: "text-ndp-success", bg: "bg-ndp-success/15" },
  downloadFailed: { label: "Failed", color: "text-ndp-error", bg: "bg-ndp-error/15" },
  episodeFileDeleted: { label: "Deleted", color: "text-ndp-text-dim", bg: "bg-white/5" },
  episodeFileRenamed: { label: "Renamed", color: "text-ndp-text-dim", bg: "bg-white/5" },
  downloadIgnored: { label: "Ignored", color: "text-amber-300", bg: "bg-amber-500/15" },
  seriesFolderImported: { label: "Imported", color: "text-ndp-success", bg: "bg-ndp-success/15" }
};
function eventMeta(eventType) {
  return EVENT_META[eventType] ?? { label: eventType, color: "text-ndp-text-dim", bg: "bg-white/5" };
}
function SeriesModal({ seriesId, onClose }) {
  const [series, setSeries] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const [activeTab, setActiveTab] = useState2("overview");
  const [panelVisible, setPanelVisible] = useState2(false);
  useEffect2(() => {
    const t = setTimeout(() => setPanelVisible(true), 10);
    return () => clearTimeout(t);
  }, []);
  const [searchPhase, setSearchPhase] = useState2("idle");
  const [refreshState, setRefreshState] = useState2("idle");
  const [monitorState, setMonitorState] = useState2("idle");
  const [deleteConfirm, setDeleteConfirm] = useState2("none");
  const [deleteState, setDeleteState] = useState2("idle");
  const [message, setMessage] = useState2(null);
  const [seasons, setSeasons] = useState2([]);
  const [drilledSeason, setDrilledSeason] = useState2(null);
  const [seasonActionBusy, setSeasonActionBusy] = useState2(null);
  const [files, setFiles] = useState2(null);
  const [filesLoading, setFilesLoading] = useState2(false);
  const [deletingFileId, setDeletingFileId] = useState2(null);
  const [history, setHistory] = useState2(null);
  const [historyLoading, setHistoryLoading] = useState2(false);
  const [retrying, setRetrying] = useState2(null);
  const [queue, setQueue] = useState2(null);
  const [queueLoading, setQueueLoading] = useState2(false);
  const [removingQueue, setRemovingQueue] = useState2(null);
  const [blocklist, setBlocklist] = useState2(null);
  const [blocklistLoading, setBlocklistLoading] = useState2(false);
  const [unblocking, setUnblocking] = useState2(null);
  const pollRef = useRef(null);
  useEffect2(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);
  useEffect2(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/plugins/sonarr/series/${seriesId}`, { credentials: "include" }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        return r.json();
      }),
      fetch(`/api/plugins/sonarr/series/${seriesId}/seasons`, { credentials: "include" }).then((r) => r.ok ? r.json() : { seasons: [] })
    ]).then(([detail, seasonsData]) => {
      if (cancelled) return;
      setSeries(detail?.series || null);
      setSeasons(Array.isArray(seasonsData?.seasons) ? seasonsData.seasons : []);
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Failed to load series");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);
  useEffect2(() => {
    let cancelled = false;
    setQueueLoading(true);
    fetch(`/api/plugins/sonarr/series/${seriesId}/queue`, { credentials: "include" }).then((r) => r.ok ? r.json() : { items: [] }).then((data) => {
      if (!cancelled) setQueue(Array.isArray(data?.items) ? data.items : []);
    }).catch(() => {
      if (!cancelled) setQueue([]);
    }).finally(() => {
      if (!cancelled) setQueueLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);
  useEffect2(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  useEffect2(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3e3);
  };
  const loadFiles = useCallback2(async () => {
    if (files !== null) return;
    setFilesLoading(true);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/files`, { credentials: "include" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
      showMessage("Failed to load files", "error");
    }
    setFilesLoading(false);
  }, [files, seriesId]);
  const loadHistory = useCallback2(async () => {
    if (history !== null) return;
    setHistoryLoading(true);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/history`, { credentials: "include" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setHistory(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setHistory([]);
      showMessage("Failed to load history", "error");
    }
    setHistoryLoading(false);
  }, [history, seriesId]);
  const loadBlocklist = useCallback2(async () => {
    if (blocklist !== null) return;
    setBlocklistLoading(true);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/blocklist`, { credentials: "include" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setBlocklist(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setBlocklist([]);
      showMessage("Failed to load blocklist", "error");
    }
    setBlocklistLoading(false);
  }, [blocklist, seriesId]);
  useEffect2(() => {
    if (activeTab === "files") loadFiles();
    if (activeTab === "history") loadHistory();
    if (activeTab === "blocklist") loadBlocklist();
  }, [activeTab, loadFiles, loadHistory, loadBlocklist]);
  const handleSearch = async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setSearchPhase("searching");
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/search`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const commandId = data.commandId;
      if (!commandId) {
        setSearchPhase("done");
        showMessage("Series search sent", "success");
        return;
      }
      setSearchPhase("polling");
      pollRef.current = setInterval(async () => {
        try {
          const statusR = await fetch(`/api/plugins/sonarr/command/${commandId}`, { credentials: "include" });
          if (!statusR.ok) throw new Error();
          const statusData = await statusR.json();
          if (statusData.status === "completed") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setSearchPhase("done");
            showMessage("Series search complete", "success");
          } else if (statusData.status === "failed") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setSearchPhase("error");
            showMessage("Search command failed", "error");
          }
        } catch {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setSearchPhase("error");
          showMessage("Failed to poll search status", "error");
        }
      }, 2e3);
    } catch {
      setSearchPhase("error");
      showMessage("Search failed", "error");
    }
  };
  const handleRefresh = async () => {
    setRefreshState("loading");
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/refresh`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      setRefreshState("success");
      showMessage("Refresh command sent", "success");
    } catch {
      setRefreshState("error");
      showMessage("Refresh failed", "error");
    }
    setTimeout(() => setRefreshState("idle"), 2e3);
  };
  const handleToggleMonitored = async () => {
    if (!series) return;
    setMonitorState("loading");
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/monitored`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitored: !series.monitored })
      });
      if (!r.ok) throw new Error();
      setSeries({ ...series, monitored: !series.monitored });
      setMonitorState("success");
      showMessage(`Series ${series.monitored ? "unmonitored" : "monitored"}`, "success");
    } catch {
      setMonitorState("error");
      showMessage("Toggle monitored failed", "error");
    }
    setTimeout(() => setMonitorState("idle"), 2e3);
  };
  const handleDeleteSeries = async (deleteFiles) => {
    setDeleteState("loading");
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}?deleteFiles=${deleteFiles}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!r.ok) throw new Error();
      setDeleteState("success");
      showMessage(deleteFiles ? "Series and files deleted" : "Series removed from Sonarr", "success");
      setTimeout(() => onClose(), 800);
    } catch {
      setDeleteState("error");
      showMessage("Delete failed", "error");
    }
    setTimeout(() => setDeleteState("idle"), 2e3);
  };
  const handleSeasonSearch = async (seasonNumber) => {
    setSeasonActionBusy(seasonNumber);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/seasons/${seasonNumber}/search`, {
        method: "POST",
        credentials: "include"
      });
      if (!r.ok) throw new Error();
      showMessage(`Season ${seasonNumber} search sent`, "success");
    } catch {
      showMessage("Season search failed", "error");
    }
    setSeasonActionBusy(null);
  };
  const handleSeasonMonitor = async (seasonNumber, monitored) => {
    setSeasonActionBusy(seasonNumber);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/seasons/${seasonNumber}/monitored`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitored })
      });
      if (!r.ok) throw new Error();
      setSeasons((prev) => prev.map((s) => s.seasonNumber === seasonNumber ? { ...s, monitored } : s));
      showMessage(`Season ${seasonNumber} ${monitored ? "monitored" : "unmonitored"}`, "success");
    } catch {
      showMessage("Season monitor toggle failed", "error");
    }
    setSeasonActionBusy(null);
  };
  const handleDeleteFile = async (fileId) => {
    setDeletingFileId(fileId);
    try {
      const r = await fetch(`/api/plugins/sonarr/episodefile/${fileId}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error();
      setFiles((prev) => (prev ?? []).filter((f) => f.id !== fileId));
      showMessage("Episode file deleted", "success");
    } catch {
      showMessage("Delete failed", "error");
    }
    setDeletingFileId(null);
  };
  const handleRetryFailed = async (historyId) => {
    setRetrying(historyId);
    try {
      const r = await fetch(`/api/plugins/sonarr/history/failed/${historyId}`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      showMessage("Retry triggered \u2014 a new search will run", "success");
    } catch {
      showMessage("Retry failed", "error");
    }
    setRetrying(null);
  };
  const handleRemoveQueue = async (itemId, blocklistFlag) => {
    setRemovingQueue(itemId);
    try {
      const params = new URLSearchParams({ removeFromClient: "true", blocklist: String(blocklistFlag) });
      const r = await fetch(`/api/plugins/sonarr/queue/${itemId}?${params}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error();
      setQueue((prev) => (prev ?? []).filter((q) => q.id !== itemId));
      showMessage(blocklistFlag ? "Removed & blocklisted" : "Removed from queue", "success");
    } catch {
      showMessage("Failed to remove queue item", "error");
    }
    setRemovingQueue(null);
  };
  const handleUnblock = async (blocklistId) => {
    setUnblocking(blocklistId);
    try {
      const r = await fetch(`/api/plugins/sonarr/blocklist/${blocklistId}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error();
      setBlocklist((prev) => (prev ?? []).filter((b) => b.id !== blocklistId));
      showMessage("Removed from blocklist", "success");
    } catch {
      showMessage("Failed to remove from blocklist", "error");
    }
    setUnblocking(null);
  };
  const isSearchBusy = searchPhase === "searching" || searchPhase === "polling";
  const poster = series?.images?.find((i) => i.coverType === "poster");
  const posterUrl = poster?.remoteUrl || poster?.url || null;
  const queueCount = queue?.length ?? 0;
  const blocklistCount = blocklist?.length ?? 0;
  const filesCount = files?.length ?? 0;
  const TABS2 = [
    { id: "overview", label: "Overview" },
    { id: "seasons", label: "Seasons", badge: seasons.length || void 0, badgeTone: "dim" },
    { id: "files", label: "Files", badge: filesCount || void 0, badgeTone: "dim" },
    { id: "history", label: "History" },
    { id: "queue", label: "Queue", badge: queueCount || void 0, badgeTone: "accent" },
    { id: "blocklist", label: "Blocklist", badge: blocklistCount || void 0, badgeTone: "dim" }
  ];
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ jsxs2(
        "div",
        {
          className: "w-full max-w-5xl bg-ndp-surface border-l border-white/5 flex flex-col shadow-2xl shadow-black/60 transition-transform duration-300 ease-out " + (panelVisible ? "translate-x-0" : "translate-x-full"),
          style: { position: "fixed", top: 0, right: 0, height: "100dvh" },
          children: [
            /* @__PURE__ */ jsx2(
              "button",
              {
                onClick: onClose,
                className: "flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-ndp-text-dim hover:text-ndp-text transition-colors",
                style: { position: "absolute", top: 16, right: 16, width: 32, height: 32, zIndex: 10 },
                "aria-label": "Close",
                children: /* @__PURE__ */ jsxs2("svg", { style: { width: 16, height: 16 }, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx2("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsx2("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            ),
            loading && /* @__PURE__ */ jsx2("div", { className: "flex justify-center py-16", children: /* @__PURE__ */ jsx2("div", { className: "w-8 h-8 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) }),
            error && /* @__PURE__ */ jsx2("div", { className: "p-6 text-center", children: /* @__PURE__ */ jsx2("p", { className: "text-ndp-error", children: error }) }),
            series && !loading && /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsxs2("div", { className: "flex gap-5 p-6 pr-14 border-b border-white/5 flex-shrink-0", children: [
                posterUrl ? /* @__PURE__ */ jsx2("img", { src: posterUrl, alt: series.title, className: "object-cover rounded-xl flex-shrink-0", style: { width: 128, height: 192 } }) : /* @__PURE__ */ jsx2("div", { className: "bg-white/5 rounded-xl flex items-center justify-center text-ndp-text-dim flex-shrink-0 text-xs", style: { width: 128, height: 192 }, children: "No Poster" }),
                /* @__PURE__ */ jsxs2("div", { className: "min-w-0 flex-1 flex flex-col", children: [
                  /* @__PURE__ */ jsxs2("h2", { className: "text-xl sm:text-2xl font-bold text-ndp-text leading-tight", children: [
                    series.title,
                    series.year ? /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim font-normal ml-2", children: [
                      "(",
                      series.year,
                      ")"
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ jsxs2("div", { className: "flex items-center flex-wrap gap-2 mt-2 text-xs", children: [
                    /* @__PURE__ */ jsx2(
                      "span",
                      {
                        className: "inline-block px-2.5 py-0.5 rounded-full font-medium " + (!series.monitored ? "bg-white/10 text-ndp-text-dim" : series.statistics && series.statistics.episodeCount > 0 && series.statistics.episodeFileCount >= series.statistics.episodeCount ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"),
                        children: !series.monitored ? "Unmonitored" : series.statistics && series.statistics.episodeCount > 0 && series.statistics.episodeFileCount >= series.statistics.episodeCount ? "Complete" : "Missing episodes"
                      }
                    ),
                    /* @__PURE__ */ jsx2("span", { className: "inline-block px-2.5 py-0.5 rounded-full font-medium bg-white/5 text-ndp-text-dim capitalize", children: series.status }),
                    /* @__PURE__ */ jsx2("span", { className: "inline-block px-2.5 py-0.5 rounded-full font-medium bg-white/5 text-ndp-text-dim capitalize", children: series.seriesType }),
                    queueCount > 0 && /* @__PURE__ */ jsx2("span", { className: "inline-block px-2.5 py-0.5 rounded-full font-medium bg-sky-500/20 text-sky-300", children: "Downloading" }),
                    series.statistics && /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim", children: [
                      series.statistics.episodeFileCount,
                      "/",
                      series.statistics.episodeCount,
                      " eps"
                    ] }),
                    series.statistics && series.statistics.sizeOnDisk > 0 && /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim", children: [
                      "\xB7 ",
                      formatSize2(series.statistics.sizeOnDisk)
                    ] }),
                    formatRuntime(series.runtime) && /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim", children: [
                      "\xB7 ",
                      formatRuntime(series.runtime)
                    ] }),
                    series.network && /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim", children: [
                      "\xB7 ",
                      series.network
                    ] }),
                    series.genres && series.genres.length > 0 && /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim truncate", children: [
                      "\xB7 ",
                      series.genres.slice(0, 3).join(", ")
                    ] })
                  ] }),
                  series.overview && /* @__PURE__ */ jsx2("p", { className: "text-sm text-ndp-text-dim leading-relaxed mt-3 line-clamp-3", children: series.overview }),
                  /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 mt-3 text-xs", children: [
                    series.tvdbId && /* @__PURE__ */ jsx2("a", { href: `https://www.thetvdb.com/?tab=series&id=${series.tvdbId}`, target: "_blank", rel: "noopener noreferrer", className: "text-ndp-accent hover:underline", children: "TVDB" }),
                    series.imdbId && /* @__PURE__ */ jsx2("a", { href: `https://www.imdb.com/title/${series.imdbId}`, target: "_blank", rel: "noopener noreferrer", className: "text-ndp-accent hover:underline", children: "IMDb" }),
                    series.tmdbId && /* @__PURE__ */ jsx2("a", { href: `https://www.themoviedb.org/tv/${series.tmdbId}`, target: "_blank", rel: "noopener noreferrer", className: "text-ndp-accent hover:underline", children: "TMDB" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-3 border-b border-white/5 flex-shrink-0 pl-4 pr-3", children: [
                /* @__PURE__ */ jsx2("div", { className: "flex gap-1 overflow-x-auto flex-1 min-w-0 pt-3", style: { scrollbarWidth: "none" }, children: TABS2.map(({ id, label, badge, badgeTone }) => {
                  const active = activeTab === id;
                  return /* @__PURE__ */ jsxs2(
                    "button",
                    {
                      onClick: () => {
                        setActiveTab(id);
                        if (id !== "seasons") setDrilledSeason(null);
                      },
                      className: "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 " + (active ? "border-ndp-accent text-ndp-accent" : "border-transparent text-ndp-text-dim hover:text-ndp-text"),
                      children: [
                        label,
                        badge !== void 0 && /* @__PURE__ */ jsx2(
                          "span",
                          {
                            className: "text-[10px] px-1.5 py-0.5 rounded-full font-semibold " + (badgeTone === "accent" ? "bg-sky-500/25 text-sky-300" : "bg-white/10 text-ndp-text-dim"),
                            children: badge
                          }
                        )
                      ]
                    },
                    id
                  );
                }) }),
                /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 flex-shrink-0 py-2", children: [
                  /* @__PURE__ */ jsx2(
                    "button",
                    {
                      onClick: handleSearch,
                      disabled: isSearchBusy,
                      className: "text-xs font-medium rounded-lg bg-ndp-accent text-white hover:bg-ndp-accent/90 transition-colors disabled:opacity-50 px-3 py-1.5 whitespace-nowrap",
                      children: isSearchBusy ? /* @__PURE__ */ jsxs2("span", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx2("span", { className: "w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" }),
                        "Searching"
                      ] }) : "Search"
                    }
                  ),
                  /* @__PURE__ */ jsx2(
                    "button",
                    {
                      onClick: handleRefresh,
                      disabled: refreshState === "loading",
                      className: "text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-ndp-text transition-colors disabled:opacity-50 px-3 py-1.5 whitespace-nowrap",
                      children: refreshState === "loading" ? "Refreshing\u2026" : "Refresh"
                    }
                  ),
                  /* @__PURE__ */ jsx2(
                    "button",
                    {
                      onClick: handleToggleMonitored,
                      disabled: monitorState === "loading",
                      className: "text-xs font-medium rounded-lg transition-colors disabled:opacity-50 px-3 py-1.5 whitespace-nowrap " + (series.monitored ? "bg-white/10 hover:bg-white/15 text-ndp-text" : "bg-ndp-accent/20 hover:bg-ndp-accent/30 text-ndp-accent"),
                      children: monitorState === "loading" ? "\u2026" : series.monitored ? "Unmonitor" : "Monitor"
                    }
                  ),
                  deleteConfirm === "none" ? /* @__PURE__ */ jsx2(
                    "button",
                    {
                      onClick: () => setDeleteConfirm("confirm"),
                      className: "text-xs font-medium rounded-lg bg-ndp-error/10 hover:bg-ndp-error/20 text-ndp-error transition-colors px-3 py-1.5 whitespace-nowrap",
                      children: "Delete"
                    }
                  ) : /* @__PURE__ */ jsxs2(Fragment, { children: [
                    /* @__PURE__ */ jsx2(
                      "button",
                      {
                        onClick: () => handleDeleteSeries(false),
                        disabled: deleteState === "loading",
                        className: "text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-ndp-text transition-colors disabled:opacity-50 px-3 py-1.5 whitespace-nowrap",
                        children: "Remove only"
                      }
                    ),
                    /* @__PURE__ */ jsx2(
                      "button",
                      {
                        onClick: () => handleDeleteSeries(true),
                        disabled: deleteState === "loading",
                        className: "text-xs font-medium rounded-lg bg-ndp-error text-white hover:bg-ndp-error/80 transition-colors disabled:opacity-50 px-3 py-1.5 whitespace-nowrap",
                        children: deleteState === "loading" ? "\u2026" : "Remove + files"
                      }
                    ),
                    /* @__PURE__ */ jsx2(
                      "button",
                      {
                        onClick: () => setDeleteConfirm("none"),
                        className: "text-xs font-medium rounded-lg bg-white/10 text-ndp-text-dim hover:bg-white/15 transition-colors px-3 py-1.5 whitespace-nowrap",
                        children: "Cancel"
                      }
                    )
                  ] })
                ] })
              ] }),
              message && /* @__PURE__ */ jsx2(
                "div",
                {
                  className: "mx-6 mt-3 rounded-lg text-sm font-medium px-4 py-2 flex-shrink-0 " + (message.type === "success" ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"),
                  children: message.text
                }
              ),
              /* @__PURE__ */ jsxs2("div", { className: "flex-1 overflow-y-auto p-6", children: [
                activeTab === "overview" && /* @__PURE__ */ jsx2(OverviewTab, { series }),
                activeTab === "seasons" && (drilledSeason !== null ? /* @__PURE__ */ jsx2(
                  SeasonEpisodesView,
                  {
                    seriesId,
                    seasonNumber: drilledSeason,
                    onBack: () => setDrilledSeason(null),
                    showMessage
                  }
                ) : /* @__PURE__ */ jsx2(
                  SeasonsTab,
                  {
                    seasons,
                    onDrill: (sn) => setDrilledSeason(sn),
                    onSearch: handleSeasonSearch,
                    onToggleMonitor: handleSeasonMonitor,
                    busySeason: seasonActionBusy
                  }
                )),
                activeTab === "files" && /* @__PURE__ */ jsx2(
                  FilesContent,
                  {
                    files,
                    loading: filesLoading,
                    deletingFileId,
                    onDelete: handleDeleteFile
                  }
                ),
                activeTab === "history" && /* @__PURE__ */ jsx2(
                  HistoryContent,
                  {
                    items: history,
                    loading: historyLoading,
                    retrying,
                    onRetry: handleRetryFailed
                  }
                ),
                activeTab === "queue" && /* @__PURE__ */ jsx2(
                  QueueContent,
                  {
                    items: queue,
                    loading: queueLoading,
                    removing: removingQueue,
                    onRemove: handleRemoveQueue
                  }
                ),
                activeTab === "blocklist" && /* @__PURE__ */ jsx2(
                  BlocklistContent,
                  {
                    items: blocklist,
                    loading: blocklistLoading,
                    unblocking,
                    onUnblock: handleUnblock
                  }
                )
              ] })
            ] })
          ]
        }
      )
    }
  );
}
function OverviewTab({ series }) {
  const stats = series.statistics;
  return /* @__PURE__ */ jsx2("div", { className: "space-y-4", children: /* @__PURE__ */ jsx2(Section, { title: "Library", children: /* @__PURE__ */ jsxs2(Grid, { children: [
    /* @__PURE__ */ jsx2(Field, { label: "Path", children: /* @__PURE__ */ jsx2("span", { className: "break-all", children: series.path }) }),
    /* @__PURE__ */ jsx2(Field, { label: "Type", span: true, children: /* @__PURE__ */ jsx2("span", { className: "capitalize", children: series.seriesType }) }),
    stats && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Field, { label: "Seasons", children: stats.seasonCount }),
      /* @__PURE__ */ jsxs2(Field, { label: "Episodes", children: [
        stats.episodeFileCount,
        " / ",
        stats.episodeCount,
        " (of ",
        stats.totalEpisodeCount,
        " total)"
      ] }),
      /* @__PURE__ */ jsxs2(Field, { label: "Complete", children: [
        Math.round(stats.percentOfEpisodes),
        "%"
      ] }),
      /* @__PURE__ */ jsx2(Field, { label: "Size on disk", children: formatSize2(stats.sizeOnDisk) })
    ] })
  ] }) }) });
}
function SeasonsTab({
  seasons,
  onDrill,
  onSearch,
  onToggleMonitor,
  busySeason
}) {
  if (seasons.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: "text-center py-12 text-sm text-ndp-text-dim", children: "No seasons available" });
  }
  return /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: seasons.map((s) => {
    const complete = s.episodeCount > 0 && s.episodeFileCount >= s.episodeCount;
    const pct = Math.round(s.percentOfEpisodes);
    const busy = busySeason === s.seasonNumber;
    return /* @__PURE__ */ jsx2("div", { className: "card p-4 space-y-3", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs2("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsx2("h3", { className: "text-base font-semibold text-ndp-text", children: s.seasonNumber === 0 ? "Specials" : `Season ${s.seasonNumber}` }),
          /* @__PURE__ */ jsx2(
            "span",
            {
              className: "inline-block px-2 py-0.5 rounded-full text-xs font-medium " + (!s.monitored ? "bg-white/10 text-ndp-text-dim" : complete ? "bg-ndp-success/15 text-ndp-success" : s.episodeFileCount > 0 ? "bg-amber-500/15 text-amber-300" : "bg-ndp-error/15 text-ndp-error"),
              children: !s.monitored ? "Unmonitored" : complete ? "Complete" : s.episodeFileCount > 0 ? "Partial" : "Missing"
            }
          ),
          /* @__PURE__ */ jsxs2("span", { className: "text-xs text-ndp-text-dim", children: [
            s.episodeFileCount,
            "/",
            s.episodeCount,
            " eps \xB7 ",
            pct,
            "%"
          ] }),
          s.sizeOnDisk > 0 && /* @__PURE__ */ jsxs2("span", { className: "text-xs text-ndp-text-dim", children: [
            "\xB7 ",
            formatSize2(s.sizeOnDisk)
          ] })
        ] }),
        /* @__PURE__ */ jsx2("div", { className: "w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2", children: /* @__PURE__ */ jsx2(
          "div",
          {
            className: "h-full transition-all duration-300 " + (complete ? "bg-ndp-success" : "bg-ndp-accent"),
            style: { width: `${Math.min(100, pct)}%` }
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onDrill(s.seasonNumber),
            className: "text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-ndp-text transition-colors px-3 py-1.5",
            children: "Episodes"
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onSearch(s.seasonNumber),
            disabled: busy,
            className: "text-xs font-medium rounded-lg bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors disabled:opacity-50 px-3 py-1.5",
            children: busy ? "\u2026" : "Search"
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onToggleMonitor(s.seasonNumber, !s.monitored),
            disabled: busy,
            className: "text-xs font-medium rounded-lg transition-colors disabled:opacity-50 px-3 py-1.5 " + (s.monitored ? "bg-white/10 hover:bg-white/15 text-ndp-text" : "bg-ndp-accent/20 hover:bg-ndp-accent/30 text-ndp-accent"),
            children: s.monitored ? "Unmonitor" : "Monitor"
          }
        )
      ] })
    ] }) }, s.seasonNumber);
  }) });
}
function FilesContent({
  files,
  loading,
  deletingFileId,
  onDelete
}) {
  if (loading && files === null) {
    return /* @__PURE__ */ jsx2("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx2("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (!files || files.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: "text-center py-12 text-sm text-ndp-text-dim", children: "No episode files yet." });
  }
  const sorted = [...files].sort((a, b) => a.seasonNumber - b.seasonNumber || a.path.localeCompare(b.path));
  return /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: sorted.map((f) => /* @__PURE__ */ jsxs2("div", { className: "card p-3 flex items-start gap-3", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx2("p", { className: "text-xs text-ndp-text break-all leading-snug", children: f.relativePath || f.path }),
      /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-ndp-text-dim", children: [
        /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text", children: [
          "S",
          String(f.seasonNumber).padStart(2, "0")
        ] }),
        /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
        /* @__PURE__ */ jsx2("span", { children: f.quality?.quality?.name || "\u2014" }),
        /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
        /* @__PURE__ */ jsx2("span", { children: formatSize2(f.size) }),
        f.mediaInfo?.videoCodec && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { children: f.mediaInfo.videoCodec })
        ] }),
        f.mediaInfo?.resolution && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { children: f.mediaInfo.resolution })
        ] }),
        f.mediaInfo?.audioLanguages && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { children: f.mediaInfo.audioLanguages })
        ] }),
        /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
        /* @__PURE__ */ jsx2("span", { children: formatRelativeDate(f.dateAdded) })
      ] })
    ] }),
    /* @__PURE__ */ jsx2(
      "button",
      {
        onClick: () => onDelete(f.id),
        disabled: deletingFileId === f.id,
        className: "flex-shrink-0 rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors disabled:opacity-50 px-3 py-1.5",
        children: deletingFileId === f.id ? "Deleting\u2026" : "Delete"
      }
    )
  ] }, f.id)) });
}
function HistoryContent({
  items,
  loading,
  retrying,
  onRetry
}) {
  if (loading && items === null) {
    return /* @__PURE__ */ jsx2("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx2("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (!items || items.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: "text-center py-12 text-sm text-ndp-text-dim", children: "No history events for this series yet." });
  }
  return /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: items.map((item) => {
    const meta = eventMeta(item.eventType);
    const isFailed = item.eventType === "downloadFailed";
    return /* @__PURE__ */ jsxs2("div", { className: "card p-3 flex items-start gap-3", children: [
      /* @__PURE__ */ jsx2("span", { className: `flex-shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`, children: meta.label }),
      /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx2("p", { className: "text-xs text-ndp-text break-all leading-snug", children: item.sourceTitle }),
        /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-ndp-text-dim", children: [
          item.episode && /* @__PURE__ */ jsx2("span", { className: "font-mono text-ndp-text", children: epTag2(item.episode) }),
          item.episode?.title && /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { children: item.episode.title })
          ] }),
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { className: "text-ndp-text", children: item.quality?.quality?.name || "\u2014" }),
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { children: formatRelativeDate(item.date) }),
          item.data?.downloadClient && /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { children: item.data.downloadClient })
          ] }),
          item.data?.reason && /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { className: "text-ndp-error/80", children: item.data.reason })
          ] })
        ] })
      ] }),
      isFailed && /* @__PURE__ */ jsx2(
        "button",
        {
          onClick: () => onRetry(item.id),
          disabled: retrying === item.id,
          className: "flex-shrink-0 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50 px-3 py-1.5",
          children: retrying === item.id ? "Retrying\u2026" : "Retry"
        }
      )
    ] }, item.id);
  }) });
}
function QueueContent({
  items,
  loading,
  removing,
  onRemove
}) {
  if (loading && items === null) {
    return /* @__PURE__ */ jsx2("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx2("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (!items || items.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: "text-center py-12 text-sm text-ndp-text-dim", children: "Nothing in the download queue for this series." });
  }
  return /* @__PURE__ */ jsx2("div", { className: "space-y-3", children: items.map((item) => {
    const total = item.size || 0;
    const left = item.sizeleft || 0;
    const done = Math.max(0, total - left);
    const pct = total > 0 ? Math.min(100, Math.round(done / total * 100)) : 0;
    return /* @__PURE__ */ jsxs2("div", { className: "card p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx2("p", { className: "text-xs text-ndp-text break-all leading-snug flex-1 min-w-0", children: item.title }),
            item.episode && /* @__PURE__ */ jsx2("span", { className: "text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-ndp-text-dim", children: epTag2(item.episode) })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-ndp-text-dim", children: [
            /* @__PURE__ */ jsx2("span", { className: "text-ndp-text", children: item.quality?.quality?.name || "\u2014" }),
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { children: formatSize2(total) }),
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { children: item.downloadClient || "\u2014" }),
            /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx2("span", { className: "uppercase tracking-wider", children: item.protocol }),
            item.timeleft && /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
              /* @__PURE__ */ jsxs2("span", { children: [
                "ETA ",
                item.timeleft
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx2("span", { className: "flex-shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300", children: item.status })
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "w-full h-1.5 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx2("div", { className: "h-full bg-ndp-accent transition-all duration-300", style: { width: `${pct}%` } }) }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between text-[11px] text-ndp-text-dim", children: [
        /* @__PURE__ */ jsxs2("span", { children: [
          formatSize2(done),
          " / ",
          formatSize2(total)
        ] }),
        /* @__PURE__ */ jsxs2("span", { className: "font-semibold text-ndp-accent", children: [
          pct,
          "%"
        ] })
      ] }),
      item.statusMessages && item.statusMessages.length > 0 && /* @__PURE__ */ jsx2("ul", { className: "border-t border-white/5 pt-2 space-y-1", children: item.statusMessages.flatMap(
        (m) => m.messages.map((msg, i) => /* @__PURE__ */ jsxs2("li", { className: "text-[11px] text-amber-300/80 flex items-start gap-1.5", children: [
          /* @__PURE__ */ jsx2("span", { className: "text-amber-400 mt-0.5", children: "\u26A0" }),
          /* @__PURE__ */ jsx2("span", { children: msg })
        ] }, `${m.title}-${i}`))
      ) }),
      /* @__PURE__ */ jsxs2("div", { className: "flex gap-2 pt-1", children: [
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onRemove(item.id, false),
            disabled: removing === item.id,
            className: "rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-ndp-text transition-colors disabled:opacity-50 px-3 py-1.5",
            children: removing === item.id ? "Removing\u2026" : "Remove"
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onRemove(item.id, true),
            disabled: removing === item.id,
            className: "rounded-lg text-xs font-medium bg-ndp-error/10 hover:bg-ndp-error/20 text-ndp-error transition-colors disabled:opacity-50 px-3 py-1.5",
            children: "Remove & Blocklist"
          }
        )
      ] })
    ] }, item.id);
  }) });
}
function BlocklistContent({
  items,
  loading,
  unblocking,
  onUnblock
}) {
  if (loading && items === null) {
    return /* @__PURE__ */ jsx2("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx2("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (!items || items.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: "text-center py-12 text-sm text-ndp-text-dim", children: "No blocklisted releases for this series." });
  }
  return /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: items.map((item) => /* @__PURE__ */ jsxs2("div", { className: "card p-3 flex items-start gap-3", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx2("p", { className: "text-xs text-ndp-text break-all leading-snug", children: item.sourceTitle }),
      /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-ndp-text-dim", children: [
        /* @__PURE__ */ jsx2("span", { className: "text-ndp-text", children: item.quality?.quality?.name || "\u2014" }),
        /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
        /* @__PURE__ */ jsx2("span", { children: formatRelativeDate(item.date) }),
        item.message && /* @__PURE__ */ jsxs2(Fragment, { children: [
          /* @__PURE__ */ jsx2("span", { children: "\xB7" }),
          /* @__PURE__ */ jsx2("span", { className: "text-ndp-error/80", children: item.message })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx2(
      "button",
      {
        onClick: () => onUnblock(item.id),
        disabled: unblocking === item.id,
        className: "flex-shrink-0 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-ndp-text transition-colors disabled:opacity-50 px-3 py-1.5",
        children: unblocking === item.id ? "Removing\u2026" : "Unblock"
      }
    )
  ] }, item.id)) });
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx2("h3", { className: "text-xs font-semibold uppercase tracking-wider text-ndp-text-dim", children: title }),
    children
  ] });
}
function Grid({ children }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className: "card p-4 text-sm grid gap-y-2 gap-x-6",
      style: { gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" },
      children
    }
  );
}
function Field({ label, children, span = false }) {
  return /* @__PURE__ */ jsxs2("div", { style: span ? { gridColumn: "1 / -1" } : void 0, children: [
    /* @__PURE__ */ jsxs2("span", { className: "text-ndp-text-dim", children: [
      label,
      ": "
    ] }),
    /* @__PURE__ */ jsx2("span", { className: "text-ndp-text", children })
  ] });
}

// frontend/components/LibraryTab.tsx
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function formatSize3(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function getStatusInfo(series) {
  if (!series.monitored) return { label: "Unmonitored", className: "bg-white/10 text-ndp-text-dim" };
  if (series.complete) return { label: "Complete", className: "bg-ndp-success/15 text-ndp-success" };
  if (series.episodeFileCount > 0) return { label: "Partial", className: "bg-amber-500/15 text-amber-300" };
  return { label: "Missing", className: "bg-ndp-error/15 text-ndp-error" };
}
var PAGE_SIZE = 50;
function LibraryTab() {
  const [series, setSeries] = useState3([]);
  const [profiles, setProfiles] = useState3([]);
  const [loading, setLoading] = useState3(true);
  const [loadingMore, setLoadingMore] = useState3(false);
  const [error, setError] = useState3(null);
  const [total, setTotal] = useState3(0);
  const [hasMore, setHasMore] = useState3(false);
  const [page, setPage] = useState3(1);
  const [search, setSearch] = useState3("");
  const [statusFilter, setStatusFilter] = useState3("all");
  const [profileFilter, setProfileFilter] = useState3("all");
  const [typeFilter, setTypeFilter] = useState3("all");
  const [selectedSeriesId, setSelectedSeriesId] = useState3(null);
  const [viewMode, setViewMode] = useState3(() => {
    try {
      return localStorage.getItem("plugin-sonarr-library-view") || "table";
    } catch {
      return "table";
    }
  });
  const updateViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("plugin-sonarr-library-view", mode);
    } catch {
    }
  };
  const [debouncedSearch, setDebouncedSearch] = useState3("");
  useEffect3(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const buildQuery = useCallback3((p) => {
    const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (profileFilter !== "all") params.set("qualityProfileId", profileFilter);
    if (typeFilter !== "all") params.set("seriesType", typeFilter);
    return params.toString();
  }, [debouncedSearch, statusFilter, profileFilter, typeFilter]);
  const fetchPage = useCallback3(async (p, append) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/plugins/sonarr/series?${buildQuery(p)}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data.series) ? data.series : [];
      if (append) {
        setSeries((prev) => [...prev, ...list]);
      } else {
        setSeries(list);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(p);
    } catch (err) {
      setError(err.message || "Failed to load series");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery]);
  useEffect3(() => {
    setSeries([]);
    setPage(1);
    fetchPage(1, false);
  }, [debouncedSearch, statusFilter, profileFilter, typeFilter]);
  useEffect3(() => {
    fetch("/api/plugins/sonarr/profiles", { credentials: "include" }).then((r) => r.ok ? r.json() : []).then((data) => setProfiles(Array.isArray(data) ? data : [])).catch(() => setProfiles([]));
  }, []);
  const sentinelRef = useRef2(null);
  useEffect3(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);
  const profileMap = useMemo(() => {
    const map = {};
    for (const p of profiles) map[p.id] = p.name;
    return map;
  }, [profiles]);
  if (loading && series.length === 0) {
    return /* @__PURE__ */ jsx3("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx3("div", { style: { width: 32, height: 32, border: "2px solid", borderColor: "var(--ndp-accent, #6366f1) transparent", borderRadius: "50%", animation: "spin 1s linear infinite" } }) });
  }
  if (error && series.length === 0) {
    return /* @__PURE__ */ jsx3("div", { className: "card p-6 text-center", children: /* @__PURE__ */ jsx3("p", { className: "text-ndp-error", children: error }) });
  }
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsxs3("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsx3(
          "input",
          {
            type: "text",
            placeholder: "Search series...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "input flex-1 min-w-[200px] text-sm"
          }
        ),
        /* @__PURE__ */ jsxs3("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "input text-sm min-w-[140px]", children: [
          /* @__PURE__ */ jsx3("option", { value: "all", children: "All Status" }),
          /* @__PURE__ */ jsx3("option", { value: "complete", children: "Complete" }),
          /* @__PURE__ */ jsx3("option", { value: "missing", children: "Missing Episodes" }),
          /* @__PURE__ */ jsx3("option", { value: "unmonitored", children: "Unmonitored" }),
          /* @__PURE__ */ jsx3("option", { value: "continuing", children: "Continuing" }),
          /* @__PURE__ */ jsx3("option", { value: "ended", children: "Ended" })
        ] }),
        /* @__PURE__ */ jsxs3("select", { value: profileFilter, onChange: (e) => setProfileFilter(e.target.value), className: "input text-sm min-w-[150px]", children: [
          /* @__PURE__ */ jsx3("option", { value: "all", children: "All Profiles" }),
          profiles.map((p) => /* @__PURE__ */ jsx3("option", { value: p.id, children: p.name }, p.id))
        ] }),
        /* @__PURE__ */ jsxs3("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: "input text-sm min-w-[120px]", children: [
          /* @__PURE__ */ jsx3("option", { value: "all", children: "All Types" }),
          /* @__PURE__ */ jsx3("option", { value: "standard", children: "Standard" }),
          /* @__PURE__ */ jsx3("option", { value: "anime", children: "Anime" }),
          /* @__PURE__ */ jsx3("option", { value: "daily", children: "Daily" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs3("p", { className: "text-sm text-ndp-text-dim", children: [
          series.length,
          " of ",
          total,
          " series"
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "flex rounded-lg overflow-hidden border border-white/10", children: [
          /* @__PURE__ */ jsx3(
            "button",
            {
              onClick: () => updateViewMode("table"),
              style: { padding: "6px 12px", fontSize: 13, background: viewMode === "table" ? "rgba(255,255,255,0.1)" : "transparent", color: viewMode === "table" ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s" },
              children: "Table"
            }
          ),
          /* @__PURE__ */ jsx3(
            "button",
            {
              onClick: () => updateViewMode("cards"),
              style: { padding: "6px 12px", fontSize: 13, background: viewMode === "cards" ? "rgba(255,255,255,0.1)" : "transparent", color: viewMode === "cards" ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s" },
              children: "Cards"
            }
          )
        ] })
      ] }),
      viewMode === "cards" && /* @__PURE__ */ jsxs3("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }, children: [
        series.map((s) => {
          const status = getStatusInfo(s);
          return /* @__PURE__ */ jsxs3(
            "div",
            {
              onClick: () => setSelectedSeriesId(s.id),
              className: "card cursor-pointer hover:ring-1 hover:ring-ndp-accent/50 transition-all",
              style: { overflow: "hidden", borderRadius: 8 },
              children: [
                /* @__PURE__ */ jsxs3("div", { style: { position: "relative", aspectRatio: "2/3", background: "rgba(255,255,255,0.03)" }, children: [
                  s.poster ? /* @__PURE__ */ jsx3("img", { src: s.poster, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }, loading: "lazy" }) : /* @__PURE__ */ jsx3("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }, className: "text-ndp-text-dim text-xs", children: "No Poster" }),
                  /* @__PURE__ */ jsx3("span", { className: status.className, style: { position: "absolute", top: 6, right: 6, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600 }, children: status.label })
                ] }),
                /* @__PURE__ */ jsxs3("div", { style: { padding: "8px 10px" }, children: [
                  /* @__PURE__ */ jsx3("p", { className: "text-ndp-text", style: { fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: s.title }),
                  /* @__PURE__ */ jsxs3("div", { className: "text-ndp-text-dim", style: { fontSize: 11, marginTop: 2, display: "flex", justifyContent: "space-between" }, children: [
                    /* @__PURE__ */ jsxs3("span", { children: [
                      s.episodeFileCount,
                      "/",
                      s.episodeCount,
                      " eps"
                    ] }),
                    /* @__PURE__ */ jsx3("span", { children: profileMap[s.qualityProfileId] || "" })
                  ] }),
                  s.sizeOnDisk > 0 && /* @__PURE__ */ jsx3("p", { className: "text-ndp-text-dim", style: { fontSize: 10, marginTop: 2 }, children: formatSize3(s.sizeOnDisk) })
                ] })
              ]
            },
            s.id
          );
        }),
        series.length === 0 && !loading && /* @__PURE__ */ jsx3("p", { className: "text-ndp-text-dim text-center", style: { gridColumn: "1 / -1", padding: "48px 0" }, children: "No series found" })
      ] }),
      viewMode === "table" && /* @__PURE__ */ jsx3("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx3("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs3("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx3("thead", { children: /* @__PURE__ */ jsxs3("tr", { className: "border-b border-white/5", children: [
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", style: { width: 60 } }),
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Title" }),
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", style: { width: 100 }, children: "Episodes" }),
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", style: { width: 110 }, children: "Status" }),
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", style: { width: 120 }, children: "Quality" }),
          /* @__PURE__ */ jsx3("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", style: { width: 100 }, children: "Type" }),
          /* @__PURE__ */ jsx3("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium", style: { width: 100 }, children: "Size" })
        ] }) }),
        /* @__PURE__ */ jsxs3("tbody", { children: [
          series.map((s) => {
            const status = getStatusInfo(s);
            const pct = Math.round(s.percentOfEpisodes);
            return /* @__PURE__ */ jsxs3(
              "tr",
              {
                onClick: () => setSelectedSeriesId(s.id),
                className: "border-b border-white/5 last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors",
                children: [
                  /* @__PURE__ */ jsx3("td", { className: "px-4 py-2", children: s.poster ? /* @__PURE__ */ jsx3("img", { src: s.poster, alt: "", style: { width: 40, height: 60, objectFit: "cover", borderRadius: 4 }, loading: "lazy" }) : /* @__PURE__ */ jsx3("div", { style: { width: 40, height: 60, borderRadius: 4 }, className: "bg-white/5 flex items-center justify-center text-ndp-text-dim text-xs", children: "N/A" }) }),
                  /* @__PURE__ */ jsxs3("td", { className: "px-4 py-2", children: [
                    /* @__PURE__ */ jsx3("span", { className: "text-ndp-text font-medium", children: s.title }),
                    s.year ? /* @__PURE__ */ jsxs3("span", { className: "text-ndp-text-dim ml-1.5 text-xs", children: [
                      "(",
                      s.year,
                      ")"
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ jsxs3("td", { className: "px-4 py-2 text-ndp-text-dim", children: [
                    /* @__PURE__ */ jsxs3("span", { children: [
                      s.episodeFileCount,
                      "/",
                      s.episodeCount
                    ] }),
                    /* @__PURE__ */ jsxs3("span", { className: "text-[10px] ml-1 text-ndp-text-dim", children: [
                      "(",
                      pct,
                      "%)"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx3("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsx3("span", { className: "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium " + status.className, children: status.label }) }),
                  /* @__PURE__ */ jsx3("td", { className: "px-4 py-2 text-ndp-text-dim", children: profileMap[s.qualityProfileId] || "-" }),
                  /* @__PURE__ */ jsx3("td", { className: "px-4 py-2 text-ndp-text-dim capitalize", children: s.seriesType }),
                  /* @__PURE__ */ jsx3("td", { className: "px-4 py-2 text-right text-ndp-text-dim", children: s.sizeOnDisk > 0 ? formatSize3(s.sizeOnDisk) : "-" })
                ]
              },
              s.id
            );
          }),
          series.length === 0 && !loading && /* @__PURE__ */ jsx3("tr", { children: /* @__PURE__ */ jsx3("td", { colSpan: 7, className: "px-4 py-12 text-center text-ndp-text-dim", children: "No series found" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx3("div", { ref: sentinelRef, style: { height: 1 } }),
      loadingMore && /* @__PURE__ */ jsx3("div", { className: "flex justify-center py-4", children: /* @__PURE__ */ jsx3("div", { style: { width: 24, height: 24, border: "2px solid", borderColor: "var(--ndp-accent, #6366f1) transparent", borderRadius: "50%", animation: "spin 1s linear infinite" } }) })
    ] }),
    selectedSeriesId !== null && /* @__PURE__ */ jsx3(SeriesModal, { seriesId: selectedSeriesId, onClose: () => setSelectedSeriesId(null) })
  ] });
}

// frontend/components/AnalyticsTab.tsx
import { useState as useState4, useEffect as useEffect4 } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function formatSize4(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function formatSizeTB(bytes) {
  const tb = bytes / Math.pow(1024, 4);
  if (tb >= 1) return `${tb.toFixed(2)} TB`;
  return formatSize4(bytes);
}
function formatMonth(key) {
  const [year, month] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}
function StatCard({ label, value, accent }) {
  return /* @__PURE__ */ jsxs4("div", { className: "card p-5", children: [
    /* @__PURE__ */ jsx4("p", { className: "text-sm text-ndp-text-dim", children: label }),
    /* @__PURE__ */ jsx4("p", { className: "text-2xl font-bold mt-1 " + (accent || "text-ndp-text"), children: value })
  ] });
}
function AnalyticsTab() {
  const [data, setData] = useState4(null);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  useEffect4(() => {
    let cancelled = false;
    fetch("/api/plugins/sonarr/analytics", { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((d) => {
      if (!cancelled) setData(d);
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Failed to load analytics");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx4("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx4("div", { className: "w-8 h-8 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (error || !data) {
    return /* @__PURE__ */ jsx4("div", { className: "card p-6 text-center", children: /* @__PURE__ */ jsx4("p", { className: "text-ndp-error", children: error || "No data available" }) });
  }
  const maxTimelineCount = Math.max(...data.timeline.map((t) => t.count), 1);
  const maxSeriesTypeCount = Math.max(...data.seriesTypeCounts.map((q) => q.count), 1);
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs4("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsx4(StatCard, { label: "Total Series", value: data.overview.totalSeries.toLocaleString() }),
      /* @__PURE__ */ jsx4(StatCard, { label: "Total Size", value: formatSizeTB(data.overview.totalSize) }),
      /* @__PURE__ */ jsx4(
        StatCard,
        {
          label: "Episodes",
          value: `${data.overview.totalFiles.toLocaleString()} / ${data.overview.totalEpisodes.toLocaleString()}`
        }
      ),
      /* @__PURE__ */ jsx4(StatCard, { label: "Complete", value: data.overview.complete.toLocaleString(), accent: "text-ndp-success" }),
      /* @__PURE__ */ jsx4(StatCard, { label: "Missing", value: data.overview.missing.toLocaleString(), accent: "text-ndp-error" }),
      /* @__PURE__ */ jsx4(StatCard, { label: "Unmonitored", value: data.overview.unmonitored.toLocaleString(), accent: "text-ndp-text-dim" }),
      /* @__PURE__ */ jsx4(StatCard, { label: "Continuing", value: data.overview.continuing.toLocaleString(), accent: "text-ndp-accent" }),
      /* @__PURE__ */ jsx4(StatCard, { label: "Ended", value: data.overview.ended.toLocaleString(), accent: "text-ndp-text-dim" })
    ] }),
    data.diskSpace.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx4("h3", { className: "text-sm font-semibold text-ndp-text", children: "Disk Space" }),
      /* @__PURE__ */ jsx4("div", { className: "card p-5 space-y-4", children: data.diskSpace.map((disk) => /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between text-sm mb-1.5", children: [
          /* @__PURE__ */ jsx4("span", { className: "text-ndp-text truncate", title: disk.path, children: disk.label || disk.path }),
          /* @__PURE__ */ jsxs4("span", { className: "text-ndp-text-dim flex-shrink-0 ml-3", children: [
            formatSize4(disk.usedSpace),
            " / ",
            formatSize4(disk.totalSpace),
            " (",
            disk.usedPercent,
            "%)"
          ] })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "w-full h-3 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx4(
          "div",
          {
            className: "h-full rounded-full transition-all duration-500 " + (disk.usedPercent > 90 ? "bg-ndp-error" : disk.usedPercent > 70 ? "bg-yellow-500" : "bg-ndp-accent"),
            style: { width: `${Math.min(disk.usedPercent, 100)}%` }
          }
        ) })
      ] }, disk.path)) })
    ] }),
    data.seriesTypeCounts.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx4("h3", { className: "text-sm font-semibold text-ndp-text", children: "Series Type" }),
      /* @__PURE__ */ jsx4("div", { className: "card p-5 space-y-3", children: data.seriesTypeCounts.map((q) => /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between text-sm mb-1", children: [
          /* @__PURE__ */ jsx4("span", { className: "text-ndp-text capitalize", children: q.name }),
          /* @__PURE__ */ jsx4("span", { className: "text-ndp-text-dim", children: q.count })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "w-full h-2 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx4(
          "div",
          {
            className: "h-full bg-ndp-accent rounded-full transition-all duration-500",
            style: { width: `${q.count / maxSeriesTypeCount * 100}%` }
          }
        ) })
      ] }, q.name)) })
    ] }),
    data.timeline.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx4("h3", { className: "text-sm font-semibold text-ndp-text", children: "Series Added (Last 12 Months)" }),
      /* @__PURE__ */ jsx4("div", { className: "card p-5", children: /* @__PURE__ */ jsx4("div", { className: "flex items-end gap-1.5 h-40", children: data.timeline.map((t) => /* @__PURE__ */ jsxs4("div", { className: "flex-1 flex flex-col items-center gap-1 h-full justify-end", children: [
        /* @__PURE__ */ jsx4("span", { className: "text-[10px] text-ndp-text-dim", children: t.count > 0 ? t.count : "" }),
        /* @__PURE__ */ jsx4(
          "div",
          {
            className: "w-full bg-ndp-accent/80 rounded-t transition-all duration-500 min-h-[2px]",
            style: {
              height: t.count > 0 ? `${Math.max(t.count / maxTimelineCount * 100, 5)}%` : "2px"
            }
          }
        ),
        /* @__PURE__ */ jsx4("span", { className: "text-[9px] text-ndp-text-dim whitespace-nowrap", children: formatMonth(t.month) })
      ] }, t.month)) }) })
    ] }),
    data.topBySize.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx4("h3", { className: "text-sm font-semibold text-ndp-text", children: "Largest Series" }),
      /* @__PURE__ */ jsx4("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsxs4("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { className: "border-b border-white/5", children: [
          /* @__PURE__ */ jsx4("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Series" }),
          /* @__PURE__ */ jsx4("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[120px]", children: "Episodes" }),
          /* @__PURE__ */ jsx4("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[100px]", children: "Size" })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: data.topBySize.map((s) => /* @__PURE__ */ jsxs4("tr", { className: "border-b border-white/5 last:border-0", children: [
          /* @__PURE__ */ jsxs4("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsx4("span", { className: "text-ndp-text font-medium", children: s.title }),
            s.year ? /* @__PURE__ */ jsxs4("span", { className: "text-ndp-text-dim ml-1.5 text-xs", children: [
              "(",
              s.year,
              ")"
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx4("td", { className: "px-4 py-3 text-right text-ndp-text-dim", children: s.episodeFileCount }),
          /* @__PURE__ */ jsx4("td", { className: "px-4 py-3 text-right text-ndp-text-dim", children: formatSize4(s.size) })
        ] }, s.id)) })
      ] }) })
    ] }),
    data.rootFolders.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx4("h3", { className: "text-sm font-semibold text-ndp-text", children: "Root Folders" }),
      /* @__PURE__ */ jsx4("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsxs4("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { className: "border-b border-white/5", children: [
          /* @__PURE__ */ jsx4("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Path" }),
          /* @__PURE__ */ jsx4("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[100px]", children: "Series" }),
          /* @__PURE__ */ jsx4("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[100px]", children: "Size" })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: data.rootFolders.map((rf) => /* @__PURE__ */ jsxs4("tr", { className: "border-b border-white/5 last:border-0", children: [
          /* @__PURE__ */ jsx4("td", { className: "px-4 py-3 text-ndp-text break-all", children: rf.path }),
          /* @__PURE__ */ jsx4("td", { className: "px-4 py-3 text-right text-ndp-text-dim", children: rf.count }),
          /* @__PURE__ */ jsx4("td", { className: "px-4 py-3 text-right text-ndp-text-dim", children: formatSize4(rf.size) })
        ] }, rf.path)) })
      ] }) })
    ] })
  ] });
}

// frontend/components/QualityTab.tsx
import { useState as useState5, useEffect as useEffect5, useCallback as useCallback4 } from "react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function epTag3(s, e) {
  return `S${String(s).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
}
function resolveCutoffName(profile) {
  if (!profile) return "-";
  const item = profile.items.find((i) => i.quality?.id === profile.cutoff);
  return item?.quality?.name || "-";
}
function QualityTab() {
  const [data, setData] = useState5(null);
  const [profiles, setProfiles] = useState5([]);
  const [loading, setLoading] = useState5(true);
  const [error, setError] = useState5(null);
  const [page, setPage] = useState5(1);
  const [pageSize] = useState5(20);
  const [searchingIds, setSearchingIds] = useState5(/* @__PURE__ */ new Set());
  const [searchedIds, setSearchedIds] = useState5(/* @__PURE__ */ new Set());
  const [bulkSearching, setBulkSearching] = useState5(false);
  const [message, setMessage] = useState5(null);
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3e3);
  };
  const fetchData = useCallback4(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/plugins/sonarr/quality/cutoff-unmet?page=${page}&pageSize=${pageSize}`, { credentials: "include" }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${r.status}`);
        }
        return r.json();
      }),
      fetch("/api/plugins/sonarr/profiles", { credentials: "include" }).then((r) => r.ok ? r.json() : []).catch(() => [])
    ]).then(([cutoffData, profilesData]) => {
      setData({
        ...cutoffData,
        records: Array.isArray(cutoffData?.records) ? cutoffData.records : []
      });
      setProfiles(Array.isArray(profilesData) ? profilesData : []);
    }).catch((err) => setError(err.message || "Failed to load data")).finally(() => setLoading(false));
  }, [page, pageSize]);
  useEffect5(() => {
    fetchData();
  }, [fetchData]);
  const profileMap = {};
  for (const p of profiles) profileMap[p.id] = p;
  const handleSearchUpgrade = async (episodeId) => {
    setSearchingIds((prev) => new Set(prev).add(episodeId));
    try {
      const r = await fetch(`/api/plugins/sonarr/quality/search/${episodeId}`, {
        method: "POST",
        credentials: "include"
      });
      if (!r.ok) throw new Error("Search failed");
      setSearchedIds((prev) => new Set(prev).add(episodeId));
      showMessage("Search upgrade command sent", "success");
    } catch {
      showMessage("Search upgrade failed", "error");
    }
    setSearchingIds((prev) => {
      const next = new Set(prev);
      next.delete(episodeId);
      return next;
    });
  };
  const handleSearchAll = async () => {
    if (!data || data.records.length === 0) return;
    setBulkSearching(true);
    try {
      const episodeIds = data.records.map((e) => e.id);
      const r = await fetch("/api/plugins/sonarr/quality/search-bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeIds })
      });
      if (!r.ok) throw new Error("Bulk search failed");
      const result = await r.json();
      const successCount = result.results?.filter((r2) => r2.ok).length || 0;
      setSearchedIds((prev) => {
        const next = new Set(prev);
        episodeIds.forEach((id) => next.add(id));
        return next;
      });
      showMessage(`Search sent for ${successCount} episode${successCount !== 1 ? "s" : ""}`, "success");
    } catch {
      showMessage("Bulk search failed", "error");
    }
    setBulkSearching(false);
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.totalRecords / data.pageSize)) : 1;
  if (loading) {
    return /* @__PURE__ */ jsx5("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx5("div", { className: "w-8 h-8 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs5("div", { className: "card p-6 text-center", children: [
      /* @__PURE__ */ jsx5("p", { className: "text-ndp-error", children: error }),
      /* @__PURE__ */ jsx5("button", { onClick: fetchData, className: "btn-primary text-sm mt-4", children: "Retry" })
    ] });
  }
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5("h2", { className: "text-lg font-semibold text-ndp-text", children: "Cutoff Unmet" }),
        /* @__PURE__ */ jsxs5("p", { className: "text-sm text-ndp-text-dim mt-0.5", children: [
          data?.totalRecords || 0,
          " episode",
          (data?.totalRecords || 0) !== 1 ? "s" : "",
          " below quality cutoff"
        ] })
      ] }),
      /* @__PURE__ */ jsx5(
        "button",
        {
          onClick: handleSearchAll,
          disabled: bulkSearching || !data || data.records.length === 0,
          className: "btn-primary text-sm disabled:opacity-50",
          children: bulkSearching ? /* @__PURE__ */ jsxs5("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx5("span", { className: "w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" }),
            "Searching All..."
          ] }) : "Search All (Page)"
        }
      )
    ] }),
    message && /* @__PURE__ */ jsx5("div", { className: "px-4 py-2 rounded-lg text-sm font-medium " + (message.type === "success" ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"), children: message.text }),
    /* @__PURE__ */ jsx5("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx5("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs5("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx5("thead", { children: /* @__PURE__ */ jsxs5("tr", { className: "border-b border-white/5", children: [
        /* @__PURE__ */ jsx5("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Series" }),
        /* @__PURE__ */ jsx5("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[110px]", children: "Episode" }),
        /* @__PURE__ */ jsx5("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Title" }),
        /* @__PURE__ */ jsx5("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[130px]", children: "Current" }),
        /* @__PURE__ */ jsx5("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[130px]", children: "Cutoff" }),
        /* @__PURE__ */ jsx5("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[120px]" })
      ] }) }),
      /* @__PURE__ */ jsxs5("tbody", { children: [
        data?.records.map((ep) => {
          const profile = ep.series ? profileMap[ep.series.qualityProfileId] : void 0;
          const currentQuality = ep.episodeFile?.quality?.quality?.name || "No file";
          const cutoffQuality = resolveCutoffName(profile);
          const isSearching = searchingIds.has(ep.id);
          const wasSearched = searchedIds.has(ep.id);
          return /* @__PURE__ */ jsxs5("tr", { className: "border-b border-white/5 last:border-0", children: [
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx5("span", { className: "text-ndp-text font-medium", children: ep.series?.title || "\u2014" }) }),
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3 text-xs font-mono text-ndp-text-dim", children: epTag3(ep.seasonNumber, ep.episodeNumber) }),
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3 text-ndp-text-dim truncate", children: ep.title }),
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx5("span", { className: "inline-block px-2 py-0.5 rounded-full text-xs bg-ndp-error/15 text-ndp-error", children: currentQuality }) }),
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx5("span", { className: "inline-block px-2 py-0.5 rounded-full text-xs bg-ndp-success/15 text-ndp-success", children: cutoffQuality }) }),
            /* @__PURE__ */ jsx5("td", { className: "px-4 py-3 text-right", children: wasSearched ? /* @__PURE__ */ jsx5("span", { className: "text-xs text-ndp-success", children: "Sent" }) : /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: () => handleSearchUpgrade(ep.id),
                disabled: isSearching,
                className: "px-3 py-1 rounded-lg text-xs font-medium bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors disabled:opacity-50",
                children: isSearching ? /* @__PURE__ */ jsxs5("span", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx5("span", { className: "w-2.5 h-2.5 border border-ndp-accent border-t-transparent rounded-full animate-spin" }),
                  "Searching"
                ] }) : "Search Upgrade"
              }
            ) })
          ] }, ep.id);
        }),
        (!data || data.records.length === 0) && /* @__PURE__ */ jsx5("tr", { children: /* @__PURE__ */ jsx5("td", { colSpan: 6, className: "px-4 py-12 text-center text-ndp-text-dim", children: "No episodes below quality cutoff" }) })
      ] })
    ] }) }) }),
    totalPages > 1 && /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs5("p", { className: "text-sm text-ndp-text-dim", children: [
        "Page ",
        data?.page || 1,
        " of ",
        totalPages,
        " (",
        data?.totalRecords || 0,
        " total)"
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            disabled: page <= 1,
            className: "px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors",
            children: "Previous"
          }
        ),
        /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
            disabled: page >= totalPages,
            className: "px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors",
            children: "Next"
          }
        )
      ] })
    ] })
  ] });
}

// frontend/components/ReleasesTab.tsx
import { useState as useState6, useEffect as useEffect6, useCallback as useCallback5 } from "react";
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function formatSize5(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function formatAge(days) {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
}
function epTag4(s, e) {
  return `S${String(s).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
}
function ReleasesTab() {
  const [searchQuery, setSearchQuery] = useState6("");
  const [seriesResults, setSeriesResults] = useState6([]);
  const [selectedSeries, setSelectedSeries] = useState6(null);
  const [searchingSeries, setSearchingSeries] = useState6(false);
  const [scope, setScope] = useState6("episode");
  const [seasons, setSeasons] = useState6([]);
  const [episodes, setEpisodes] = useState6([]);
  const [selectedSeason, setSelectedSeason] = useState6(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState6(null);
  const [loadingSeasonsEpisodes, setLoadingSeasonsEpisodes] = useState6(false);
  const [releases, setReleases] = useState6([]);
  const [loadingReleases, setLoadingReleases] = useState6(false);
  const [grabbing, setGrabbing] = useState6(null);
  const [blocklist, setBlocklist] = useState6([]);
  const [blocklistTotal, setBlocklistTotal] = useState6(0);
  const [blocklistPage, setBlocklistPage] = useState6(1);
  const [loadingBlocklist, setLoadingBlocklist] = useState6(true);
  const [removingId, setRemovingId] = useState6(null);
  const [message, setMessage] = useState6(null);
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3e3);
  };
  const handleSearchSeries = useCallback5(async () => {
    if (!searchQuery.trim()) return;
    setSearchingSeries(true);
    setSeriesResults([]);
    setSelectedSeries(null);
    setReleases([]);
    setSeasons([]);
    setEpisodes([]);
    try {
      const r = await fetch(`/api/plugins/sonarr/series?search=${encodeURIComponent(searchQuery.trim())}`, {
        credentials: "include"
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const list = Array.isArray(data?.series) ? data.series : [];
      setSeriesResults(list.slice(0, 20));
    } catch {
      showMessage("Failed to search series", "error");
    }
    setSearchingSeries(false);
  }, [searchQuery]);
  const handlePickSeries = async (series) => {
    setSelectedSeries(series);
    setReleases([]);
    setSelectedSeason(null);
    setSelectedEpisodeId(null);
    setLoadingSeasonsEpisodes(true);
    try {
      const [seasonsRes, episodesRes] = await Promise.all([
        fetch(`/api/plugins/sonarr/series/${series.id}/seasons`, { credentials: "include" }).then((r) => r.ok ? r.json() : { seasons: [] }),
        fetch(`/api/plugins/sonarr/series/${series.id}/episodes`, { credentials: "include" }).then((r) => r.ok ? r.json() : { episodes: [] })
      ]);
      setSeasons(Array.isArray(seasonsRes?.seasons) ? seasonsRes.seasons : []);
      setEpisodes(Array.isArray(episodesRes?.episodes) ? episodesRes.episodes : []);
    } catch {
      showMessage("Failed to load seasons/episodes", "error");
    }
    setLoadingSeasonsEpisodes(false);
  };
  const fetchReleases = async () => {
    if (!selectedSeries) return;
    setLoadingReleases(true);
    setReleases([]);
    try {
      let url;
      if (scope === "episode" && selectedEpisodeId !== null) {
        url = `/api/plugins/sonarr/releases?episodeId=${selectedEpisodeId}`;
      } else if (scope === "season" && selectedSeason !== null) {
        url = `/api/plugins/sonarr/releases?seriesId=${selectedSeries.id}&seasonNumber=${selectedSeason}`;
      } else {
        setLoadingReleases(false);
        return;
      }
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setReleases(Array.isArray(data) ? data : []);
    } catch {
      showMessage("Failed to load releases", "error");
    }
    setLoadingReleases(false);
  };
  const handleGrab = async (release) => {
    setGrabbing(release.guid);
    try {
      const r = await fetch("/api/plugins/sonarr/releases/grab", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guid: release.guid, indexerId: release.indexerId || 0 })
      });
      if (!r.ok) throw new Error("Grab failed");
      showMessage("Release grabbed", "success");
    } catch {
      showMessage("Failed to grab release", "error");
    }
    setGrabbing(null);
  };
  const fetchBlocklist = useCallback5(async () => {
    setLoadingBlocklist(true);
    try {
      const r = await fetch(`/api/plugins/sonarr/blocklist?page=${blocklistPage}&pageSize=20`, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setBlocklist(Array.isArray(data?.records) ? data.records : []);
      setBlocklistTotal(data?.totalRecords || 0);
    } catch {
      showMessage("Failed to load blocklist", "error");
    }
    setLoadingBlocklist(false);
  }, [blocklistPage]);
  useEffect6(() => {
    fetchBlocklist();
  }, [fetchBlocklist]);
  const handleRemoveBlocklistItem = async (id) => {
    setRemovingId(id);
    try {
      const r = await fetch(`/api/plugins/sonarr/blocklist/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Remove failed");
      setBlocklist((prev) => prev.filter((item) => item.id !== id));
      setBlocklistTotal((prev) => prev - 1);
      showMessage("Blocklist item removed", "success");
    } catch {
      showMessage("Failed to remove blocklist item", "error");
    }
    setRemovingId(null);
  };
  const blocklistTotalPages = Math.max(1, Math.ceil(blocklistTotal / 20));
  const episodesOfSelectedSeason = selectedSeason !== null ? episodes.filter((e) => e.seasonNumber === selectedSeason).sort((a, b) => a.episodeNumber - b.episodeNumber) : [];
  return /* @__PURE__ */ jsxs6("div", { className: "space-y-8", children: [
    message && /* @__PURE__ */ jsx6("div", { className: "px-4 py-2 rounded-lg text-sm font-medium " + (message.type === "success" ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"), children: message.text }),
    /* @__PURE__ */ jsxs6("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx6("h2", { className: "text-lg font-semibold text-ndp-text", children: "Release Search" }),
      /* @__PURE__ */ jsxs6("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx6(
          "input",
          {
            type: "text",
            placeholder: "Search by series title...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") handleSearchSeries();
            },
            className: "input flex-1 text-sm"
          }
        ),
        /* @__PURE__ */ jsx6(
          "button",
          {
            onClick: handleSearchSeries,
            disabled: searchingSeries || !searchQuery.trim(),
            className: "btn-primary text-sm disabled:opacity-50",
            children: searchingSeries ? /* @__PURE__ */ jsxs6("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx6("span", { className: "w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" }),
              "Searching"
            ] }) : "Search"
          }
        )
      ] }),
      seriesResults.length > 0 && !selectedSeries && /* @__PURE__ */ jsxs6("div", { className: "card overflow-hidden", children: [
        /* @__PURE__ */ jsx6("div", { className: "px-4 py-2 border-b border-white/5", children: /* @__PURE__ */ jsx6("p", { className: "text-xs text-ndp-text-dim", children: "Select a series to browse releases" }) }),
        seriesResults.map((s) => /* @__PURE__ */ jsxs6(
          "button",
          {
            onClick: () => handlePickSeries(s),
            className: "w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors",
            children: [
              /* @__PURE__ */ jsx6("span", { className: "text-sm text-ndp-text font-medium", children: s.title }),
              s.year ? /* @__PURE__ */ jsxs6("span", { className: "text-sm text-ndp-text-dim ml-2", children: [
                "(",
                s.year,
                ")"
              ] }) : null
            ]
          },
          s.id
        ))
      ] }),
      selectedSeries && /* @__PURE__ */ jsxs6("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs6("p", { className: "text-sm text-ndp-text", children: [
            "Releases for ",
            /* @__PURE__ */ jsxs6("span", { className: "font-semibold", children: [
              selectedSeries.title,
              selectedSeries.year ? ` (${selectedSeries.year})` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx6(
            "button",
            {
              onClick: () => {
                setSelectedSeries(null);
                setReleases([]);
                setSeasons([]);
                setEpisodes([]);
              },
              className: "text-xs text-ndp-text-dim hover:text-ndp-text transition-colors",
              children: "Clear"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs6("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx6(
            "button",
            {
              onClick: () => {
                setScope("episode");
                setReleases([]);
              },
              className: "text-xs rounded-lg px-3 py-1.5 transition-colors " + (scope === "episode" ? "bg-ndp-accent text-white" : "bg-white/5 text-ndp-text-dim hover:bg-white/10"),
              children: "Episode"
            }
          ),
          /* @__PURE__ */ jsx6(
            "button",
            {
              onClick: () => {
                setScope("season");
                setReleases([]);
                setSelectedEpisodeId(null);
              },
              className: "text-xs rounded-lg px-3 py-1.5 transition-colors " + (scope === "season" ? "bg-ndp-accent text-white" : "bg-white/5 text-ndp-text-dim hover:bg-white/10"),
              children: "Season"
            }
          )
        ] }),
        loadingSeasonsEpisodes ? /* @__PURE__ */ jsx6("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsx6("div", { className: "w-5 h-5 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx6("div", { className: "flex gap-2 flex-wrap", children: seasons.map((s) => {
          const active = selectedSeason === s.seasonNumber;
          return /* @__PURE__ */ jsxs6(
            "button",
            {
              onClick: () => {
                setSelectedSeason(s.seasonNumber);
                setSelectedEpisodeId(null);
                setReleases([]);
              },
              className: "text-xs rounded-lg px-3 py-1.5 transition-colors " + (active ? "bg-ndp-accent/25 text-ndp-accent" : "bg-white/5 text-ndp-text-dim hover:bg-white/10"),
              children: [
                s.seasonNumber === 0 ? "Specials" : `Season ${s.seasonNumber}`,
                /* @__PURE__ */ jsxs6("span", { className: "ml-1.5 text-[10px] text-ndp-text-dim", children: [
                  s.episodeFileCount,
                  "/",
                  s.episodeCount
                ] })
              ]
            },
            s.seasonNumber
          );
        }) }),
        scope === "episode" && selectedSeason !== null && /* @__PURE__ */ jsxs6("div", { className: "card max-h-72 overflow-y-auto", children: [
          episodesOfSelectedSeason.map((ep) => {
            const active = selectedEpisodeId === ep.id;
            return /* @__PURE__ */ jsxs6(
              "button",
              {
                onClick: () => {
                  setSelectedEpisodeId(ep.id);
                  setReleases([]);
                },
                className: "w-full text-left px-4 py-2 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors " + (active ? "bg-ndp-accent/10" : "hover:bg-white/[0.03]"),
                children: [
                  /* @__PURE__ */ jsx6("span", { className: "text-xs font-mono text-ndp-text-dim", children: epTag4(ep.seasonNumber, ep.episodeNumber) }),
                  /* @__PURE__ */ jsx6("span", { className: "text-sm text-ndp-text truncate flex-1", children: ep.title || "\u2014" }),
                  ep.hasFile && /* @__PURE__ */ jsx6("span", { className: "text-[10px] text-ndp-success", children: "File" }),
                  !ep.monitored && /* @__PURE__ */ jsx6("span", { className: "text-[10px] text-ndp-text-dim", children: "Unmonitored" })
                ]
              },
              ep.id
            );
          }),
          episodesOfSelectedSeason.length === 0 && /* @__PURE__ */ jsx6("p", { className: "text-xs text-ndp-text-dim text-center py-4", children: "No episodes in this season" })
        ] }),
        /* @__PURE__ */ jsx6("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx6(
          "button",
          {
            onClick: fetchReleases,
            disabled: loadingReleases || scope === "episode" && selectedEpisodeId === null || scope === "season" && selectedSeason === null,
            className: "btn-primary text-sm disabled:opacity-50",
            children: loadingReleases ? /* @__PURE__ */ jsxs6("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx6("span", { className: "w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" }),
              "Fetching releases"
            ] }) : "Fetch releases"
          }
        ) }),
        releases.length > 0 && /* @__PURE__ */ jsx6("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx6("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs6("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx6("thead", { children: /* @__PURE__ */ jsxs6("tr", { className: "border-b border-white/5", children: [
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Title" }),
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px]", children: "Quality" }),
            /* @__PURE__ */ jsx6("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]", children: "Size" }),
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[100px]", children: "Indexer" }),
            /* @__PURE__ */ jsx6("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[60px]", children: "Age" }),
            /* @__PURE__ */ jsx6("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[70px]", children: "S/L" }),
            /* @__PURE__ */ jsx6("th", { className: "text-center px-4 py-3 text-ndp-text-dim font-medium w-[80px]", children: "Status" }),
            /* @__PURE__ */ jsx6("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]" })
          ] }) }),
          /* @__PURE__ */ jsx6("tbody", { children: releases.map((release) => /* @__PURE__ */ jsxs6("tr", { className: "border-b border-white/5 last:border-0", children: [
            /* @__PURE__ */ jsxs6("td", { className: "px-4 py-2", children: [
              /* @__PURE__ */ jsx6("span", { className: "text-ndp-text text-xs break-all line-clamp-2", children: release.title }),
              release.fullSeason && /* @__PURE__ */ jsx6("span", { className: "inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300", children: "Full Season" })
            ] }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-xs text-ndp-text-dim", children: release.quality?.quality?.name || "-" }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-right text-xs text-ndp-text-dim", children: formatSize5(release.size) }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-xs text-ndp-text-dim", children: release.indexer || "-" }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-right text-xs text-ndp-text-dim", children: formatAge(release.age) }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-right text-xs text-ndp-text-dim", children: release.protocol === "torrent" ? release.seeders !== void 0 ? `${release.seeders}/${release.leechers ?? "-"}` : "-" : "-" }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-center", children: release.approved ? /* @__PURE__ */ jsx6("span", { className: "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-success/15 text-ndp-success", children: "Approved" }) : /* @__PURE__ */ jsx6(
              "span",
              {
                className: "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-ndp-error/15 text-ndp-error cursor-help",
                title: release.rejections?.join(", ") || "Rejected",
                children: "Rejected"
              }
            ) }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-right", children: /* @__PURE__ */ jsx6(
              "button",
              {
                onClick: () => handleGrab(release),
                disabled: grabbing === release.guid,
                className: "px-2.5 py-1 rounded-lg text-xs font-medium bg-ndp-accent/20 text-ndp-accent hover:bg-ndp-accent/30 transition-colors disabled:opacity-50",
                children: grabbing === release.guid ? /* @__PURE__ */ jsx6("span", { className: "w-2.5 h-2.5 border border-ndp-accent border-t-transparent rounded-full animate-spin inline-block" }) : "Grab"
              }
            ) })
          ] }, release.guid)) })
        ] }) }) }),
        !loadingReleases && releases.length === 0 && (scope === "episode" ? selectedEpisodeId !== null : selectedSeason !== null) && /* @__PURE__ */ jsx6("div", { className: "card p-6 text-center text-ndp-text-dim text-sm", children: 'Click "Fetch releases" to search.' })
      ] })
    ] }),
    /* @__PURE__ */ jsx6("div", { className: "border-t border-white/5" }),
    /* @__PURE__ */ jsxs6("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx6("h2", { className: "text-lg font-semibold text-ndp-text", children: "Blocklist" }),
        /* @__PURE__ */ jsxs6("span", { className: "text-sm text-ndp-text-dim", children: [
          blocklistTotal,
          " item",
          blocklistTotal !== 1 ? "s" : ""
        ] })
      ] }),
      loadingBlocklist ? /* @__PURE__ */ jsx6("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx6("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) }) : blocklist.length === 0 ? /* @__PURE__ */ jsx6("div", { className: "card p-6 text-center text-ndp-text-dim text-sm", children: "Blocklist is empty" }) : /* @__PURE__ */ jsxs6(Fragment3, { children: [
        /* @__PURE__ */ jsx6("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx6("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs6("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx6("thead", { children: /* @__PURE__ */ jsxs6("tr", { className: "border-b border-white/5", children: [
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium", children: "Source Title" }),
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[180px]", children: "Series" }),
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[110px]", children: "Date" }),
            /* @__PURE__ */ jsx6("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[100px]", children: "Quality" }),
            /* @__PURE__ */ jsx6("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px]" })
          ] }) }),
          /* @__PURE__ */ jsx6("tbody", { children: blocklist.map((item) => /* @__PURE__ */ jsxs6("tr", { className: "border-b border-white/5 last:border-0", children: [
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsx6("span", { className: "text-ndp-text text-xs break-all line-clamp-2", children: item.sourceTitle }) }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-xs text-ndp-text-dim", children: item.series ? `${item.series.title}${item.series.year ? ` (${item.series.year})` : ""}` : `ID ${item.seriesId}` }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-xs text-ndp-text-dim", children: formatDate(item.date) }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-xs text-ndp-text-dim", children: item.quality?.quality?.name || "-" }),
            /* @__PURE__ */ jsx6("td", { className: "px-4 py-2 text-right", children: /* @__PURE__ */ jsx6(
              "button",
              {
                onClick: () => handleRemoveBlocklistItem(item.id),
                disabled: removingId === item.id,
                className: "px-2.5 py-1 rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors disabled:opacity-50",
                children: removingId === item.id ? /* @__PURE__ */ jsx6("span", { className: "w-2.5 h-2.5 border border-ndp-error border-t-transparent rounded-full animate-spin inline-block" }) : "Remove"
              }
            ) })
          ] }, item.id)) })
        ] }) }) }),
        blocklistTotalPages > 1 && /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs6("p", { className: "text-sm text-ndp-text-dim", children: [
            "Page ",
            blocklistPage,
            " of ",
            blocklistTotalPages
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx6(
              "button",
              {
                onClick: () => setBlocklistPage((p) => Math.max(1, p - 1)),
                disabled: blocklistPage <= 1,
                className: "px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors",
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsx6(
              "button",
              {
                onClick: () => setBlocklistPage((p) => Math.min(blocklistTotalPages, p + 1)),
                disabled: blocklistPage >= blocklistTotalPages,
                className: "px-3 py-1.5 rounded-lg text-sm bg-ndp-surface text-ndp-text-dim hover:bg-ndp-surface-light disabled:opacity-40 disabled:pointer-events-none transition-colors",
                children: "Next"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}

// frontend/components/FilesTab.tsx
import { useState as useState7, useEffect as useEffect7, useMemo as useMemo2 } from "react";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function formatSize6(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function FilesTab() {
  const [series, setSeries] = useState7([]);
  const [loading, setLoading] = useState7(true);
  const [error, setError] = useState7(null);
  const [fileRows, setFileRows] = useState7([]);
  const [loadingFiles, setLoadingFiles] = useState7(false);
  const [filterSeriesId, setFilterSeriesId] = useState7("all");
  const [sortKey, setSortKey] = useState7("seriesTitle");
  const [sortDir, setSortDir] = useState7("asc");
  const [deletingId, setDeletingId] = useState7(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState7(null);
  const [renamingId, setRenamingId] = useState7(null);
  const [message, setMessage] = useState7(null);
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3e3);
  };
  useEffect7(() => {
    let cancelled = false;
    fetch("/api/plugins/sonarr/series?pageSize=100", { credentials: "include" }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      return r.json();
    }).then((data) => {
      if (!cancelled) {
        const list = Array.isArray(data?.series) ? data.series : [];
        setSeries(list.filter((s) => s.hasFile));
      }
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Failed to load series");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect7(() => {
    const targets = filterSeriesId === "all" ? series.slice(0, 5) : series.filter((s) => String(s.id) === filterSeriesId);
    if (targets.length === 0) {
      setFileRows([]);
      return;
    }
    let cancelled = false;
    setLoadingFiles(true);
    (async () => {
      const rows = [];
      for (const s of targets) {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/plugins/sonarr/series/${s.id}/files`, { credentials: "include" });
          if (!r.ok) continue;
          const raw = await r.json();
          const files = Array.isArray(raw) ? raw : [];
          for (const f of files) {
            rows.push({
              fileId: f.id,
              seriesId: s.id,
              seriesTitle: s.title,
              seasonNumber: f.seasonNumber,
              path: f.path || f.relativePath || "-",
              size: f.size || 0,
              qualityName: f.quality?.quality?.name || "-",
              videoCodec: f.mediaInfo?.videoCodec || "-",
              audioCodec: f.mediaInfo?.audioCodec ? `${f.mediaInfo.audioCodec}${f.mediaInfo.audioChannels ? ` ${f.mediaInfo.audioChannels}ch` : ""}` : "-",
              resolution: f.mediaInfo?.resolution || "-"
            });
          }
        } catch {
        }
      }
      if (!cancelled) {
        setFileRows(rows);
        setLoadingFiles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [series, filterSeriesId]);
  const sortedRows = useMemo2(() => {
    const result = [...fileRows];
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "size") {
        cmp = a.size - b.size;
      } else {
        const aVal = String(a[sortKey]).toLowerCase();
        const bVal = String(b[sortKey]).toLowerCase();
        cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [fileRows, sortKey, sortDir]);
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const handleDelete = async (row) => {
    setDeletingId(row.fileId);
    try {
      const r = await fetch(`/api/plugins/sonarr/episodefile/${row.fileId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!r.ok) throw new Error("Delete failed");
      setFileRows((prev) => prev.filter((x) => x.fileId !== row.fileId));
      setConfirmDeleteId(null);
      showMessage(`Deleted episode file from ${row.seriesTitle}`, "success");
    } catch {
      showMessage("Failed to delete file", "error");
    }
    setDeletingId(null);
  };
  const handleRename = async (seriesId, title) => {
    setRenamingId(seriesId);
    try {
      const r = await fetch(`/api/plugins/sonarr/series/${seriesId}/rename`, {
        method: "POST",
        credentials: "include"
      });
      if (!r.ok) throw new Error("Rename failed");
      showMessage(`Rename command sent for ${title}`, "success");
    } catch {
      showMessage("Failed to rename files", "error");
    }
    setRenamingId(null);
  };
  const sortIndicator = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };
  if (loading) {
    return /* @__PURE__ */ jsx7("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx7("div", { className: "w-8 h-8 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx7("div", { className: "card p-6 text-center", children: /* @__PURE__ */ jsx7("p", { className: "text-ndp-error", children: error }) });
  }
  return /* @__PURE__ */ jsxs7("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs7("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs7("div", { children: [
        /* @__PURE__ */ jsx7("h2", { className: "text-lg font-semibold text-ndp-text", children: "File Management" }),
        /* @__PURE__ */ jsxs7("p", { className: "text-sm text-ndp-text-dim mt-0.5", children: [
          sortedRows.length,
          " file",
          sortedRows.length !== 1 ? "s" : "",
          filterSeriesId === "all" && series.length > 5 && " (showing first 5 series \u2014 pick one below for a focused view)",
          loadingFiles && " (loading...)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs7(
        "select",
        {
          value: filterSeriesId,
          onChange: (e) => setFilterSeriesId(e.target.value),
          className: "input text-sm min-w-[220px]",
          children: [
            /* @__PURE__ */ jsx7("option", { value: "all", children: "First 5 series" }),
            series.map((s) => /* @__PURE__ */ jsxs7("option", { value: s.id, children: [
              s.title,
              s.year ? ` (${s.year})` : ""
            ] }, s.id))
          ]
        }
      )
    ] }),
    message && /* @__PURE__ */ jsx7("div", { className: "px-4 py-2 rounded-lg text-sm font-medium " + (message.type === "success" ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"), children: message.text }),
    sortedRows.length === 0 && !loadingFiles ? /* @__PURE__ */ jsx7("div", { className: "card p-6 text-center text-ndp-text-dim text-sm", children: "No episode files found" }) : /* @__PURE__ */ jsx7("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx7("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs7("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx7("thead", { children: /* @__PURE__ */ jsxs7("tr", { className: "border-b border-white/5", children: [
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("seriesTitle"),
            children: [
              "Series",
              sortIndicator("seriesTitle")
            ]
          }
        ),
        /* @__PURE__ */ jsx7("th", { className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[60px]", children: "Season" }),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("path"),
            children: [
              "File Path",
              sortIndicator("path")
            ]
          }
        ),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("size"),
            children: [
              "Size",
              sortIndicator("size")
            ]
          }
        ),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px] cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("qualityName"),
            children: [
              "Quality",
              sortIndicator("qualityName")
            ]
          }
        ),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("videoCodec"),
            children: [
              "Video",
              sortIndicator("videoCodec")
            ]
          }
        ),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[90px] cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("audioCodec"),
            children: [
              "Audio",
              sortIndicator("audioCodec")
            ]
          }
        ),
        /* @__PURE__ */ jsxs7(
          "th",
          {
            className: "text-left px-4 py-3 text-ndp-text-dim font-medium w-[80px] cursor-pointer hover:text-ndp-text select-none",
            onClick: () => handleSort("resolution"),
            children: [
              "Res",
              sortIndicator("resolution")
            ]
          }
        ),
        /* @__PURE__ */ jsx7("th", { className: "text-right px-4 py-3 text-ndp-text-dim font-medium w-[140px]", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx7("tbody", { children: sortedRows.map((row) => /* @__PURE__ */ jsxs7("tr", { className: "border-b border-white/5 last:border-0", children: [
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsx7("span", { className: "text-ndp-text font-medium", children: row.seriesTitle }) }),
        /* @__PURE__ */ jsxs7("td", { className: "px-4 py-2 text-ndp-text-dim text-xs", children: [
          "S",
          String(row.seasonNumber).padStart(2, "0")
        ] }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsx7("span", { className: "text-ndp-text-dim text-xs break-all line-clamp-2", children: row.path }) }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-right text-ndp-text-dim", children: formatSize6(row.size) }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-ndp-text-dim", children: row.qualityName }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-ndp-text-dim text-xs", children: row.videoCodec }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-ndp-text-dim text-xs", children: row.audioCodec }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-ndp-text-dim text-xs", children: row.resolution }),
        /* @__PURE__ */ jsx7("td", { className: "px-4 py-2 text-right", children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: () => handleRename(row.seriesId, row.seriesTitle),
              disabled: renamingId === row.seriesId,
              className: "px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-ndp-text-dim hover:bg-white/10 transition-colors disabled:opacity-50",
              children: renamingId === row.seriesId ? /* @__PURE__ */ jsx7("span", { className: "w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" }) : "Rename"
            }
          ),
          confirmDeleteId === row.fileId ? /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx7(
              "button",
              {
                onClick: () => handleDelete(row),
                disabled: deletingId === row.fileId,
                className: "px-2 py-1 rounded-lg text-xs font-medium bg-ndp-error text-white hover:bg-ndp-error/80 transition-colors disabled:opacity-50",
                children: deletingId === row.fileId ? "Deleting" : "Confirm"
              }
            ),
            /* @__PURE__ */ jsx7(
              "button",
              {
                onClick: () => setConfirmDeleteId(null),
                className: "px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-ndp-text-dim hover:bg-white/10 transition-colors",
                children: "Cancel"
              }
            )
          ] }) : /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: () => setConfirmDeleteId(row.fileId),
              className: "px-2 py-1 rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors",
              children: "Delete"
            }
          )
        ] }) })
      ] }, row.fileId)) })
    ] }) }) })
  ] });
}

// frontend/components/DownloadsTab.tsx
import { useState as useState8, useEffect as useEffect8, useCallback as useCallback6, useRef as useRef3 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function formatSize7(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
function formatEpisodeTag(ep) {
  if (!ep) return "";
  const s = String(ep.seasonNumber).padStart(2, "0");
  const e = String(ep.episodeNumber).padStart(2, "0");
  return `S${s}E${e}`;
}
function getStatusColor(status, trackedState) {
  const s = (trackedState || status || "").toLowerCase();
  if (s === "completed" || s === "importpending" || s === "imported") return "text-ndp-success";
  if (s === "failed") return "text-ndp-error";
  if (s === "warning") return "text-yellow-400";
  if (s === "downloading" || s === "delay") return "text-ndp-accent";
  return "text-ndp-text-dim";
}
function getStatusLabel(status, trackedState) {
  const s = trackedState || status || "unknown";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function DownloadsTab() {
  const [queue, setQueue] = useState8([]);
  const [totalRecords, setTotalRecords] = useState8(0);
  const [loading, setLoading] = useState8(true);
  const [error, setError] = useState8(null);
  const [removingId, setRemovingId] = useState8(null);
  const [message, setMessage] = useState8(null);
  const intervalRef = useRef3(null);
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3e3);
  };
  const fetchQueue = useCallback6(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const r = await fetch("/api/plugins/sonarr/queue?page=1&pageSize=50", { credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setQueue(Array.isArray(data?.records) ? data.records : []);
      setTotalRecords(data?.totalRecords || 0);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect8(() => {
    fetchQueue(true);
    intervalRef.current = setInterval(() => fetchQueue(false), 5e3);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQueue]);
  const handleRemove = async (id, blocklist = false) => {
    setRemovingId(id);
    try {
      const params = blocklist ? "?blocklist=true&removeFromClient=true" : "";
      const r = await fetch(`/api/plugins/sonarr/queue/${id}${params}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!r.ok) throw new Error("Remove failed");
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setTotalRecords((prev) => Math.max(0, prev - 1));
      showMessage(blocklist ? "Removed and blocklisted" : "Removed from queue", "success");
    } catch {
      showMessage("Failed to remove from queue", "error");
    }
    setRemovingId(null);
  };
  const totalSize = queue.reduce((sum, item) => sum + item.size, 0);
  return /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 24 }, children: [
    message && /* @__PURE__ */ jsx8(
      "div",
      {
        className: "rounded-lg text-sm font-medium " + (message.type === "success" ? "bg-ndp-success/15 text-ndp-success" : "bg-ndp-error/15 text-ndp-error"),
        style: { padding: "8px 16px" },
        children: message.text
      }
    ),
    /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx8("h2", { className: "text-lg font-semibold text-ndp-text", children: "Active Downloads" }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center", style: { gap: 16 }, children: [
        /* @__PURE__ */ jsxs8("span", { className: "text-sm text-ndp-text-dim", children: [
          totalRecords,
          " item",
          totalRecords !== 1 ? "s" : ""
        ] }),
        totalSize > 0 && /* @__PURE__ */ jsxs8("span", { className: "text-sm text-ndp-text-dim", children: [
          formatSize7(totalSize),
          " total"
        ] })
      ] })
    ] }),
    loading && /* @__PURE__ */ jsx8("div", { className: "flex justify-center", style: { padding: "48px 0" }, children: /* @__PURE__ */ jsx8("div", { className: "w-6 h-6 border-2 border-ndp-accent border-t-transparent rounded-full animate-spin" }) }),
    error && !loading && /* @__PURE__ */ jsxs8("div", { className: "card text-center", style: { padding: 24 }, children: [
      /* @__PURE__ */ jsx8("p", { className: "text-ndp-error text-sm", children: error }),
      /* @__PURE__ */ jsx8(
        "button",
        {
          onClick: () => fetchQueue(true),
          className: "btn-primary text-sm",
          style: { marginTop: 12, padding: "6px 16px" },
          children: "Retry"
        }
      )
    ] }),
    !loading && !error && queue.length === 0 && /* @__PURE__ */ jsx8("div", { className: "card text-center text-ndp-text-dim text-sm", style: { padding: 48 }, children: "No active downloads" }),
    !loading && !error && queue.length > 0 && /* @__PURE__ */ jsx8("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsx8("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs8("table", { className: "w-full text-sm", style: { minWidth: 800 }, children: [
      /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsxs8("tr", { className: "border-b border-white/5", children: [
        /* @__PURE__ */ jsx8("th", { className: "text-left text-ndp-text-dim font-medium", style: { padding: "12px 16px" }, children: "Series / Episode" }),
        /* @__PURE__ */ jsx8("th", { className: "text-left text-ndp-text-dim font-medium", style: { padding: "12px 16px", width: 90 }, children: "Quality" }),
        /* @__PURE__ */ jsx8("th", { className: "text-left text-ndp-text-dim font-medium", style: { padding: "12px 16px", width: 200 }, children: "Progress" }),
        /* @__PURE__ */ jsx8("th", { className: "text-right text-ndp-text-dim font-medium", style: { padding: "12px 16px", width: 80 }, children: "Time Left" }),
        /* @__PURE__ */ jsx8("th", { className: "text-center text-ndp-text-dim font-medium", style: { padding: "12px 16px", width: 100 }, children: "Status" }),
        /* @__PURE__ */ jsx8("th", { className: "text-left text-ndp-text-dim font-medium", style: { padding: "12px 16px", width: 110 }, children: "Client" }),
        /* @__PURE__ */ jsx8("th", { style: { padding: "12px 16px", width: 140 } })
      ] }) }),
      /* @__PURE__ */ jsx8("tbody", { children: queue.map((item) => {
        const progress = item.size > 0 ? (item.size - item.sizeleft) / item.size * 100 : 0;
        const progressPct = Math.min(100, Math.max(0, progress));
        const statusColor = getStatusColor(item.status, item.trackedDownloadState);
        const statusLabel = getStatusLabel(item.status, item.trackedDownloadState);
        const isRemoving = removingId === item.id;
        const epTag5 = formatEpisodeTag(item.episode);
        return /* @__PURE__ */ jsxs8("tr", { className: "border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors", children: [
          /* @__PURE__ */ jsxs8("td", { style: { padding: "10px 16px" }, children: [
            /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx8("span", { className: "text-ndp-text text-sm font-medium", children: item.series?.title || item.title }),
              epTag5 && /* @__PURE__ */ jsx8("span", { className: "text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-ndp-text-dim", children: epTag5 })
            ] }),
            item.episode?.title && /* @__PURE__ */ jsx8("div", { className: "text-xs text-ndp-text-dim mt-0.5 truncate", children: item.episode.title }),
            item.statusMessages && item.statusMessages.length > 0 && /* @__PURE__ */ jsx8("div", { style: { marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }, children: item.statusMessages.map((sm, i) => /* @__PURE__ */ jsx8("div", { children: sm.messages.map((msg, j) => /* @__PURE__ */ jsx8(
              "span",
              {
                className: "text-ndp-text-dim",
                style: { fontSize: 10, lineHeight: "14px", display: "block" },
                children: msg
              },
              j
            )) }, i)) })
          ] }),
          /* @__PURE__ */ jsx8("td", { className: "text-xs text-ndp-text-dim", style: { padding: "10px 16px" }, children: item.quality?.quality?.name || "-" }),
          /* @__PURE__ */ jsxs8("td", { style: { padding: "10px 16px" }, children: [
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx8(
                "div",
                {
                  style: {
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    overflow: "hidden"
                  },
                  children: /* @__PURE__ */ jsx8(
                    "div",
                    {
                      style: {
                        width: `${progressPct}%`,
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: progressPct >= 100 ? "var(--color-ndp-success, #22c55e)" : "var(--color-ndp-accent, #3b82f6)",
                        transition: "width 0.3s ease"
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxs8("span", { className: "text-xs text-ndp-text-dim", style: { minWidth: 38, textAlign: "right" }, children: [
                progressPct.toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs8("div", { className: "text-xs text-ndp-text-dim", style: { marginTop: 2 }, children: [
              formatSize7(item.size - item.sizeleft),
              " / ",
              formatSize7(item.size)
            ] })
          ] }),
          /* @__PURE__ */ jsx8("td", { className: "text-right text-xs text-ndp-text-dim", style: { padding: "10px 16px" }, children: item.timeleft || "-" }),
          /* @__PURE__ */ jsx8("td", { className: "text-center", style: { padding: "10px 16px" }, children: /* @__PURE__ */ jsx8("span", { className: `text-xs font-medium ${statusColor}`, children: statusLabel }) }),
          /* @__PURE__ */ jsx8("td", { className: "text-xs text-ndp-text-dim", style: { padding: "10px 16px" }, children: item.downloadClient || "-" }),
          /* @__PURE__ */ jsx8("td", { style: { padding: "10px 16px" }, children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-end", style: { gap: 6 }, children: [
            /* @__PURE__ */ jsx8(
              "button",
              {
                onClick: () => handleRemove(item.id, false),
                disabled: isRemoving,
                className: "rounded-lg text-xs font-medium bg-white/10 text-ndp-text-dim hover:bg-white/15 hover:text-ndp-text transition-colors disabled:opacity-50",
                style: { padding: "4px 8px", whiteSpace: "nowrap" },
                title: "Remove from queue",
                children: isRemoving ? /* @__PURE__ */ jsx8("span", { className: "w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" }) : "Remove"
              }
            ),
            /* @__PURE__ */ jsx8(
              "button",
              {
                onClick: () => handleRemove(item.id, true),
                disabled: isRemoving,
                className: "rounded-lg text-xs font-medium bg-ndp-error/10 text-ndp-error hover:bg-ndp-error/20 transition-colors disabled:opacity-50",
                style: { padding: "4px 8px", whiteSpace: "nowrap" },
                title: "Remove and add to blocklist",
                children: "Blocklist"
              }
            )
          ] }) })
        ] }, item.id);
      }) })
    ] }) }) })
  ] });
}

// frontend/index.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var TABS = [
  { id: "library", label: "Library" },
  { id: "downloads", label: "Downloads" },
  { id: "analytics", label: "Analytics" },
  { id: "quality", label: "Quality" },
  { id: "releases", label: "Releases" },
  { id: "files", label: "Files" }
];
function getInitialTab() {
  const hash = window.location.hash.replace("#", "");
  if (TABS.some((t) => t.id === hash)) return hash;
  return "library";
}
function SonarrManager() {
  const [activeTab, setActiveTab] = useState9(getInitialTab);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };
  return /* @__PURE__ */ jsxs9("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs9("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs9("svg", { className: "w-6 h-6 text-ndp-accent", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx9("rect", { x: "2", y: "7", width: "20", height: "15", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsx9("polyline", { points: "17 2 12 7 7 2" })
      ] }),
      /* @__PURE__ */ jsx9("h1", { className: "text-2xl font-bold text-ndp-text", children: "Sonarr Manager" })
    ] }),
    /* @__PURE__ */ jsx9("div", { className: "flex gap-2 overflow-x-auto pb-1", style: { scrollbarWidth: "none" }, children: TABS.map(({ id, label }) => /* @__PURE__ */ jsx9(
      "button",
      {
        onClick: () => handleTabChange(id),
        className: "px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap " + (activeTab === id ? "bg-ndp-accent text-white" : "bg-ndp-surface text-ndp-text-muted hover:bg-ndp-surface-light"),
        children: label
      },
      id
    )) }),
    /* @__PURE__ */ jsxs9("div", { className: "animate-fade-in", children: [
      activeTab === "library" && /* @__PURE__ */ jsx9(LibraryTab, {}),
      activeTab === "downloads" && /* @__PURE__ */ jsx9(DownloadsTab, {}),
      activeTab === "analytics" && /* @__PURE__ */ jsx9(AnalyticsTab, {}),
      activeTab === "quality" && /* @__PURE__ */ jsx9(QualityTab, {}),
      activeTab === "releases" && /* @__PURE__ */ jsx9(ReleasesTab, {}),
      activeTab === "files" && /* @__PURE__ */ jsx9(FilesTab, {})
    ] }, activeTab)
  ] });
}
export {
  SonarrManager as default
};
//# sourceMappingURL=index.js.map
