'use client';

import { hierarchy, tree } from 'd3-hierarchy';
import type { JourneyNode as JourneyNodeData } from '../AlgorithmJourney/JourneyNodeCard';
import { Sky } from './Sky'; import { Clouds } from './Clouds'; import { Mountains } from './Mountains'; import { Hills } from './Hills'; import { Trees } from './Trees'; import { SceneDecorations } from './SceneDecorations'; import { JourneyPath, type WorldPosition } from './JourneyPath'; import { JourneyNode } from './JourneyNode';

const WORLD_HEIGHT = 3200;
type GraphBranch = { id: string; children: GraphBranch[] };
type Unit = { category: JourneyNodeData['category']; title: string; eyebrow: string; tone: string; y: number };
const unitMeta: Record<JourneyNodeData['category'], Omit<Unit, 'category' | 'y'>> = {
  foundations: { eyebrow: 'Trail one', title: 'Foundations', tone: '#397e67' },
  'core-patterns': { eyebrow: 'Trail two', title: 'Core patterns', tone: '#dd7d20' },
  'data-structures': { eyebrow: 'Trail three', title: 'Data structures', tone: '#397dbf' },
  'problem-solving': { eyebrow: 'Trail four', title: 'Problem solving', tone: '#7855c7' },
};
function ChapterBackdrops() {
  const scene = (y: number, sky: string, hill: string) => <g transform={`translate(0 ${y})`}>
    <path d="M0 100 150-40l125 120L430-90l180 170L770-35l155 115 150-150 125 150v180H0Z" fill="#9ed4d1" opacity=".46" />
    <path d="M0 210c170-100 310-75 455 18 145-112 315-84 425 4 130-85 235-55 320 4v290H0Z" fill={hill} opacity=".76" />
    <path d="M0 390c180-85 345-48 505 28 175-104 385-74 695 8v180H0Z" fill={sky} opacity=".9" />
    <g fill="#f7fcf5" opacity=".8"><path d="M160 100c0-28 23-50 51-50 19 0 36 11 45 27 7-5 16-8 26-8 25 0 45 20 45 45 0 5-1 10-2 14H160Z" /><path d="M900 245c0-23 19-42 42-42 16 0 30 9 37 23 6-4 13-7 22-7 21 0 38 17 38 38 0 4-1 8-2 12H900Z" /></g>
    <g><path d="M78 470h12v-53h18v53h12l-21 28Z" fill="#8c6239" /><path d="M99 350C55 404 62 427 99 422c38 5 45-18 0-72Z" fill="#23876d" /><path d="M99 390C48 455 60 477 99 468c42 9 53-13 0-78Z" fill="#16725e" /><path d="M1060 430h12v-64h20v64h12l-22 30Z" fill="#8c6239" /><path d="M1082 290c-48 61-39 85 0 77 40 8 48-16 0-77Z" fill="#23876d" /><path d="M1082 340c-55 70-41 93 0 83 44 10 58-13 0-83Z" fill="#0b5d52" /></g>
  </g>;
  return <g opacity=".72">{scene(700, '#d1e98d', '#72c496')}{scene(1450, '#e2edbd', '#7ec899')}{scene(2200, '#d1e4ed', '#72bca8')}</g>;
}
function makeLayout(nodes: JourneyNodeData[]) {
  const children = new Map<string, string[]>(); const ids = new Set(nodes.map((node) => node.id));
  nodes.forEach((node) => { const parent = node.prerequisites.find((id) => ids.has(id)); if (parent) children.set(parent, [...(children.get(parent) || []), node.id]); });
  const roots = nodes.filter((node) => !node.prerequisites.some((id) => ids.has(id))).map((node) => node.id);
  const branch = (id: string): GraphBranch => ({ id, children: (children.get(id) || []).map(branch) });
  const root = hierarchy<GraphBranch>({ id: '__root__', children: roots.map(branch) }, (data) => data.children);
  const layout = tree<GraphBranch>().size([650, WORLD_HEIGHT - 260]).separation((a, b) => a.parent === b.parent ? 1.5 : 2.1)(root);
  const positions = new Map<string, WorldPosition>(); const offsets = [0, 115, 165, 105, 0, -110, -165, -105];
  layout.descendants().forEach((point) => { if (point.data.id !== '__root__') positions.set(point.data.id, { x: Math.max(155, Math.min(1045, 600 + offsets[point.depth % offsets.length] + (point.x - 325) * .78)), y: point.y + 120 }); });
  return positions;
}
export function LearningWorld({ nodes, selectedNodeId, onSelect }: { nodes: JourneyNodeData[]; selectedNodeId: string | null; onSelect: (id: string) => void }) {
  const positions = makeLayout(nodes);
  const units: Unit[] = (['foundations', 'core-patterns', 'data-structures', 'problem-solving'] as const).flatMap((category) => { const first = nodes.find((node) => node.category === category); const position = first && positions.get(first.id); return position ? [{ category, y: Math.max(84, position.y - 125), ...unitMeta[category] }] : []; });
  return <section className="relative min-h-[3600px] overflow-hidden rounded-[28px] border border-[#d7e7d1] bg-[#edf7ef] shadow-[0_22px_50px_rgba(42,92,72,.12)]" aria-label="Your learning journey"><svg preserveAspectRatio="none" viewBox={`0 0 1200 ${WORLD_HEIGHT}`} className="absolute inset-0 h-full w-full" role="img" aria-label="PatternForge learning world"><rect width="1200" height={WORLD_HEIGHT} fill="#edf7ef" /><Sky /><Clouds /><Mountains /><Hills /><ChapterBackdrops /><JourneyPath nodes={nodes} positions={positions} /><SceneDecorations /><Trees /></svg><div className="sticky top-5 z-20 mx-7 w-fit rounded-2xl border border-white/85 bg-white/90 px-5 py-3 shadow-sm backdrop-blur"><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#47756e]">PatternForge journey</p><h2 className="mt-1 text-xl font-black tracking-tight text-[#13283a]">One pattern at a time</h2></div>{units.map((unit) => <div key={unit.category} className="absolute left-1/2 z-10 -translate-x-1/2 text-center" style={{ top: `${(unit.y / WORLD_HEIGHT) * 100}%` }}><div className="rounded-2xl border-2 border-white/90 px-5 py-2 shadow-sm" style={{ background: unit.tone }}><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/75">{unit.eyebrow}</p><p className="text-sm font-black text-white">{unit.title}</p></div></div>)}{nodes.map((node) => { const position = positions.get(node.id); return position ? <JourneyNode key={node.id} node={node} position={position} selected={selectedNodeId === node.id} onSelect={onSelect} worldHeight={WORLD_HEIGHT} /> : null; })}</section>;
}
