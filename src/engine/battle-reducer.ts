import type { BattleState, BattleLog, Position, Skill, DamagePopup, BattleSpeed } from '../types';
import { calcMovablePositions } from './movement';
import { calcTurnOrder, createBattleUnit, canPlaceAt, autoPlaceRemaining } from './battle-setup';
import { executeAttack } from './combat';
import { decideAction } from './enemy-ai';

// === アクション定義 ===
export type BattleAction =
  | { type: 'PLACE_UNIT'; position: Position }
  | { type: 'AUTO_PLACE' }
  | { type: 'REMOVE_UNIT'; position: Position }
  | { type: 'START_BATTLE' }
  | { type: 'AUTO_TICK' }
  | { type: 'CLEAR_ANIMATION' }
  | { type: 'SET_SPEED'; speed: BattleSpeed }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'START_TURN' }
  | { type: 'CLEAR_POPUPS' }
  // 後方互換性（使わないが型エラー防止）
  | { type: 'SELECT_CELL'; position: Position }
  | { type: 'SKIP_MOVE' }
  | { type: 'SELECT_SKILL'; skillId: string }
  | { type: 'CANCEL_SKILL' }
  | { type: 'WAIT' }
  | { type: 'ENEMY_AI_TURN' };

function findUnitById(state: BattleState, id: string | null) {
  if (!id) return undefined;
  return state.units.find((u) => u.id === id);
}

function getCurrentUnit(state: BattleState) {
  const id = state.turnOrder[state.currentTurnIndex];
  return findUnitById(state, id);
}

function addLog(
  state: BattleState,
  message: string,
  type: BattleLog['type'],
  team?: 'player' | 'enemy',
): BattleState {
  const id = state.logCounter + 1;
  return {
    ...state,
    battleLog: [...state.battleLog.slice(-99), { id, message, type, team }],
    logCounter: id,
  };
}

function addPopup(
  state: BattleState,
  position: Position,
  text: string,
  type: DamagePopup['type'],
): BattleState {
  const id = state.popupCounter + 1;
  return {
    ...state,
    damagePopups: [...state.damagePopups, { id, position, text, type }],
    popupCounter: id,
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
    animation: { type: 'turn_start', unitId: unit.id },
  };
}

// 次のターンへ
function advanceTurn(state: BattleState): BattleState {
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

  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[unit.position.row][unit.position.col].unitId = null;
  newGrid[target.row][target.col].unitId = unit.id;

  const from = { ...unit.position };
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
    animation: { type: 'moving', unitId: unit.id, from, to: target },
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
    newUnits = newUnits.map((u) =>
      u.id === targetId
        ? { ...u, hp: Math.min(u.maxHp, u.hp + result.damage) }
        : u,
    );
    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}のHPが${result.damage}回復!`,
      'heal',
      attacker.team,
    );
    newState = addPopup(newState, target.position, `+${result.damage}`, 'heal');
    newState = {
      ...newState,
      animation: { type: 'damaged', targetId, amount: result.damage, resultType: 'heal' },
    };
  } else if (result.evaded) {
    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}は回避した!`,
      'miss',
      attacker.team,
    );
    newState = addPopup(newState, target.position, 'MISS', 'miss');
    newState = {
      ...newState,
      animation: { type: 'damaged', targetId, amount: 0, resultType: 'miss' },
    };
  } else {
    newUnits = newUnits.map((u) => {
      if (u.id !== targetId) return u;
      const newHp = Math.max(0, u.hp - result.damage);
      return { ...u, hp: newHp, isAlive: newHp > 0 };
    });

    newState = addLog(
      { ...newState, units: newUnits },
      `${attacker.name}の${skill.name}! ${target.name}に${result.damage}ダメージ!`,
      'damage',
      attacker.team,
    );
    newState = addPopup(
      newState,
      target.position,
      `${result.damage}`,
      result.targetKilled ? 'kill' : 'damage',
    );
    newState = {
      ...newState,
      animation: {
        type: 'damaged',
        targetId,
        amount: result.damage,
        resultType: result.targetKilled ? 'kill' : 'damage',
      },
    };

    if (result.targetKilled) {
      const deadUnit = newUnits.find((u) => u.id === targetId)!;
      const newGrid = newState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      newGrid[deadUnit.position.row][deadUnit.position.col].unitId = null;

      newState = addLog(
        { ...newState, units: newUnits, grid: newGrid },
        `${target.name}は倒れた!`,
        'kill',
        attacker.team,
      );
    }
  }

  return advanceTurn({
    ...newState,
    units: newState.units,
    attackableUnitIds: [],
    selectedSkillId: null,
  });
}

