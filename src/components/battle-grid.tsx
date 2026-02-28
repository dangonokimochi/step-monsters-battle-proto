import type { BattleState, BattleUnit, TerrainType } from '../types';
import { GRID_SIZE } from '../types';
import { PixelSprite } from './pixel-sprite';
import './battle-grid.css';

interface BattleGridProps {
  battleState: BattleState;
}

// 地形に対応する背景色クラス
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

// 地形の記号表示
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

// 現在行動中のユニットID
function getCurrentUnitId(state: BattleState): string | null {
  if (state.phase !== 'battle') return null;
  return state.turnOrder[state.currentTurnIndex] ?? null;
}

export function BattleGrid({ battleState }: BattleGridProps) {
  const currentUnitId = getCurrentUnitId(battleState);

  return (
    <div className="grid-container">
      <div className="grid">
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div className="grid-row" key={row}>
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const cell = battleState.grid[row][col];
              const unit = findUnit(battleState.units, cell.unitId);
              const isCurrentUnit = unit?.id === currentUnitId;

              return (
                <div
                  className={`cell ${terrainClass(cell.terrain)} ${isCurrentUnit ? 'cell-active' : ''}`}
                  key={`${row}-${col}`}
                >
                  {unit && unit.isAlive ? (
                    <div
                      className={`unit ${unit.team === 'player' ? 'unit-player' : 'unit-enemy'}`}
                    >
                      <PixelSprite
                        speciesId={unit.speciesId}
                        size={40}
                        flip={unit.team === 'enemy'}
                        className="unit-sprite"
                      />
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
