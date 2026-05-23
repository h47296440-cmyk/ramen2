import React, { useRef, useState, useEffect } from "react";
import { RamenRecipe, SOUP_INFO, NOODLE_INFO } from "../types";
import { 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Award, 
  Zap, 
  Flame, 
  Smile 
} from "lucide-react";

interface ShareCardProps {
  recipe: RamenRecipe;
}

export default function ShareCard({ recipe }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>("");

  const evalData = recipe.evaluation;
  const overallScore = evalData ? evalData.overallScore : 88;
  const gourmetName = evalData ? evalData.gourmetName : "極上醤油伝説ラーメン";
  const price = evalData ? evalData.priceEstimation : 1200;
  const criticSay = evalData ? evalData.criticReview : "旨味のバランスが至高の一杯。";

  // Re-draw canvas on load/update of specific recipe
  useEffect(() => {
    drawReportCard();
  }, [recipe]);

  const drawReportCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Standard card dimensions for convenient phone saving (600x850)
    canvas.width = 600;
    canvas.height = 850;

    // 1. Draw elegant dark stone textured cardboard background
    ctx.fillStyle = "#141517";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative inner boundary lines (thin double gold/red path)
    ctx.strokeStyle = "#be9d54";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = "#801b13";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

    // 2. Card header stamp title
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 15px 'Century Gothic', Inter, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.textAlign = "center";
    ctx.fillText("NATIONAL GASTRONOMY TRADITION", 300, 65);

    // AI Certification text label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Space Grotesk', system-ui, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("AI ラーメン職人免許皆伝", 300, 105);

    // Golden Separator line
    ctx.strokeStyle = "rgba(190, 157, 84, 0.4)";
    ctx.beginPath();
    ctx.moveTo(150, 125);
    ctx.lineTo(450, 125);
    ctx.stroke();

    // 3. Main Bowl representation (Simulating graphics cleanly with shapes)
    const bowlX = 300;
    const bowlY = 270;
    const bowlRadius = 110;

    // Draw the ceramic retro ramen bowl background color
    ctx.beginPath();
    ctx.arc(bowlX, bowlY, bowlRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#8a1e13"; // Deep dark red rim
    ctx.fill();
    ctx.strokeStyle = "#be9d54"; // Gold rim outline
    ctx.lineWidth = 6;
    ctx.stroke();

    // Soup color fill based on actual base
    let soupColorHex = "#ebd9bc"; // Tonkotsu default
    if (recipe.soup === "shoyu") soupColorHex = "#714b2d";
    if (recipe.soup === "shio") soupColorHex = "#ece0cc";
    if (recipe.soup === "miso") soupColorHex = "#ab7c42";
    if (recipe.soup === "tori_paitan") soupColorHex = "#f1e6cc";

    ctx.beginPath();
    ctx.arc(bowlX, bowlY, bowlRadius - 6, 0, Math.PI * 2);
    ctx.fillStyle = soupColorHex;
    ctx.fill();

    // Noodles curly path representation on report
    ctx.strokeStyle = "rgba(255, 203, 52, 0.4)";
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(bowlX - 20 + i*5, bowlY - 10, bowlRadius - 38, i * 0.1, Math.PI + i*0.1);
      ctx.stroke();
    }

    // Abstract visual topping spots drawn on card
    recipe.toppings.forEach((pt, ti) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.beginPath();
      // Translate percentages to coordinates inside canvas circle
      const targetX = bowlX + ((pt.x - 50) / 100) * (bowlRadius * 1.6);
      const targetY = bowlY + ((pt.y - 50) / 100) * (bowlRadius * 1.6);
      
      ctx.arc(targetX, targetY, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Label topping count
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🥓", targetX, targetY + 4);
    });

    // 4. Gourmet Ramen custom Title Text Box
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(40, 420, 520, 100);
    ctx.strokeStyle = "rgba(190, 110, 40, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 420, 520, 100);

    ctx.fillStyle = "#ffdf7e";
    ctx.font = "black 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${gourmetName}`, 300, 465);

    // Details caption
    ctx.fillStyle = "#a8a29e";
    ctx.font = "bold 13px system-ui";
    const soupName = SOUP_INFO[recipe.soup].name.split(" ")[0];
    const noodleName = NOODLE_INFO[recipe.noodle].name.split(" ")[0];
    ctx.fillText(`スープ: ${soupName}  /  麺: ${noodleName}  /  こってり度: ${recipe.richness.toUpperCase()}`, 300, 500);

    // 5. SCORE DISPLAY BADGE (Michelin stars badge layout)
    ctx.fillStyle = "#ffd053";
    ctx.font = "bold 65px Inter, Helvetica, sans-serif";
    ctx.fillText(`${overallScore}`, 160, 630);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("AI 総合職人度", 110, 565);

    // Price sticker
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 28px Inter, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`¥ ${price}`, 505, 620);

    ctx.fillStyle = "#a8a29e";
    ctx.font = "sans-serif 12px";
    ctx.fillText("推奨鑑定価値", 505, 565);

    // Evaluation text block wrap
    ctx.fillStyle = "#1c1d1f";
    ctx.fillRect(40, 680, 520, 100);
    ctx.strokeStyle = "rgba(190, 157, 84, 0.3)";
    ctx.strokeRect(40, 680, 520, 100);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "italic 14px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    
    // Split critic Review text if excessively long for safe canvas lines
    let line1 = criticSay;
    let line2 = "";
    if (criticSay.length > 34) {
      line1 = criticSay.slice(0, 31) + "...";
      line2 = criticSay.slice(31);
    }
    
    ctx.fillText(`「 ${line1} 」`, 300, 725);
    if (line2) {
      ctx.fillText(` ${line2} `, 300, 755);
    }

    // Legend signature seal
    ctx.fillStyle = "rgba(220, 38, 38, 0.2)";
    ctx.beginPath();
    ctx.arc(480, 730, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(220, 38, 38, 0.5)";
    ctx.stroke();

    ctx.fillStyle = "rgba(220, 38, 38, 0.7)";
    ctx.font = "bold 13px 'MS Gothic', sans-serif";
    ctx.fillText("審査", 480, 728);
    ctx.fillText("合格", 480, 742);

    // Footer credits
    ctx.fillStyle = "#78716c";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("本格ラーメン職人 - Ramen Legend シミュレータ判定証書", 300, 810);

    // Save image blob for live browser layout display
    setPreviewSrc(canvas.toDataURL("image/png"));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ramen_certified_${recipe.id}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboardInvite = () => {
    // Generate fancy copy block text for SNS boasting
    const textBlock = `【究極のラーメン免許皆伝 証書】
私の作った創作ラーメン「${gourmetName}」がAI評論家に審査されました！

🍜 職人度評価: ${overallScore} 点！
💰 推奨価値: ${price} G / ¥
💬 評論家評: 「${criticSay}」

あなたも本格ラーメンを創作して店を繁盛させよう！
#本格ラーメン職人 #AIラーメン屋シミュレーター #RamenLegend #GitHubでプレイ可能
${window.location.href}`;

    navigator.clipboard.writeText(textBlock).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
      
      <div className="text-center mb-4">
        <h3 className="text-stone-100 font-sans font-black text-sm tracking-wide">
          📜 創作レシピ・SNS自慢カード
        </h3>
        <p className="text-stone-400 text-[10px] mt-0.5">
          AIが審査したあなたの一杯を画像で保存。または、テキストをコピーしてSNSで自慢しよう！
        </p>
      </div>

      {/* Hidden layout canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* High Quality Canvas Image preview display */}
      <div className="w-56 overflow-hidden rounded-2xl border-2 border-stone-880 shadow-md bg-stone-950 relative group">
        {previewSrc ? (
          <img 
            src={previewSrc} 
            alt="Certified Ramen Certificate" 
            className="w-full object-cover select-none transition group-hover:scale-105 duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex animate-pulse justify-center items-center py-24 text-stone-500 text-xs">
            証明書描画中...
          </div>
        )}
      </div>

      {/* Action buttons list */}
      <div className="w-full mt-4 flex flex-col gap-2">
        
        {/* DOWNLOAD BUTTON */}
        <button
          onClick={handleDownload}
          className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-stone-950 rounded-xl font-bold font-sans text-xs flex gap-1.5 items-center justify-center cursor-pointer transition shadow shadow-yellow-950/20"
        >
          <Download className="w-4 h-4 text-stone-950" />
          <span>レシピカード画像をダウンロード</span>
        </button>

        {/* COPY INVITE AND HYPE BLOCK */}
        <button
          onClick={handleCopyClipboardInvite}
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-100 rounded-xl font-bold font-sans text-xs flex gap-1.5 items-center justify-center cursor-pointer transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400 animate-bounce" />
              <span className="text-green-400">コピーしました！</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-300" />
              <span>SNS投稿テキストをクリップボードにコピー</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
}
