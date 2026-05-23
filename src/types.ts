export interface Topping {
  id: string;
  name: string;
  jpName: string;
  category: "meat" | "vegetable" | "seasoning" | "special";
  iconName: string;
  description: string;
  cost: number; // Cost to unlock (G)
  level: number;
  unlocked: boolean;
  color: string; // Used for rendering bowl toppings beautifully
  flavorMod: {
    richness: number;  // -1 to +2
    spiciness: number; // 0 to +2
    umami: number;     // 0 to +3
  };
}

export type SoupType = "tonkotsu" | "shoyu" | "shio" | "miso" | "tori_paitan";
export type NoodleType = "thin_straight" | "curly_medium" | "thick_flat" | "whole_wheat";
export type RichnessType = "light" | "regular" | "heavy" | "backfat_bomb";

export interface PlacedTopping {
  id: string; // ID of the base Topping
  x: number;  // Horizontal coordinate (percentage 15% - 85%) inside bowl
  y: number;  // Vertical coordinate (percentage 15% - 85%) inside bowl
  rotation: number; // Rotation degree
  scale: number;    // Scale factor (usually 0.8 - 1.2)
}

export interface AIEvaluation {
  gourmetName: string;
  overallScore: number;
  soupNoodleHarmony: number;
  visualHarmony: number;
  umamiDepth: number;
  priceEstimation: number;
  criticReview: string;
  flavorProfile: {
    richness: number;
    spiciness: number;
    originality: number;
  };
}

export interface RamenRecipe {
  id: string;
  customName: string;
  soup: SoupType;
  noodle: NoodleType;
  richness: RichnessType;
  toppings: PlacedTopping[];
  evaluation?: AIEvaluation;
  createdAt: number;
}

export type CustomerType = 
  | "salaryman"   // Salaryman (loves heavy Tonkotsu + garlic)
  | "student"     // Student (loves Miso + corn & butter, high volume!)
  | "jk"          // High-school girl (loves aesthetic Tori Paitan + egg, clean look)
  | "gourmet"     // Food Critic (loves premium Shio / Shoyu, very picky!)
  | "tourist"     // Foreign Tourist (loves Chashu bomb, Naruto, classic ramen look);
  | "grandpa";    // Elderly Local (loves rustic Shoyu/Shio with Menma + Nori)

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  patience: number; // 0 to 100
  patienceMax: number;
  preferredSoup: SoupType[];
  dislikedSoup: SoupType[];
  orderedRamen?: RamenRecipe;
  status: "waiting" | "eating" | "reacting" | "leaving";
  seatedTime: number;
  avatarSeed: number;
  reactionMessage: string;
  payAmount: number;
  ratingStars: number;
}

export interface ShopUpgrade {
  id: string;
  name: string;
  jpName: string;
  category: "kitchen" | "interior" | "staff";
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  effectMultiplier: number;
}

export interface GameState {
  gold: number;
  reputation: number; // Exp
  activeRecipeId: string | null;
  recipes: RamenRecipe[];
  unlockedToppingIds: string[];
  upgrades: ShopUpgrade[];
  totalBowlsServed: number;
  activeTab: "kitchen" | "create" | "shop" | "recipes" | "help";
}

export const SOUP_INFO: Record<SoupType, { name: string; desc: string; basePrice: number; color: string; pattern: string }> = {
  tonkotsu: { name: "濃厚豚骨 (Tonkotsu)", desc: "じっくり煮込んだ骨太な白濁スープ。コクが深く背脂と。 \n(Pairs perfectly with Thin Straight noodles)", basePrice: 450, color: "bg-[#ebd9bc]", pattern: "radial-gradient(circle, #ebd9bc 40%, #decbae 100%)" },
  shoyu: { name: "芳醇醤油 (Shoyu)", desc: "鶏ガラと和風出汁に特製カエシを合わせた王道スープ。 \n(Pairs perfectly with Curly Medium / Whole Wheat noodles)", basePrice: 400, color: "bg-[#714b2d]", pattern: "radial-gradient(circle, #714b2d 30%, #56331a 100%)" },
  shio: { name: "淡麗塩 (Shio)", desc: "岩塩と貝類の出汁が生む透き通った黄金スープ。繊細。 \n(Pairs perfectly with Whole Wheat / Thin Straight noodles)", basePrice: 380, color: "bg-[#ece0cc]", pattern: "radial-gradient(circle, #fbf7f0 30%, #ebd7be 100%)" },
  miso: { name: "芳醇味噌 (Miso)", desc: "数種類の極上味噌に、香味野菜のコクを加えた旨口スープ。 \n(Pairs perfectly with Thick Flat / Curly Medium noodles)", basePrice: 420, color: "bg-[#ab7c42]", pattern: "radial-gradient(circle, #c7955c 20%, #906231 100%)" },
  tori_paitan: { name: "濃厚鶏白湯 (Tori Paitan)", desc: "雌鶏を強火で炊き出したコラーゲンたっぷりスープ。マイルド。 \n(Pairs perfectly with Straight Thin / Curly Medium noodles)", basePrice: 430, color: "bg-[#f1e6cc]", pattern: "radial-gradient(circle, #f9f3e5 45%, #ebd7ba 100%)" }
};

