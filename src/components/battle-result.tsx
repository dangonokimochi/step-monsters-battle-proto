import type { BattleState } from '../types';
import './battle-result.css';

interface BattleResultProps {
  battleState: BattleState;
  onRestart: () => void;
}

export function BattleResult({ battleState, onRestart }: BattleResultProps) {
  if (battleState.phase !== 'result') return null;

  const isWin = battleState.result === 'win';

  return (
    <div className="result-overlay">
      <div className="result-card">
        <h2 className={`result-title ${isWin ? 'result-win' : 'result-lose'}`}>
          {isWin ? '勝利!' : '敗北...'}
        </h2>
        <p className="result-round">Round {battleState.round}で決着</p>
        <button className="result-btn" onClick={onRestart}>
          再戦する
        </button>
      </div>
    </div>
  );
}
