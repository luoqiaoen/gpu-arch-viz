import type { BlockKind } from '../data/gpus';

const COLORS: Record<BlockKind, { active: string; idle: string }> = {
  'compute-cluster': { active: '#2ea043', idle: '#16291b' },
  tensor: { active: '#b3477e', idle: '#5c2a1f' }, // idle tensor = warning hue (wasted area)
  l2: { active: '#3b6e9e', idle: '#1a2a3a' },
  memCtrl: { active: '#6e7a1f', idle: '#2a2d0d' },
  hbm: { active: '#2d7d9e', idle: '#102530' },
  gddr: { active: '#7d47b3', idle: '#241433' },
  interconnect: { active: '#9e7a2d', idle: '#2e2510' },
};

export function blockColor(kind: BlockKind, active: boolean): string {
  return active ? COLORS[kind].active : COLORS[kind].idle;
}
