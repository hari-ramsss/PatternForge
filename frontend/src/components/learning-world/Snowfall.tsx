'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SEASON_BANDS, WORLD_HEIGHT, seededRandom } from './seasons';

// Gentle snowfall for the winter band: flakes sink slowly, drift with the
// wind and flutter much less than autumn leaves do.
type FlakeSpec = {
  x: number; startY: number; fall: number; r: number; opacity: number;
  fallDuration: number; drift: number; swayWidth: number; swayDuration: number; delay: number;
};

function buildFlakes(): FlakeSpec[] {
  const random = seededRandom(20261221);
  return Array.from({ length: 30 }, () => {
    const fall = 460 + random() * 340;
    return {
      x: 40 + random() * 1120,
      startY: SEASON_BANDS.autumn.end - 40 + random() * (WORLD_HEIGHT - SEASON_BANDS.autumn.end - fall),
      fall,
      r: 2 + random() * 3.4,
      opacity: .55 + random() * .4,
      fallDuration: 17 + random() * 16,
      drift: (random() - .5) * 110,
      swayWidth: 10 + random() * 20,
      swayDuration: 3.4 + random() * 3,
      delay: -random() * 26,
    };
  });
}

function Flake({ flake, reducedMotion }: { flake: FlakeSpec; reducedMotion: boolean }) {
  if (reducedMotion) {
    return <circle cx={flake.x + flake.drift * .4} cy={flake.startY + flake.fall * .55} r={flake.r} fill="#ffffff" opacity={flake.opacity} />;
  }
  return (
    <motion.g
      initial={{ y: flake.startY }}
      animate={{ y: [flake.startY, flake.startY + flake.fall] }}
      transition={{ duration: flake.fallDuration, repeat: Infinity, ease: 'linear', delay: flake.delay }}
    >
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, flake.opacity, flake.opacity, 0] }}
        transition={{ duration: flake.fallDuration, times: [0, .08, .86, 1], repeat: Infinity, ease: 'linear', delay: flake.delay }}
      >
        <motion.g
          initial={{ x: 0 }}
          animate={{ x: [0, flake.drift, 0] }}
          transition={{ duration: flake.fallDuration, repeat: Infinity, ease: 'easeInOut', delay: flake.delay }}
        >
          <motion.g
            animate={{ x: [0, flake.swayWidth, -flake.swayWidth * .7, 0] }}
            transition={{ duration: flake.swayDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx={flake.x} cy="0" r={flake.r} fill="#ffffff" />
          </motion.g>
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

export function Snowfall() {
  const reducedMotion = useReducedMotion();
  return <g aria-hidden="true">{buildFlakes().map((flake, index) => <Flake key={index} flake={flake} reducedMotion={!!reducedMotion} />)}</g>;
}
