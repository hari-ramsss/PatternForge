'use client';

import { motion } from 'framer-motion';

const Cloud = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => <g transform={`translate(${x} ${y}) scale(${scale})`} fill="white" opacity=".72"><circle cx="0" cy="18" r="19"/><circle cx="24" cy="4" r="27"/><circle cx="55" cy="17" r="21"/><rect x="-2" y="17" width="78" height="22" rx="11"/></g>;
export function Clouds() {
  return <><motion.g animate={{ x: [0, 24, 0] }} transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}><Cloud x={118} y={90} scale={.85}/><Cloud x={780} y={78} scale={.65}/></motion.g><motion.g animate={{ x: [0, -18, 0] }} transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}><Cloud x={940} y={210} scale={.52}/><Cloud x={360} y={190} scale={.48}/></motion.g></>;
}
