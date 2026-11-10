export function americanWinProfit(odds: number | null): number | null {
  if (odds === null || !Number.isFinite(odds) || Math.abs(odds)<100) return null;
  return odds > 0 ? odds/100 : 100/Math.abs(odds);
}

// Consume only explicitly labeled close fields. Never infer spread signs from favorite flags or substitute opening/live prices.
export function parseClosingMarkets(value: unknown) {
  const x=value as { moneyline?: {home?:{close?:{odds?:unknown}};away?:{close?:{odds?:unknown}}};
    pointSpread?:{home?:{close?:{line?:unknown}};away?:{close?:{line?:unknown}}}; total?:{over?:{close?:{line?:unknown}};under?:{close?:{line?:unknown}}} } | null;
  const numeric=(v:unknown)=>{if(typeof v!=="number"&&typeof v!=="string")return null;const s=String(v).trim();if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;};
  const home=numeric(x?.pointSpread?.home?.close?.line),away=numeric(x?.pointSpread?.away?.close?.line);
  const over=x?.total?.over?.close?.line,under=x?.total?.under?.close?.line;
  const overLine=numeric(typeof over==="string"?over.replace(/^o/i,""):over),underLine=numeric(typeof under==="string"?under.replace(/^u/i,""):under);
  const hm=numeric(x?.moneyline?.home?.close?.odds),am=numeric(x?.moneyline?.away?.close?.odds);
  return {homeSpread:home!==null&&away!==null&&Math.abs(home+away)<0.001?home:null,
    total:overLine!==null&&overLine>0&&overLine===underLine?overLine:null,
    homeMoneyline:americanWinProfit(hm)===null?null:hm,awayMoneyline:americanWinProfit(am)===null?null:am};
}
