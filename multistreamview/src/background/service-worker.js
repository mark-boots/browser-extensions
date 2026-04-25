const MULTISTREAM_PAGE = 'multistream/index.html';

// Inject Referer header on YouTube sub-frame requests from this extension.
// YouTube requires a Referer header — extension pages don't send one, causing error 153.
async function setupDynamicRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: [
      {
        id: 1,
        priority: 1,
        condition: {
          initiatorDomains: [chrome.runtime.id],
          requestDomains: ['www.youtube-nocookie.com'],
          resourceTypes: ['sub_frame'],
        },
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'referer', value: 'https://www.youtube-nocookie.com/', operation: 'set' },
          ],
        },
      },
    ],
  });
}

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'msv-main',   title: '⬛ Set as Main',     contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-pip',    title: '⧉ Set as PiP',      contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-eject',  title: '▬ Move to Small',   contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-sep1',   type: 'separator',           contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-corner', title: 'PiP Corner',         contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-corner-top-right',    parentId: 'msv-corner', title: '↗ Top right',    contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-corner-top-left',     parentId: 'msv-corner', title: '↖ Top left',     contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-corner-bottom-right', parentId: 'msv-corner', title: '↘ Bottom right', contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-corner-bottom-left',  parentId: 'msv-corner', title: '↙ Bottom left',  contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-sep2',   type: 'separator',           contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-chat',   title: '💬 Open Chat',       contexts: ['frame'] });
    chrome.contextMenus.create({ id: 'msv-remove', title: '✕ Remove Stream',    contexts: ['frame'] });
  });
}

chrome.runtime.onInstalled.addListener(() => { setupDynamicRules(); setupContextMenus(); });
chrome.runtime.onStartup.addListener(setupDynamicRules);
setupDynamicRules();

function streamIdFromFrameUrl(frameUrl) {
  try {
    const url = new URL(frameUrl);
    if (url.hostname === 'www.youtube.com') {
      const videoId = url.pathname.split('/embed/')[1]?.split('?')[0];
      if (videoId) return `yt_${videoId}`;
    } else if (url.hostname === 'player.twitch.tv') {
      const channel = url.searchParams.get('channel');
      if (channel) return `tw_${channel}`;
    } else if (url.hostname === 'player.kick.com') {
      const channel = url.pathname.split('/').filter(Boolean)[0];
      if (channel) return `kk_${channel}`;
    }
  } catch {}
  return null;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const id = info.menuItemId;
  if (!id.startsWith('msv-')) return;

  const viewId = new URL(tab.url).searchParams.get('view') || 'default';
  const streamId = streamIdFromFrameUrl(info.frameUrl);
  if (!streamId) return;

  if (id.startsWith('msv-corner-')) {
    const corner = id.replace('msv-corner-', '');
    await chrome.storage.local.set({ [`msv_${viewId}_pipCorner`]: corner });
    return;
  }

  if (id === 'msv-chat') {
    await chrome.storage.local.set({ [`msv_${viewId}_activeChatId`]: streamId });
    return;
  }

  const key = `msv_streams_${viewId}`;
  const { [key]: streams = [] } = await chrome.storage.local.get(key);
  const updated = applyStreamAction(streams, streamId, id.replace('msv-', ''));
  if (updated) await chrome.storage.local.set({ [key]: updated });
});

function applyStreamAction(streams, id, action) {
  const target = streams.find(s => s.id === id);
  if (!target) return null;

  if (action === 'main') {
    const curMain = streams.find(s => s.role === 'main');
    return streams.map(s => {
      if (s.id === id) return { ...s, role: 'main' };
      if (curMain && s.id === curMain.id) return { ...s, role: target.role };
      return s;
    });
  }
  if (action === 'pip') {
    const curPip = streams.find(s => s.role === 'pip');
    return streams.map(s => {
      if (s.id === id) return { ...s, role: 'pip' };
      if (curPip && s.id === curPip.id) return { ...s, role: target.role };
      return s;
    });
  }
  if (action === 'eject') {
    return streams.map(s => s.id === id ? { ...s, role: 'small' } : s);
  }
  if (action === 'remove') {
    let updated = streams.filter(s => s.id !== id);
    if (target.role === 'main') {
      const pip = updated.find(s => s.role === 'pip');
      if (pip) {
        updated = updated.map(s => s.id === pip.id ? { ...s, role: 'main' } : s);
      } else {
        const first = updated.find(s => s.role === 'small');
        if (first) updated = updated.map(s => s.id === first.id ? { ...s, role: 'main' } : s);
      }
    }
    return updated;
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ADD_STREAM') {
    handleAddStream(message.stream, message.viewId || 'default')
      .then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function handleAddStream(parsed, viewId) {
  const key = `msv_streams_${viewId}`;
  const { [key]: current = [] } = await chrome.storage.local.get(key);

  if (current.some((s) => s.id === parsed.id)) return;

  const hasMain  = current.some((s) => s.role === 'main');
  const newStream = { ...parsed, role: hasMain ? 'small' : 'main', addedAt: Date.now() };

  await chrome.storage.local.set({ [key]: [...current, newStream] });
  await openOrFocusView(viewId);
}

async function openOrFocusView(viewId) {
  const pageUrl = chrome.runtime.getURL(`${MULTISTREAM_PAGE}?view=${viewId}`);
  const pattern = chrome.runtime.getURL(`${MULTISTREAM_PAGE}*`);
  const allTabs = await chrome.tabs.query({ url: pattern });
  const tab     = allTabs.find(t => new URL(t.url).searchParams.get('view') === viewId);

  if (tab) {
    await chrome.windows.update(tab.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: pageUrl, active: false });
  }
}
