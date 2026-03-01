import type { BattleState, BattleLog, Position, Skill, DamagePopup, BattleSpeed, SkillEffectType } from '../types';
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
  | { type: 'SET_SPEED'; speed: BattleSpeed }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'CLEAR_POPUPS' };

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

// エフェクトタイプのフォールバック
function deriveEffectType(skill: Skill): SkillEffectType {
  if (skill.isHeal) return 'heal';
  if (skill.range === 1) return 'impact';
  return 'projectile';
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

// ターン準備（アニメーションは設定しない）
function prepareTurn(state: BattleState): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit || !unit.isAlive) {
    return advanceTurnRaw(state);
  }

  return {
    ...state,
    turnPhase: 'move',
    selectedUnitId: unit.id,
    movablePositions: calcMovablePositions(unit, state.grid),
    attackableUnitIds: [],
    selectedSkillId: null,
    hasMoved: false,
  };
}

// 次のターンへ（アニメーションは設定しない）
function advanceTurnRaw(state: BattleState): BattleState {
  const checked = checkResult(state);
  if (checked.phase === 'result') return checked;

  let nextIndex = state.currentTurnIndex + 1;
  let nextRound = state.round;

  if (nextIndex >= state.turnOrder.length) {
    nextIndex = 0;
    nextRound += 1;
    const newOrder = calcTurnOrder(state.units);
    return prepareTurn({
      ...state,
      turnOrder: newOrder,
      currentTurnIndex: 0,
      round: nextRound,
    });
  }

  return prepareTurn({
    ...state,
    currentTurnIndex: nextIndex,
  });
}

// 移動を実行（アニメーション設定なし）
function moveUnit(state: BattleState, target: Position): BattleState {
  const unit = getCurrentUnit(state);
  if (!unit) return state;

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

// スキル実行（ダメージ適用のみ、ターン進行しない）
function applySkill(
  state: BattleState,
  attackerId: string,
  targetId: string,
  skill: Skill,
): BattleState {
  const attacker = state.units.find((u) => u.id === attackerId);
  const target = state.units.find((u) => u.id === targetId);
  if (!attacker || !target) return state;

  const result = executeAttack(attacker, target, skill);
  const effectType = skill.effectType ?? deriveEffectType(skill);

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
      animation: { type: 'damaged', targetId, amount: result.damage, resultType: 'heal', effectType },
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
      animation: { type: 'damaged', targetId, amount: 0, resultType: 'miss', effectType },
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
        effectType,
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

  return {
    ...newState,
    attackableUnitIds: [],
    selectedSkillId: null,
  };
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

  const prepared = prepareTurn({
    ...state,
    phase: 'battle',
    turnOrder,
    currentTurnIndex: 0,
    selectedUnitId: turnOrder[0] ?? null,
  });

  return {
    ...prepared,
    animation: { type: 'idle' },
    pendingAction: null,
  };
}

// === オートバトルのステップ式ティック ===
// アニメーション状態に応じて1ステップずつ処理
//
// idle → turn_start（AI判断＋保存）
// turn_start → moving（移動あり）/ attacking（攻撃のみ）/ idle（待機）
// moving → attacking（攻撃あり）/ idle（移動のみ）
// attacking → damaged（スキル実行）
// damaged → idle（次のターンへ）

function handleAutoTick(state: BattleState): BattleState {
  if (state.phase !== 'battle') return state;
  if (state.isPaused) return state;

  const anim = state.animation;

  switch (anim.type) {
    case 'idle': {
      // ポップアップをクリアして新ターン開始
      const cleaned = { ...state, damagePopups: [] as DamagePopup[] };
      const unit = getCurrentUnit(cleaned);
      if (!unit || !unit.isAlive) {
        const advanced = advanceTurnRaw(cleaned);
        if (advanced.phase === 'result') return advanced;
        const nextUnit = getCurrentUnit(advanced);
        if (!nextUnit) return advanced;
        return {
          ...advanced,
          animation: { type: 'idle' },
          pendingAction: null,
        };
      }

      // AI判断を計算して保存
      const decision = decideAction(unit, cleaned);

      return {
        ...cleaned,
        animation: { type: 'turn_start', unitId: unit.id },
        selectedUnitId: unit.id,
        pendingAction: decision ? {
          moveTarget: decision.moveTarget,
          skillName: decision.skill.name,
          skillId: decision.skill.id,
          attackTarget: decision.attackTarget,
          effectType: decision.skill.effectType ?? deriveEffectType(decision.skill),
        } : null,
      };
    }

    case 'turn_start': {
      const pending = state.pendingAction;
      const unit = getCurrentUnit(state);

      if (!pending || !unit) {
        // 行動不能 → 待機してターン進行
        const logged = unit ? addLog(state, `${unit.name}は待機した`, 'info', unit.team) : state;
        const advanced = advanceTurnRaw(logged);
        return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
      }

      if (pending.moveTarget) {
        // 移動あり → moving へ
        const from = { ...unit.position };
        const moved = moveUnit(state, pending.moveTarget);
        return {
          ...moved,
          animation: { type: 'moving', unitId: unit.id, from, to: pending.moveTarget },
        };
      }

      if (pending.attackTarget) {
        // 移動なし・攻撃あり → attacking へ
        return {
          ...state,
          animation: {
            type: 'attacking',
            attackerId: unit.id,
            targetId: pending.attackTarget,
            skillName: pending.skillName,
            effectType: pending.effectType,
          },
        };
      }

      // 移動も攻撃もない（到達不能ケース）
      const logged = addLog(state, `${unit.name}は待機した`, 'info', unit.team);
      const advanced = advanceTurnRaw(logged);
      return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
    }

    case 'moving': {
      const pending = state.pendingAction;
      const unit = getCurrentUnit(state);

      if (pending && pending.attackTarget && unit) {
        // 移動後に攻撃 → attacking へ
        return {
          ...state,
          animation: {
            type: 'attacking',
            attackerId: unit.id,
            targetId: pending.attackTarget,
            skillName: pending.skillName,
            effectType: pending.effectType,
          },
        };
      }

      // 移動のみ
      const logged = unit ? addLog(state, `${unit.name}は移動した`, 'info', unit.team) : state;
      const advanced = advanceTurnRaw(logged);
      return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
    }

    case 'attacking': {
      // スキル実行 → damaged へ（applySkill内でdamagedアニメーションがセットされる）
      const pending = state.pendingAction;
      const unit = getCurrentUnit(state);
      if (!pending || !unit) {
        const advanced = advanceTurnRaw(state);
        return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
      }

      const skill = unit.skills.find((s) => s.id === pending.skillId);
      if (!skill) {
        const advanced = advanceTurnRaw(state);
        return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
      }

      return applySkill(state, unit.id, pending.attackTarget, skill);
    }

    case 'damaged': {
      // ダメージ表示完了 → 次のターンへ
      const advanced = advanceTurnRaw(state);
      return { ...advanced, animation: { type: 'idle' }, pendingAction: null };
    }
  }

  return state;
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
    case 'SET_SPEED':
      return { ...state, battleSpeed: action.speed };
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };

    // 共通
    case 'CLEAR_POPUPS':
      return { ...state, damagePopups: [] };

    default:
      return state;
  }
}
