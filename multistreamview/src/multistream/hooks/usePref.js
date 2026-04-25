import { useState, useEffect, useCallback } from 'react';

/**
 * Like useState but backed by chrome.storage.local, scoped to a view.
 * Stored as msv_{viewId}_{key}.
 */
export function usePref(viewId, key, defaultValue) {
  const storageKey = `msv_${viewId}_${key}`;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(storageKey, (result) => {
      if (result[storageKey] !== undefined) setValue(result[storageKey]);
    });

    function onChanged(changes) {
      if (changes[storageKey] !== undefined) setValue(changes[storageKey].newValue);
    }
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [storageKey]);

  const setPref = useCallback((newValue) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' ? newValue(prev) : newValue;
      chrome.storage.local.set({ [storageKey]: resolved });
      return resolved;
    });
  }, [storageKey]);

  return [value, setPref];
}
