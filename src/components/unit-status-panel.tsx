import type { BattleUnit } from '../types';
import { PixelSprite } from './pixel-sprite';
import './unit-status-panel.css';

interface UnitStatusPanelProps {
  units: BattleUnit[];
  team: 'player' | 'enemy';
  label: string;
}

export function UnitStatusPanel({ units, team, label }: UnitStatusPanelProps) {
  const teamUnits = units.filter((u) => u.team === team);

  return (
    <div className="status-panel">
      <h3
        className={`status-title ${team === 'player' ? 'title-player' : 'title-enemy'}`}
      >
        {label}
      </h3>
      <div className="status-list">
        {teamUnits.map((unit) => (
          <div
            key={unit.id}
            className={`status-card ${!unit.isAlive ? 'status-dead' : ''}`}
          >
            <div className="status-header">
              <PixelSprite
                speciesId={unit.speciesId}
                size={24}
                flip={unit.team === 'enemy'}
                className="status-sprite"
              />
              <span className="status-name">{unit.name}</span>
            </div>
            <div className="status-bars">
              <div className="bar-row">
                <span className="bar-label">HP</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-hp"
                    style={{
                      width: `${(unit.hp / unit.maxHp) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-value">
                  {unit.hp}/{unit.maxHp}
                </span>
              </div>
              <div className="bar-row">
                <span className="bar-label">MP</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-mp"
                    style={{
                      width: `${(unit.mp / unit.maxMp) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-value">
                  {unit.mp}/{unit.maxMp}
                </span>
              </div>
            </div>
            <div className="status-stats">
              ATK {unit.atk} / DEF {unit.def} / SPD {unit.spd} / MOV {unit.mov}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
