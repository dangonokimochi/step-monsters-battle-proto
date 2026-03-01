import type { BattleState, BattleUnit, Position, TerrainType, DamagePopup, SkillEffectType } from '../types';
import { GRID_COLS, GRID_ROWS } from '../types';
import { PixelSprite } from './pixel-sprite';
import { TerrainTile } from './terrain-tile';
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

// 攻撃アニメーションのクラスを決定
function getAttackAnimClass(effectType: SkillEffectType): string {
  if (['slash', 'impact', 'claw'].includes(effectType)) return 'unit-attack-melee';
  if (effectType === 'heal') return 'unit-attack-heal';
  return 'unit-attack-ranged';
}

const PLAYER_COLS = Math.floor(GRID_COLS / 2);

export function BattleGrid({ battleState, onCellClick }: BattleGridProps) {
  const currentUnitId = getCurrentUnitId(battleState);
  const isPlacement = battleState.phase === 'placement';

  const movableSet = new Set(
    battleState.movablePositions.map((p) => posKey(p)),
  );

  const attackableSet = new Set(battleState.attackableUnitIds);

  // アニメーション情報
  const animation = battleState.animation;
  const attackingId = animation.type === 'attacking' ? animation.attackerId : null;
  const attackSkillName = animation.type === 'attacking' ? animation.skillName : null;
  const attackEffectType = animation.type === 'attacking' ? animation.effectType : null;
  const damagedId = animation.type === 'damaged' ? animation.targetId : null;
  const damagedType = animation.type === 'damaged' ? animation.resultType : null;
  const damagedEffectType = animation.type === 'damaged' && animation.resultType !== 'miss'
    ? animation.effectType : null;

  // 撃破時の画面シェイク
  const isKillShake = animation.type === 'damaged' && animation.resultType === 'kill';

  return (
    <div className="grid-container">
      {/* 陣地ラベル */}
      <div className="zone-labels">
        <span className="zone-label zone-label-player">ALLY</span>
        <span className="zone-label zone-label-enemy">ENEMY</span>
      </div>
      <div className={`grid ${isKillShake ? 'grid-shake' : ''}`}>
        {Array.from({ length: GRID_ROWS }, (_, row) => (
          <div className="grid-row" key={row}>
            {Array.from({ length: GRID_COLS }, (_, col) => {
              const cell = battleState.grid[row][col];
              const unit = findUnit(battleState.units, cell.unitId);
              const isCurrentUnit = unit?.id === currentUnitId;
              const isMovable = movableSet.has(posKey({ row, col }));
              const isAttackable = unit ? attackableSet.has(unit.id) : false;
              const isPlayerZone = col < PLAYER_COLS;
              const isDivider = col === PLAYER_COLS;

              // 配置フェーズ: 味方エリアの空きセルをハイライト
              const isPlaceable = isPlacement && isPlayerZone &&
                cell.terrain !== 'rock' && !cell.unitId &&
                battleState.placementQueue.length > 0;

              // アニメーションクラス
              const isAttacking = unit?.id === attackingId;
              const isDamaged = unit?.id === damagedId;
              const isHitFlash = isDamaged && damagedType !== 'miss';

              const classes = [
                'cell',
                terrainClass(cell.terrain),
                isCurrentUnit ? 'cell-active' : '',
                isMovable ? 'cell-movable' : '',
                isAttackable ? 'cell-attackable' : '',
                isPlayerZone ? 'cell-player-zone' : 'cell-enemy-zone',
                isDivider ? 'cell-divider' : '',
                isPlaceable ? 'cell-placeable' : '',
                isHitFlash ? 'cell-hit-flash' : '',
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
                  <TerrainTile terrain={cell.terrain} cellSize={52} />
                  {unit && unit.isAlive && (
                    <div
                      className={[
                        'unit',
                        unit.team === 'player' ? 'unit-player' : 'unit-enemy',
                        isAttacking && attackEffectType ? getAttackAnimClass(attackEffectType) : '',
                        isDamaged ? `unit-hit unit-hit-${damagedType}` : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <PixelSprite
                        speciesId={unit.speciesId}
                        size={32}
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
                  )}
                  {isMovable && !unit && (
                    <div className="movable-dot" />
                  )}
                  {isPlaceable && (
                    <div className="placeable-indicator" />
                  )}
                  {/* 技名ポップアップ（攻撃者セル） */}
                  {isAttacking && attackSkillName && (
                    <div className="skill-name-popup">{attackSkillName}</div>
                  )}
                  {/* 技エフェクト（被ダメージセル） */}
                  {isDamaged && damagedEffectType && (
                    <div className={`skill-effect skill-effect-${damagedEffectType}`} />
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
