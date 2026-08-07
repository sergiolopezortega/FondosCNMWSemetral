
import React, { useMemo } from 'react';
import { FileData } from '../types';
import { Layers, ChevronLeft } from 'lucide-react';
import { TrendIcon } from './TrendIcon';
import { cleanFundName } from '../utils/correlation';

interface AnalysisViewProps {
  files: FileData[];
  onBack?: () => void;
}

interface Coincidence {
  stockName: string;
  isin: string;
  occurrences: {
    fileName: string;
    currentWeight: string;
    previousWeight: string;
  }[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ files, onBack }) => {
  const parseValue = (val: string): number => {
    if (!val || val === 'N/A') return 0;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const coincidences = useMemo(() => {
    const stockMap = new Map<string, { name: string; occurrences: Coincidence['occurrences'] }>();

    files.forEach(file => {
      if (file.status !== 'completed') return;
      file.records.forEach(record => {
        if (!record.isin || record.isin === 'N/A') return;
        const cleanFileName = cleanFundName(file.file.name);
        const entry = { fileName: cleanFileName, currentWeight: record.currentWeight, previousWeight: record.previousWeight };
        if (stockMap.has(record.isin)) {
          stockMap.get(record.isin)?.occurrences.push(entry);
        } else {
          stockMap.set(record.isin, { name: record.name, occurrences: [entry] });
        }
      });
    });

    const result: Coincidence[] = [];
    stockMap.forEach((val, isin) => {
      if (val.occurrences.length >= 2) {
        result.push({ stockName: val.name, isin, occurrences: val.occurrences });
      }
    });

    return result.sort((a, b) => b.occurrences.length - a.occurrences.length);
  }, [files]);

  if (coincidences.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-500">
        <Layers size={48} className="mb-4 opacity-10" />
        <p className="font-medium">No hay coincidencias.</p>
        <button onClick={onBack} className="mt-4 md:hidden text-accent font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500">
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-accent hidden md:inline" size={20} />
            Coincidencias
          </h2>
        </div>
        <p className="text-[10px] md:text-sm text-slate-500">
          {coincidences.length} acciones presentes en 2 o más fondos.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {coincidences.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center gap-2">
              <div className="min-w-0">
                 <h3 className="font-bold text-slate-700 text-xs md:text-sm truncate">{item.stockName}</h3>
                 <span className="text-[10px] font-mono text-slate-400">{item.isin}</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                {item.occurrences.length} Fondos
              </span>
            </div>
            
            <div className="w-full">
              {/* Vista Escritorio: Tabla */}
              <table className="hidden md:table w-full text-sm text-left">
                <thead className="bg-white border-b border-slate-100 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="w-14 px-3 py-2 text-center"></th>
                    <th className="px-4 py-2 font-semibold">Fondo</th>
                    <th className="px-4 py-2 text-right w-32">Peso Actual</th>
                    <th className="px-4 py-2 text-right w-32">Peso Anterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {item.occurrences.map((occ, occIdx) => {
                    const cur = parseValue(occ.currentWeight);
                    const prev = parseValue(occ.previousWeight);

                    let rowBgClass = 'hover:bg-slate-50 transition-colors';
                    if (cur === 0) {
                      rowBgClass = 'bg-rose-50 hover:bg-rose-100/70 transition-colors';
                    } else if (prev === 0) {
                      rowBgClass = 'bg-emerald-50 hover:bg-emerald-100/70 transition-colors';
                    }

                    return (
                      <tr 
                        key={occIdx} 
                        className={rowBgClass}
                      >
                        <td className="w-14 px-3 py-2 text-center align-middle">
                          <div className="flex items-center justify-center">
                            <TrendIcon currentWeight={occ.currentWeight} previousWeight={occ.previousWeight} />
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-800 truncate">{occ.fileName}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-600">{occ.currentWeight}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-600">{occ.previousWeight}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Vista Móvil: Bloques apilados sin scroll horizontal */}
              <div className="md:hidden divide-y divide-slate-100">
                {item.occurrences.map((occ, occIdx) => {
                  const cur = parseValue(occ.currentWeight);
                  const prev = parseValue(occ.previousWeight);

                  let cardBgClass = 'hover:bg-slate-50';
                  if (cur === 0) {
                    cardBgClass = 'bg-rose-50 hover:bg-rose-100/70';
                  } else if (prev === 0) {
                    cardBgClass = 'bg-emerald-50 hover:bg-emerald-100/70';
                  }

                  return (
                    <div 
                      key={occIdx} 
                      className={`p-4 flex flex-col gap-2 transition-colors ${cardBgClass}`}
                    >
                      <div className="text-xs font-bold text-slate-800 leading-tight truncate flex items-center gap-2">
                        <TrendIcon currentWeight={occ.currentWeight} previousWeight={occ.previousWeight} />
                        <span className="truncate">{occ.fileName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex flex-col">
                          <span className="text-slate-400 uppercase font-semibold">Peso Actual</span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{occ.currentWeight}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400 uppercase font-semibold">Peso Anterior</span>
                          <span className="font-mono text-slate-500">{occ.previousWeight}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
