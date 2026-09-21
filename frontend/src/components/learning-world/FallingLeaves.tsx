'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SEASON_BANDS, seededRandom } from './seasons';

// Realistic autumn leaf fall is three movements stacked: a steady downward
// fall, a slow net drift with the wind, and a faster side-to-side flutter
// while the leaf tumbles. Each movement lives in its own <g> so the speeds
// can differ per leaf the way real leaves never sync up.
const LEAF_PATH = 'M0 -10C7 -6 7 4 0 10-7 4-7-6 0 -10Z';
const LEAF_COLORS = ['#e07b2e', '#c9552e', '#e8a83c', '#b8642b', '#d24a2a', '#d98e3f'];

type LeafSpec = {
  x: number; startY: number; fall: number; size: number; color: string;
  fallDuration: number; drift: number; swayWidth: number; swayDuration: number; spinDuration: number; delay: number;
};

function buildLeaves(): LeafSpec[] {
  const random = seededRandom(20260921);
  return Array.from({ length: 30 }, () => {
    const fall = 420 + random() * 320;
    return {
      x: 60 + random() * 1080,
      startY: SEASON_BANDS.summer.end - 80 + random() * (SEASON_BANDS.autumn.end - SEASON_BANDS.summer.end - fall),
      fall,
      size: .65 + random() * .75,
      color: LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)],
      fallDuration: 13 + random() * 11,
      drift: (random() - .5) * 150,
      swayWidth: 24 + random() * 46,
      swayDuration: 2.6 + random() * 2.6,
      spinDuration: 5 + random() * 8,
      delay: -random() * 20,
    };
  });
}

function Leaf({ leaf, reducedMotion }: { leaf: LeafSpec; reducedMotion: boolean }) {
  if (reducedMotion) {
    return <g transform={`translate(${leaf.x + leaf.drift * .4} ${leaf.startY + leaf.fall * .55}) rotate(${Math.abs(leaf.delay) * 17 % 360}) scale(${leaf.size})`}>
      <path d={LEAF_PATH} fill={leaf.color} opacity=".85" />
    </g>;
  }
  return (
    <g transform={`translate(${leaf.x} 0)`}>
      <motion.g
        initial={{ y: leaf.startY }}
        animate={{ y: [leaf.startY, leaf.startY + leaf.fall] }}
        transition={{ duration: leaf.fallDuration, repeat: Infinity, ease: 'linear', delay: leaf.delay }}
      >
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, .95, .95, 0] }}
          transition={{ duration: leaf.fallDuration, times: [0, .08, .84, 1], repeat: Infinity, ease: 'linear', delay: leaf.delay }}
        >
          <motion.g
            initial={{ x: 0 }}
            animate={{ x: [0, leaf.drift, 0] }}
            transition={{ duration: leaf.fallDuration, repeat: Infinity, ease: 'easeInOut', delay: leaf.delay }}
          >
            <motion.g
              animate={{ x: [0, leaf.swayWidth, -leaf.swayWidth * .72, leaf.swayWidth * .45, 0] }}
              transition={{ duration: leaf.swayDuration, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: leaf.spinDuration, repeat: Infinity, ease: 'linear' }}
              >
                <g transform={`scale(${leaf.size})`}>
                  <path d={LEAF_PATH} fill={leaf.color} />
                  <path d="M0 -7V7" stroke="#3a2412" strokeOpacity=".28" strokeWidth="1.4" />
                </g>
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </motion.g>
    </g>
  );
}

export function FallingLeaves() {
  const reducedMotion = useReducedMotion();
  return <g aria-hidden="true">{buildLeaves().map((leaf, index) => <Leaf key={index} leaf={leaf} reducedMotion={!!reducedMotion} />)}</g>;
}
