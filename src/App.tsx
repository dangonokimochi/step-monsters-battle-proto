import { useEffect, useReducer } from 'react';
import { BattleGrid } from './components/battle-grid';
import { TurnOrderPanel } from './components/turn-order-panel';
import { UnitStatusPanel } from './components/unit-status-panel';
import { ActionPanel } from './components/action-panel';
import { BattleLogPanel } from './components/battle-log';
import { BattleResult } from './components/battle-result';
import { playerMonsters, enemyMonsters } from './data/monsters';
import { initBattle } from './engine/battle-setup';
import { battleReducer } from './engine/battle-reducer';
import type { Position } from './types';
import './App.css';

function App() {
  const [battleState, dispatch] = useReducer(
    battleReducer,
    null,
    () => initBattle(playerMonsters, enemyMonsters),
  );

  useEffect(() => {
    dispatch({ type: 'START_TURN' });
  }, []);

  const handleCellClick = (position: Position) => {
    dispatch({ type: 'SELECT_CELL', position });
  };

  const handleSkipMove = () => {
    dispatch({ type: 'SKIP_MOVE' });
  };

  const handleSelectSkill = (skillId: string) => {
    dispatch({ type: 'SELECT_SKILL', skillId });
  };

  const handleCancelSkill = () => {
    dispatch({ type: 'CANCEL_SKILL' });
  };

  const handleWait = () => {
    dispatch({ type: 'WAIT' });
  };

  const handleRestart = () => {
    // useReducerをリセットする代わりにページリロード
    window.location.reload();
  };

  // 敵AIターンを自動実行
  useEffect(() => {
    if (battleState.phase !== 'battle') return;
    const currentId = battleState.turnOrder[battleState.currentTurnIndex];
    const currentUnit = battleState.units.find((u) => u.id === currentId);
    if (currentUnit && currentUnit.team === 'enemy' && currentUnit.isAlive) {
      const timer = setTimeout(() => {
        dispatch({ type: 'ENEMY_AI_TURN' });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [battleState.currentTurnIndex, battleState.round, battleState.phase]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Step Monsters Battle</h1>
        <span className="round-label">Round {battleState.round}</span>
      </header>
      <main className="app-main">
        <aside className="side-panel left-panel">
          <UnitStatusPanel
            units={battleState.units}
            team="player"
            label="味方"
          />
        </aside>
        <div className="center-area">
          <BattleGrid
            battleState={battleState}
            onCellClick={handleCellClick}
          />
          <ActionPanel
            battleState={battleState}
            onSkipMove={handleSkipMove}
            onSelectSkill={handleSelectSkill}
            onCancelSkill={handleCancelSkill}
            onWait={handleWait}
          />
        </div>
        <aside className="side-panel right-panel">
          <TurnOrderPanel battleState={battleState} />
          <UnitStatusPanel
            units={battleState.units}
            team="enemy"
            label="敵"
          />
          <BattleLogPanel logs={battleState.battleLog} />
        </aside>
      </main>
      <BattleResult battleState={battleState} onRestart={handleRestart} />
    </div>
  );
}

export default App;
