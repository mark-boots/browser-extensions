const TWITCH_RESERVED = new Set([
  'videos', 'directory', 'settings', 'wallet', 'jobs', 'p', 'turbo',
  'bits', 'prime', 'subscriptions', 'logout', 'downloads', 'brand',
  'user', 'payments', 'drops', 'inventory', 'friends', 'messages',
]);

const KICK_RESERVED = new Set([
  'categories', 'search', 'following', 'top', 'recommended',
  'browse', 'privacy-policy', 'terms-of-service', 'contact-us',
]);

export function parseStreamUrl(rawUrl) {
  try {
    const raw = rawUrl.trim();
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtube.com') {
      // /watch?v=ID
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return { platform: 'youtube', videoId: v, channel: null, id: `yt_${v}` };
      }
      // /live/ID
      const liveMatch = u.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) {
        return { platform: 'youtube', videoId: liveMatch[1], channel: null, id: `yt_${liveMatch[1]}` };
      }
    }

    if (host === 'youtu.be') {
      const videoId = u.pathname.slice(1).split(/[/?]/)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return { platform: 'youtube', videoId, channel: null, id: `yt_${videoId}` };
      }
    }

    if (host === 'twitch.tv' || host === 'twitch.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 1 && !TWITCH_RESERVED.has(parts[0])) {
        const channel = parts[0].toLowerCase();
        if (/^[a-zA-Z0-9_]{1,25}$/.test(channel)) {
          return { platform: 'twitch', videoId: null, channel, id: `tw_${channel}` };
        }
      }
    }

    if (host === 'kick.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 1 && !KICK_RESERVED.has(parts[0])) {
        const channel = parts[0].toLowerCase();
        if (/^[a-zA-Z0-9_]{1,25}$/.test(channel)) {
          return { platform: 'kick', videoId: null, channel, id: `kk_${channel}` };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
