import type { BattleState, Position } from '../types';
import { calcMovablePositions } from './movement';
import { calcTurnOrder } from './battle-setup';

// === アクション定義 ===
export type BattleAction =
  | { type: 'SELECT_CELL'; position: Position }
  | { type: 'SKIP_MOVE' }
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

// ターン開始処理：移動可能範囲を計算
function startTurn(state: BattleState): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit || !unit.isAlive) {
    // 死亡ユニットはスキップ
    return advanceTurn(state);
  }

  const movable = calcMovablePositions(unit, state.grid);

  return {
    ...state,
    turnPhase: 'move',
    selectedUnitId: unit.id,
    movablePositions: movable,
    hasMoved: false,
  };
}

// 次のターンへ進む
function advanceTurn(state: BattleState): BattleState {
  let nextIndex = state.currentTurnIndex + 1;
  let nextRound = state.round;

  // 全員行動済みなら次のラウンド
  if (nextIndex >= state.turnOrder.length) {
    nextIndex = 0;
    nextRound += 1;
    // ターン順を再計算
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

  // 移動可能チェック
  const isMovable = state.movablePositions.some(
    (p) => posKey(p) === posKey(target),
  );
  if (!isMovable) return state;

  // グリッドを更新
  const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[unit.position.row][unit.position.col].unitId = null;
  newGrid[target.row][target.col].unitId = unit.id;

  // ユニット位置を更新
  const newUnits = state.units.map((u) =>
    u.id === unit.id ? { ...u, position: { ...target } } : u,
  );

  return {
    ...state,
    grid: newGrid,
    units: newUnits,
    turnPhase: 'action',
    movablePositions: [],
    hasMoved: true,
  };
}

// セル選択時の処理
function handleSelectCell(state: BattleState, position: Position): BattleState {
  if (state.phase !== 'battle') return state;

  const unit = getCurrentUnit(state);
  if (!unit) return state;

  // 味方ターンでなければ無視（敵AIは後のステップ）
  if (unit.team !== 'player') return state;

  if (state.turnPhase === 'move') {
    // 移動可能なマスをタップした場合
    const isMovable = state.movablePositions.some(
      (p) => posKey(p) === posKey(position),
    );
    if (isMovable) {
      return moveUnit(state, position);
    }
  }

  return state;
}

// 移動スキップ → 行動フェーズへ
function handleSkipMove(state: BattleState): BattleState {
  return {
    ...state,
    turnPhase: 'action',
    movablePositions: [],
  };
}

// 待機 → 次のターンへ
function handleWait(state: BattleState): BattleState {
  return advanceTurn(state);
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
    case 'WAIT':
      return handleWait(state);
    case 'START_TURN':
      return startTurn(state);
    default:
      return state;
  }
}
