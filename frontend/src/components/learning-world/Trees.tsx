'use client';

import { motion } from 'framer-motion';

// Duolingo-style flora: chunky rounded silhouettes, flat two-tone fills, no
// outlines. Canopies are clusters of circles; the darker "shade" layer sits a
// few units down-right of the "lit" layer so its sliver reads as soft shadow.

type Canopy = { base: string; shade: string; light: string };

const LeafyTree = ({ x, y, scale = 1, canopy }: { x: number; y: number; scale?: number; canopy: Canopy }) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <rect x="-7" y="22" width="14" height="46" rx="6" fill="#8c5a3a" />
  <g fill={canopy.shade}>
    <circle cx="-21" cy="14" r="24" /><circle cx="27" cy="14" r="24" /><circle cx="3" cy="-3" r="30" /><circle cx="-12" cy="-18" r="19" /><circle cx="18" cy="-18" r="19" />
  </g>
  <g fill={canopy.base}>
    <circle cx="-25" cy="8" r="23" /><circle cx="23" cy="8" r="23" /><circle cx="0" cy="-12" r="28" /><circle cx="-16" cy="-25" r="18" /><circle cx="14" cy="-25" r="18" />
  </g>
  <circle cx="-14" cy="-22" r="7" fill={canopy.light} opacity=".75" />
  <circle cx="8" cy="-30" r="5" fill={canopy.light} opacity=".6" />
  <circle cx="20" cy="10" r="4" fill={canopy.shade} opacity=".7" />
  <circle cx="-20" cy="16" r="3.5" fill={canopy.shade} opacity=".7" />
</g>;

// Winter deciduous tree: stubby round-capped branches with snow settled on top.
const BareTree = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M0 68V-16" stroke="#7a5233" strokeWidth="11" strokeLinecap="round" />
  <path d="M0 20-27-6M0 4 28-20M-27-6-39-20M28-20 41-30" stroke="#7a5233" strokeWidth="7" strokeLinecap="round" fill="none" />
  <path d="M2 16-25-10M2 0 25-24M-25-10-36-23M25-24 36-33" stroke="#f4f9fb" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".9" />
  <ellipse cx="0" cy="68" rx="21" ry="7" fill="#f4f9fb" opacity=".85" />
</g>;

// Snow-dusted evergreen: rounded-corner triangle tiers (thick round-joined
// strokes over the fill fake the soft corners), snow caps on each tip.
const FirTree = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <rect x="-6" y="44" width="12" height="24" rx="5" fill="#7a5233" />
  <path d="M0 -52-30 6H30Z" fill="#35785f" stroke="#35785f" strokeWidth="9" strokeLinejoin="round" />
  <path d="M0 -28-38 28H38Z" fill="#2d6b54" stroke="#2d6b54" strokeWidth="10" strokeLinejoin="round" />
  <path d="M0 -4-45 52H45Z" fill="#265e4b" stroke="#265e4b" strokeWidth="11" strokeLinejoin="round" />
  <path d="M0 -52-9 -36H9Z" fill="#f4f9fb" stroke="#f4f9fb" strokeWidth="6" strokeLinejoin="round" />
  <path d="M0 -28-11 -10H11Z" fill="#eef5f8" stroke="#eef5f8" strokeWidth="6" strokeLinejoin="round" opacity=".95" />
  <path d="M0 -4-13 16H13Z" fill="#e7f0f4" stroke="#e7f0f4" strokeWidth="6" strokeLinejoin="round" opacity=".9" />
</g>;

const GREEN: Canopy = { base: '#46b86e', shade: '#2e8f55', light: '#9adf9f' };
const GOLD: Canopy = { base: '#f2b23c', shade: '#d18e22', light: '#ffd97e' };
const RUST: Canopy = { base: '#ef8a3c', shade: '#cf6a1f', light: '#ffc37e' };
const RED: Canopy = { base: '#e4573d', shade: '#b73a26', light: '#ff9d84' };
const AMBER: Canopy = { base: '#e8a83c', shade: '#c4831f', light: '#ffd98e' };

export function Trees() {
  return <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
    {/* Summer meadow */}
    <LeafyTree x={60} y={505} scale={1.35} canopy={GREEN} />
    <LeafyTree x={1100} y={468} scale={1.2} canopy={GREEN} />
    <LeafyTree x={1018} y={700} scale={1.1} canopy={GREEN} />
    <LeafyTree x={172} y={695} scale={.85} canopy={GREEN} />
    <LeafyTree x={909} y={405} scale={.65} canopy={GREEN} />
    {/* Autumn woods */}
    <LeafyTree x={85} y={1180} scale={1.25} canopy={GOLD} />
    <LeafyTree x={1090} y={1120} scale={1.1} canopy={RUST} />
    <LeafyTree x={150} y={1560} scale={1} canopy={RED} />
    <LeafyTree x={1075} y={1620} scale={1.2} canopy={AMBER} />
    <LeafyTree x={90} y={1950} scale={.9} canopy={RUST} />
    {/* First bare trees as the frost sets in */}
    <BareTree x={1085} y={2140} scale={.95} />
    {/* Deep winter: bare oaks and snowy firs */}
    <BareTree x={100} y={2260} scale={1.2} />
    <BareTree x={1100} y={2200} scale={1.05} />
    <FirTree x={230} y={2520} scale={1} />
    <FirTree x={950} y={2560} scale={1.15} />
    <BareTree x={160} y={2760} scale={1.1} />
    <BareTree x={1085} y={2840} scale={1.25} />
    <FirTree x={1020} y={3060} scale={1.2} />
    <FirTree x={70} y={3080} scale={1.05} />
  </motion.g>;
}
