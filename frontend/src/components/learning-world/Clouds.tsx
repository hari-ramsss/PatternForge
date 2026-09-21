'use client';

import { motion } from 'framer-motion';

const Cloud = ({ x, y, scale = 1, tint = 'white', opacity = .72 }: { x: number; y: number; scale?: number; tint?: string; opacity?: number }) => <g transform={`translate(${x} ${y}) scale(${scale})`} fill={tint} opacity={opacity}><circle cx="0" cy="18" r="19"/><circle cx="24" cy="4" r="27"/><circle cx="55" cy="17" r="21"/><rect x="-2" y="17" width="78" height="22" rx="11"/></g>;

export function Clouds() {
  return <>
    {/* Summer: soft white cumulus */}
    <motion.g animate={{ x: [0, 24, 0] }} transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={118} y={90} scale={.85} />
      <Cloud x={780} y={78} scale={.65} />
    </motion.g>
    <motion.g animate={{ x: [0, -18, 0] }} transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={940} y={210} scale={.52} />
      <Cloud x={360} y={190} scale={.48} />
    </motion.g>
    {/* Autumn: warm, gilded haze drifting over the golden band */}
    <motion.g animate={{ x: [0, -26, 0] }} transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={210} y={1180} scale={.62} tint="#fdf1d8" opacity={.62} />
      <Cloud x={905} y={1310} scale={.5} tint="#f8e6c4" opacity={.55} />
    </motion.g>
    <motion.g animate={{ x: [0, 20, 0] }} transition={{ duration: 46, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={620} y={1650} scale={.44} tint="#f3e3c6" opacity={.45} />
    </motion.g>
    {/* Winter: flat, pale steel clouds over the snowfields */}
    <motion.g animate={{ x: [0, 22, 0] }} transition={{ duration: 52, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={760} y={2280} scale={.6} tint="#e4ebf1" opacity={.6} />
      <Cloud x={150} y={2420} scale={.5} tint="#dfe7ee" opacity={.52} />
    </motion.g>
    <motion.g animate={{ x: [0, -16, 0] }} transition={{ duration: 58, repeat: Infinity, ease: 'easeInOut' }}>
      <Cloud x={430} y={2980} scale={.46} tint="#d9e3ec" opacity={.45} />
    </motion.g>
  </>;
}