export const NOODLE_INFO: Record<NoodleType, { name: string; desc: string; matchBonus: string }> = {
  thin_straight: { name: "博多風極細ストレート (Thin Straight)", desc: "小麦香る低加水の極細麺。スープを巧みに吸い上げる。", matchBonus: "豚骨、鶏白湯にジャストフィット！" },
  curly_medium: { name: "札幌風中太ちぢれ麺 (Curly Medium)", desc: "プリプリとした食感でスープがよく絡む万能なちぢれ麺。", matchBonus: "味噌、醤油に抜群の絡み！" },
  thick_flat: { name: "喜多方風平打ち極太麺 (Thick Flat)", desc: "モチモチした食感と抜群の噛みごたえを持つ幅広麺。", matchBonus: "味噌、濃厚豚骨に負けない力強さ！" },
  whole_wheat: { name: "全粒粉入りストレート (Whole Wheat)", desc: "ヘルシーで香り高く、噛むほどに味わい深い高級風味麺。", matchBonus: "極上塩、芳醇醤油を引き立てる上品さ！" }
};

export const RICHNESS_INFO: Record<RichnessType, { name: string; multiplier: number; desc: string }> = {
  light: { name: "淡麗・あっさり (Light)", multiplier: 0.9, desc: "余計な油を浮かせず、出汁本来の優しく端麗な旨みを追求。" },
  regular: { name: "普通 (Regular)", multiplier: 1.0, desc: "スープの旨味と油分が完璧に調和した標準的なブレンド。" },
  heavy: { name: "こってり (Heavy)", multiplier: 1.1, desc: "鶏油や背あぶらを程よく加え、濃厚なボディとコクを与える。" },
  backfat_bomb: { name: "背脂チャッチャ極限 (Backfat Bomb)", multiplier: 1.25, desc: "豪快に背脂の雨を降らせた、破壊力抜群のジャンキー仕様。" }
};

