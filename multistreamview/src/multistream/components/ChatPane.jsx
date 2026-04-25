import { buildChatUrl } from '../utils/embedBuilder.js';

export default function ChatPane({ stream, visible }) {
  const src = buildChatUrl(stream);
  const label = stream.platform === 'youtube'
    ? { name: stream.channelName, title: stream.title }
    : { name: stream.channel, title: null };

  return (
    <div className="chat-pane" style={{ visibility: visible ? 'visible' : 'hidden', pointerEvents: visible ? '' : 'none' }}>
      {(label.name || label.title) && (
        <div className="chat-pane-header">
          {label.name && <span className="chat-pane-channel">{label.name}</span>}
          {label.title && <span className="chat-pane-title">{label.title}</span>}
        </div>
      )}
      <iframe
        src={src}
        title="Chat"
        className="chat-iframe"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="autoplay"
      />
    </div>
  );
}
