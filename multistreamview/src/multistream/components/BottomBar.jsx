import StreamSlot from './StreamSlot.jsx';

export default function BottomBar({ streams, onAction }) {
  if (streams.length === 0) return null;

  return (
    <div className="bottom-bar">
      {streams.map((stream) => (
        <StreamSlot
          key={stream.id}
          stream={stream}
          availableActions={['main', 'pip', 'remove']}
          onAction={(action) => onAction(stream.id, action)}
          className="bottom-slot"
        />
      ))}
    </div>
  );
}
