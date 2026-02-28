import type { BattleUnit, Skill, Position, Grid } from '../types';
import { hasLineOfSight } from './line-of-sight';

// マンハッタン距離
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ダメージ計算（仕様書準拠）
export function calcDamage(
  atk: number,
  def: number,
  power: number,
  defPen: number,
): number {
  const effectiveDef = def * (1 - defPen);
  const damage = atk * power * (100 / (100 + effectiveDef));
  return Math.max(1, Math.round(damage));
}

// 回避判定
export function checkEvasion(eva: number): boolean {
  return Math.random() * 100 < eva;
}

// 射程内の攻撃対象を取得（射線・茂み・高台を考慮）
export function getAttackTargets(
  attacker: BattleUnit,
  skill: Skill,
  allUnits: BattleUnit[],
  grid?: Grid,
): BattleUnit[] {
  // 高台にいるユニットは射程+1
  const attackerTerrain = grid
    ? grid[attacker.position.row][attacker.position.col].terrain
    : 'plain';
  const rangeBonus = attackerTerrain === 'hill' ? 1 : 0;
  const effectiveRange = skill.range + rangeBonus;

  return allUnits.filter((target) => {
    if (!target.isAlive) return false;
    if (target.team === attacker.team && !skill.isHeal) return false;
    if (target.team !== attacker.team && skill.isHeal) return false;

    const dist = manhattanDistance(attacker.position, target.position);
    if (dist > effectiveRange || dist === 0) return false;

    // 茂みの効果：茂みにいるユニットは射線貫通=falseの遠距離攻撃の対象にならない
    if (grid && !skill.isHeal) {
      const targetTerrain = grid[target.position.row][target.position.col].terrain;
      if (
        targetTerrain === 'bush' &&
        !skill.piercing &&
        skill.range >= 2
      ) {
        return false;
      }
    }

    // 射線判定（gridがある場合のみ）
    if (grid && !skill.isHeal) {
      if (!hasLineOfSight(attacker.position, target.position, grid, skill.piercing)) {
        return false;
      }
    }

    return true;
  });
}

// 攻撃可能なスキル一覧
export function getUsableSkills(
  attacker: BattleUnit,
  allUnits: BattleUnit[],
  grid?: Grid,
): { skill: Skill; targets: BattleUnit[] }[] {
  return attacker.skills
    .filter((skill) => attacker.mp >= skill.mpCost)
    .map((skill) => ({
      skill,
      targets: getAttackTargets(attacker, skill, allUnits, grid),
    }))
    .filter(({ targets }) => targets.length > 0);
}

// 攻撃結果
export interface AttackResult {
  attackerId: string;
  targetId: string;
  skillName: string;
  damage: number;
  evaded: boolean;
  isHeal: boolean;
  targetKilled: boolean;
}

// 攻撃実行
export function executeAttack(
  attacker: BattleUnit,
  target: BattleUnit,
  skill: Skill,
): AttackResult {
  if (skill.isHeal) {
    const healAmount = skill.healAmount ?? 0;
    return {
      attackerId: attacker.id,
      targetId: target.id,
      skillName: skill.name,
      damage: healAmount,
      evaded: false,
      isHeal: true,
      targetKilled: false,
    };
  }

  if (checkEvasion(target.eva)) {
    return {
      attackerId: attacker.id,
      targetId: target.id,
      skillName: skill.name,
      damage: 0,
      evaded: true,
      isHeal: false,
      targetKilled: false,
    };
  }

  const damage = calcDamage(attacker.atk, target.def, skill.power, skill.defPen);
  const targetKilled = target.hp - damage <= 0;

  return {
    attackerId: attacker.id,
    targetId: target.id,
    skillName: skill.name,
    damage,
    evaded: false,
    isHeal: false,
    targetKilled,
  };
}
