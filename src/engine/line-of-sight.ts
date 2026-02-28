import type { Position, Grid } from '../types';

// ブレゼンハムのラインアルゴリズムで2点間のマスを取得（始点・終点を除く）
export function getLineCells(from: Position, to: Position): Position[] {
  const cells: Position[] = [];

  let r0 = from.row;
  let c0 = from.col;
  const r1 = to.row;
  const c1 = to.col;

  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dr - dc;

  while (true) {
    // 始点と終点はスキップ
    if ((r0 !== from.row || c0 !== from.col) && (r0 !== r1 || c0 !== c1)) {
      cells.push({ row: r0, col: c0 });
    }

    if (r0 === r1 && c0 === c1) break;

    const e2 = 2 * err;
    if (e2 > -dc) {
      err -= dc;
      r0 += sr;
    }
    if (e2 < dr) {
      err += dr;
      c0 += sc;
    }
  }

  return cells;
}

// 射線が通るか判定
// piercing=trueなら常に通る
// piercing=falseなら、間に岩またはユニットがあると遮蔽
export function hasLineOfSight(
  from: Position,
  to: Position,
  grid: Grid,
  piercing: boolean,
): boolean {
  if (piercing) return true;

  const lineCells = getLineCells(from, to);

  for (const cell of lineCells) {
    const gridCell = grid[cell.row][cell.col];
    // 岩は射線を遮る
    if (gridCell.terrain === 'rock') return false;
    // 他ユニットも射線を遮る
    if (gridCell.unitId !== null) return false;
  }

  return true;
}
