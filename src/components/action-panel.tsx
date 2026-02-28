import type { BattleState } from '../types';
import './action-panel.css';

interface ActionPanelProps {
  battleState: BattleState;
  onSkipMove: () => void;
  onSelectSkill: (skillId: string) => void;
  onCancelSkill: () => void;
  onWait: () => void;
}

export function ActionPanel({
  battleState,
  onSkipMove,
  onSelectSkill,
  onCancelSkill,
  onWait,
}: ActionPanelProps) {
  const { turnPhase, phase } = battleState;
  if (phase !== 'battle') return null;

  const currentId = battleState.turnOrder[battleState.currentTurnIndex];
  const currentUnit = battleState.units.find((u) => u.id === currentId);
  if (!currentUnit) return null;

  // 敵ターンは思考中表示
  if (currentUnit.team === 'enemy') {
    return (
      <div className="action-panel">
        <div className="action-info">
          <span className="action-unit-emoji">{currentUnit.emoji}</span>
          <span className="action-unit-name enemy-name">{currentUnit.name}</span>
          <span className="action-phase-label enemy-phase">敵ターン</span>
        </div>
        <div className="enemy-thinking">思考中...</div>
      </div>
    );
  }

  const phaseLabel =
    turnPhase === 'move'
      ? '移動フェーズ'
      : turnPhase === 'select_target'
        ? '対象を選択'
        : '行動フェーズ';

  return (
    <div className="action-panel">
      <div className="action-info">
        <span className="action-unit-emoji">{currentUnit.emoji}</span>
        <span className="action-unit-name">{currentUnit.name}</span>
        <span className="action-phase-label">{phaseLabel}</span>
      </div>

      {turnPhase === 'move' && (
        <div className="action-buttons">
          <button className="action-btn btn-skip" onClick={onSkipMove}>
            移動スキップ
          </button>
        </div>
      )}

      {turnPhase === 'action' && (
        <>
          <div className="skill-list">
            {currentUnit.skills.map((skill) => {
              const canUse = currentUnit.mp >= skill.mpCost;
              return (
                <button
                  key={skill.id}
                  className={`skill-btn ${!canUse ? 'skill-disabled' : ''} ${skill.mpCost === 0 ? 'skill-normal' : ''}`}
                  disabled={!canUse}
                  onClick={() => onSelectSkill(skill.id)}
                >
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-info">
                    射程{skill.range}
                    {skill.mpCost > 0 && ` / MP${skill.mpCost}`}
                    {skill.defPen > 0 &&
                      ` / 貫通${Math.round(skill.defPen * 100)}%`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="action-buttons">
            <button className="action-btn btn-wait" onClick={onWait}>
              待機
            </button>
          </div>
        </>
      )}

      {turnPhase === 'select_target' && (
        <div className="action-buttons">
          <span className="target-hint">攻撃対象をタップしてください</span>
          <button className="action-btn btn-cancel" onClick={onCancelSkill}>
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
