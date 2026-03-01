// === 地形 ===
export type TerrainType = 'plain' | 'rock' | 'water' | 'bush' | 'hill';

export interface TerrainCell {
  type: TerrainType;
}

// === 座標 ===
export interface Position {
  col: number; // 0-(GRID_COLS-1), 左→右
  row: number; // 0-(GRID_ROWS-1), 上→下
}

// === 技 ===
export interface Skill {
  id: string;
  name: string;
  range: number;      // 射程（1=近接）
  piercing: boolean;   // 射線貫通
  defPen: number;      // 防御貫通率 0.0〜1.0
  mpCost: number;      // MP消費（0=通常攻撃）
  power: number;       // 威力倍率
  isHeal?: boolean;    // 回復技フラグ
  healAmount?: number; // 回復量（固定値）
}

// === 種族 ===
export type Tribe = 'beast' | 'rock' | 'spirit' | 'dragon';

// === レアリティ ===
export type Rarity = 'common' | 'rare' | 'epic' | 'unique' | 'legend';

// === 陣営 ===
export type Team = 'player' | 'enemy';

// === モンスター種族定義（データ駆動） ===
export interface MonsterSpecies {
  id: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  emoji: string; // MVP段階では絵文字で表現

  // 基礎ステータス
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseMp: number;
  baseEva: number;
  mov: number; // 固定値（個体値なし）

  // 技リスト（通常攻撃 + スキル）
  skills: Skill[];
}

// === 戦闘中のユニット ===
export interface BattleUnit {
  id: string;
  speciesId: string;
  name: string;
  team: Team;
  emoji: string;

  // 現在ステータス
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  mp: number;
  maxMp: number;
  eva: number;
  mov: number;

  // 位置
  position: Position;

  // 技
  skills: Skill[];

  // 状態
  isAlive: boolean;
  hasActed: boolean; // 今ラウンドで行動済みか
}

// === 盤面 ===
export const GRID_COLS = 6; // 各陣営3列 × 2
export const GRID_ROWS = 4; // 4行

export interface GridCell {
  terrain: TerrainType;
  unitId: string | null;
}

export type Grid = GridCell[][];

// === ターンフェーズ（内部管理用） ===
export type TurnPhase = 'move' | 'action' | 'select_target';

// === オートバトルのアニメーション状態 ===
export type AnimationPhase =
  | { type: 'idle' }
  | { type: 'turn_start'; unitId: string }
  | { type: 'moving'; unitId: string; from: Position; to: Position }
  | { type: 'attacking'; attackerId: string; targetId: string; skillName: string }
  | { type: 'damaged'; targetId: string; amount: number; resultType: 'damage' | 'heal' | 'miss' | 'kill' };

// === 戦闘ログ ===
export interface BattleLog {
  id: number;
  message: string;
  type: 'damage' | 'heal' | 'miss' | 'kill' | 'info';
  team?: Team; // 行動者のチーム
}

// === ダメージポップアップ ===
export interface DamagePopup {
  id: number;
  position: Position;
  text: string;
  type: 'damage' | 'heal' | 'miss' | 'kill';
}

// === 配置キュー ===
export interface PlacementQueue {
  species: MonsterSpecies;
  index: number;
}

// === バトル速度 ===
export type BattleSpeed = 1 | 2 | 3;

// === AI判断の保持（アニメーション間で引き継ぐ） ===
export interface PendingAction {
  moveTarget: Position | null;
  skillName: string;
  skillId: string;
  attackTarget: string; // ユニットID（空文字 = 攻撃なし）
}

// === 戦闘状態 ===
export interface BattleState {
  grid: Grid;
  units: BattleUnit[];
  turnOrder: string[]; // ユニットIDの配列（SPD順）
  currentTurnIndex: number;
  round: number;
  phase: 'placement' | 'battle' | 'result';
  turnPhase: TurnPhase;
  selectedUnitId: string | null;
  movablePositions: Position[]; // 移動可能なマスのリスト
  attackableUnitIds: string[]; // 攻撃可能な対象のIDリスト
  selectedSkillId: string | null; // 選択中のスキルID
  hasMoved: boolean; // 今ターンで移動済みか
  battleLog: BattleLog[];
  logCounter: number;
  damagePopups: DamagePopup[];
  popupCounter: number;
  result: 'none' | 'win' | 'lose';

  // オートバトル用
  animation: AnimationPhase;
  pendingAction: PendingAction | null;
  isPaused: boolean;
  battleSpeed: BattleSpeed;

  // 配置フェーズ用
  placementQueue: PlacementQueue[];
  placementReady: boolean; // 全ユニット配置済みか
}
