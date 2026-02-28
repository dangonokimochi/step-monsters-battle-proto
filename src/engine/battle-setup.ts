import type {
  BattleUnit,
  BattleState,
  Grid,
  GridCell,
  MonsterSpecies,
  Position,
  Team,
} from '../types';
import { GRID_SIZE } from '../types';

// モンスター種族データからBattleUnitを生成
export function createBattleUnit(
  species: MonsterSpecies,
  team: Team,
  position: Position,
  index: number,
): BattleUnit {
  return {
    id: `${team}-${index}-${species.id}`,
    speciesId: species.id,
    name: species.name,
    team,
    emoji: species.emoji,
    hp: species.baseHp,
    maxHp: species.baseHp,
    atk: species.baseAtk,
    def: species.baseDef,
    spd: species.baseSpd,
    mp: species.baseMp,
    maxMp: species.baseMp,
    eva: species.baseEva,
    mov: species.mov,
    position,
    skills: species.skills,
    isAlive: true,
    hasActed: false,
  };
}

// 空のグリッドを生成
export function createEmptyGrid(): Grid {
  const grid: Grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: GridCell[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      rowCells.push({ terrain: 'plain', unitId: null });
    }
    grid.push(rowCells);
  }
  return grid;
}

// 味方の初期配置（左半分 col 0-3 にランダム配置）
function placePlayerUnits(
  monsters: MonsterSpecies[],
  grid: Grid,
): BattleUnit[] {
  const units: BattleUnit[] = [];
  const usedPositions = new Set<string>();

  monsters.forEach((species, index) => {
    let pos: Position;
    do {
      pos = {
        col: Math.floor(Math.random() * 4), // col 0-3
        row: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      usedPositions.has(`${pos.row},${pos.col}`) ||
      grid[pos.row][pos.col].terrain === 'rock'
    );

    usedPositions.add(`${pos.row},${pos.col}`);
    const unit = createBattleUnit(species, 'player', pos, index);
    grid[pos.row][pos.col].unitId = unit.id;
    units.push(unit);
  });

  return units;
}

// 敵の初期配置（右半分 col 4-7 にランダム配置）
function placeEnemyUnits(
  monsters: MonsterSpecies[],
  grid: Grid,
  existingUnits: BattleUnit[],
): BattleUnit[] {
  const units: BattleUnit[] = [];
  const usedPositions = new Set<string>(
    existingUnits.map((u) => `${u.position.row},${u.position.col}`),
  );

  monsters.forEach((species, index) => {
    let pos: Position;
    do {
      pos = {
        col: 4 + Math.floor(Math.random() * 4), // col 4-7
        row: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      usedPositions.has(`${pos.row},${pos.col}`) ||
      grid[pos.row][pos.col].terrain === 'rock'
    );

    usedPositions.add(`${pos.row},${pos.col}`);
    const unit = createBattleUnit(species, 'enemy', pos, index);
    grid[pos.row][pos.col].unitId = unit.id;
    units.push(unit);
  });

  return units;
}

// SPD順でターン順序を決定
export function calcTurnOrder(units: BattleUnit[]): string[] {
  return [...units]
    .filter((u) => u.isAlive)
    .sort((a, b) => {
      if (b.spd !== a.spd) return b.spd - a.spd;
      // SPD同値：味方優先
      if (a.team !== b.team) return a.team === 'player' ? -1 : 1;
      // それも同じならランダム
      return Math.random() - 0.5;
    })
    .map((u) => u.id);
}

// 戦闘状態の初期化
export function initBattle(
  playerMonsterData: MonsterSpecies[],
  enemyMonsterData: MonsterSpecies[],
): BattleState {
  const grid = createEmptyGrid();

  const playerUnits = placePlayerUnits(playerMonsterData, grid);
  const enemyUnits = placeEnemyUnits(enemyMonsterData, grid, playerUnits);
  const allUnits = [...playerUnits, ...enemyUnits];
  const turnOrder = calcTurnOrder(allUnits);

  return {
    grid,
    units: allUnits,
    turnOrder,
    currentTurnIndex: 0,
    round: 1,
    phase: 'battle',
    result: 'none',
  };
}
