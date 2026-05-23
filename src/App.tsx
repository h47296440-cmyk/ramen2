import React, { useState, useEffect } from "react";
import { 
  GameState, 
  RamenRecipe, 
  ShopUpgrade, 
  INITIAL_UPGRADES, 
  MASTER_TOPPINGS 
} from "./types";
import RamenCreator from "./components/RamenCreator";
import ShopTycoon from "./components/ShopTycoon";
import ShareCard from "./components/ShareCard";
import ShopUpgrades from "./components/ShopUpgrades";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, 
  Coins, 
  ChefHat, 
  Sparkles, 
  HelpCircle, 
  Utensils, 
  BookOpen, 
  Layers, 
  Settings, 
  Volume2, 
  VolumeX,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
  Heart
} from "lucide-react";

export default function App() {
  // Game states with standard fallbacks
  const [gold, setGold] = useState<number>(500);
  const [reputation, setReputation] = useState<number>(10);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RamenRecipe[]>([]);
  const [unlockedToppingIds, setUnlockedToppingIds] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<ShopUpgrade[]>([]);
  const [totalBowlsServed, setTotalBowlsServed] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"kitchen" | "create" | "recipes" | "shop" | "help">("kitchen");
  
  // Game settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const savedGold = localStorage.getItem("ramen_gold");
      const savedRep = localStorage.getItem("ramen_reputation");
      const savedRecipes = localStorage.getItem("ramen_recipes");
      const savedActive = localStorage.getItem("ramen_active_recipe_id");
      const savedToppings = localStorage.getItem("ramen_unlocked_toppings");
      const savedUpgrades = localStorage.getItem("ramen_upgrades");
      const savedTotalCups = localStorage.getItem("ramen_total_bowls");

      if (savedGold) setGold(parseInt(savedGold));
      if (savedRep) setReputation(parseInt(savedRep));
      if (savedActive) setActiveRecipeId(savedActive === "null" ? null : savedActive);
      if (savedTotalCups) setTotalBowlsServed(parseInt(savedTotalCups));
      
      if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
      if (savedToppings) setUnlockedToppingIds(JSON.parse(savedToppings));
      
      if (savedUpgrades) {
        setUpgrades(JSON.parse(savedUpgrades));
      } else {
        setUpgrades(INITIAL_UPGRADES);
      }
    } catch (e) {
      console.warn("Could not retrieve local storage: ", e);
      setUpgrades(INITIAL_UPGRADES);
    }
  }, []);

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem("ramen_gold", gold.toString());
    localStorage.setItem("ramen_reputation", reputation.toString());
    localStorage.setItem("ramen_active_recipe_id", activeRecipeId || "null");
    localStorage.setItem("ramen_recipes", JSON.stringify(recipes));
    localStorage.setItem("ramen_unlocked_toppings", JSON.stringify(unlockedToppingIds));
    localStorage.setItem("ramen_upgrades", JSON.stringify(upgrades));
    localStorage.setItem("ramen_total_bowls", totalBowlsServed.toString());
  }, [gold, reputation, activeRecipeId, recipes, unlockedToppingIds, upgrades, totalBowlsServed]);

  // Oscillator synthesizer helper for satisfying audio chimes 
  const playSfx = (freq = 440, type: OscillatorType = "sine", duration = 0.12) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // SFX Presets
  const playCoinSfx = () => {
    playSfx(587.33, "sine", 0.08); // D5
    setTimeout(() => playSfx(880, "sine", 0.15), 60); // A5 clink
  };

  const playUpgradedSfx = () => {
    playSfx(523.25, "triangle", 0.1); // C5
    setTimeout(() => playSfx(659.25, "triangle", 0.1), 80); // E5
    setTimeout(() => playSfx(783.99, "triangle", 0.1), 160); // G5
    setTimeout(() => playSfx(1046.50, "triangle", 0.2), 240); // C6 fanfares
  };

  const playTabSfx = () => {
    playSfx(440, "sine", 0.05); // Standard click
  };

  // State actions
  const handleEarnGold = (amount: number) => {
    setGold(prev => prev + amount);
    playCoinSfx();
  };

  const handleEarnReputation = (points: number) => {
    setReputation(prev => prev + points);
  };

  const handleServeBowl = () => {
    setTotalBowlsServed(prev => prev + 1);
  };

  const handleRecipeCreated = (newRecipe: RamenRecipe) => {
    setRecipes(prev => [...prev, newRecipe]);
    // Automatically set menu if this is the first created recipe 
    if (recipes.length === 0) {
      setActiveRecipeId(newRecipe.id);
    }
    // Success chime
    playUpgradedSfx();
  };

  const handleSetMenu = (recipeId: string) => {
    setActiveRecipeId(recipeId);
    playSfx(783.99, "sine", 0.18); // Churn chime
  };

  const handleUnlockTopping = (toppingId: string, cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    setUnlockedToppingIds(prev => [...prev, toppingId]);
    playUpgradedSfx();
  };

  const handleUpgradeShop = (upgradeId: string, cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    setUpgrades(prev => prev.map((up) => {
      if (up.id === upgradeId) {
        return { ...up, level: up.level + 1 };
      }
      return up;
    }));
    playUpgradedSfx();
  };

  // Calculated reputation bounds
  const getReputationLevel = () => {
    const level = Math.floor(Math.sqrt(reputation / 25)) + 1;
    return level;
  };

  const repLevel = getReputationLevel();
  const nextLevelBound = (repLevel) * (repLevel) * 25;
  const prevLevelBound = (repLevel - 1) * (repLevel - 1) * 25;
  const levelProgressPercent = Math.min(100, Math.max(0, ((reputation - prevLevelBound) / (nextLevelBound - prevLevelBound)) * 100));

  // Visual text titles corresponding to reputation levels
  const getChefRankTitle = (lvl: number) => {
    if (lvl >= 10) return "🍥 伝説のラーメン大聖者";
    if (lvl >= 8) return "🌟 極み流一等料理総帥";
    if (lvl >= 6) return "🔪 神田の名店おやっさん";
    if (lvl >= 4) return "🍖 新宿新進気鋭の仕掛け人";
    if (lvl >= 2) return "🌱 麺切り見習い修行僧";
    return "🥣 本格屋台の下準備係";
  };

  return (
    <div className="min-h-screen bg-[#111112] text-stone-100 flex flex-col font-sans selection:bg-yellow-500 selection:text-stone-900">
      
      {/* GLOBAL HERO STATS HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#16171a]/95 backdrop-blur border-b border-stone-850 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Left Brand Area */}
          <div className="flex items-center gap-3">
            <span className="text-3xl filter animate-spin duration-[4000ms] select-none">🍥</span>
            <div>
              <h1 className="text-stone-100 font-extrabold text-base tracking-wider flex items-center gap-1.5 leading-none">
                本格ラーメン職人 <span className="text-yellow-400 text-xs font-mono font-bold tracking-normal px-2 py-0.5 bg-yellow-950/60 border border-yellow-800/40 rounded-full">Ramen Legend</span>
              </h1>
              <p className="text-[10px] text-stone-400 font-sans tracking-wide mt-1">
                {getChefRankTitle(repLevel)} (Lv.{repLevel})
              </p>
            </div>
          </div>

          {/* Center stats parameters readout */}
          <div className="flex gap-4 items-center">
            
            {/* GOLD COINS HUB */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 border border-stone-850 rounded-2xl shadow-inner">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-stone-950 font-bold text-xs shadow">
                G
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold block leading-none">資金ゴールド</span>
                <span className="text-sm font-mono font-black text-yellow-400 leading-none">{gold}</span>
              </div>
            </div>

            {/* FAME POINTS LEVEL */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 border border-stone-850 rounded-2xl shadow-inner min-w-[150px]">
              <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 font-bold text-xs">
                ★
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center text-[9px] text-slate-400 leading-none mb-0.5">
                  <span className="font-bold">名声値 (Exp)</span>
                  <span className="font-mono">{reputation}</span>
                </div>
                {/* Micro level progress bar */}
                <div className="w-full bg-stone-880 h-1.5 rounded-full overflow-hidden border border-stone-900/50">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${levelProgressPercent}%` }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Sound Controls Area */}
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSfx(440, "sine", 0.05);
            }}
            className="text-stone-400 hover:text-white p-1.5 hover:bg-stone-800 rounded-lg border border-transparent hover:border-stone-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

        </div>
      </header>

      {/* MOBILE DESKTOP DUAL NAVIGATION TABS */}
      <nav className="bg-stone-950 border-b border-stone-850/60 overflow-x-auto select-none px-4 scrollbar-hide py-1">
        <div className="max-w-4xl mx-auto flex justify-around gap-1">
          {[
            { id: "kitchen", label: "店舗経営カウンター", icon: <Utensils className="w-4 h-4" /> },
            { id: "create", label: "創作どんぶり厨房", icon: <ChefHat className="w-4 h-4" /> },
            { id: "recipes", label: "創作免許・実績", icon: <BookOpen className="w-4 h-4" /> },
            { id: "shop", label: "道具・トッピング屋", icon: <Coins className="w-4 h-4" /> },
            { id: "help", label: "ラーメン屋指南書", icon: <HelpCircle className="w-4 h-4" /> }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playTabSfx();
                }}
                className={`py-3.5 px-3 border-b-2 text-xs font-bold font-sans tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer relative ${
                  isSelected 
                    ? "border-yellow-500 text-yellow-500 bg-stone-900/60" 
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CORE ROUTING AND CONTENT PANELS */}
      <main className="flex-1 py-4 px-2 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "kitchen" && (
              <ShopTycoon 
                gold={gold}
                reputation={reputation}
                activeRecipeId={activeRecipeId}
                recipes={recipes}
                upgrades={upgrades}
                onEarnGold={handleEarnGold}
                onEarnReputation={handleEarnReputation}
                onServeBowl={handleServeBowl}
              />
            )}

            {activeTab === "create" && (
              <RamenCreator 
                gold={gold}
                unlockedToppingIds={unlockedToppingIds}
                onRecipeCreated={handleRecipeCreated}
                recipes={recipes}
                onSetMenu={handleSetMenu}
                activeRecipeId={activeRecipeId}
              />
            )}

            {activeTab === "shop" && (
              <ShopUpgrades 
                gold={gold}
                unlockedToppingIds={unlockedToppingIds}
                upgrades={upgrades}
                onUnlockTopping={handleUnlockTopping}
                onUpgradeShop={handleUpgradeShop}
              />
            )}

            {activeTab === "recipes" && (
              <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6">
                
                {/* Header overview banner */}
                <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl flex justify-between items-center shadow">
                  <div>
                    <h3 className="text-stone-100 font-sans font-black text-sm uppercase tracking-wide">
                      📚 常識を覆す創作らーめんの歩み (Your Recipes)
                    </h3>
                    <p className="text-stone-400 text-[10px] mt-1">
                      これまで創作し、AIによって厳格なプロ審査が施された一杯のアーカイブです。
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 font-bold block">累計提供数</span>
                    <strong className="text-sm font-mono text-indigo-400 font-black">{totalBowlsServed} 杯 Served</strong>
                  </div>
                </div>

                {/* Grid list of recipes */}
                {recipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recipes.map((recipe) => {
                      const isMenu = recipe.id === activeRecipeId;
                      return (
                        <div 
                          key={recipe.id}
                          className="bg-stone-950 border border-stone-880 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden"
                          style={{ contentVisibility: "auto" }}
                        >
                          {isMenu && (
                            <div className="absolute top-0 right-0 bg-[#ffd053] text-[#121213] text-[9px] px-3 py-1 rounded-bl-xl font-bold font-sans tracking-widest uppercase">
                              ★ お店の看板メニュー
                            </div>
                          )}

                          <div className="min-w-0 pr-12">
                            <h4 className="text-[#ffd053] font-extrabold text-base tracking-wide truncate">
                              {recipe.evaluation?.gourmetName || recipe.customName}
                            </h4>
                            <p className="text-[10px] text-stone-400 mt-1 font-mono">
                              スープ: {recipe.soup.toUpperCase()} / 評価: <strong className="text-yellow-400 text-xs font-sans">{recipe.evaluation?.overallScore || "審査なし"}点</strong>
                            </p>
                          </div>

                          {/* Built-in ShareCard layout directly in list */}
                          <ShareCard recipe={recipe} />

                          {/* Set menu option toggles */}
                          {!isMenu && (
                            <button
                              onClick={() => handleSetMenu(recipe.id)}
                              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl font-bold text-xs tracking-wide cursor-pointer transition border border-stone-800"
                            >
                              この一杯をメニューに設定する
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#3c3d42] py-20 rounded-3xl flex flex-col justify-center items-center text-center opacity-60">
                    <span className="text-5xl mb-2">🍜</span>
                    <h4 className="text-stone-300 font-sans font-bold text-sm tracking-wide">アーカイブは空っぽです</h4>
                    <p className="text-[10px] text-stone-400 max-w-[280px] leading-relaxed mt-1">
                      「創作どんぶり厨房」タブからスープ、麺、トッピングを組み合わせ、AIラーメン評論家に審査させることでアーカイブに蓄積され、実質的な販売看板メニューに登録できます！
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "help" && (
              <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-6">
                
                {/* Traditional Help Guide */}
                <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl flex flex-col gap-5 shadow-lg">
                  <div className="border-b border-stone-800 pb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-stone-100 font-sans font-black text-sm uppercase tracking-widest">
                      🏮 本格ラーメン屋・虎の巻（ゲームマニュアル）
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4 text-xs text-stone-300 leading-relaxed font-sans">
                    <div>
                      <h3 className="font-extrabold text-[#ffd053] mb-1">【ゲームの全体目標】</h3>
                      <p>
                        このシミュレータは、スープと麺、特選トッピングを完璧に計算して組み合わせる「ラーメン匠」となって、伝説の一杯を世に広め、押し寄せるお客さんから資金(G)と名声値(Exp)を獲得し、お店を拡大・大繁盛させるタイクーンゲームです。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#ffd053] mb-1">【ゲームの流れ】</h3>
                      <ol className="list-decimal pl-4 flex flex-col gap-1 mt-1 text-stone-400">
                        <li>
                          <strong>麺どんぶりの創作</strong>：〈創作どんぶり厨房〉タブでスープ・麺質を選び、高級トッピングをどんぶりの任意の位置に配置して、AI評論家に実食させます。
                        </li>
                        <li>
                          <strong>AIによる免許・評価</strong>：Gemini AI評論家がスープと具材の調和、美しさを秒速で実食審査して点数を付けます。自動的におすすめ提供価格が決定されます。
                        </li>
                        <li>
                          <strong>店舗看板メニュー化</strong>：審査された一杯を「メニューに設定」することで、店頭に並びます。
                        </li>
                        <li>
                          <strong>カウンターでの配膳</strong>：〈店舗経営カウンター〉で、次々とやってくるお客さんの空腹を、看板商品で満たします。お客さんの好みと一致すれば、高額のチップを回収できます。
                        </li>
                        <li>
                          <strong>道具屋で解禁</strong>：稼いだ資金で「特製辣油」「コーンバター」「金箔」などの高級食材を道具屋でアンロック。さらに店を自動化する「お弟子さん」の雇用やヒノキカウンターの増設などを行いましょう！
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#ffd053] mb-1">【素材と相性のヒント】</h3>
                      <ul className="list-disc pl-4 flex flex-col gap-1 mt-1 text-stone-400">
                        <li>
                          <strong>濃厚豚骨 (Tonkotsu)</strong>：極細ストレート麺が一番マッチ。サラリーマンに抜群の威力を発揮。
                        </li>
                        <li>
                          <strong>淡麗塩 (Shio)</strong>：全粒粉入り上品なストレート麺、九条ネギや江戸前のりなど。美食家が愛好。
                        </li>
                        <li>
                          <strong>芳醇味噌 (Miso)</strong>：中太ちぢれ麺、コーンバターなどの甘み・こってり増しトッピングが大食い高校生にバズります。
                        </li>
                      </ul>
                    </div>

                    <div className="bg-stone-950 p-4 border border-stone-850 rounded-2xl flex items-center gap-3">
                      <Heart className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="font-bold text-stone-100">AI実食評価で高評価を勝ち取りましょう！</p>
                        <p className="text-stone-400 text-[11px] mt-0.5">
                          完成した証書カードはダウンロードしてGitHub READMEなどで公開し、SNSでハッシュタグを添えて自慢できます。
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="py-6 mt-12 bg-stone-950 border-t border-stone-850 text-center text-[10px] text-stone-500 font-sans">
        <p className="tracking-widest">© 2026 RAMEN CREATOR TYCOON. ALL CHIPS DESERVED.</p>
        <p className="text-[9px] text-[#423f3f] mt-1">
          Crafted with React, Tailwind, motion, and Google AI Studio Gemini SDK.
        </p>
      </footer>

    </div>
  );
}
