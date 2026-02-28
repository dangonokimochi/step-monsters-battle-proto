import type { BattleUnit, BattleState, Position, Skill } from '../types';
import { calcMovablePositions } from './movement';
import { getAttackTargets, manhattanDistance, calcDamage } from './combat';

interface AIDecision {
  moveTarget: Position | null; // 移動先（nullなら移動しない）
  skill: Skill;
  attackTarget: string; // 攻撃対象のユニットID
}

// 予測ダメージ（回避は考慮しない）
function estimateDamage(attacker: BattleUnit, target: BattleUnit, skill: Skill): number {
  if (skill.isHeal) return 0;
  return calcDamage(attacker.atk, target.def, skill.power, skill.defPen);
}

// 敵AIの行動を決定
export function decideEnemyAction(
  unit: BattleUnit,
  state: BattleState,
): AIDecision | null {
  const playerUnits = state.units.filter(
    (u) => u.team === 'player' && u.isAlive,
  );
  if (playerUnits.length === 0) return null;

  // 現在位置から攻撃可能かチェック
  const currentBest = findBestAttack(unit, unit.position, state);

  // 移動可能位置を取得
  const movable = calcMovablePositions(unit, state.grid);

  // 各移動先での最善の攻撃を評価
  let bestDecision: AIDecision | null = null;
  let bestScore = -Infinity;

  // 現在位置での攻撃（移動なし）
  if (currentBest) {
    const score = evaluateAttack(unit, currentBest.target, currentBest.skill, unit.position, state);
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
    // 仮想的にユニットを移動させて攻撃対象を検索
    const movedUnit = { ...unit, position: pos };
    const attack = findBestAttackForMovedUnit(movedUnit, state);

    if (attack) {
      const score = evaluateAttack(unit, attack.target, attack.skill, pos, state);
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

  // 攻撃対象がない場合、最も近い味方に向かって移動
  if (!bestDecision) {
    const closest = findClosestPlayer(unit, playerUnits);
    if (closest && movable.length > 0) {
      // 最も近い味方に近づく移動先を選択
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
        skill: unit.skills[0], // 通常攻撃
        attackTarget: '', // 攻撃対象なし
      };
    }
    return null;
  }

  return bestDecision;
}

// 現在位置から最善の攻撃を探す
function findBestAttack(
  unit: BattleUnit,
  _pos: Position,
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
      // HP最低の味方を優先（集中攻撃）
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

// 移動後ユニットの攻撃候補（gridのunitIdは更新しない簡易版）
function findBestAttackForMovedUnit(
  movedUnit: BattleUnit,
  state: BattleState,
): { skill: Skill; target: BattleUnit } | null {
  let bestScore = 0;
  let bestResult: { skill: Skill; target: BattleUnit } | null = null;

  for (const skill of movedUnit.skills) {
    if (movedUnit.mp < skill.mpCost) continue;
    if (skill.isHeal) continue;

    const targets = getAttackTargets(movedUnit, skill, state.units, state.grid);
    for (const target of targets) {
      if (target.team !== 'player') continue;
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
  _unit: BattleUnit,
  target: BattleUnit,
  skill: Skill,
  _pos: Position,
  _state: BattleState,
): number {
  const dmg = calcDamage(_unit.atk, target.def, skill.power, skill.defPen);
  // 倒せるならボーナス
  const killBonus = target.hp <= dmg ? 500 : 0;
  // HP低い相手優先
  const hpRatio = 1 - target.hp / target.maxHp;
  return dmg + killBonus + hpRatio * 100;
}

function findClosestPlayer(
  unit: BattleUnit,
  players: BattleUnit[],
): BattleUnit | null {
  let closest: BattleUnit | null = null;
  let minDist = Infinity;

  for (const p of players) {
    const dist = manhattanDistance(unit.position, p.position);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }

  return closest;
}
