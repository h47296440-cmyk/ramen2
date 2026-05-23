import React, { useState, useRef, useEffect } from "react";
import { 
  Topping, 
  PlacedTopping, 
  RamenRecipe, 
  MASTER_TOPPINGS, 
  SOUP_INFO, 
  NOODLE_INFO, 
  RICHNESS_INFO, 
  SoupType, 
  NoodleType, 
  RichnessType,
  AIEvaluation
} from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Flame, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  HelpCircle, 
  BookOpen, 
  Layers,
  ChefHat,
  Share2
} from "lucide-react";

interface RamenCreatorProps {
  gold: number;
  unlockedToppingIds: string[];
  onRecipeCreated: (recipe: RamenRecipe) => void;
  recipes: RamenRecipe[];
  onSetMenu: (recipeId: string) => void;
  activeRecipeId: string | null;
}

export default function RamenCreator({
  gold,
  unlockedToppingIds,
  onRecipeCreated,
  recipes,
  onSetMenu,
  activeRecipeId
}: RamenCreatorProps) {
  // Creator configuration state
  const [selectedSoup, setSelectedSoup] = useState<SoupType>("tonkotsu");
  const [selectedNoodle, setSelectedNoodle] = useState<NoodleType>("thin_straight");
  const [selectedRichness, setSelectedRichness] = useState<RichnessType>("regular");
  const [placedToppings, setPlacedToppings] = useState<PlacedTopping[]>([]);
  const [customName, setCustomName] = useState("");
  const [activeToppingIndex, setActiveToppingIndex] = useState<number | null>(null);

  // Dragging interaction states
  const bowlRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // API Call state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [slurpPhase, setSlurpPhase] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<AIEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Slurping animation text cycles
  const slurpMessages = [
    "AI評論家がどんぶりを覗き込んでいます...",
    "黄金比率のスープをレンゲですすっています...",
    "麺の加水率と絡み具合をじっくり吟味中...",
    "具材の盛り付けと色彩の贅沢さを凝視中...",
    "…ッ！箸が止まらないようです！"
  ];

  useEffect(() => {
    let interval: any;
    if (isEvaluating) {
      interval = setInterval(() => {
        setSlurpPhase((prev) => (prev + 1) % slurpMessages.length);
      }, 2500);
    } else {
      setSlurpPhase(0);
    }
    return () => clearInterval(interval);
  }, [isEvaluating]);

  // Topping list derived from dynamic unlocks
  const availableToppings = MASTER_TOPPINGS.map(t => {
    return {
      ...t,
      unlocked: unlockedToppingIds.includes(t.id) || t.cost === 0
    };
  });

  const handleAddTopping = (topping: Topping) => {
    if (!topping.unlocked) return;
    
    // Add topping slightly randomized near center of the bowl
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 20; // radius %
    const newTopping: PlacedTopping = {
      id: topping.id,
      x: 50 + Math.cos(angle) * distance,
      y: 50 + Math.sin(angle) * distance,
      rotation: Math.round(Math.random() * 360),
      scale: 1.0
    };

    setPlacedToppings([...placedToppings, newTopping]);
    setActiveToppingIndex(placedToppings.length); // Focus the newest topping
  };

  const handleRemoveTopping = (index: number) => {
    const updated = [...placedToppings];
    updated.splice(index, 1);
    setPlacedToppings(updated);
    setActiveToppingIndex(null);
  };

  const handleUpdateTopping = (index: number, updates: Partial<PlacedTopping>) => {
    const updated = [...placedToppings];
    updated[index] = { ...updated[index], ...updates };
    setPlacedToppings(updated);
  };

  // Drag and Drop implementation inside the custom bowl container 
  const handleBowlPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeToppingIndex === null || !bowlRef.current) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBowlPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || activeToppingIndex === null || !bowlRef.current) return;
    
    const rect = bowlRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to logical safe boundary of the soup base rim (15% to 85%)
    const clampedX = Math.max(16, Math.min(84, x));
    const clampedY = Math.max(16, Math.min(84, y));

    handleUpdateTopping(activeToppingIndex, { x: clampedX, y: clampedY });
  };

  const handleBowlPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const clearAllToppings = () => {
    setPlacedToppings([]);
    setActiveToppingIndex(null);
    setEvaluationResult(null);
    setErrorMessage("");
  };

  // Submit ramen recipe to Gemini evaluation proxy
  const handleSubmitToCritic = async () => {
    setIsEvaluating(true);
    setErrorMessage("");
    setEvaluationResult(null);

    const mappedToppingsForAPI = placedToppings.map(pt => {
      const base = availableToppings.find(t => t.id === pt.id);
      return {
        id: pt.id,
        name: base?.jpName || pt.id,
        count: 1
      };
    });

    try {
      const response = await fetch("/api/evaluate-ramen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soup: SOUP_INFO[selectedSoup].name,
          noodle: NOODLE_INFO[selectedNoodle].name,
          richness: RICHNESS_INFO[selectedRichness].name,
          toppings: mappedToppingsForAPI
        })
      });

      const resData = await response.json();
      if (resData.success && resData.evaluation) {
        setEvaluationResult(resData.evaluation);
        
        // Generate new Ramen object and save it inside parent component state
        const generatedRecipe: RamenRecipe = {
          id: "recipe_" + Date.now(),
          customName: customName.trim() || `${SOUP_INFO[selectedSoup].name.split(" ")[0]}・特製拉麺`,
          soup: selectedSoup,
          noodle: selectedNoodle,
          richness: selectedRichness,
          toppings: [...placedToppings],
          evaluation: resData.evaluation,
          createdAt: Date.now()
        };

        onRecipeCreated(generatedRecipe);
      } else {
        setErrorMessage(resData.error || "ラーメンの審査に失敗しました。もう一度試してください。");
      }
    } catch (err: any) {
      setErrorMessage("システムエラー: 評論サーバーに接続できません。");
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentSoupObj = SOUP_INFO[selectedSoup];

  // Helper renderer to draw distinct topping graphics in SVG/CSS style inside the bowl
  const renderToppingVisual = (pt: PlacedTopping, index: boolean, isSelected: boolean) => {
    const base = MASTER_TOPPINGS.find(t => t.id === pt.id);
    if (!base) return null;

    // Dynamic graphic generator corresponding to Topping types
    let shape = null;
    if (base.id === "chashu") {
      shape = (
        <div className="w-14 h-14 rounded-full border-2 border-[#823a31] relative overflow-hidden flex items-center justify-center"
             style={{ 
               background: "radial-gradient(circle, #ce7366 30%, #893e34 90%)",
               boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)"
             }}>
          <div className="absolute inset-2 rounded-full border border-dashed border-[#ffbca3] opacity-60"></div>
          {/* Meat grain swirls */}
          <div className="absolute w-12 h-6 rounded-full border-t border-[#f4b6ad] opacity-70 top-2 -rotate-12"></div>
          <div className="absolute w-10 h-4 rounded-full border-b border-[#f4b6ad] opacity-70 bottom-3 rotate-12"></div>
          <span className="text-xl font-bold saturate-125 select-none drop-shadow-md">🍖</span>
        </div>
      );
    } else if (base.id === "nitamago") {
      shape = (
        <div className="w-11 h-13 rounded-[40%_40%_50%_50%] border-2 border-[#8a6833] relative flex items-center justify-center p-1 bg-[#fff8ea]"
             style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.15)" }}>
          {/* Golden yolk */}
          <div className="w-7 h-7 rounded-full bg-[#ff9e00] border border-orange-500 absolute bottom-1.5 flex items-center justify-center shadow-inner"
               style={{ background: "radial-gradient(circle, #ffca36 20%, #e06000 100%)" }}>
            <div className="w-3.5 h-3.5 rounded-full bg-white opacity-45 absolute top-1 left-1 filter blur-[0.5px]"></div>
          </div>
        </div>
      );
    } else if (base.id === "menma") {
      shape = (
        <div className="w-14 h-6 bg-[#dfad62] rounded border-2 border-[#ad7e3a] relative overflow-hidden shadow-md flex items-center justify-around">
          <div className="h-full w-0.5 bg-[#ad7e3a] opacity-40"></div>
          <div className="h-full w-0.5 bg-[#ad7e3a] opacity-40"></div>
          <div className="h-full w-0.5 bg-[#ad7e3a] opacity-40"></div>
        </div>
      );
    } else if (base.id === "negi") {
      shape = (
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-full border border-emerald-700 bg-emerald-500 flex items-center justify-center text-[8px] text-white font-black">🌱</div>
          <div className="w-3.5 h-3.5 rounded-full border border-emerald-600 bg-emerald-400 -ml-1"></div>
          <div className="w-4 h-4 rounded-full border border-emerald-700 bg-emerald-500 -ml-1 flex items-center justify-center text-[10px]">🌱</div>
        </div>
      );
    } else if (base.id === "nori") {
      shape = (
        <div className="w-16 h-16 bg-[#1f2621] border border-[#2d3a2f] shadow-lg flex flex-col justify-around p-1 rounded-sm"
             style={{ background: "linear-gradient(135deg, #222a24 0%, #171d19 100%)", clipPath: "polygon(0% 15%, 100% 0%, 95% 100%, 5% 90%)" }}>
          <div className="w-full h-0.5 bg-[#405445] opacity-25"></div>
          <div className="w-full h-0.5 bg-[#405445] opacity-25"></div>
        </div>
      );
    } else if (base.id === "naruto") {
      shape = (
        <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-white shadow-md flex items-center justify-center relative overflow-hidden"
             style={{ backgroundImage: "radial-gradient(circle, #fcfcfc 40%, #e2e2e2 100%)" }}>
          {/* Pink swirls */}
          <svg className="absolute w-8 h-8 text-[#ff4c7b] opacity-80" viewBox="0 0 100 100">
            <path d="M 50,50 Q 75,30 50,20 Q 25,30 30,50 Q 35,70 60,65 Q 85,60 70,40" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round"/>
          </svg>
          <div className="w-full h-full absolute border border-dashed border-red-100 rounded-full scale-95 opacity-50"></div>
        </div>
      );
    } else if (base.id === "garlic") {
      shape = (
        <div className="flex gap-1.5 p-1 bg-white/70 backdrop-blur-[1px] rounded-full shadow-inner border border-yellow-100">
          <span className="text-xs">🧄</span>
          <span className="text-[10px] font-sans text-amber-900 leading-none self-center">にんにく</span>
        </div>
      );
    } else if (base.id === "raiyu") {
      shape = (
        <div className="w-12 h-12 rounded-full border border-red-700 border-dashed absolute animate-pulse"
             style={{ background: "radial-gradient(circle, rgba(220,38,38,0.7) 10%, rgba(220,10,10,0.1) 85%)" }}>
        </div>
      );
    } else if (base.id === "corn_butter") {
      shape = (
        <div className="flex flex-col items-center">
          {/* Butter brick */}
          <div className="w-7 h-5 bg-[#ffe26b] border border-amber-500 rounded-sm shadow-md mb-0.5"></div>
          {/* Corn pieces */}
          <div className="flex gap-0.5">
            <span className="text-xs">🌽</span>
            <span className="text-xs">🌽</span>
          </div>
        </div>
      );
    } else if (base.id === "kikurage") {
      shape = (
        <div className="flex flex-col gap-0.5">
          <div className="w-10 h-2.5 bg-[#252528] rounded-full border border-neutral-800 rotate-12"></div>
          <div className="w-9 h-2.5 bg-[#313035] rounded-full border border-neutral-800 -rotate-12 -mt-1 ml-1"></div>
          <div className="w-11 h-2 bg-[#1b1c1e] rounded-full border border-neutral-950 rotate-45 -mt-1"></div>
        </div>
      );
    } else if (base.id === "mayu") {
      shape = (
        <div className="w-14 h-10 border-t-2 border-[#1c1917] rounded-[50%] opacity-85"
             style={{ background: "radial-gradient(circle, rgba(30,30,30,0.6) 20%, transparent 90%)" }}>
        </div>
      );
    } else if (base.id === "gold") {
      shape = (
        <div className="w-8 h-8 relative animate-pulse">
          <div className="absolute inset-0 bg-yellow-400" 
               style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}></div>
          <div className="absolute inset-1.5 bg-[#ffe054]" 
               style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}></div>
          <span className="text-yellow-600 font-bold text-[8px] absolute top-1.5 left-2 select-none">GOLD</span>
        </div>
      );
    } else {
      shape = (
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center">
          <span className="text-xl">{base.iconName}</span>
        </div>
      );
    }

    return (
      <div 
        key={index}
        className={`absolute cursor-pointer transition-shadow select-none z-20 ${
          isSelected ? "ring-2 ring-yellow-400 ring-offset-2 scale-110 drop-shadow-2xl z-30" : "hover:scale-105"
        }`}
        style={{
          left: `${pt.x}%`,
          top: `${pt.y}%`,
          transform: `translate(-50%, -50%) rotate(${pt.rotation}deg) scale(${pt.scale})`,
          touchAction: "none"
        }}
        onClick={(e) => {
          e.stopPropagation(); // Avoid bowl de-select trigger
          setActiveToppingIndex(index);
        }}
      >
        {shape}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto items-start">
      
      {/* LEFT COLUMN: The Interactive Ramen Bowl & Toppings Canvas */}
      <div className="col-span-1 lg:col-span-7 flex flex-col items-center">
        
        {/* Bowl Card Canvas wrap */}
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-xs font-mono px-3 py-1 bg-stone-800 text-stone-300 border border-stone-700 rounded-full flex gap-1 items-center">
              <Layers className="w-3 h-3 text-yellow-500" /> Layered Builder
            </span>
            <div className="flex gap-2">
              <button 
                onClick={clearAllToppings}
                className="text-stone-400 hover:text-white hover:bg-stone-800 p-1.5 rounded-lg border border-transparent hover:border-stone-700 transition"
                title="最初からやり直す"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DYNAMIC BOWL CANVAS CONTAINER */}
          <div 
            ref={bowlRef}
            id="ramen-interactive-bowl"
            className="w-80 h-80 rounded-full border-[12px] border-[#9c2921] relative overflow-hidden select-none flex items-center justify-center bg-amber-950 transition-colors duration-500 shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_12px_24px_rgba(0,0,0,0.4)]"
            style={{ 
              borderColor: "#881e13",
              background: currentSoupObj.pattern,
              touchAction: "none"
            }}
            onPointerDown={handleBowlPointerDown}
            onPointerMove={handleBowlPointerMove}
            onPointerUp={handleBowlPointerUp}
            onPointerLeave={handleBowlPointerUp}
            onClick={() => setActiveToppingIndex(null)} // Click empty space inside bowl to deactive focus
          >
            {/* Outer golden design line on broth */}
            <div className="absolute inset-4 rounded-full border border-dashed border-[#ffd36e] opacity-25"></div>
            
            {/* Elegant porcelain waves SVG background */}
            <svg className="absolute inset-0 w-full h-full text-white/5 opacity-10 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M10,50 Q40,40 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M20,60 Q40,55 50,60 T80,60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>

            {/* STEAM LAYER */}
            <div className="absolute inset-0 z-40 bg-radial-gradient from-white/10 to-transparent pointer-events-none opacity-40 mix-blend-screen filter blur-md"></div>

            {/* DYNAMIC NOODLE GRAPHIC ENGINE */}
            <div className="absolute inset-10 z-10 opacity-75 pointer-events-none">
              {selectedNoodle === "thin_straight" && (
                <svg className="w-full h-full text-[#ffd154]" viewBox="0 0 100 100">
                  {/* Straight fine lines */}
                  {Array.from({ length: 28 }).map((_, i) => {
                    const offset = (i - 14) * 2.5;
                    return (
                      <line 
                        key={i} 
                        x1={15 + offset} y1="20" 
                        x2={85 + offset} y2="80" 
                        stroke="currentColor" 
                        strokeWidth="1.2" 
                        opacity={0.85 - Math.abs(offset)/40} 
                      />
                    );
                  })}
                </svg>
              )}
              {selectedNoodle === "curly_medium" && (
                <svg className="w-full h-full text-[#ffc634]" viewBox="0 0 100 100">
                  {/* Curly sine wave lines */}
                  {Array.from({ length: 14 }).map((_, i) => {
                    const y = 20 + i * 5;
                    return (
                      <path 
                        key={i} 
                        d={`M 15 ${y} Q 25 ${y - 5} 35 ${y} T 55 ${y} T 75 ${y} T 85 ${y}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                      />
                    );
                  })}
                </svg>
              )}
              {selectedNoodle === "thick_flat" && (
                <svg className="w-full h-full text-[#ffe893]" viewBox="0 0 100 100">
                  {/* Broad wavy lines */}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const y = 22 + i * 7;
                    return (
                      <path 
                        key={i} 
                        d={`M 15 ${y} C 30 ${y - 10}, 45 ${y + 10}, 85 ${y}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                      />
                    );
                  })}
                </svg>
              )}
              {selectedNoodle === "whole_wheat" && (
                <svg className="w-full h-full text-[#eed2a4] stroke-[#bf9254]" viewBox="0 0 100 100">
                  {/* Textured beige straight/curved combo */}
                  {Array.from({ length: 20 }).map((_, i) => {
                    const offset = (i - 10) * 3;
                    return (
                      <line 
                        key={i} 
                        x1={20 + offset} y1="15" 
                        x2={80 + offset} y2="85" 
                        stroke="#dfab62" 
                        strokeWidth="1.6" 
                        opacity={0.9} 
                      />
                    );
                  })}
                  {/* Small whole wheat flecks */}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const rx = 20 + Math.random() * 60;
                    const ry = 20 + Math.random() * 60;
                    return (
                      <circle key={i} cx={rx} cy={ry} r="0.8" fill="#583f1d" />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Broth oil droplets */}
            <div className="absolute inset-0 pointer-events-none opacity-45 mix-blend-overlay">
              <svg className="w-full h-full text-yellow-300" viewBox="0 0 100 100">
                <circle cx="35" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="0.8"/>
                <circle cx="62" cy="30" r="3" fill="none" stroke="currentColor" strokeWidth="0.8"/>
                <circle cx="50" cy="70" r="5" fill="none" stroke="currentColor" strokeWidth="0.8"/>
                <circle cx="65" cy="65" r="3.5" fill="none" stroke="currentColor" strokeWidth="0.8"/>
                <circle cx="28" cy="60" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.8"/>
              </svg>
            </div>

            {/* PLACED TOPPINGS RENDER */}
            {placedToppings.map((pt, idx) => 
              renderToppingVisual(pt, idx, idx === activeToppingIndex)
            )}

            {/* Empty state overlay indicator */}
            {placedToppings.length === 0 && (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center pointer-events-none z-10">
                <p className="text-3xl filter saturate-50 select-none mb-1 animate-bounce">🍜</p>
                <h3 className="text-stone-300 font-sans text-xs tracking-wider uppercase mb-1">Soup & Noodles Base Done</h3>
                <p className="text-stone-400 text-[10px] max-w-[200px]">右の食材リストからトッピングを選び、配置してください。ドラッグで自由移動が可能です！</p>
              </div>
            )}
          </div>

          {/* ACTIVE TOPPING WORK PANEL CONTROLS */}
          <div className="w-full min-h-[50px] mt-4 p-3 bg-stone-800 border border-stone-700/60 rounded-xl relative flex items-center justify-between">
            {activeToppingIndex !== null && placedToppings[activeToppingIndex] ? (
              <div className="w-full flex justify-between items-center text-xs">
                <div className="flex gap-2 items-center">
                  <span className="text-stone-400">具材操作:</span>
                  <span className="font-bold text-yellow-400">
                    {MASTER_TOPPINGS.find(t => t.id === placedToppings[activeToppingIndex].id)?.jpName}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const current = placedToppings[activeToppingIndex];
                      handleUpdateTopping(activeToppingIndex, { rotation: (current.rotation + 30) % 360 });
                    }}
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-200 transition flex gap-1 items-center"
                    title="回転する"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> 30°
                  </button>
                  <button 
                    onClick={() => {
                      const current = placedToppings[activeToppingIndex];
                      handleUpdateTopping(activeToppingIndex, { scale: Math.min(1.5, current.scale + 0.1) });
                    }}
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-200 transition"
                    title="大きくする"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      const current = placedToppings[activeToppingIndex];
                      handleUpdateTopping(activeToppingIndex, { scale: Math.max(0.6, current.scale - 0.1) });
                    }}
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-200 transition"
                    title="小さくする"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleRemoveTopping(activeToppingIndex)}
                    className="p-1.5 bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 rounded transition"
                    title="削除する"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-stone-400 font-sans text-[11px] text-center w-full">
                💡 どんぶり内の具材を選択すると「回転・縮尺・削除」の調整が可能です。
              </p>
            )}
          </div>

          <div className="w-full mt-4 flex flex-col gap-2">
            <label className="text-[11px] font-sans text-stone-400 font-bold">ラーメン命名 (任意):</label>
            <input 
              type="text"
              placeholder="例: 長浜爆裂ニンニクもっこり, 黄金淡麗潮そば..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full p-2.5 bg-stone-950 border border-stone-800 text-stone-100 rounded-lg text-sm focus:outline-none focus:border-yellow-500 tracking-wide"
            />
          </div>

          {/* CRITIC SUBMIT ACTION TRIGGER */}
          <div className="w-full mt-5">
            <button
              onClick={handleSubmitToCritic}
              disabled={isEvaluating}
              className={`w-full py-3.5 rounded-xl font-bold font-sans tracking-wider text-sm flex gap-2 items-center justify-center transition-all ${
                isEvaluating 
                  ? "bg-stone-800 text-stone-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-yellow-500 to-amber-600 text-stone-950 hover:from-yellow-400 hover:to-amber-500 hover:scale-[1.02] shadow-lg shadow-yellow-950/40 cursor-pointer"
              }`}
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                  <span>審査中...</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 text-stone-950" />
                  <span>AIラーメン評論家に審査を依頼する</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* ERROR BLOCK */}
        {errorMessage && (
          <div className="w-full max-w-md bg-red-950/80 border border-red-900/60 p-4 rounded-xl mt-4 text-red-200 text-xs">
            ⚠️ {errorMessage}
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Custom Controls for Broth, Noodles, and Active Toppings List */}
      <div className="col-span-1 lg:col-span-5 flex flex-col gap-5">
        
        {/* EVALUATION RESULT BLOCK */}
        <AnimatePresence mode="wait">
          {isEvaluating && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col justify-center items-center min-h-[300px]"
            >
              <div className="relative mb-5 scale-125">
                <ChefHat className="w-10 h-10 text-yellow-500 animate-pulse" />
                <div className="absolute -inset-1 rounded-full border border-dashed border-yellow-500 animate-spin opacity-50 duration-1000"></div>
              </div>
              <p className="text-yellow-400 font-sans font-bold text-sm tracking-wide mb-2 animate-bounce">
                🍜 AI評論家実食審査中！ 🍜
              </p>
              <p className="text-stone-300 text-xs min-h-[40px] px-4 leading-relaxed font-sans font-medium transition-all">
                {slurpMessages[slurpPhase]}
              </p>
              {/* Animated progress bar indicator */}
              <div className="w-48 h-1 overflow-hidden bg-stone-800 rounded mt-4">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-[pulse_1.5s_infinite]" style={{ width: "100%" }}></div>
              </div>
            </motion.div>
          )}

          {!isEvaluating && evaluationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-[#1b1c1d] to-[#121213] border-2 border-yellow-500/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Backlight flare glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 bg-yellow-950 border border-yellow-800 text-yellow-400 rounded-full flex gap-1 items-center animate-pulse">
                  <Sparkles className="w-3 h-3" /> AI CERTIFIED RECIPE
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  推奨価格: <strong className="text-green-400 text-sm font-sans">{evaluationResult.priceEstimation}</strong> G
                </span>
              </div>

              <h2 className="text-[#ffd053] font-sans font-black text-lg tracking-wide mb-3 drop-shadow border-b border-stone-800 pb-2">
                {evaluationResult.gourmetName}
              </h2>

              {/* Multi rating progress bars */}
              <div className="grid grid-cols-2 gap-4 my-4 bg-stone-900/60 p-4 border border-stone-800 rounded-xl">
                <div>
                  <div className="flex justify-between text-[11px] font-sans font-bold text-stone-300 mb-1">
                    <span>総合評価</span>
                    <span className="text-yellow-400 font-mono">{evaluationResult.overallScore}点</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${evaluationResult.overallScore}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-sans font-bold text-stone-300 mb-1">
                    <span>スープ＆麺 調和</span>
                    <span className="text-blue-400 font-mono">{evaluationResult.soupNoodleHarmony}点</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${evaluationResult.soupNoodleHarmony}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-sans font-bold text-stone-300 mb-1">
                    <span>盛り付け・色彩</span>
                    <span className="text-emerald-400 font-mono">{evaluationResult.visualHarmony}点</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${evaluationResult.visualHarmony}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-sans font-bold text-stone-300 mb-1">
                    <span>旨味の深度</span>
                    <span className="text-pink-400 font-mono">{evaluationResult.umamiDepth}点</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-pink-400 h-full rounded-full" style={{ width: `${evaluationResult.umamiDepth}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Flavor Profile Metrics */}
              <div className="flex gap-4 justify-around text-center text-[10px] font-sans font-bold text-stone-400 mb-4 border-b border-stone-800 pb-4">
                <div>
                  <p>油っこさ / コク</p>
                  <p className="text-stone-200 mt-1 font-mono text-sm">{"🔥".repeat(evaluationResult.flavorProfile.richness)}</p>
                </div>
                <div>
                  <p>スパイシーさ</p>
                  <p className="text-stone-200 mt-1 font-mono text-sm">{evaluationResult.flavorProfile.spiciness > 0 ? "🌶️".repeat(evaluationResult.flavorProfile.spiciness) : "なし"}</p>
                </div>
                <div>
                  <p>独創性</p>
                  <p className="text-stone-200 mt-1 font-mono text-sm">{"🌟".repeat(evaluationResult.flavorProfile.originality)}</p>
                </div>
              </div>

              {/* Poetic review sentence */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl relative">
                <div className="absolute top-1 right-2 text-stone-800 text-3xl font-serif">”</div>
                <p className="text-stone-300 text-xs italic font-sans leading-relaxed text-justify relative z-10">
                  {evaluationResult.criticReview}
                </p>
              </div>

              {/* Set menu and share button */}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => {
                    const latestRecipe = recipes[recipes.length - 1];
                    if (latestRecipe) {
                      onSetMenu(latestRecipe.id);
                    }
                  }}
                  disabled={recipes.length === 0}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs tracking-wider border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    recipes[recipes.length - 1]?.id === activeRecipeId
                      ? "bg-stone-800 text-stone-400 border-stone-700 cursor-not-allowed"
                      : "bg-[#ffd053] text-[#121213] border-[#ffd053] hover:bg-[#ffdf7b]"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {recipes[recipes.length - 1]?.id === activeRecipeId ? "販売中メニュー" : "店舗メニューに設定する"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSTATION CONTROLS: SOUP, NOODLE, RICHNESS SELECTION */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          
          {/* Soup Base choose */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-sans text-stone-400 font-bold uppercase tracking-wider">
                1. スープを選択 (Soup Base)
              </label>
              <span className="text-[10px] text-yellow-500 font-sans">
                基本G価格: {SOUP_INFO[selectedSoup].basePrice}G
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SOUP_INFO) as SoupType[]).map((key) => {
                const info = SOUP_INFO[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSoup(key)}
                    className={`p-2 rounded-xl text-xs font-sans font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                      selectedSoup === key
                        ? "bg-yellow-500 text-stone-950 border-yellow-500 font-black shadow-md"
                        : "bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <span>{info.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-sans text-stone-400 mt-1 bg-stone-950 p-2 border border-stone-850 rounded truncate">
              💡 {SOUP_INFO[selectedSoup].desc}
            </p>
          </div>

          {/* Noodle style choose */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-sans text-stone-400 font-bold uppercase tracking-wider">
                2. 麺の太さ・形状 (Noodle Thickness)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(NOODLE_INFO) as NoodleType[]).map((key) => {
                const info = NOODLE_INFO[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedNoodle(key)}
                    className={`p-2 rounded-xl text-xs font-sans font-bold transition cursor-pointer border ${
                      selectedNoodle === key
                        ? "bg-yellow-500 text-stone-950 border-yellow-500 font-black shadow-md"
                        : "bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    {info.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-sans text-stone-400 mt-1 bg-stone-950 p-2 border border-stone-850 rounded">
              🎯 {NOODLE_INFO[selectedNoodle].matchBonus} ({NOODLE_INFO[selectedNoodle].desc})
            </p>
          </div>

          {/* Richness level choose */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-sans text-stone-400 font-bold uppercase tracking-wider">
                3. こってり度（背脂・油分）
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RICHNESS_INFO) as RichnessType[]).map((key) => {
                const info = RICHNESS_INFO[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedRichness(key)}
                    className={`p-2.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer border ${
                      selectedRichness === key
                        ? "bg-yellow-500 text-stone-950 border-yellow-500 font-black shadow-md"
                        : "bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    {info.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* WORKSTATION CONTROLS: ADD TOPPINGS TO BOWL */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <label className="text-[11px] font-sans text-stone-400 font-bold uppercase tracking-wider mb-1">
            4. トッピングをのせる (Add Toppings to Bowl)
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {availableToppings.map((topping) => (
              <button
                key={topping.id}
                onClick={() => handleAddTopping(topping)}
                disabled={!topping.unlocked}
                className={`p-1.5 rounded-xl text-xs font-sans font-bold transition flex flex-col items-center justify-center p-2 relative border select-none ${
                  topping.unlocked
                    ? "bg-stone-950 border-stone-850 hover:border-yellow-500 text-stone-200 cursor-pointer"
                    : "bg-stone-950/45 border-transparent text-stone-650 opacity-40 cursor-not-allowed"
                }`}
                style={{ contentVisibility: "auto" }}
              >
                <span className="text-xl mb-0.5 filter saturate-110">{topping.iconName}</span>
                <span className="text-[9px] font-medium leading-none text-center truncate w-full">{topping.name}</span>
                {/* Lock icon overlay for locked items */}
                {!topping.unlocked && (
                  <div className="absolute top-1 right-1 bg-stone-900/90 text-[8px] px-1 rounded text-stone-400">
                    🔒 {topping.cost}G
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-sans text-stone-500 text-center">
            ※ どんぶりの具材はタップで選択後に「ドラッグ」で位置を自由に調整できます！
          </p>
        </div>

      </div>

    </div>
  );
}
