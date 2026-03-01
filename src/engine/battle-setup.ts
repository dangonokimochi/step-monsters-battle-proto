import type {
  BattleUnit,
  BattleState,
  Grid,
  GridCell,
  MonsterSpecies,
  Position,
  Team,
  PlacementQueue,
} from '../types';
import { GRID_COLS, GRID_ROWS } from '../types';

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
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowCells: GridCell[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      rowCells.push({ terrain: 'plain', unitId: null });
    }
    grid.push(rowCells);
  }
  return grid;
}

// ランダム地形配置（6×4盤面: 3〜5マス程度に地形を配置）
function placeRandomTerrain(grid: Grid): void {
  const terrainTypes: Array<GridCell['terrain']> = ['rock', 'water', 'bush', 'hill'];
  const terrainCount = 3 + Math.floor(Math.random() * 3); // 3〜5

  let placed = 0;
  while (placed < terrainCount) {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const col = Math.floor(Math.random() * GRID_COLS);

    // 既に地形がある場合はスキップ
    if (grid[row][col].terrain !== 'plain') continue;

    const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
    grid[row][col].terrain = terrain;
    placed++;
  }
}

// 敵の初期配置（右側 col 3〜5 にランダム配置）
const PLAYER_COLS = Math.floor(GRID_COLS / 2); // 3列

function placeEnemyUnits(
  monsters: MonsterSpecies[],
  grid: Grid,
): BattleUnit[] {
  const units: BattleUnit[] = [];
  const usedPositions = new Set<string>();

  monsters.forEach((species, index) => {
    let pos: Position;
    do {
      pos = {
        col: PLAYER_COLS + Math.floor(Math.random() * PLAYER_COLS), // col 3〜5
        row: Math.floor(Math.random() * GRID_ROWS),
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

// 配置フェーズで開始する戦闘の初期化
// 敵は配置済み、味方は配置キューに入る
export function initBattle(
  playerMonsterData: MonsterSpecies[],
  enemyMonsterData: MonsterSpecies[],
): BattleState {
  const grid = createEmptyGrid();
  placeRandomTerrain(grid);

  // 敵のみ配置
  const enemyUnits = placeEnemyUnits(enemyMonsterData, grid);

  // 味方は配置キューへ
  const placementQueue: PlacementQueue[] = playerMonsterData.map(
    (species, index) => ({ species, index }),
  );

  return {
    grid,
    units: [...enemyUnits],
    turnOrder: [],
    currentTurnIndex: 0,
    round: 1,
    phase: 'placement',
    turnPhase: 'move' as const,
    selectedUnitId: null,
    movablePositions: [],
    attackableUnitIds: [],
    selectedSkillId: null,
    hasMoved: false,
    battleLog: [],
    logCounter: 0,
    damagePopups: [],
    popupCounter: 0,
    result: 'none',

    // オートバトル用
    animation: { type: 'idle' },
    pendingAction: null,
    isPaused: false,
    battleSpeed: 1,

    // 配置フェーズ用
    placementQueue,
    placementReady: false,
  };
}

// 味方ユニットを配置可能かチェック
export function canPlaceAt(grid: Grid, pos: Position): boolean {
  if (pos.col >= PLAYER_COLS) return false; // 味方は左半分のみ
  if (grid[pos.row][pos.col].terrain === 'rock') return false;
  if (grid[pos.row][pos.col].unitId !== null) return false;
  return true;
}

// 残りのユニットを自動配置
export function autoPlaceRemaining(
  grid: Grid,
  queue: PlacementQueue[],
  existingUnits: BattleUnit[],
): { grid: Grid; units: BattleUnit[]; queue: PlacementQueue[] } {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const newUnits = [...existingUnits];
  const remainingQueue = [...queue];

  while (remainingQueue.length > 0) {
    const item = remainingQueue[0];
    let placed = false;

    // ランダムに配置先を探す
    for (let attempt = 0; attempt < 100; attempt++) {
      const pos: Position = {
        col: Math.floor(Math.random() * PLAYER_COLS),
        row: Math.floor(Math.random() * GRID_ROWS),
      };

      if (canPlaceAt(newGrid, pos) && !newUnits.some(
        (u) => u.position.row === pos.row && u.position.col === pos.col,
      )) {
        const unit = createBattleUnit(item.species, 'player', pos, item.index);
        newGrid[pos.row][pos.col].unitId = unit.id;
        newUnits.push(unit);
        remainingQueue.shift();
        placed = true;
        break;
      }
    }

    if (!placed) break; // 配置できなかった場合は中断
  }

  return { grid: newGrid, units: newUnits, queue: remainingQueue };
}
