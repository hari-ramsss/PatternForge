import { WORLD_HEIGHT } from './seasons';

export function Sky() {
  return <>
    <defs>
      {/* One continuous sky: summer blue -> late-summer haze -> autumn gold -> frost -> winter steel */}
      <linearGradient id="world-sky" x1="0" x2="0" y1="0" y2="1">
        <stop stopColor="#a9ddf2" />
        <stop offset=".16" stopColor="#dcf1e9" />
        <stop offset=".30" stopColor="#f7eec4" />
        <stop offset=".44" stopColor="#f2d79f" />
        <stop offset=".56" stopColor="#ecd6b2" />
        <stop offset=".68" stopColor="#dfe6e6" />
        <stop offset=".82" stopColor="#cfdfea" />
        <stop offset="1" stopColor="#bcd3e4" />
      </linearGradient>
      <linearGradient id="world-hill" x1="0" x2="1"><stop stopColor="#a9df8e" /><stop offset="1" stopColor="#67ba83" /></linearGradient>
      <radialGradient id="summer-sun-glow"><stop stopColor="#ffe9a4" stopOpacity=".9" /><stop offset=".45" stopColor="#ffe9a4" stopOpacity=".38" /><stop offset="1" stopColor="#ffe9a4" stopOpacity="0" /></radialGradient>
      <radialGradient id="winter-sun-glow"><stop stopColor="#ffffff" stopOpacity=".7" /><stop offset=".5" stopColor="#eef5fa" stopOpacity=".25" /><stop offset="1" stopColor="#eef5fa" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="1200" height={WORLD_HEIGHT} fill="url(#world-sky)" />
    {/* High summer sun */}
    <g>
      <circle cx="1006" cy="150" r="150" fill="url(#summer-sun-glow)" />
      <circle cx="1006" cy="150" r="44" fill="#ffd97a" />
      <circle cx="1006" cy="150" r="34" fill="#ffe6a0" />
    </g>
    {/* Pale, low winter sun */}
    <g opacity=".85">
      <circle cx="196" cy="2440" r="170" fill="url(#winter-sun-glow)" />
      <circle cx="196" cy="2440" r="40" fill="#f6fafc" />
      <circle cx="196" cy="2440" r="30" fill="#ffffff" />
    </g>
  </>;
}
