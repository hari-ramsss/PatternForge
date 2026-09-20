'use client';

import { motion } from 'framer-motion';
const Tree = ({ x, y, scale = 1 }: {x:number;y:number;scale?:number}) => <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0 64h14V20H0Z" fill="#8c6239"/><path d="M7-36C-30 2-22 21 7 18 33 21 44 2 7-36Z" fill="#23876d"/><path d="M7-14C-34 32-20 50 7 43 35 49 47 31 7-14Z" fill="#16725e"/><path d="M7 12C-30 63-12 72 7 63 29 72 45 61 7 12Z" fill="#0b5d52"/></g>;
export function Trees() { return <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}><Tree x={60} y={505} scale={1.35}/><Tree x={1100} y={468} scale={1.2}/><Tree x={1018} y={700} scale={1.1}/><Tree x={172} y={695} scale={.85}/><Tree x={909} y={405} scale={.65}/></motion.g>; }
