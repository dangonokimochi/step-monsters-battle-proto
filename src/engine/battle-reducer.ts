import type { BattleState, BattleLog, Position, Skill } from '../types';
import { calcMovablePositions } from './movement';
import { calcTurnOrder } from './battle-setup';
import { getAttackTargets, executeAttack } from './combat';
import { decideEnemyAction } from './enemy-ai';

// === アクション定義 ===
export type BattleAction =
  | { type: 'SELECT_CELL'; position: Position }
  | { type: 'SKIP_MOVE' }
  | { type: 'SELECT_SKILL'; skillId: string }
  | { type: 'ENEMY_AI_TURN' }
  | { type: 'CANCEL_SKILL' }
  | { type: 'WAIT' }
  | { type: 'START_TURN' };

function findUnitById(state: BattleState, id: string | null) {
  if (!id) return undefined;
  return state.units.find((u) => u.id === id);
}

function getCurrentUnit(state: BattleState) {
  const id = state.turnOrder[state.currentTurnIndex];
  return findUnitById(state, id);
}

function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function addLog(
  state: BattleState,
  message: string,
  type: BattleLog['type'],
): BattleState {
  const id = state.logCounter + 1;
  return {
    ...state,
    battleLog: [...state.battleLog.slice(-99), { id, message, type }],
    logCounter: id,
  };
}

// 勝敗チェック
function checkResult(state: BattleState): BattleState {
  const playerAlive = state.units.some(
    (u) => u.team === 'player' && u.isAlive,
  );
  const enemyAlive = state.units.some(
    (u) => u.team === 'enemy' && u.isAlive,
  );

  if (!enemyAlive) {
    return { ...state, phase: 'result', result: 'win' };
  }
  if (!playerAlive) {
    return { ...state, phase: 'result', result: 'lose' };
  }
  return state;
}

// ターン開始処理
function startTurn(state: BattleState): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit || !unit.isAlive) {
    return advanceTurn(state);
  }

  const movable = calcMovablePositions(unit, state.grid);

  return {
    ...state,
    turnPhase: 'move',
    selectedUnitId: unit.id,
    movablePositions: movable,
    attackableUnitIds: [],
    selectedSkillId: null,
    hasMoved: false,
  };
}

// 次のターンへ
function advanceTurn(state: BattleState): BattleState {
  // 勝敗チェック
  const checked = checkResult(state);
  if (checked.phase === 'result') return checked;

  let nextIndex = state.currentTurnIndex + 1;
  let nextRound = state.round;

  if (nextIndex >= state.turnOrder.length) {
    nextIndex = 0;
    nextRound += 1;
    const newOrder = calcTurnOrder(state.units);
    return startTurn({
      ...state,
      turnOrder: newOrder,
      currentTurnIndex: 0,
      round: nextRound,
    });
  }

  return startTurn({
    ...state,
    currentTurnIndex: nextIndex,
  });
}

// 移動を実行
function moveUnit(state: BattleState, target: Position): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit) return state;

  const isMovable = state.movablePositions.some(
    (p) => posKey(p) === posKey(target),
  );
  if (!isMovable) return state;

  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[unit.position.row][unit.position.col].unitId = null;
  newGrid[target.row][target.col].unitId = unit.id;

  const newUnits = state.units.map((u) =>
    u.id === unit.id ? { ...u, position: { ...target } } : u,
  );

  return {
    ...state,
    grid: newGrid,
    units: newUnits,
    turnPhase: 'action',
    movablePositions: [],
    attackableUnitIds: [],
    selectedSkillId: null,
    hasMoved: true,
  };
}

// スキル選択 → 対象選択フェーズへ
function handleSelectSkill(state: BattleState, skillId: string): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit) return state;

  const skill = unit.skills.find((s) => s.id === skillId);
  if (!skill) return state;
  if (unit.mp < skill.mpCost) return state;

  const targets = getAttackTargets(unit, skill, state.units, state.grid);
  if (targets.length === 0) return state;

  return {
    ...state,
    turnPhase: 'select_target',
    selectedSkillId: skillId,
    attackableUnitIds: targets.map((t) => t.id),
  };
}

