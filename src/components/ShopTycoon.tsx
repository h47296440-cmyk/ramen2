import React, { useState, useEffect, useRef } from "react";
import { 
  Customer, 
  CustomerType, 
  RamenRecipe, 
  ShopUpgrade, 
  SOUP_INFO, 
  NOODLE_INFO, 
  MASTER_TOPPINGS 
} from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  DollarSign, 
  Users, 
  Heart, 
  Clock, 
  Utensils, 
  ChevronRight, 
  ShieldAlert, 
  HelpCircle, 
  ThumbsUp, 
  Coins, 
  Award,
  Zap,
  RefreshCw
} from "lucide-react";

interface ShopTycoonProps {
  gold: number;
  reputation: number;
  activeRecipeId: string | null;
  recipes: RamenRecipe[];
  upgrades: ShopUpgrade[];
  onEarnGold: (amount: number) => void;
  onEarnReputation: (amount: number) => void;
  onServeBowl: () => void;
}

const CUSTOMER_NAMES: Record<CustomerType, string[]> = {
  salaryman: ["タカハシ課長", "サトウ係長", "ヤマダ部長", "ノムラさん"],
  student: ["タカシ(高校生)", "リュウジ(大食党)", "ケンタ(陸上部)", "ショウタ"],
  jk: ["マイ(JK)", "サクラ(女子大生)", "ユイ(映え重視)", "ヒナ"],
  gourmet: ["ラーメン王・神原", "美食家マダム・ルイ", "ラーヲタのシュン", "ラ王"],
  tourist: ["ジョン(米)", "マルコ(伊)", "リン(台)", "アレックス(独)"],
  grandpa: ["茂おじいちゃん", "サブちゃん(常連)", "亀吉翁", "大正レトロおじさん"]
};

const CUSTOMER_AVATARS: Record<CustomerType, string> = {
  salaryman: "👨‍💼",
  student: "👦",
  jk: "👩‍🦰",
  gourmet: "🕶️",
  tourist: "🤠",
  grandpa: "👴"
};

