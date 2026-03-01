import type { BattleUnit, BattleState, Position, Skill, Team } from '../types';
import { calcMovablePositions } from './movement';
import { getAttackTargets, manhattanDistance, calcDamage } from './combat';

export interface AIDecision {
  moveTarget: Position | null; // 移動先（nullなら移動しない）
  skill: Skill;
  attackTarget: string; // 攻撃対象のユニットID
}

function opposingTeam(team: Team): Team {
  return team === 'player' ? 'enemy' : 'player';
}

// 予測ダメージ（回避は考慮しない）
function estimateDamage(attacker: BattleUnit, target: BattleUnit, skill: Skill): number {
  if (skill.isHeal) return 0;
  return calcDamage(attacker.atk, target.def, skill.power, skill.defPen);
}

// AIの行動を決定（両チーム共通）
export function decideAction(
  unit: BattleUnit,
  state: BattleState,
): AIDecision | null {
  const enemyTeam = opposingTeam(unit.team);
  const enemies = state.units.filter(
    (u) => u.team === enemyTeam && u.isAlive,
  );
  if (enemies.length === 0) return null;

  // 現在位置から攻撃可能かチェック
  const currentBest = findBestAttack(unit, state);

  // 移動可能位置を取得
  const movable = calcMovablePositions(unit, state.grid);

  // 各移動先での最善の攻撃を評価
  let bestDecision: AIDecision | null = null;
  let bestScore = -Infinity;

  // 現在位置での攻撃（移動なし）
  if (currentBest) {
    const score = evaluateAttack(unit, currentBest.target, currentBest.skill);
    if (score > bestScore) {
      bestScore = score;
      bestDecision = {
        moveTarget: null,
        skill: currentBest.skill,
        attackTarget: currentBest.target.id,
      };
    }
  }

  // 各移動先を評価
  for (const pos of movable) {
    const movedUnit = { ...unit, position: pos };
    const attack = findBestAttackForMovedUnit(movedUnit, unit.team, state);

    if (attack) {
      const score = evaluateAttack(unit, attack.target, attack.skill);
      if (score > bestScore) {
        bestScore = score;
        bestDecision = {
          moveTarget: pos,
          skill: attack.skill,
          attackTarget: attack.target.id,
        };
      }
    }
  }

  // 攻撃対象がない場合、最も近い敵に向かって移動
  if (!bestDecision) {
    const closest = findClosestEnemy(unit, enemies);
    if (closest && movable.length > 0) {
      let bestPos = movable[0];
      let bestDist = Infinity;
      for (const pos of movable) {
        const dist = manhattanDistance(pos, closest.position);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = pos;
        }
      }

      return {
        moveTarget: bestPos,
        skill: unit.skills[0],
        attackTarget: '', // 攻撃対象なし
      };
    }
    return null;
  }

  return bestDecision;
}

// 後方互換性のためのエイリアス
export function decideEnemyAction(
  unit: BattleUnit,
  state: BattleState,
): AIDecision | null {
  return decideAction(unit, state);
}

// 現在位置から最善の攻撃を探す
function findBestAttack(
  unit: BattleUnit,
  state: BattleState,
): { skill: Skill; target: BattleUnit } | null {
  let bestDamage = 0;
  let bestResult: { skill: Skill; target: BattleUnit } | null = null;

  for (const skill of unit.skills) {
    if (unit.mp < skill.mpCost) continue;
    if (skill.isHeal) continue;

    const targets = getAttackTargets(unit, skill, state.units, state.grid);
    for (const target of targets) {
      const dmg = estimateDamage(unit, target, skill);
      const priorityBonus = target.hp <= dmg ? 1000 : (1 - target.hp / target.maxHp) * 100;
      const score = dmg + priorityBonus;

      if (score > bestDamage) {
        bestDamage = score;
        bestResult = { skill, target };
      }
    }
  }

  return bestResult;
}

// 移動後ユニットの攻撃候補
function findBestAttackForMovedUnit(
  movedUnit: BattleUnit,
  team: Team,
  state: BattleState,
): { skill: Skill; target: BattleUnit } | null {
  const enemyTeam = opposingTeam(team);
  let bestScore = 0;
  let bestResult: { skill: Skill; target: BattleUnit } | null = null;

  for (const skill of movedUnit.skills) {
    if (movedUnit.mp < skill.mpCost) continue;
    if (skill.isHeal) continue;

    const targets = getAttackTargets(movedUnit, skill, state.units, state.grid);
    for (const target of targets) {
      if (target.team !== enemyTeam) continue;
      const dmg = estimateDamage(movedUnit, target, skill);
      const priorityBonus = target.hp <= dmg ? 1000 : (1 - target.hp / target.maxHp) * 100;
      const score = dmg + priorityBonus;

      if (score > bestScore) {
        bestScore = score;
        bestResult = { skill, target };
      }
    }
  }

  return bestResult;
}

function evaluateAttack(
  unit: BattleUnit,
  target: BattleUnit,
  skill: Skill,
): number {
  const dmg = calcDamage(unit.atk, target.def, skill.power, skill.defPen);
  const killBonus = target.hp <= dmg ? 500 : 0;
  const hpRatio = 1 - target.hp / target.maxHp;
  return dmg + killBonus + hpRatio * 100;
}

function findClosestEnemy(
  unit: BattleUnit,
  enemies: BattleUnit[],
): BattleUnit | null {
  let closest: BattleUnit | null = null;
  let minDist = Infinity;

  for (const e of enemies) {
    const dist = manhattanDistance(unit.position, e.position);
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  }

  return closest;
}
