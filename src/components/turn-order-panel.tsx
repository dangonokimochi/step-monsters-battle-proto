import type { BattleState, BattleUnit } from '../types';
import { PixelSprite } from './pixel-sprite';
import './turn-order-panel.css';

interface TurnOrderPanelProps {
  battleState: BattleState;
}

export function TurnOrderPanel({ battleState }: TurnOrderPanelProps) {
  const { units, turnOrder, currentTurnIndex } = battleState;

  const unitMap = new Map<string, BattleUnit>();
  units.forEach((u) => unitMap.set(u.id, u));

  return (
    <div className="turn-order-panel">
      <h3 className="panel-title">
        ターン順 - Round {battleState.round}
      </h3>
      <ul className="turn-list">
        {turnOrder.map((unitId, idx) => {
          const unit = unitMap.get(unitId);
          if (!unit) return null;

          const isCurrent = idx === currentTurnIndex;
          const isDone = idx < currentTurnIndex;

          return (
            <li
              key={unitId}
              className={`turn-item ${isCurrent ? 'turn-current' : ''} ${isDone ? 'turn-done' : ''} ${!unit.isAlive ? 'turn-dead' : ''}`}
            >
              <PixelSprite
                speciesId={unit.speciesId}
                size={20}
                flip={unit.team === 'enemy'}
                className="turn-sprite"
              />
              <span
                className={`turn-name ${unit.team === 'player' ? 'name-player' : 'name-enemy'}`}
              >
                {unit.name}
              </span>
              <span className="turn-spd">SPD {unit.spd}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
