// モンスターの16x16ドット絵データ
// パレット文字 → カラーコード、'.' は透明

interface SpriteDefinition {
  palette: Record<string, string>;
  data: string[]; // 16行×16文字
}

export interface ParsedSprite {
  width: number;
  height: number;
  pixels: (string | null)[][]; // [row][col] = hex color or null
}

function parseSprite(def: SpriteDefinition): ParsedSprite {
  const pixels = def.data.map((row) =>
    [...row].map((ch) => (ch === '.' ? null : def.palette[ch] ?? null)),
  );
  return { width: 16, height: 16, pixels };
}

// === スプライト定義 ===

const spriteDefinitions: Record<string, SpriteDefinition> = {
  // 疾風狼 - 銀色の疾風ウルフ（右向き）
  'shippu-wolf': {
    palette: {
      o: '#222233', // アウトライン
      a: '#778899', // 濃いグレー毛並み
      b: '#aabbcc', // 明るいグレー毛並み
      c: '#d0dde8', // ハイライト
      e: '#44ee88', // 目（緑）
      n: '#333344', // 鼻
      t: '#4488dd', // 青い尾の風エフェクト
    },
    data: [
      '................',
      '.........oo.....',
      '........obbo....',
      '.......obbcbo...',
      '......obbbcbbo..',
      '......obecbbcoo.',
      '......obbbbbbbon',
      '.......obbbbbo..',
      '...t.oobbbbbbo..',
      '..t.obbbbbbbbbbo',
      '.t.obbobbbbboabo',
      't..oo.obbbb.oao.',
      '......obbbo.....',
      '.....ob..ob.....',
      '.....oo..oo.....',
      '................',
    ],
  },

  // 岩甲蟹 - オレンジの岩蟹（正面）
  'gankou-crab': {
    palette: {
      o: '#2a1a0a', // アウトライン
      r: '#cc6633', // 甲羅（オレンジ）
      s: '#dd7744', // 甲羅（明るい）
      c: '#ffaa44', // ハサミ（黄色）
      e: '#111111', // 目
      y: '#ddbb66', // 腹
      l: '#aa5522', // 脚
    },
    data: [
      '................',
      '.cc..........cc.',
      'occo........occo',
      '.oco........oco.',
      '..oo..oooo..oo..',
      '.....osssso.....',
      '....osssssso....',
      '...osse..essso..',
      '...ossssssssso..',
      '...ossyyyyssso..',
      '....osssssso....',
      '.....osrrso.....',
      '....ol.oo.lo....',
      '...ol..oo..lo...',
      '..ol...oo...lo..',
      '................',
    ],
  },

  // 幽灯火 - 紫の幽霊＋青い炎
  yuutouka: {
    palette: {
      o: '#221133', // アウトライン
      p: '#8855bb', // 紫ボディ
      l: '#aa77dd', // 明るい紫
      w: '#ddccee', // 白ハイライト
      f: '#44ddff', // シアン炎
      g: '#88eeff', // 炎ハイライト
      e: '#ff2244', // 目（赤）
    },
    data: [
      '.......fg.......',
      '......fggf......',
      '.....fgffgf.....',
      '.....ffffff.....',
      '....oooooooo....',
      '...opppppppo....',
      '..olpwppwpplo...',
      '..oppeoppeoppo..',
      '..opppppppppo...',
      '..olppppppplo...',
      '...oppppppppo...',
      '...opppppppo....',
      '....oppppppo....',
      '...op.opppo.po..',
      '..o...op.o...o..',
      '................',
    ],
  },

  // 仔竜 - 緑のベビードラゴン（右向き）
  koryuu: {
    palette: {
      o: '#0a2a0a', // アウトライン
      g: '#44aa44', // 緑ボディ
      l: '#66cc66', // 明るい緑
      y: '#eedd44', // 黄色い腹
      e: '#ff2222', // 赤い目
      w: '#338833', // 翼（暗い緑）
      h: '#55bb55', // 角
    },
    data: [
      '................',
      '..........hh....',
      '.........ohho...',
      '........olgggo..',
      '.......olgggggo.',
      '.......ogelgggo.',
      '.......ogggggoo.',
      '........ogggo...',
      '....w.oogggggoo.',
      '...ww.oggggggggo',
      '..www.oggoggggoo',
      '...w..oo.ogggo..',
      '.........ogygo..',
      '........og..og..',
      '........oo..oo..',
      '................',
    ],
  },

  // 餓狼 - 暗い茶色の飢えた狼（右向き）
  garou: {
    palette: {
      o: '#1a0a0a', // アウトライン
      d: '#554433', // 暗い茶色
      b: '#776655', // 茶色
      c: '#997766', // 明るい茶色
      e: '#ff2222', // 赤い目
      t: '#ddddcc', // 牙
    },
    data: [
      '................',
      '.........oo.....',
      '........oddo....',
      '.......oddcdo...',
      '......odddbddo..',
      '......odedbbdoo.',
      '......odddbdddot',
      '.......odddddo..',
      '....oodddddddoo.',
      '...odddddddddddo',
      '..oddodddddodddo',
      '..oo..odddd.odo.',
      '......odddo.....',
      '.....od..od.....',
      '.....oo..oo.....',
      '................',
    ],
  },

  // 鉄壁亀 - 灰色の装甲亀（右向き）
  'teppeki-turtle': {
    palette: {
      o: '#0a1a0a', // アウトライン
      s: '#667788', // 甲羅（灰色）
      d: '#445566', // 甲羅（暗い）
      g: '#448844', // 緑ボディ
      l: '#66aa66', // 明るい緑
      e: '#111111', // 目
      y: '#aabb88', // 腹
    },
    data: [
      '................',
      '................',
      '.....ooooooo....',
      '....odsdsdsdoo..',
      '...osssssssssoo.',
      '...odddssdddsoo.',
      '...ossssssssso..',
      '....ooooooooo...',
      '...ogggggggggo..',
      '..ogge.ggggggo..',
      '..ogyggggggggoo.',
      '...ogyggggggggoo',
      '....oggggggo.oo.',
      '....og.og.og....',
      '....oo.oo.oo....',
      '................',
    ],
  },

  // 影蜘蛛 - 暗い紫の蜘蛛（正面）
  'kage-spider': {
    palette: {
      o: '#0a0a1a', // アウトライン
      p: '#553388', // 紫ボディ
      d: '#3a2266', // 暗い紫
      l: '#774499', // 明るい紫
      e: '#ff2222', // 赤い目
      g: '#443366', // 脚
    },
    data: [
      '................',
      '....g..oo..g....',
      '...g..oppo..g...',
      '..g..oppppo..g..',
      '.g..oppddppo..g.',
      '...oppdppdppo...',
      '...oppeppeppo...',
      '....oppppppo....',
      '.g...oppppo...g.',
      '..g..opddpo..g..',
      '...g.oppppo.g...',
      '....gopppog.....',
      '...g.op.po.g....',
      '..g..o...o..g...',
      '.g...........g..',
      '................',
    ],
  },

  // 飛竜 - 赤/オレンジのワイバーン（右向き、翼を広げた姿）
  hiryuu: {
    palette: {
      o: '#2a0a0a', // アウトライン
      r: '#cc3322', // 赤ボディ
      d: '#882211', // 暗い赤
      y: '#ffaa44', // オレンジ/黄色
      e: '#ffff44', // 黄色い目
      w: '#dd4433', // 翼膜
    },
    data: [
      '................',
      '..oo............',
      '.orro...........',
      '..orrro.oo......',
      '...orrrrrroo....',
      '...orerrrrro....',
      '...orrrrrroo....',
      '....orrrroo.....',
      '..ooorrrrrrooo..',
      '.owwwrrrrrywwwo.',
      '.ow..rrrry..wo..',
      '..o..orrro...o..',
      '.....orryo......',
      '....or...or.....',
      '....oo...oo.....',
      '................',
    ],
  },
};

// パース済みスプライトのキャッシュ
const spriteCache = new Map<string, ParsedSprite>();

export function getSprite(speciesId: string): ParsedSprite | null {
  if (spriteCache.has(speciesId)) {
    return spriteCache.get(speciesId)!;
  }

  const def = spriteDefinitions[speciesId];
  if (!def) return null;

  const parsed = parseSprite(def);
  spriteCache.set(speciesId, parsed);
  return parsed;
}

// 全スプライトIDのリスト
export function getAllSpriteIds(): string[] {
  return Object.keys(spriteDefinitions);
}
