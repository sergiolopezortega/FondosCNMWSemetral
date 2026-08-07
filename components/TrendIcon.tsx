import React from 'react';
import { ArrowUp, ArrowDown, Tag, Sparkles, Minus } from 'lucide-react';

interface TrendIconProps {
  currentWeight: string;
  previousWeight: string;
}

export const TrendIcon: React.FC<TrendIconProps> = ({ currentWeight, previousWeight }) => {
  const parseVal = (val: string): number => {
    if (!val || val === 'N/A') return 0;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const cur = parseVal(currentWeight);
  const prev = parseVal(previousWeight);

  if (cur === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 shrink-0" title="Vendido (Peso actual 0%)">
        <Tag size={12} className="text-rose-600" />
        <span>SOLD</span>
      </span>
    );
  }

  if (prev === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0" title="Nueva posición (Peso anterior 0%)">
        <Sparkles size={12} className="text-emerald-600" />
        <span>NEW</span>
      </span>
    );
  }

  if (cur > prev) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shrink-0" title="Incremento de peso">
        <ArrowUp size={14} className="stroke-[2.5]" />
      </span>
    );
  }

  if (cur < prev) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 shrink-0" title="Decremento de peso">
        <ArrowDown size={14} className="stroke-[2.5]" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 shrink-0" title="Sin variación">
      <Minus size={14} className="stroke-[2.5]" />
    </span>
  );
};
