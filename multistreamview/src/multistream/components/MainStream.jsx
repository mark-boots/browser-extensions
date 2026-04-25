import StreamSlot from './StreamSlot.jsx';

export default function MainStream({ stream, onAction }) {
  if (!stream) {
    return (
      <div className="main-stream main-stream--empty">
        <p>Add a stream to get started</p>
      </div>
    );
  }

  return (
    <StreamSlot
      stream={stream}
      availableActions={['pip', 'small', 'remove']}
      onAction={onAction}
      className="main-stream"
    />
  );
}