export const MASTER_TOPPINGS: Topping[] = [
  {
    id: "chashu",
    name: "チャーシュー",
    jpName: "極厚炙りチャーシュー",
    category: "meat",
    iconName: "🍖",
    description: "炭火でじっくり炙った秘伝タレ香る豚肩ロース。",
    cost: 0,
    level: 1,
    unlocked: true,
    color: "#a45447",
    flavorMod: { richness: 1, spiciness: 0, umami: 2 }
  },
  {
    id: "nitamago",
    name: "味玉",
    jpName: "半熟黄金煮卵",
    category: "special",
    iconName: "🥚",
    description: "トロリと流れる極上黄身とダシが染みた白身のハーモニー。",
    cost: 0,
    level: 1,
    unlocked: true,
    color: "#e6ad45",
    flavorMod: { richness: 1, spiciness: 0, umami: 1 }
  },
  {
    id: "menma",
    name: "メンマ",
    jpName: "極太味付けメンマ",
    category: "vegetable",
    iconName: "🎋",
    description: "シャキシャキ、コリコリした食感がアクセントを添える。",
    cost: 0,
    level: 1,
    unlocked: true,
    color: "#ce9a55",
    flavorMod: { richness: 0, spiciness: 0, umami: 1 }
  },
  {
    id: "negi",
    name: "ネギ",
    jpName: "シャキシャキ九条ネギ",
    category: "vegetable",
    iconName: "🌱",
    description: "九条ネギの爽快な辛味と香りがスープを引き締める。",
    cost: 0,
    level: 1,
    unlocked: true,
    color: "#52ad5a",
    flavorMod: { richness: -1, spiciness: 0, umami: 0 }
  },
  {
    id: "nori",
    name: "のり",
    jpName: "江戸前特上海苔",
    category: "vegetable",
    iconName: "⬛",
    description: "スープを巻いて食べると磯の香りが口いっぱいに広がる。",
    cost: 100,
    level: 1,
    unlocked: false,
    color: "#2a2d29",
    flavorMod: { richness: 0, spiciness: 0, umami: 1 }
  },
  {
    id: "naruto",
    name: "なると",
    jpName: "伝統の渦巻きなると",
    category: "special",
    iconName: "🍥",
    description: "昭和レトロな見た目とほのかな魚肉練り物の風味。",
    cost: 150,
    level: 1,
    unlocked: false,
    color: "#f67180",
    flavorMod: { richness: 0, spiciness: 0, umami: 0 }
  },
  {
    id: "garlic",
    name: "刻みニンニク",
    jpName: "青森産極粗ニンニク",
    category: "seasoning",
    iconName: "🧄",
    description: "ガツンとしたパンチを与える、背脂スープの必須相棒。",
    cost: 200,
    level: 1,
    unlocked: false,
    color: "#fcf9eb",
    flavorMod: { richness: 1, spiciness: 1, umami: 2 }
  },
  {
    id: "raiyu",
    name: "特製辣油",
    jpName: "自家製焦がし辣油",
    category: "seasoning",
    iconName: "🌶️",
    description: "山椒とゴマ香る自家製ピリ辛辣油。刺激が欲しい方に。",
    cost: 250,
    level: 1,
    unlocked: false,
    color: "#d93829",
    flavorMod: { richness: 0, spiciness: 2, umami: 0 }
  },
  {
    id: "corn_butter",
    name: "コーンバター",
    jpName: "十勝コーン＆北海道バター",
    category: "special",
    iconName: "🌽",
    description: "甘みあふれるコーンと高級コクリッチなバターの罪な組み合わせ。",
    cost: 350,
    level: 1,
    unlocked: false,
    color: "#fade60",
    flavorMod: { richness: 2, spiciness: 0, umami: 1 }
  },
  {
    id: "kikurage",
    name: "きくらげ",
    jpName: "博多特選細切りキクラゲ",
    category: "vegetable",
    iconName: "👂",
    description: "とんこつラーメン専用。コリコリ最高峰の食感トリガー。",
    cost: 300,
    level: 1,
    unlocked: false,
    color: "#353232",
    flavorMod: { richness: 0, spiciness: 0, umami: 0 }
  },
  {
    id: "mayu",
    name: "マー油",
    jpName: "漆黒の焦がしニンニク黒油",
    category: "seasoning",
    iconName: "🥣",
    description: "ニンニクを7段階に焦ぎ分けた漆黒の香味油。香ばしさ抜群。",
    cost: 500,
    level: 1,
    unlocked: false,
    color: "#212121",
    flavorMod: { richness: 1, spiciness: 0, umami: 2 }
  },
  {
    id: "gold",
    name: "金箔",
    jpName: "加賀伝統の一等金箔",
    category: "special",
    iconName: "✨",
    description: "これぞインバウンド・バブリー！ビジュアル華を極限にする金箔。",
    cost: 1000,
    level: 1,
    unlocked: false,
    color: "#ffd700",
    flavorMod: { richness: 0, spiciness: 0, umami: 1 }
  }
];

export const INITIAL_UPGRADES: ShopUpgrade[] = [
  {
    id: "stovetop",
    name: "自動スープかくはん釜",
    jpName: "自動スープかくはん釜",
    category: "kitchen",
    description: "スープの旨味抽出を加速。ラーメン一杯のベースG価格 +15%",
    cost: 300,
    level: 0,
    maxLevel: 5,
    effectMultiplier: 0.15
  },
  {
    id: "seating",
    name: "高級ヒノキのコの字カウンター",
    jpName: "高級ヒノキカウンター",
    category: "interior",
    description: "客の座席数を増加。回転率とチップ獲得率 +20%",
    cost: 450,
    level: 0,
    maxLevel: 4,
    effectMultiplier: 0.20
  },
  {
    id: "neon",
    name: "インスタ風麺看板＆ネオン",
    jpName: "インスタ風ネオン看板",
    category: "interior",
    description: "若者や観光客に大バズり。人気度・名声獲得効率 +25%",
    cost: 600,
    level: 0,
    maxLevel: 4,
    effectMultiplier: 0.25
  },
  {
    id: "assistant",
    name: "伝説の修行僧お弟子さん",
    jpName: "お弟子さんの雇用",
    category: "staff",
    description: "客を自動で高速配膳＆片付け。客の待ち時間の忍耐減少速度 -15%",
    cost: 800,
    level: 0,
    maxLevel: 3,
    effectMultiplier: 0.15
  }
];
