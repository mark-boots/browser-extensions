import { useState, useEffect } from 'react';

export function useBlobUrl(stream) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (stream.platform !== 'youtube') return;

    const embedUrl = `https://www.youtube.com/embed/${stream.videoId}?autoplay=1&mute=1`;
    const html = `<!DOCTYPE html>
<html>
<head>
<style>*{margin:0;padding:0;overflow:hidden}html,body{width:100%;height:100%;background:#000}</style>
</head>
<body>
<iframe
  src="${embedUrl}"
  width="100%" height="100%"
  style="position:absolute;inset:0;border:none"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [stream.platform, stream.videoId]);

  return blobUrl;
}
