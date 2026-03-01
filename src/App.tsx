import { useEffect, useReducer, useCallback } from 'react';
import { BattleGrid } from './components/battle-grid';
import { TurnOrderPanel } from './components/turn-order-panel';
import { UnitStatusPanel } from './components/unit-status-panel';
import { ActionPanel } from './components/action-panel';
import { PlacementPanel } from './components/placement-panel';
import { BattleLogPanel } from './components/battle-log';
import { BattleResult } from './components/battle-result';
import { playerMonsters, enemyMonsters } from './data/monsters';
import { initBattle } from './engine/battle-setup';
import { battleReducer } from './engine/battle-reducer';
import type { Position, BattleSpeed } from './types';
import './App.css';

// 速度に応じたティック間隔（ms）
function getTickInterval(speed: BattleSpeed): number {
  switch (speed) {
    case 1: return 1200;
    case 2: return 600;
    case 3: return 300;
  }
}

function App() {
  const [battleState, dispatch] = useReducer(
    battleReducer,
    null,
    () => initBattle(playerMonsters, enemyMonsters),
  );

  // === 配置フェーズのハンドラ ===
  const handleCellClick = useCallback((position: Position) => {
    if (battleState.phase === 'placement') {
      dispatch({ type: 'PLACE_UNIT', position });
    }
  }, [battleState.phase]);

  const handleAutoPlace = useCallback(() => {
    dispatch({ type: 'AUTO_PLACE' });
  }, []);

  const handleStartBattle = useCallback(() => {
    dispatch({ type: 'START_BATTLE' });
  }, []);

  // === オートバトルのハンドラ ===
  const handleTogglePause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' });
  }, []);

  const handleSetSpeed = useCallback((speed: BattleSpeed) => {
    dispatch({ type: 'SET_SPEED', speed });
  }, []);

  const handleRestart = () => {
    window.location.reload();
  };

  // ポップアップの自動クリア
  useEffect(() => {
    if (battleState.damagePopups.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_POPUPS' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [battleState.damagePopups]);

  // オートバトルのティックループ
  useEffect(() => {
    if (battleState.phase !== 'battle') return;
    if (battleState.isPaused) return;
    if (battleState.result !== 'none') return;

    const interval = getTickInterval(battleState.battleSpeed);

    const timer = setTimeout(() => {
      dispatch({ type: 'AUTO_TICK' });
    }, interval);

    return () => clearTimeout(timer);
  }, [
    battleState.phase,
    battleState.isPaused,
    battleState.result,
    battleState.currentTurnIndex,
    battleState.round,
    battleState.battleSpeed,
  ]);

  // バトル開始時の初期ターン
  useEffect(() => {
    if (battleState.phase === 'battle' && battleState.turnOrder.length > 0 && battleState.animation.type === 'idle') {
      dispatch({ type: 'START_TURN' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState.phase]);

  const phaseLabel = battleState.phase === 'placement'
    ? '配置フェーズ'
    : battleState.phase === 'result'
      ? '結果'
      : `Round ${battleState.round}`;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Step Monsters Battle</h1>
        <span className="round-label">{phaseLabel}</span>
        {battleState.phase === 'battle' && !battleState.isPaused && (
          <span className="auto-label">AUTO</span>
        )}
      </header>
      <main className="app-main">
        <div className="center-area">
          {battleState.phase === 'battle' && (
            <TurnOrderPanel battleState={battleState} />
          )}
          <BattleGrid
            battleState={battleState}
            onCellClick={handleCellClick}
          />
          {battleState.phase === 'placement' && (
            <PlacementPanel
              battleState={battleState}
              onAutoPlace={handleAutoPlace}
              onStartBattle={handleStartBattle}
            />
          )}
          {battleState.phase === 'battle' && (
            <ActionPanel
              battleState={battleState}
              onTogglePause={handleTogglePause}
              onSetSpeed={handleSetSpeed}
            />
          )}
          <div className="status-row">
            <UnitStatusPanel
              units={battleState.units}
              team="player"
              label="味方"
            />
            <UnitStatusPanel
              units={battleState.units}
              team="enemy"
              label="敵"
            />
          </div>
          {battleState.phase === 'battle' && (
            <BattleLogPanel logs={battleState.battleLog} />
          )}
        </div>
      </main>
      <BattleResult battleState={battleState} onRestart={handleRestart} />
    </div>
  );
}

export default App;
