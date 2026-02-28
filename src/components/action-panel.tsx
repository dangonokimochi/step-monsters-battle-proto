import type { BattleState } from '../types';
import './action-panel.css';

interface ActionPanelProps {
  battleState: BattleState;
  onSkipMove: () => void;
  onWait: () => void;
}

export function ActionPanel({
  battleState,
  onSkipMove,
  onWait,
}: ActionPanelProps) {
  const { turnPhase, phase } = battleState;
  if (phase !== 'battle') return null;

  const currentId = battleState.turnOrder[battleState.currentTurnIndex];
  const currentUnit = battleState.units.find((u) => u.id === currentId);
  if (!currentUnit || currentUnit.team !== 'player') return null;

  return (
    <div className="action-panel">
      <div className="action-info">
        <span className="action-unit-emoji">{currentUnit.emoji}</span>
        <span className="action-unit-name">{currentUnit.name}</span>
        <span className="action-phase-label">
          {turnPhase === 'move' ? '移動フェーズ' : '行動フェーズ'}
        </span>
      </div>
      <div className="action-buttons">
        {turnPhase === 'move' && (
          <button className="action-btn btn-skip" onClick={onSkipMove}>
            移動スキップ
          </button>
        )}
        {turnPhase === 'action' && (
          <button className="action-btn btn-wait" onClick={onWait}>
            待機
          </button>
        )}
      </div>
    </div>
  );
}