// スキル実行（ダメージ適用）
function executeSkill(
  state: BattleState,
  attackerId: string,
  targetId: string,
  skill: Skill,
): BattleState {
  const attacker = state.units.find((u) => u.id === attackerId);
  const target = state.units.find((u) => u.id === targetId);
  if (!attacker || !target) return state;

  const result = executeAttack(attacker, target, skill);

  let newState = state;

  // MP消費
  let newUnits = newState.units.map((u) =>
    u.id === attackerId ? { ...u, mp: u.mp - skill.mpCost } : u,
  );

  if (result.isHeal) {
    // 回復
    newUnits = newUnits.map((u) =>
      u.id === targetId
        ? { ...u, hp: Math.min(u.maxHp, u.hp + result.damage) }
        : u,
    );
    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}のHPが${result.damage}回復!`,
      'heal',
    );
  } else if (result.evaded) {
    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}は回避した!`,
      'miss',
    );
  } else {
    // ダメージ
    newUnits = newUnits.map((u) => {
      if (u.id !== targetId) return u;
      const newHp = Math.max(0, u.hp - result.damage);
      return { ...u, hp: newHp, isAlive: newHp > 0 };
    });

    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}に${result.damage}ダメージ!`,
      'damage',
    );

    if (result.targetKilled) {
      // グリッドから除去
      const deadUnit = newUnits.find((u) => u.id === targetId)!;
      const newGrid = newState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      newGrid[deadUnit.position.row][deadUnit.position.col].unitId = null;

      newState = addLog(
        { ...newState, units: newUnits, grid: newGrid },
        `${target.name}は倒れた!`,
        'kill',
      );
    }
  }

  // ターン終了
  return advanceTurn({
    ...newState,
    units: newState.units, // addLogで更新済み
    attackableUnitIds: [],
    selectedSkillId: null,
  });
}

// セル選択
function handleSelectCell(
  state: BattleState,
  position: Position,
): BattleState {
  if (state.phase !== 'battle') return state;

  const unit = getCurrentUnit(state);
  if (!unit) return state;
  if (unit.team !== 'player') return state;

  if (state.turnPhase === 'move') {
    const isMovable = state.movablePositions.some(
      (p) => posKey(p) === posKey(position),
    );
    if (isMovable) {
      return moveUnit(state, position);
    }
  }

  if (state.turnPhase === 'select_target') {
    // 攻撃対象のマスをタップ
    const cellUnitId = state.grid[position.row][position.col].unitId;
    if (cellUnitId && state.attackableUnitIds.includes(cellUnitId)) {
      const skill = unit.skills.find((s) => s.id === state.selectedSkillId);
      if (skill) {
        return executeSkill(state, unit.id, cellUnitId, skill);
      }
    }
  }

  return state;
}

function handleSkipMove(state: BattleState): BattleState {
  return {
    ...state,
    turnPhase: 'action',
    movablePositions: [],
    attackableUnitIds: [],
    selectedSkillId: null,
  };
}

function handleCancelSkill(state: BattleState): BattleState {
  return {
    ...state,
    turnPhase: 'action',
    attackableUnitIds: [],
    selectedSkillId: null,
  };
}

function handleWait(state: BattleState): BattleState {
  return advanceTurn(state);
}

// 敵AIターン
function handleEnemyAI(state: BattleState): BattleState {
  if (state.phase !== 'battle') return state;

  const unit = getCurrentUnit(state);
  if (!unit || !unit.isAlive || unit.team !== 'enemy') {
    return advanceTurn(state);
  }

  const decision = decideEnemyAction(unit, state);

  if (!decision) {
    // 行動できない場合は待機
    const logged = addLog(state, `${unit.name}は待機した`, 'info');
    return advanceTurn(logged);
  }

  let currentState = state;

  // 移動
  if (decision.moveTarget) {
    currentState = moveUnit(currentState, decision.moveTarget);
  }

  // 攻撃対象がいない場合（移動のみ）
  if (!decision.attackTarget) {
    const logged = addLog(currentState, `${unit.name}は移動した`, 'info');
    return advanceTurn(logged);
  }

  // 攻撃
  return executeSkill(
    currentState,
    unit.id,
    decision.attackTarget,
    decision.skill,
  );
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  switch (action.type) {
    case 'SELECT_CELL':
      return handleSelectCell(state, action.position);
    case 'SKIP_MOVE':
      return handleSkipMove(state);
    case 'SELECT_SKILL':
      return handleSelectSkill(state, action.skillId);
    case 'CANCEL_SKILL':
      return handleCancelSkill(state);
    case 'WAIT':
      return handleWait(state);
    case 'ENEMY_AI_TURN':
      return handleEnemyAI(state);
    case 'START_TURN':
      return startTurn(state);
    default:
      return state;
  }
}
