import { useState } from 'react';
import { BattleGrid } from './components/battle-grid';
import { TurnOrderPanel } from './components/turn-order-panel';
import { UnitStatusPanel } from './components/unit-status-panel';
import { playerMonsters, enemyMonsters } from './data/monsters';
import { initBattle } from './engine/battle-setup';
import type { BattleState } from './types';
import './App.css';

function App() {
  const [battleState, setBattleState] = useState<BattleState>(() =>
    initBattle(playerMonsters, enemyMonsters),
  );

  const handleRestart = () => {
    setBattleState(initBattle(playerMonsters, enemyMonsters));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Step Monsters Battle</h1>
        <button className="restart-btn" onClick={handleRestart}>
          再配置
        </button>
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
          <BattleGrid battleState={battleState} />
        </div>
        <aside className="side-panel right-panel">
          <TurnOrderPanel battleState={battleState} />
          <UnitStatusPanel
            units={battleState.units}
            team="enemy"
            label="敵"
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