// === 配置フェーズのハンドラ ===

function handlePlaceUnit(state: BattleState, position: Position): BattleState {
  if (state.phase !== 'placement') return state;
  if (state.placementQueue.length === 0) return state;
  if (!canPlaceAt(state.grid, position)) return state;

  const item = state.placementQueue[0];
  const unit = createBattleUnit(item.species, 'player', position, item.index);

  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[position.row][position.col].unitId = unit.id;

  const newQueue = state.placementQueue.slice(1);

  return {
    ...state,
    grid: newGrid,
    units: [...state.units, unit],
    placementQueue: newQueue,
    placementReady: newQueue.length === 0,
  };
}

function handleRemoveUnit(state: BattleState, position: Position): BattleState {
  if (state.phase !== 'placement') return state;

  const cell = state.grid[position.row][position.col];
  if (!cell.unitId) return state;

  const unit = state.units.find((u) => u.id === cell.unitId);
  if (!unit || unit.team !== 'player') return state;

  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[position.row][position.col].unitId = null;

  return {
    ...state,
    grid: newGrid,
    units: state.units.filter((u) => u.id !== cell.unitId),
    placementReady: false,
  };
}

function handleAutoPlace(state: BattleState): BattleState {
  if (state.phase !== 'placement') return state;

  const result = autoPlaceRemaining(state.grid, state.placementQueue, state.units);

  return {
    ...state,
    grid: result.grid,
    units: result.units,
    placementQueue: result.queue,
    placementReady: result.queue.length === 0,
  };
}

function handleStartBattle(state: BattleState): BattleState {
  if (state.phase !== 'placement') return state;
  if (!state.placementReady) return state;

  const turnOrder = calcTurnOrder(state.units);

  const newState: BattleState = {
    ...state,
    phase: 'battle',
    turnOrder,
    currentTurnIndex: 0,
    selectedUnitId: turnOrder[0] ?? null,
    animation: { type: 'idle' },
  };

  return startTurn(newState);
}

// === オートバトルのティック ===
// 1ティック = 1ユニットの行動を完了
function handleAutoTick(state: BattleState): BattleState {
  if (state.phase !== 'battle') return state;
  if (state.isPaused) return state;

  const unit = getCurrentUnit(state);
  if (!unit || !unit.isAlive) {
    return advanceTurn(state);
  }

  // 両チーム共通のAI判断
  const decision = decideAction(unit, state);

  if (!decision) {
    const logged = addLog(state, `${unit.name}は待機した`, 'info', unit.team);
    return advanceTurn(logged);
  }

  let currentState = state;

  // 移動
  if (decision.moveTarget) {
    currentState = moveUnit(currentState, decision.moveTarget);
  }

  // 攻撃対象がいない場合（移動のみ）
  if (!decision.attackTarget) {
    const logged = addLog(currentState, `${unit.name}は移動した`, 'info', unit.team);
    return advanceTurn(logged);
  }

  // 攻撃アニメーション情報をセット
  currentState = {
    ...currentState,
    animation: {
      type: 'attacking',
      attackerId: unit.id,
      targetId: decision.attackTarget,
      skillName: decision.skill.name,
    },
  };

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
    // 配置フェーズ
    case 'PLACE_UNIT':
      return handlePlaceUnit(state, action.position);
    case 'AUTO_PLACE':
      return handleAutoPlace(state);
    case 'REMOVE_UNIT':
      return handleRemoveUnit(state, action.position);
    case 'START_BATTLE':
      return handleStartBattle(state);

    // オートバトル
    case 'AUTO_TICK':
      return handleAutoTick(state);
    case 'CLEAR_ANIMATION':
      return { ...state, animation: { type: 'idle' } };
    case 'SET_SPEED':
      return { ...state, battleSpeed: action.speed };
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };

    // 共通
    case 'START_TURN':
      return startTurn(state);
    case 'CLEAR_POPUPS':
      return { ...state, damagePopups: [] };

    // 後方互換性（何もしない）
    case 'SELECT_CELL':
    case 'SKIP_MOVE':
    case 'SELECT_SKILL':
    case 'CANCEL_SKILL':
    case 'WAIT':
    case 'ENEMY_AI_TURN':
      return state;

    default:
      return state;
  }
}
