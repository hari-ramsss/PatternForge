export function Sky() {
  return <>
    <defs>
      <linearGradient id="world-sky" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#bdebf7" /><stop offset=".55" stopColor="#e8f8ec" /><stop offset="1" stopColor="#f8f0d6" /></linearGradient>
      <linearGradient id="world-hill" x1="0" x2="1"><stop stopColor="#a9df8e" /><stop offset="1" stopColor="#67ba83" /></linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#world-sky)" />
  </>;
}
