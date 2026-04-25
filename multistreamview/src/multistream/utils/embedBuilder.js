const TWITCH_PARENT = 'localhost';
const YT_PROXY = 'https://mark-boots.github.io/browser-extensions/youtube-embed.html';

export function buildPlayerUrl(stream) {
  const muted = stream.role === 'small';
  if (stream.platform === 'youtube') {
    return `${YT_PROXY}?v=${stream.videoId}&muted=${muted ? 1 : 0}`;
  }
  if (stream.platform === 'twitch') {
    return `https://player.twitch.tv/?channel=${stream.channel}&parent=${TWITCH_PARENT}&muted=${muted}&autoplay=true`;
  }
  if (stream.platform === 'kick') {
    return `https://player.kick.com/${stream.channel}?autoplay=true&muted=${muted}`;
  }
  return '';
}

export function buildChatUrl(stream) {
  if (stream.platform === 'youtube') {
    return `https://www.youtube.com/live_chat?v=${stream.videoId}&embed_domain=${TWITCH_PARENT}`;
  }
  if (stream.platform === 'twitch') {
    return `https://www.twitch.tv/embed/${stream.channel}/chat?parent=${TWITCH_PARENT}&darkpopout`;
  }
  if (stream.platform === 'kick') {
    return `https://kick.com/${stream.channel}/chatroom`;
  }
  return '';
}
