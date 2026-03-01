import type { MonsterSpecies } from '../types';

// === 味方モンスター ===

const shippuWolf: MonsterSpecies = {
  id: 'shippu-wolf',
  name: '疾風狼',
  tribe: 'beast',
  rarity: 'common',
  emoji: '🐺',
  baseHp: 80,
  baseAtk: 30,
  baseDef: 15,
  baseSpd: 28,
  baseMp: 20,
  baseEva: 15,
  mov: 2,
  skills: [
    { id: 'bite', name: '噛みつき', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'slash' },
    { id: 'gale-slash', name: '疾風斬', range: 1, piercing: false, defPen: 0, mpCost: 5, power: 1.5, effectType: 'slash' },
    { id: 'charge', name: '突進', range: 2, piercing: false, defPen: 0.1, mpCost: 8, power: 1.2, effectType: 'impact' },
  ],
};

const gankouCrab: MonsterSpecies = {
  id: 'gankou-crab',
  name: '岩甲蟹',
  tribe: 'rock',
  rarity: 'common',
  emoji: '🦀',
  baseHp: 130,
  baseAtk: 18,
  baseDef: 35,
  baseSpd: 10,
  baseMp: 15,
  baseEva: 3,
  mov: 1,
  skills: [
    { id: 'rock-crush', name: '岩砕き', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'impact' },
    { id: 'stone-throw', name: '石投げ', range: 2, piercing: true, defPen: 0, mpCost: 6, power: 0.8, effectType: 'projectile' },
  ],
};

const yuutouka: MonsterSpecies = {
  id: 'yuutouka',
  name: '幽灯火',
  tribe: 'spirit',
  rarity: 'common',
  emoji: '👻',
  baseHp: 60,
  baseAtk: 28,
  baseDef: 10,
  baseSpd: 22,
  baseMp: 40,
  baseEva: 20,
  mov: 2,
  skills: [
    { id: 'spirit-fire', name: '霊火', range: 2, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'spirit' },
    { id: 'will-o-wisp', name: '鬼火弾', range: 2, piercing: false, defPen: 0.3, mpCost: 8, power: 1.3, effectType: 'fire' },
    { id: 'grudge-flame', name: '怨念の炎', range: 3, piercing: true, defPen: 0.5, mpCost: 15, power: 1.5, effectType: 'fire' },
    { id: 'soul-lamp', name: '魂の灯', range: 2, piercing: true, defPen: 0, mpCost: 10, power: 0, isHeal: true, healAmount: 20, effectType: 'heal' },
  ],
};

const koryuu: MonsterSpecies = {
  id: 'koryuu',
  name: '仔竜',
  tribe: 'dragon',
  rarity: 'common',
  emoji: '🐉',
  baseHp: 100,
  baseAtk: 25,
  baseDef: 22,
  baseSpd: 18,
  baseMp: 30,
  baseEva: 8,
  mov: 2,
  skills: [
    { id: 'tail-strike', name: '尾撃', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'impact' },
    { id: 'fire-breath', name: '火炎ブレス', range: 2, piercing: false, defPen: 0.2, mpCost: 10, power: 1.4, effectType: 'breath' },
    { id: 'dragon-roar', name: '竜の咆哮', range: 2, piercing: true, defPen: 0.4, mpCost: 15, power: 1.6, effectType: 'breath' },
  ],
};

// === 敵モンスター ===

const garou: MonsterSpecies = {
  id: 'garou',
  name: '餓狼',
  tribe: 'beast',
  rarity: 'common',
  emoji: '🐕',
  baseHp: 75,
  baseAtk: 28,
  baseDef: 12,
  baseSpd: 26,
  baseMp: 15,
  baseEva: 18,
  mov: 2,
  skills: [
    { id: 'fang', name: '牙', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'slash' },
    { id: 'pounce', name: '飛びかかり', range: 2, piercing: false, defPen: 0.05, mpCost: 5, power: 1.3, effectType: 'impact' },
  ],
};

const teppekiTurtle: MonsterSpecies = {
  id: 'teppeki-turtle',
  name: '鉄壁亀',
  tribe: 'rock',
  rarity: 'common',
  emoji: '🐢',
  baseHp: 140,
  baseAtk: 15,
  baseDef: 38,
  baseSpd: 8,
  baseMp: 10,
  baseEva: 2,
  mov: 1,
  skills: [
    { id: 'headbutt', name: '頭突き', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'impact' },
    { id: 'rock-drop', name: '岩落とし', range: 2, piercing: true, defPen: 0, mpCost: 8, power: 0.9, effectType: 'projectile' },
  ],
};

const kageSpider: MonsterSpecies = {
  id: 'kage-spider',
  name: '影蜘蛛',
  tribe: 'spirit',
  rarity: 'common',
  emoji: '🕷️',
  baseHp: 55,
  baseAtk: 22,
  baseDef: 12,
  baseSpd: 24,
  baseMp: 35,
  baseEva: 22,
  mov: 2,
  skills: [
    { id: 'thread-needle', name: '糸針', range: 2, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'projectile' },
    { id: 'dark-thread', name: '暗闘の糸', range: 2, piercing: true, defPen: 0.4, mpCost: 10, power: 1.2, effectType: 'spirit' },
    { id: 'poison-fog', name: '毒霧', range: 2, piercing: true, defPen: 0.2, mpCost: 8, power: 0.8, effectType: 'poison' },
  ],
};

const hiryuu: MonsterSpecies = {
  id: 'hiryuu',
  name: '飛竜',
  tribe: 'dragon',
  rarity: 'common',
  emoji: '🦎',
  baseHp: 90,
  baseAtk: 26,
  baseDef: 18,
  baseSpd: 20,
  baseMp: 25,
  baseEva: 12,
  mov: 3,
  skills: [
    { id: 'hook-claw', name: '鉤爪', range: 1, piercing: false, defPen: 0, mpCost: 0, power: 1.0, effectType: 'claw' },
    { id: 'dive', name: '急降下', range: 2, piercing: false, defPen: 0.15, mpCost: 8, power: 1.5, effectType: 'impact' },
    { id: 'flame-wing', name: '炎翼', range: 2, piercing: true, defPen: 0.3, mpCost: 12, power: 1.3, effectType: 'fire' },
  ],
};

// 味方パーティ
export const playerMonsters: MonsterSpecies[] = [
  shippuWolf,
  gankouCrab,
  yuutouka,
  koryuu,
];

// 敵パーティ
export const enemyMonsters: MonsterSpecies[] = [
  garou,
  teppekiTurtle,
  kageSpider,
  hiryuu,
];

// 全モンスター
export const allMonsters: MonsterSpecies[] = [
  ...playerMonsters,
  ...enemyMonsters,
];
