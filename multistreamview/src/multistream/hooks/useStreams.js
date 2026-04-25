import { useState, useEffect, useCallback } from 'react';
import { loadStreams, saveStreams, onStreamsChanged } from '../utils/storage.js';
import { parseStreamUrl } from '../utils/urlParser.js';

export function useStreams(viewId) {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    loadStreams(viewId).then(setStreams);
    const unsub = onStreamsChanged(viewId, setStreams);
    return unsub;
  }, [viewId]);

  useEffect(() => {
    const missing = streams.filter(s => s.platform === 'youtube' && !s.channelName);
    if (missing.length === 0) return;
    missing.forEach(s => {
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${s.videoId}&format=json`)
        .then(r => r.json())
        .then(data => {
          setStreams(cur => {
            const updated = cur.map(x => x.id === s.id ? { ...x, channelName: data.author_name, title: data.title } : x);
            saveStreams(updated, viewId);
            return updated;
          });
        })
        .catch(() => {});
    });
  }, [streams.map(s => s.id).join(','), viewId]);

  const persist = useCallback((updated) => {
    setStreams(updated);
    saveStreams(updated, viewId);
  }, [viewId]);

  const addStream = useCallback((url) => {
    const parsed = parseStreamUrl(url);
    if (!parsed) return false;

    setStreams((current) => {
      if (current.some((s) => s.id === parsed.id)) return current;
      const hasMain = current.some((s) => s.role === 'main');
      const newStream = { ...parsed, role: hasMain ? 'small' : 'main', addedAt: Date.now() };
      const updated = [...current, newStream];
      saveStreams(updated, viewId);

      if (parsed.platform === 'youtube') {
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.videoId}&format=json`)
          .then(r => r.json())
          .then(data => {
            setStreams(cur => {
              const withName = cur.map(s => s.id === parsed.id ? { ...s, channelName: data.author_name, title: data.title } : s);
              saveStreams(withName, viewId);
              return withName;
            });
          })
          .catch(() => {});
      }

      return updated;
    });
    return true;
  }, [viewId]);

  const removeStream = useCallback((id) => {
    setStreams((current) => {
      const target = current.find((s) => s.id === id);
      if (!target) return current;

      let updated = current.filter((s) => s.id !== id);

      if (target.role === 'main') {
        const pip = updated.find((s) => s.role === 'pip');
        if (pip) {
          updated = updated.map((s) => s.id === pip.id ? { ...s, role: 'main' } : s);
        } else {
          const firstSmall = updated.find((s) => s.role === 'small');
          if (firstSmall) {
            updated = updated.map((s) => s.id === firstSmall.id ? { ...s, role: 'main' } : s);
          }
        }
      }

      saveStreams(updated, viewId);
      return updated;
    });
  }, [viewId]);

  const promoteToMain = useCallback((id) => {
    setStreams((current) => {
      const target  = current.find((s) => s.id === id);
      const curMain = current.find((s) => s.role === 'main');
      const updated = current.map((s) => {
        if (s.id === id)                    return { ...s, role: 'main' };
        if (curMain && s.id === curMain.id) return { ...s, role: target.role };
        return s;
      });
      saveStreams(updated, viewId);
      return updated;
    });
  }, [viewId]);

  const promoteToPip = useCallback((id) => {
    setStreams((current) => {
      const target = current.find((s) => s.id === id);
      const curPip = current.find((s) => s.role === 'pip');
      const updated = current.map((s) => {
        if (s.id === id)                   return { ...s, role: 'pip' };
        if (curPip && s.id === curPip.id)  return { ...s, role: target.role };
        return s;
      });
      saveStreams(updated, viewId);
      return updated;
    });
  }, [viewId]);

  const demoteToSmall = useCallback((id) => {
    setStreams((current) => {
      const target     = current.find((s) => s.id === id);
      const firstSmall = current.find((s) => s.role === 'small' && s.id !== id);
      const updated = current.map((s) => {
        if (s.id === id)                          return { ...s, role: 'small' };
        if (firstSmall && s.id === firstSmall.id) return { ...s, role: target.role };
        return s;
      });
      saveStreams(updated, viewId);
      return updated;
    });
  }, [viewId]);

  const ejectToSmall = useCallback((id) => {
    setStreams((current) => {
      if (!current.find(s => s.id === id)) return current;
      const updated = current.map(s => s.id === id ? { ...s, role: 'small' } : s);
      saveStreams(updated, viewId);
      return updated;
    });
  }, [viewId]);

  return { streams, addStream, removeStream, promoteToMain, promoteToPip, demoteToSmall, ejectToSmall };
}
