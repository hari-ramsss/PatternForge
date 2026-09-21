'use client';

import { hierarchy, tree } from 'd3-hierarchy';
import type { JourneyNode as JourneyNodeData } from '../AlgorithmJourney/JourneyNodeCard';
import { Sky } from './Sky'; import { Clouds } from './Clouds'; import { Mountains } from './Mountains'; import { Hills } from './Hills'; import { Trees } from './Trees'; import { SceneDecorations } from './SceneDecorations'; import { JourneyPath, type WorldPosition } from './JourneyPath'; import { JourneyNode } from './JourneyNode';
import { SeasonalGround } from './SeasonalGround'; import { FallingLeaves } from './FallingLeaves'; import { Snowfall } from './Snowfall'; import { WORLD_HEIGHT } from './seasons';

type GraphBranch = { id: string; children: GraphBranch[] };
type Unit = { category: JourneyNodeData['category']; title: string; eyebrow: string; tone: string; y: number };
const unitMeta: Record<JourneyNodeData['category'], Omit<Unit, 'category' | 'y'>> = {
  foundations: { eyebrow: 'Trail one', title: 'Foundations', tone: '#397e67' },
  'core-patterns': { eyebrow: 'Trail two', title: 'Core patterns', tone: '#dd7d20' },
  'data-structures': { eyebrow: 'Trail three', title: 'Data structures', tone: '#397dbf' },
  'problem-solving': { eyebrow: 'Trail four', title: 'Problem solving', tone: '#7855c7' },
};
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
  // The scenery itself tells the story of the roadmap: a sunny summer start,
  // golden autumn woods with drifting leaves, and cold snowfields at the end.
  return <section className="relative min-h-[3600px] overflow-hidden rounded-[28px] border border-[#d3e0d5] bg-[#eef3ee] shadow-[0_22px_50px_rgba(42,92,72,.12)]" aria-label="Your learning journey"><svg preserveAspectRatio="none" viewBox={`0 0 1200 ${WORLD_HEIGHT}`} className="absolute inset-0 h-full w-full" role="img" aria-label="PatternForge learning world: sunny meadows give way to autumn woods and snowy peaks as you descend"><Sky /><Clouds /><Mountains /><Hills /><SeasonalGround /><FallingLeaves /><Snowfall /><JourneyPath nodes={nodes} positions={positions} /><SceneDecorations /><Trees /></svg><div className="sticky top-5 z-20 mx-7 w-fit rounded-2xl border-2 border-b-4 border-white bg-white/95 px-5 py-3 backdrop-blur"><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#47756e]">PatternForge journey</p><h2 className="mt-1 text-xl font-black tracking-tight text-[#13283a]">One pattern at a time</h2></div>{units.map((unit) => <div key={unit.category} className="absolute left-1/2 z-10 -translate-x-1/2 text-center" style={{ top: `${(unit.y / WORLD_HEIGHT) * 100}%` }}><div className="rounded-2xl border-2 border-b-4 border-white/95 px-5 py-2" style={{ background: unit.tone }}><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/75">{unit.eyebrow}</p><p className="text-sm font-black text-white">{unit.title}</p></div></div>)}{nodes.map((node) => { const position = positions.get(node.id); return position ? <JourneyNode key={node.id} node={node} position={position} selected={selectedNodeId === node.id} onSelect={onSelect} worldHeight={WORLD_HEIGHT} /> : null; })}</section>;
}