export default function ShopTycoon({
  gold,
  reputation,
  activeRecipeId,
  recipes,
  upgrades,
  onEarnGold,
  onEarnReputation,
  onServeBowl
}: ShopTycoonProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const isServingLoopRef = useRef<boolean>(false);

  // Read active recipe details
  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  // Read upgrade levels
  const kitchenUpgrade = upgrades.find(u => u.id === "stovetop");
  const interiorUpgrade = upgrades.find(u => u.id === "seating");
  const neonUpgrade = upgrades.find(u => u.id === "neon");
  const staffUpgrade = upgrades.find(u => u.id === "assistant");

  // SEAT SYSTEM capacity based on seating/wooden upgrade
  const maxSeats = 3 + (interiorUpgrade?.level || 0); 
  const currentLevelMultiplier = 1 + (kitchenUpgrade?.level || 0) * (kitchenUpgrade?.effectMultiplier || 0);
  const popularityBoost = 1 + (neonUpgrade?.level || 0) * (neonUpgrade?.effectMultiplier || 0);
  const autoSlowingMultiplier = 1 - (staffUpgrade?.level || 0) * (staffUpgrade?.effectMultiplier || 0.15);

  // Generate dynamic customer based on preferences & levels
  const generateCustomer = (): Customer => {
    const types: CustomerType[] = ["salaryman", "student", "jk", "gourmet", "tourist", "grandpa"];
    const type = types[Math.floor(Math.random() * types.length)];
    const namesList = CUSTOMER_NAMES[type];
    const name = namesList[Math.floor(Math.random() * namesList.length)];
    
    let preferredSoup: any[] = [];
    let dislikedSoup: any[] = [];
    let patienceMax = 60; // seconds

    // Taste Profiles matching
    switch(type) {
      case "salaryman":
        preferredSoup = ["tonkotsu", "tori_paitan"];
        dislikedSoup = ["shio"];
        patienceMax = 50;
        break;
      case "student":
        preferredSoup = ["miso", "tonkotsu"];
        dislikedSoup = ["shio"];
        patienceMax = 45; // Students are hungry and impatient!
        break;
      case "jk":
        preferredSoup = ["tori_paitan", "shio"];
        dislikedSoup = ["tonkotsu"];
        patienceMax = 70; // JK loves taking photos first
        break;
      case "gourmet":
        preferredSoup = ["shio", "shoyu", "whole_wheat"]; // High-end soups
        dislikedSoup = [];
        patienceMax = 40; // Food critics are very demanding!
        break;
      case "tourist":
        preferredSoup = ["tonkotsu", "shoyu", "miso"];
        dislikedSoup = [];
        patienceMax = 80; // Tourists are chill and enjoy Japan
        break;
      case "grandpa":
        preferredSoup = ["shoyu", "shio"];
        dislikedSoup = ["tonkotsu"];
        patienceMax = 75;
        break;
    }

    return {
      id: "cust_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name,
      type,
      patience: 100,
      patienceMax,
      preferredSoup,
      dislikedSoup,
      status: "waiting",
      seatedTime: Date.now(),
      avatarSeed: Math.random(),
      reactionMessage: "",
      payAmount: 0,
      ratingStars: 5
    };
  };

  // ARRIVAL LOOP: Spawn customers randomly relative to neon signs size and seats opens
  useEffect(() => {
    const minSpawnDelay = 4000;
    const maxSpawnDelay = 9000;

    const spawnTimer = setInterval(() => {
      setCustomers((prev) => {
        if (prev.filter(c => c.status !== "leaving").length >= maxSeats) {
          return prev; // Full shop seats
        }
        // Spawn a client
        return [...prev, generateCustomer()];
      });
    }, Math.max(2500, (minSpawnDelay + Math.random() * (maxSpawnDelay - minSpawnDelay)) / popularityBoost));

    return () => clearInterval(spawnTimer);
  }, [maxSeats, popularityBoost]);

  // SYSTEM CLOCK TICK: Decreases patience of waiting customers and eats food
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setCustomers((prev) => {
        return prev.map((customer) => {
          if (customer.status === "waiting") {
            const patienceDecrease = (1.5 * autoSlowingMultiplier);
            const nextPatience = Math.max(0, customer.patience - patienceDecrease);
            
            if (nextPatience <= 0) {
              return {
                ...customer,
                patience: 0,
                status: "leaving",
                reactionMessage: "もう我慢できない！別のラーメン屋に行くよ！💨",
                payAmount: 0,
                ratingStars: 1
              };
            }
            return { ...customer, patience: nextPatience };
          } else if (customer.status === "eating") {
            // Customer eating timer
            const elapsed = Date.now() - customer.seatedTime;
            if (elapsed > 4500) {
              // Finish dining, transition to reaction!
              const { pay, review, stars } = evaluateScoreAndPay(customer, activeRecipe);
              return {
                ...customer,
                status: "reacting",
                reactionMessage: review,
                payAmount: Math.round(pay * currentLevelMultiplier),
                ratingStars: stars
              };
            }
          }
          return customer;
        });
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [activeRecipeId, autoSlowingMultiplier, currentLevelMultiplier]);

  // AUTO DISCIPLES SERVING: Auto-serves if staff helper is unlocked
  useEffect(() => {
    if (staffUpgrade && staffUpgrade.level > 0 && activeRecipeId && customers.some(c => c.status === "waiting")) {
      // Find oldest waiting customer and auto-serve
      const oldestWaiting = customers.find(c => c.status === "waiting");
      if (oldestWaiting) {
        const timer = setTimeout(() => {
          handleServeCustomer(oldestWaiting.id);
        }, 1200 / staffUpgrade.level); // More disciples = faster serving
        return () => clearTimeout(timer);
      }
    }
  }, [customers, staffUpgrade, activeRecipeId]);

  // Dynamic feedback evaluation logic
  const evaluateScoreAndPay = (customer: Customer, recipe?: RamenRecipe): { pay: number; review: string; stars: number } => {
    if (!recipe) {
      return { pay: 100, review: "ごちそうさま。普通の味だったよ。", stars: 3 };
    }

    const aiEval = recipe.evaluation;
    let basePay = aiEval ? aiEval.priceEstimation : 850;
    let score = aiEval ? aiEval.overallScore : 60;
    
    let bonusSoup = 0;
    let stars = 3;
    let reviewText = "";

    // Pref base match bonuses
    if (customer.preferredSoup.includes(recipe.soup)) {
      bonusSoup += 15; // Pref base
    }
    if (customer.dislikedSoup.includes(recipe.soup)) {
      bonusSoup -= 20; // Hates base
    }

    // Special custom profile triggers
    let hasToppingBonus = 0;
    const recipeToppingIds = recipe.toppings.map(t => t.id);

    if (customer.type === "salaryman") {
      if (recipeToppingIds.includes("garlic")) hasToppingBonus += 15;
      if (recipeToppingIds.includes("chashu")) hasToppingBonus += 10;
      if (recipe.soup === "tonkotsu") hasToppingBonus += 10;
      
      const sum = score + bonusSoup + hasToppingBonus;
      if (sum >= 95) {
        stars = 5;
        reviewText = "ウオォ！この豚骨とニンニクの暴力的なパンチ！明日も仕事ががんばれる、至高の一杯だ！🔥";
      } else if (sum >= 70) {
        stars = 4;
        reviewText = "いいね！これこれ、この背脂とコク。濃厚なラーメンは仕事帰りに染みるね。";
      } else {
        stars = 2;
        reviewText = "ちょっとあっさりしすぎていて、スタミナが足りないなぁ。";
      }
    } else if (customer.type === "student") {
      if (recipeToppingIds.includes("corn_butter")) hasToppingBonus += 20;
      if (recipeToppingIds.includes("chashu")) hasToppingBonus += 12;
      
      const sum = score + bonusSoup + hasToppingBonus;
      if (sum >= 90) {
        stars = 5;
        reviewText = "大満足！コーンバターの甘みとコッテリさが神ブレンドすぎて、スープ完飲しちゃいました！ゲフ。";
      } else {
        stars = 4;
        reviewText = "山盛りの極太トッピングが最高ですね。お腹いっぱいになります！";
      }
    } else if (customer.type === "jk") {
      const topCount = recipe.toppings.length;
      if (recipeToppingIds.includes("nitamago")) hasToppingBonus += 15;
      if (recipeToppingIds.includes("naruto")) hasToppingBonus += 10;
      if (topCount > 6) hasToppingBonus -= 15; // Too messy looks ugly!

      const sum = score + bonusSoup + hasToppingBonus;
      if (sum >= 90) {
        stars = 5;
        reviewText = "ヤバい！具材の色彩パレットが超綺麗だし、鶏白湯のスープがトロトロで激ウマ！SNSにアップ決定🌟";
      } else {
        stars = 4;
        reviewText = "ビジュアルが可愛すぎ。煮玉子がトロトロでインスタ映えでした。";
      }
    } else if (customer.type === "gourmet") {
      // Very strict overall rating checking
      const sum = score + bonusSoup;
      if (recipeToppingIds.includes("gold")) hasToppingBonus += 25;
      if (recipeToppingIds.includes("mayu")) hasToppingBonus += 10;

      if (sum >= 92) {
        stars = 5;
        reviewText = "恐るべし。麺の小麦香、完璧に調和された黄金清湯スープ… 非の打ち所がない現代日本の記念碑。";
      } else if (sum >= 80) {
        stars = 4;
        reviewText = "高いレベルで調和している。スープのダシの引き出し方が一級品。";
      } else {
        stars = 2;
        reviewText = "スープと麺がバラバラに主張し、深みがない。まだまだ修業が足りんな。";
      }
    } else if (customer.type === "tourist") {
      if (recipeToppingIds.includes("chashu")) hasToppingBonus += 15;
      if (recipeToppingIds.includes("naruto")) hasToppingBonus += 15;
      if (recipeToppingIds.includes("nori")) hasToppingBonus += 10;

      const sum = score + bonusSoup + hasToppingBonus;
      if (sum >= 85) {
        stars = 5;
        reviewText = "OH MY GOD! Traditional giant Chashu with beautiful Naruto! This is the legendary Anime Ramen I saw on Kyoto blogs! Delish! 🇯🇵";
      } else {
        stars = 4;
        reviewText = "Very exotic noodles and golden soup! The Japanese dining atmosphere here is outstanding!";
      }
    } else { // grandpa
      if (recipeToppingIds.includes("menma")) hasToppingBonus += 15;
      if (recipeToppingIds.includes("nori")) hasToppingBonus += 10;
      if (recipeToppingIds.includes("negi")) hasToppingBonus += 10;

      const sum = score + bonusSoup + hasToppingBonus;
      if (sum >= 80) {
        stars = 5;
        reviewText = "懐かしいのう。やはりこの透き通った昔ながらの醤油にメンマが一番落ち着く。名店、ここですねえ。";
      } else {
        stars = 4;
        reviewText = "懐かしの屋台を思い出させる。飽きのこない丁寧な優しい味わいだ。";
      }
    }

    // Boosted payout calculation
    const matchEfficiency = stars >= 5 ? 1.4 : stars >= 4 ? 1.15 : stars >= 3 ? 1.0 : 0.7;
    const finalPay = Math.round(basePay * matchEfficiency);

    return {
      pay: finalPay,
      review: reviewText,
      stars
    };
  };

  // Serve a bowl of ramen to a specific customer
  const handleServeCustomer = (id: string) => {
    if (!activeRecipeId) return; // No menu registered
    setCustomers((prev) => {
      return prev.map(c => {
        if (c.id === id && c.status === "waiting") {
          return {
            ...c,
            status: "eating",
            seatedTime: Date.now() // Refreshed seating to track dining duration
          };
        }
        return c;
      });
    });
    onServeBowl();
  };

  // Collect money Gs and reputation when customers leave
  const handleCollectCash = (customer: Customer) => {
    onEarnGold(customer.payAmount);
    onEarnReputation(customer.ratingStars * 15);
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
  };

  const activeSeatsCount = customers.filter(c => c.status !== "leaving").length;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6">

      {/* SHOP METRICS HUD */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex justify-between items-center shadow-md">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 border border-amber-800/50 rounded-xl">
            <Users className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-sans font-bold text-stone-300">混雑状況</span>
            <span className="text-xs font-mono font-bold text-amber-400">({activeSeatsCount} / {maxSeats} 席)</span>
          </div>
          {staffUpgrade && staffUpgrade.level > 0 && (
            <div className="text-[9px] font-sans font-bold px-2 py-1 bg-emerald-950 text-emerald-400 rounded-lg flex items-center gap-1 border border-emerald-900/60">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" /> 弟子自動配膳中
            </div>
          )}
        </div>

        {/* ACTIVE MENU HUD */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-sans font-bold text-stone-400">現在の開発メニュー:</span>
          {activeRecipe ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl">
              <span className="text-xs font-sans font-black text-yellow-400 truncate max-w-[130px]">
                {activeRecipe.customName}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-stone-950 text-emerald-400 px-1.5 rounded">
                ★ {activeRecipe.evaluation?.overallScore || "?"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-red-400 px-2.5 py-1 bg-red-950/30 border border-red-500/20 rounded-xl animate-pulse">
              非掲載 (未設定)
            </span>
          )}
        </div>
      </div>

      {/* SHOP COUNTER SIMULATED UI */}
      <div className="bg-[#241711] border-4 border-[#3e271a] rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
        {/* Steam overlay animation effect */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-100/10 to-transparent pointer-events-none filter blur-lg animate-[pulse_3s_infinite]"></div>
        
        {/* Legendary Japanese Noren Header curtain */}
        <div className="absolute top-0 inset-x-12 flex justify-around pointer-events-none z-10 select-none">
          {["R", "A", "M", "E", "N"].map((char, index) => (
            <div 
              key={index}
              className="w-10 h-14 bg-red-800 border-x border-b-2 border-red-950 rounded-b-md text-white font-serif font-black text-center pt-2 leading-none"
              style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}
            >
              麺
            </div>
          ))}
        </div>

        {/* Wooden Kitchen Background panel layout */}
        <div className="w-full flex flex-col gap-6 mt-8">
          
          <h2 className="text-center font-bold font-sans text-stone-200 text-sm tracking-widest uppercase mb-1 flex items-center justify-center gap-1.5">
            <Utensils className="w-4 h-4 text-orange-400" /> ヒノキ磨きカウンター席
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {customers.map((customer) => {
                const preferenceNames = customer.preferredSoup.map(s => SOUP_INFO[s].name.split(" ")[0]).join("・");
                
                return (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -15 }}
                    className="bg-stone-950 border border-stone-880 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative relative"
                    style={{ minHeight: "180px", contentVisibility: "auto" }}
                  >
                    {/* Seat identity stamp */}
                    <div className="absolute top-2 right-3 text-[10px] font-mono text-stone-600 bg-stone-900 px-1.5 rounded border border-stone-800">
                      席別
                    </div>

                    {/* Customer Info Header */}
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 bg-stone-900 border border-amber-900/30 rounded-xl flex items-center justify-center text-2xl relative shadow-inner">
                        {CUSTOMER_AVATARS[customer.type]}
                        {/* Patience Ring */}
                        {customer.status === "waiting" && (
                          <div className="absolute inset-0 rounded-xl border-2 border-dashed animate-[spin_5s_infinite] opacity-50"
                               style={{ borderColor: customer.patience > 40 ? "#eab308" : "#ef4444" }}></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-stone-200 font-sans font-bold text-xs">{customer.name}</h4>
                        <span className="text-[9px] font-sans px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-400 rounded-full">
                          {customer.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Dialog or Preference Bubbles */}
                    <div className="my-3 bg-stone-900 p-2 border border-stone-850/60 rounded-xl text-[11px] leading-tight flex-1 flex flex-col justify-center">
                      {customer.status === "waiting" && (
                        <div>
                          <p className="text-yellow-400 font-sans font-semibold mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-500 animate-pulse" /> 
                            好みの風味: <strong>{preferenceNames}</strong>
                          </p>
                          <p className="text-stone-400 text-[10px] leading-tight">
                            「{customer.type === "salaryman" ? "仕事帰りに重い一杯、にんにく盛り盛りが欲しいねぇ。" :
                               customer.type === "student" ? "味噌が効いてるバターコーン特盛のコッテリを希望！" :
                               customer.type === "jk" ? "鶏白湯の綺麗な盛り付け。玉子はマストでお願いします♡" :
                               customer.type === "gourmet" ? "評論家に堪えうる黄金清湯を。全粒粉麺なら点数を入れるよ。" :
                               customer.type === "tourist" ? "Traditional ramen bowl with extra meat & seaweed sheets!" :
                               "和風のあっさり醤油にメンマを添えた昔ながらの一杯だよ。"
                            }」
                          </p>
                        </div>
                      )}

                      {customer.status === "eating" && (
                        <div className="flex flex-col items-center justify-center text-center py-2">
                          <p className="text-amber-400 font-bold text-[10px] uppercase tracking-wider animate-pulse mb-1">
                            🍜 ずずずーーっ！！
                          </p>
                          <p className="text-stone-300 text-[10px] italic">（スープまで一気にかき込んでいます…）</p>
                        </div>
                      )}

                      {(customer.status === "reacting" || customer.status === "leaving") && (
                        <p className="text-stone-200 italic text-[11px] font-sans leading-snug">
                          「{customer.reactionMessage}」
                        </p>
                      )}
                    </div>

                    {/* ACTIONS HUB FOOTER FOR SEATS */}
                    <div className="border-t border-stone-900 pt-2 flex items-center">
                      {customer.status === "waiting" && (
                        <div className="w-full">
                          {/* Patience Bar */}
                          <div className="w-full bg-stone-900 h-1.5 rounded-full mb-2 overflow-hidden border border-stone-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                customer.patience > 50 ? "bg-amber-500" : customer.patience > 20 ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                              }`}
                              style={{ width: `${customer.patience}%` }}
                            ></div>
                          </div>
                          
                          <button
                            onClick={() => handleServeCustomer(customer.id)}
                            disabled={!activeRecipeId}
                            className={`w-full py-1.5 rounded-lg font-bold font-sans text-[11px] border flex gap-1.5 items-center justify-center transition cursor-pointer ${
                              activeRecipeId
                                ? "bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-500 font-black shadow-sm"
                                : "bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed"
                            }`}
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            {activeRecipeId ? "配膳する (Serve)" : "【看板メニュー未設定】"}
                          </button>
                        </div>
                      )}

                      {customer.status === "eating" && (
                        <div className="w-full flex justify-between items-center bg-stone-900 py-1 px-3 rounded-lg border border-stone-850">
                          <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-stone-400" /> 食事中...
                          </span>
                          <span className="text-xs text-amber-500 font-mono">完食まであと少し</span>
                        </div>
                      )}

                      {customer.status === "reacting" && (
                        <button
                          onClick={() => handleCollectCash(customer)}
                          className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white border border-green-600 rounded-lg text-xs font-bold font-sans flex gap-1.5 items-center justify-center cursor-pointer shadow-md animate-bounce"
                        >
                          <Coins className="w-4 h-4 text-white" />
                          <span>お会計: <strong className="font-mono text-sm">{customer.payAmount}</strong> G を回収</span>
                        </button>
                      )}

                      {customer.status === "leaving" && (
                        <button
                          onClick={() => setCustomers(prev => prev.filter(c => c.id !== customer.id))}
                          className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 rounded-lg text-xs font-sans tracking-wide border border-stone-800 cursor-pointer"
                        >
                          客を片付ける
                        </button>
                      )}
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty seat visuals fill */}
            {customers.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 border-2 border-dashed border-[#503527] py-16 rounded-3xl flex flex-col justify-center items-center text-center opacity-65">
                <span className="text-4xl filter saturate-75 select-none mb-2 animate-pulse">🏮</span>
                <h3 className="text-stone-300 font-sans font-bold text-sm tracking-wide">空席カウンター</h3>
                <p className="text-[10px] text-stone-400 max-w-[280px] leading-relaxed mt-1">
                  現在、のれんをくぐるお客さんを待っています。美味しい匂いにつられて、まもなく入店します！
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SHOP TYCOON STATS & HINTS HELPER */}
      <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-slate-300 font-sans text-xs flex flex-col gap-1 leading-relaxed">
          <p className="font-black text-stone-100">💡 繁盛店のコツ（相性攻略）</p>
          <p>
            ・サラリーマンは<strong>濃厚豚骨スープ＋ニンニク＋チャーシュー</strong>で最大評価と高額チップを支払います。
          </p>
          <p>
            ・美食家（コメンテーター）は非常にグルメで、レシピ作成時に<strong>AI全体の評価スコア（★）が高い豪華な一杯</strong>を好んで注文します。
          </p>
          <p className="text-stone-400 text-[11px] mt-1">
            ※ 評判レベルが上がったら、道具屋で「弟子」を雇用して自動配膳に切り替えることもできます。
          </p>
        </div>
      </div>

    </div>
  );
}
