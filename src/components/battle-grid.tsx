import type { BattleState, BattleUnit, Position, TerrainType, DamagePopup } from '../types';
import { GRID_SIZE } from '../types';
import './battle-grid.css';

function popupClass(type: DamagePopup['type']): string {
  switch (type) {
    case 'damage': return 'popup-damage';
    case 'heal': return 'popup-heal';
    case 'miss': return 'popup-miss';
    case 'kill': return 'popup-kill';
  }
}

interface BattleGridProps {
  battleState: BattleState;
  onCellClick: (position: Position) => void;
}

function terrainClass(terrain: TerrainType): string {
  switch (terrain) {
    case 'rock':
      return 'cell-rock';
    case 'water':
      return 'cell-water';
    case 'bush':
      return 'cell-bush';
    case 'hill':
      return 'cell-hill';
    default:
      return 'cell-plain';
  }
}

function terrainLabel(terrain: TerrainType): string {
  switch (terrain) {
    case 'rock':
      return '🪨';
    case 'water':
      return '💧';
    case 'bush':
      return '🌿';
    case 'hill':
      return '⛰️';
    default:
      return '';
  }
}

function findUnit(
  units: BattleUnit[],
  unitId: string | null,
): BattleUnit | undefined {
  if (!unitId) return undefined;
  return units.find((u) => u.id === unitId);
}

function getCurrentUnitId(state: BattleState): string | null {
  if (state.phase !== 'battle') return null;
  return state.turnOrder[state.currentTurnIndex] ?? null;
}

function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function BattleGrid({ battleState, onCellClick }: BattleGridProps) {
  const currentUnitId = getCurrentUnitId(battleState);

  const movableSet = new Set(
    battleState.movablePositions.map((p) => posKey(p)),
  );

  // 攻撃対象のユニットIDセット
  const attackableSet = new Set(battleState.attackableUnitIds);

  return (
    <div className="grid-container">
      <div className="grid">
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div className="grid-row" key={row}>
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const cell = battleState.grid[row][col];
              const unit = findUnit(battleState.units, cell.unitId);
              const isCurrentUnit = unit?.id === currentUnitId;
              const isMovable = movableSet.has(posKey({ row, col }));
              const isAttackable = unit ? attackableSet.has(unit.id) : false;

              const classes = [
                'cell',
                terrainClass(cell.terrain),
                isCurrentUnit ? 'cell-active' : '',
                isMovable ? 'cell-movable' : '',
                isAttackable ? 'cell-attackable' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const cellPopups = battleState.damagePopups.filter(
                (p) => p.position.row === row && p.position.col === col,
              );

              return (
                <div
                  className={classes}
                  key={`${row}-${col}`}
                  onClick={() => onCellClick({ row, col })}
                >
                  {unit && unit.isAlive ? (
                    <div
                      className={`unit ${unit.team === 'player' ? 'unit-player' : 'unit-enemy'}`}
                    >
                      <span className="unit-emoji">{unit.emoji}</span>
                      <div className="unit-hp-bar">
                        <div
                          className="unit-hp-fill"
                          style={{
                            width: `${(unit.hp / unit.maxHp) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="terrain-label">
                      {terrainLabel(cell.terrain)}
                    </span>
                  )}
                  {isMovable && !unit && (
                    <div className="movable-dot" />
                  )}
                  {cellPopups.map((popup) => (
                    <div
                      key={popup.id}
                      className={`damage-popup ${popupClass(popup.type)}`}
                    >
                      {popup.text}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
