import type { Grid, Position, BattleUnit } from '../types';
import { GRID_COLS, GRID_ROWS } from '../types';

const DIRECTIONS: Position[] = [
  { row: -1, col: 0 }, // 上
  { row: 1, col: 0 },  // 下
  { row: 0, col: -1 }, // 左
  { row: 0, col: 1 },  // 右
];

function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

// BFSで移動可能範囲を計算
export function calcMovablePositions(
  unit: BattleUnit,
  grid: Grid,
): Position[] {
  const start = unit.position;
  const mov = unit.mov;
  const result: Position[] = [];

  // BFS: キューに (position, 残りMOV) を格納
  const visited = new Map<string, number>(); // posKey -> 残りMOVの最大値
  const queue: { pos: Position; remaining: number }[] = [
    { pos: start, remaining: mov },
  ];
  visited.set(posKey(start), mov);

  while (queue.length > 0) {
    const { pos, remaining } = queue.shift()!;

    for (const dir of DIRECTIONS) {
      const newRow = pos.row + dir.row;
      const newCol = pos.col + dir.col;

      if (!isInBounds(newRow, newCol)) continue;

      const cell = grid[newRow][newCol];

      // 岩は侵入不可
      if (cell.terrain === 'rock') continue;

      // 他ユニットがいるマスは侵入不可
      if (cell.unitId !== null) continue;

      // 水たまりはMOV+1消費
      const cost = cell.terrain === 'water' ? 2 : 1;
      const newRemaining = remaining - cost;

      if (newRemaining < 0) continue;

      const key = posKey({ row: newRow, col: newCol });
      const prevBest = visited.get(key);

      // より多くの残りMOVで到達できる場合のみ探索
      if (prevBest !== undefined && prevBest >= newRemaining) continue;

      visited.set(key, newRemaining);
      const newPos = { row: newRow, col: newCol };
      result.push(newPos);
      queue.push({ pos: newPos, remaining: newRemaining });
    }
  }

  return result;
}
