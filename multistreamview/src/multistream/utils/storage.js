const VIEWS_KEY    = 'msv_views';
const DEFAULT_VIEW = { id: 'default', name: 'Default' };

// ─── Views ────────────────────────────────────────────

export async function loadViews() {
  const result = await chrome.storage.local.get(VIEWS_KEY);
  if (!result[VIEWS_KEY]?.length) {
    const views = [DEFAULT_VIEW];
    await chrome.storage.local.set({ [VIEWS_KEY]: views });
    return views;
  }
  return result[VIEWS_KEY];
}

export async function saveViews(views) {
  await chrome.storage.local.set({ [VIEWS_KEY]: views });
}

// ─── Streams (scoped to a view) ───────────────────────

function streamsKey(viewId) {
  return `msv_streams_${viewId}`;
}

export async function loadStreams(viewId) {
  const key = streamsKey(viewId);
  const result = await chrome.storage.local.get(key);
  return result[key] ?? [];
}

export async function saveStreams(streams, viewId) {
  await chrome.storage.local.set({ [streamsKey(viewId)]: streams });
}

export function onStreamsChanged(viewId, callback) {
  const key = streamsKey(viewId);
  const listener = (changes) => {
    if (key in changes) callback(changes[key].newValue ?? []);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
