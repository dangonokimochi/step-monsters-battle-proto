import type { BattleState } from '../types';
import { PixelSprite } from './pixel-sprite';
import './placement-panel.css';

interface PlacementPanelProps {
  battleState: BattleState;
  onAutoPlace: () => void;
  onStartBattle: () => void;
}

export function PlacementPanel({
  battleState,
  onAutoPlace,
  onStartBattle,
}: PlacementPanelProps) {
  if (battleState.phase !== 'placement') return null;

  const queue = battleState.placementQueue;
  const nextMonster = queue.length > 0 ? queue[0] : null;
  const placedCount = battleState.units.filter((u) => u.team === 'player').length;
  const totalCount = placedCount + queue.length;

  return (
    <div className="placement-panel">
      <div className="placement-header">
        <h2 className="placement-title">配置フェーズ</h2>
        <span className="placement-count">
          {placedCount} / {totalCount} 配置済み
        </span>
      </div>

      <p className="placement-hint">
        左側のマスをタップしてモンスターを配置
      </p>

      {nextMonster && (
        <div className="placement-next">
          <span className="placement-next-label">次に配置:</span>
          <div className="placement-next-monster">
            <PixelSprite
              speciesId={nextMonster.species.id}
              size={32}
              className="placement-sprite"
            />
            <span className="placement-next-name">{nextMonster.species.name}</span>
          </div>
        </div>
      )}

      {queue.length > 1 && (
        <div className="placement-queue">
          <span className="placement-queue-label">待機中:</span>
          <div className="placement-queue-list">
            {queue.slice(1).map((item, i) => (
              <div key={i} className="placement-queue-item">
                <PixelSprite
                  speciesId={item.species.id}
                  size={24}
                  className="placement-sprite-small"
                />
                <span className="placement-queue-name">{item.species.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="placement-buttons">
        {queue.length > 0 && (
          <button className="placement-btn btn-auto" onClick={onAutoPlace}>
            おまかせ配置
          </button>
        )}
        {battleState.placementReady && (
          <button className="placement-btn btn-start" onClick={onStartBattle}>
            バトル開始!
          </button>
        )}
      </div>
    </div>
  );
}
