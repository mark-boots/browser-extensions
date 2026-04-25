
function PlatformIcon({ platform }) {
  if (platform === 'youtube') return (
    <svg className="tab-icon tab-icon--yt" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.6 2 12 2 12 2s-4.6 0-7.3.2c-.6.1-1.9.1-3 1.3C.8 4.3.5 6.2.5 6.2S.2 8.4.2 10.6v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.2 12 21.2 12 21.2s4.6 0 7.3-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1c0-2.1-.3-4.3-.3-4.3zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
    </svg>
  );
  if (platform === 'twitch') return (
    <svg className="tab-icon tab-icon--tw" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  );
  if (platform === 'kick') return (
    <svg className="tab-icon tab-icon--kk" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M2 2h4v7.5l5.5-7.5H17L10.5 10.5 17.5 19H11.5L6 12v7H2z M18 2h4v17h-4z"/>
    </svg>
  );
  return null;
}

export default function ChatTabs({ tabOrder, activeTabId, onTabClick }) {
  return (
    <div className="chat-tabs">
      {tabOrder.map(stream => (
        <div
          key={stream.id}
          className={`chat-tab ${activeTabId === stream.id ? 'chat-tab--active' : ''}`}
          onClick={() => onTabClick(stream.id)}
          title={stream.platform === 'youtube' ? (stream.channelName ?? stream.videoId) : stream.channel}
        >
          <PlatformIcon platform={stream.platform} />
        </div>
      ))}
    </div>
  );
}
