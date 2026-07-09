export function setFavicon(count: number) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#a855f7');
  grad.addColorStop(1, '#00f5ff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(6, 6, size - 12, size - 12, 14);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2 + 2);
  if (count > 0) {
    const r = 18;
    const cx = size - r - 2;
    const cy = r + 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = `bold ${count > 9 ? 20 : 26}px sans-serif`;
    ctx.fillText(count > 9 ? '9+' : String(count), cx, cy + 1);
  }
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = canvas.toDataURL('image/png');
}
