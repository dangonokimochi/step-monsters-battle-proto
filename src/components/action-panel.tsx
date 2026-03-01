import type { BattleState, BattleSpeed } from '../types';
import { PixelSprite } from './pixel-sprite';
import './action-panel.css';

interface ActionPanelProps {
  battleState: BattleState;
  onTogglePause: () => void;
  onSetSpeed: (speed: BattleSpeed) => void;
}

export function ActionPanel({
  battleState,
  onTogglePause,
  onSetSpeed,
}: ActionPanelProps) {
  const { phase, isPaused, battleSpeed } = battleState;
  if (phase !== 'battle') return null;

  const currentId = battleState.turnOrder[battleState.currentTurnIndex];
  const currentUnit = battleState.units.find((u) => u.id === currentId);

  return (
    <div className="action-panel">
      {/* 現在行動中のユニット表示 */}
      {currentUnit && currentUnit.isAlive && (
        <div className="action-info">
          <div className="action-unit-display">
            <PixelSprite
              speciesId={currentUnit.speciesId}
              size={28}
              flip={currentUnit.team === 'enemy'}
              className="action-unit-sprite"
            />
            <span className={`action-unit-name ${currentUnit.team === 'enemy' ? 'enemy-name' : ''}`}>
              {currentUnit.name}
            </span>
          </div>
          <span className={`action-phase-label ${currentUnit.team === 'enemy' ? 'enemy-phase' : ''}`}>
            {currentUnit.team === 'player' ? '味方' : '敵'}
          </span>
        </div>
      )}

      {/* オートバトル操作 */}
      <div className="auto-battle-controls">
        <button
          className={`control-btn btn-pause ${isPaused ? 'is-paused' : ''}`}
          onClick={onTogglePause}
        >
          {isPaused ? '再開' : '一時停止'}
        </button>

        <div className="speed-controls">
          <span className="speed-label">速度:</span>
          {([1, 2, 3] as BattleSpeed[]).map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${battleSpeed === speed ? 'speed-active' : ''}`}
              onClick={() => onSetSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
