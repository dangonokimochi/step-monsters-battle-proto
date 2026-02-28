// 地形の8×8ドット絵データ（アニメーション対応）
// モンスタースプライトと同じ方式: パレット文字 → カラーコード、'.' は透明

interface TerrainSpriteDef {
  palette: Record<string, string>;
  frames: string[][];
  frameDuration?: number;
}

export interface ParsedTerrainSprite {
  width: number;
  height: number;
  frames: (string | null)[][][]; // [frame][row][col]
  frameDuration: number;
}

function parseTerrainSprite(def: TerrainSpriteDef): ParsedTerrainSprite {
  const frames = def.frames.map((frame) =>
    frame.map((row) =>
      [...row].map((ch) => (ch === '.' ? null : def.palette[ch] ?? null)),
    ),
  );
  return {
    width: 8,
    height: 8,
    frames,
    frameDuration: def.frameDuration ?? 1000,
  };
}

// === 地形スプライト定義 ===

const terrainDefs: Record<string, TerrainSpriteDef> = {
  // 平地 - 草と土
  plain: {
    palette: {
      a: '#3d4a2e', // 暗い草
      b: '#4a5c36', // 草ベース
      c: '#566b3f', // 明るい草
      d: '#3a3428', // 土
      e: '#45402e', // 明るい土
    },
    frames: [
      [
        'aabbabba',
        'babcbabb',
        'abbaabcb',
        'ddbabbad',
        'babbabba',
        'abcbabba',
        'babbcbab',
        'aababbab',
      ],
    ],
  },

  // 岩 - 灰色の大岩、ひび割れ
  rock: {
    palette: {
      a: '#3a3535', // 暗い輪郭
      b: '#5a5252', // 暗い岩
      c: '#706666', // 岩ベース
      d: '#887e7e', // 明るい岩
      e: '#9e9494', // ハイライト
      f: '#2e2a2a', // 地面影
    },
    frames: [
      [
        'ffaaaaff',
        'fadddbaf',
        'adeddbba',
        'adeddcba',
        'abddcbba',
        'abccbbaf',
        'fabbbcaf',
        'ffaaaaff',
      ],
    ],
  },

  // 水 - 水面の波紋アニメーション
  water: {
    palette: {
      a: '#1a3555', // 深い水
      b: '#264a6e', // 水ベース
      c: '#336688', // 中間
      d: '#4488aa', // 明るい水
      e: '#66aacc', // 波のハイライト
      f: '#88ccee', // きらめき
    },
    frameDuration: 600,
    frames: [
      [
        'aabbabba',
        'babcbabb',
        'bbdecbab',
        'abcbabcb',
        'babbdeab',
        'abcbabba',
        'babcbcba',
        'aabababb',
      ],
      [
        'aabababb',
        'babbcbba',
        'abcbabcb',
        'bbdecbab',
        'abcbabba',
        'babbdeba',
        'abcbabcb',
        'aabbabba',
      ],
      [
        'aabbcbba',
        'babcbabb',
        'abcbdeba',
        'babcbcba',
        'abdeabcb',
        'babbcbab',
        'abcbabba',
        'aababcba',
      ],
    ],
  },

  // 茂み - 密な緑の茂み
  bush: {
    palette: {
      a: '#1e3a1e', // 暗い葉（影）
      b: '#2a5a2a', // 葉ベース
      c: '#389038', // 明るい葉
      d: '#4aaa4a', // ハイライト
      e: '#60c060', // 明るいハイライト
      f: '#3d4a2e', // 地面
    },
    frameDuration: 800,
    frames: [
      [
        'ffabbaff',
        'fabccbaf',
        'abcdcbba',
        'bcdedbba',
        'abdccdba',
        'abcbcbba',
        'fabccbaf',
        'ffabbaff',
      ],
      [
        'ffabbaff',
        'fabcdbaf',
        'abcecbba',
        'bcdecbba',
        'abddcdba',
        'abcbcbba',
        'fabcbbaf',
        'ffabbaff',
      ],
    ],
  },

  // 高台 - 盛り上がった地面、段差表現
  hill: {
    palette: {
      a: '#3a3020', // 暗い影
      b: '#5a4a30', // 土台
      c: '#7a6a45', // 台地ベース
      d: '#8e7e55', // 台地明るい面
      e: '#a09068', // ハイライト
      f: '#b0a078', // トップハイライト
    },
    frames: [
      [
        'aabccbaa',
        'abddedba',
        'bcdefedb',
        'bdefeecb',
        'bdeeddcb',
        'abddcbba',
        'abccbbaa',
        'aabbaaaa',
      ],
    ],
  },
};

// パース済みキャッシュ
const parsedCache: Record<string, ParsedTerrainSprite> = {};

export function getTerrainSprite(terrainType: string): ParsedTerrainSprite | null {
  if (parsedCache[terrainType]) return parsedCache[terrainType];
  const def = terrainDefs[terrainType];
  if (!def) return null;
  const parsed = parseTerrainSprite(def);
  parsedCache[terrainType] = parsed;
  return parsed;
}
