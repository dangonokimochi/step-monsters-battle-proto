// 地形の16×16ドット絵データ（アニメーション対応）
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
  const h = def.frames[0]?.length ?? 16;
  const w = def.frames[0]?.[0]?.length ?? 16;
  return {
    width: w,
    height: h,
    frames,
    frameDuration: def.frameDuration ?? 1000,
  };
}

// === 地形スプライト定義（16×16） ===

const terrainDefs: Record<string, TerrainSpriteDef> = {
  // 平地 - 控えめな草地。モンスターの邪魔にならないよう色差を極小に
  plain: {
    palette: {
      a: '#2e3328', // ベース暗
      b: '#303529', // ベース
    },
    frames: [
      [
        'aabbbbabbbbbabba',
        'bbabbbbbabbbbabb',
        'bbbbbabbbbabbbbb',
        'abbbbbbbbbbbbbba',
        'bbbabbbbbbbbabbb',
        'bbbbbbabbbbbbbbb',
        'bbbbbbbbbbabbbbb',
        'abbbbbbbbbbbbbab',
        'bbbbabbbbbbbbbbb',
        'bbbbbbbbbabbbbbb',
        'bbabbbbbbbbbabbb',
        'bbbbbbabbbbbbbb',
        'bbbbbbbbbbbabbbb',
        'abbbabbbbbbbbbbb',
        'bbbbbbbbbbbbbabb',
        'bbabbbbbabbbbabb',
      ],
    ],
  },

  // 岩 - 大きな岩塊、影とハイライトで立体感
  rock: {
    palette: {
      a: '#2e2a2a', // 地面影
      b: '#3a3535', // 暗い輪郭
      c: '#504848', // 暗い岩
      d: '#635a5a', // 岩ベース
      e: '#786e6e', // 岩明るい
      f: '#8a8080', // ハイライト
      g: '#9a9090', // 頂点ハイライト
    },
    frames: [
      [
        'aaaaabbbbbaaaaaa',
        'aaabbccddcbbaaaa',
        'aabcddeeeddcbaaa',
        'abcdeefffeeddbbaa',
        'abdeefggfeedcbbaa',
        'bcdeefgffeeddcbaa',
        'bcddeffeedddccbaa',
        'bcddeeedddccbbaa',
        'abcddddddccbbaaa',
        'abccddddccbbbaaa',
        'aabccccccbbbaaaa',
        'aaabbcccbbaabaaa',
        'aaaabbbbbaaaaaaa',
        'aaaaabbbaaaaabaa',
        'aaaaaabaaaaaaaba',
        'aaaaaaaaaaaaaaaa',
      ],
    ],
  },

  // 水 - 水面、波紋アニメーション
  water: {
    palette: {
      a: '#1a3050', // 深い水
      b: '#204060', // 水ベース
      c: '#2a5578', // 中間
      d: '#356a90', // 明るい水
      e: '#4888aa', // 波ハイライト
      f: '#5ca0c0', // きらめき
    },
    frameDuration: 700,
    frames: [
      [
        'aabbbaabbbaabbba',
        'babbbabbbbabbbab',
        'bbbcbbbbbbbcbbbb',
        'abbbbbcdbbbbbabb',
        'bbbbbcdecbbabbbb',
        'babbbbdbbbbbbabb',
        'bbbbbbbbbbbbbbbb',
        'bbbabbbbbbcbabbb',
        'abbbbbabbcdbbabb',
        'bbbcbbbbbdebbbbb',
        'bbbbcdbbbcbbbbab',
        'abbbcdebbbbabbbb',
        'bbbbbdbbbbbbbabb',
        'bbbbbbbabbbbbbbb',
        'abbbabbbbbbabbba',
        'babbbbabbabbbabb',
      ],
      [
        'babbbbabbabbbabb',
        'abbbabbbbbbabbba',
        'bbbbbbbabbbbbbbb',
        'bbbbbdbbbbbcbbbb',
        'abbbcdebbbbbbbab',
        'bbbbcdbbbcbabbbb',
        'bbbcbbbbcdebbbbb',
        'abbbbbabbdebbbab',
        'bbbbbbbbbbbbbbbb',
        'babbbbdbbbbbbabb',
        'bbbbbcdecbbabbbb',
        'abbbbbcdbbbbbabb',
        'bbbcbbbbbbbcbbbb',
        'babbbabbbbabbbab',
        'aabbbaabbbaabbba',
        'bbbabbbbabbbabbb',
      ],
      [
        'bbbabbbbabbbabbb',
        'aabbbaabbbaabbba',
        'bbbbbabbbbabbbbb',
        'babbbbbbbbbcbbab',
        'bbbbbbcbbcdbbabb',
        'abbbcdbbbdebbbbb',
        'bbbcdebbbcbbabbb',
        'bbbbbdbbbbbbbabb',
        'abbbbbbbbbbbbbbb',
        'bbbbbbbcbbbbabbb',
        'abbbbbcdbbbbbbab',
        'bbbabbcdecbbbbbb',
        'bbbbbbbdbbbabbbb',
        'bbbcbbbbbbbbbbbb',
        'babbbbabbbabbbab',
        'aabbbaabbbaabbba',
      ],
    ],
  },

  // 茂み - こんもりした茂み、葉の揺れアニメーション
  bush: {
    palette: {
      a: '#2a3a22', // 地面
      b: '#1e3a1e', // 暗い葉影
      c: '#2a5a2a', // 葉ベース
      d: '#348a34', // 明るい葉
      e: '#40a040', // ハイライト
      f: '#50b850', // 明るいハイライト
    },
    frameDuration: 900,
    frames: [
      [
        'aaaaaabbbbaaaaba',
        'aaaabbccccbbaaaa',
        'aaabccdddccbbaaa',
        'aabccddeeddccbaa',
        'abccdeefeddccbaa',
        'abcddeffeddccbaa',
        'abccdeedddccbaaa',
        'aabccdddccbbbaba',
        'aaabccccbbaaabba',
        'aaabbcccddcbbaaa',
        'aaabcddeedccbbaa',
        'aabcddeffeddcbaa',
        'abcddeefeeddcbaa',
        'abccddeddddccbaa',
        'aabccccddccbbaaa',
        'aaabbbccccbbaaaa',
      ],
      [
        'aaaaaabbbbaaaaba',
        'aaaabbccccbbaaaa',
        'aaabccddeccbbaaa',
        'aabccddefddccbaa',
        'abccddeffddccbaa',
        'abcddeefeeccbbaa',
        'abccdeedddccbaaa',
        'aabccdddccbbbaba',
        'aaabccccbbaaabba',
        'aaabbccdddcbbaaa',
        'aaabcddeedccbbaa',
        'aabcddeefeeccbaa',
        'abcddeffeddccbaa',
        'abccddeeddddcbaa',
        'aabccccddccbbaaa',
        'aaabbbccccbbaaaa',
      ],
    ],
  },

  // 高台 - 段差のある丘、上面が明るく側面に影
  hill: {
    palette: {
      a: '#332a1c', // 地面影
      b: '#4a3c25', // 暗い土
      c: '#5e4e32', // 側面
      d: '#726040', // 台地ベース
      e: '#887450', // 台地明るい
      f: '#9e8860', // ハイライト
      g: '#b09a70', // 頂点
    },
    frames: [
      [
        'aaaaaabbbbaaaaba',
        'aaaabbcdddbbaaaa',
        'aaabcddeeedcbaaa',
        'aabcdeeffeedcbaa',
        'abcdeefggfeedcba',
        'abcdeefgffeeccba',
        'abcddeeffeddccba',
        'abcdddeeedddcbaa',
        'abccdddddddccbaa',
        'abcccdddddccbbaa',
        'aabbcccddccbbaaa',
        'aaabbcccccbbaaaa',
        'aaaabbcccbbaaaaa',
        'aaaaabbbbbaaaaaa',
        'aaaaaabbbaaaaaaa',
        'aaaaaaaaaaaaaaaa',
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
