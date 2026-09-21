import { WORLD_HEIGHT } from './seasons';

// Rolling ground that continuously changes colour with the seasons: green
// meadow at the top, golden autumn in the middle, bare frost, then snow.
// Each band overlaps its neighbours and fades vertically so the transitions
// read as weather turning rather than hard cuts between scenes.
type Band = { id: string; top: number; ridge: string; fill: [string, string]; ridgeOpacity: number };

const BANDS: Band[] = [
  { id: 'ground-summer', top: 640, ridge: '#9ed4d1', fill: ['#8ecf8c', '#c3bd62'], ridgeOpacity: .42 }, // meadow slipping toward late summer
  { id: 'ground-autumn', top: 1240, ridge: '#e2c98f', fill: ['#d8a850', '#c9883c'], ridgeOpacity: .5 },  // full autumn gold and rust
  { id: 'ground-frost', top: 1900, ridge: '#d8b98a', fill: ['#c4853f', '#e3e9e2'], ridgeOpacity: .45 },  // last leaves, first frost
  { id: 'ground-snow', top: 2470, ridge: '#e8f0f3', fill: ['#eef4f6', '#fafcfd'], ridgeOpacity: .7 },    // deep winter snowfield
];

function GroundBand({ band, index }: { band: Band; index: number }) {
  const bottom = index === BANDS.length - 1 ? WORLD_HEIGHT : BANDS[index + 1].top + 180;
  // Wavy ridge line, phase-shifted per band so the hills don't repeat the same silhouette.
  const phase = index * 260;
  const ridge = `M0 ${band.top + 60} C ${180 + phase % 200} ${band.top - 55}, ${420 - phase % 160} ${band.top + 70}, 640 ${band.top + 10} S ${1010 + phase % 120} ${band.top + 80}, 1200 ${band.top + 5} L1200 ${bottom} L0 ${bottom} Z`;
  const ground = `M0 ${band.top + 210} C ${230 - phase % 180} ${band.top + 105}, ${470 + phase % 200} ${band.top + 265}, 700 ${band.top + 190} S ${1040 - phase % 140} ${band.top + 285}, 1200 ${band.top + 205} L1200 ${bottom} L0 ${bottom} Z`;
  return <g>
    <defs>
      <linearGradient id={band.id} x1="0" x2="0" y1="0" y2="1"><stop stopColor={band.fill[0]} /><stop offset="1" stopColor={band.fill[1]} /></linearGradient>
    </defs>
    <path d={ridge} fill={band.ridge} opacity={band.ridgeOpacity} />
    <path d={ground} fill={`url(#${band.id})`} opacity=".92" />
  </g>;
}

export function SeasonalGround() {
  return <g>{BANDS.map((band, index) => <GroundBand key={band.id} band={band} index={index} />)}</g>;
}
