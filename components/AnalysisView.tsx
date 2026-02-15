import React, { useMemo } from 'react';
import { FileData } from '../types';
import { Layers, AlertCircle } from 'lucide-react';

interface AnalysisViewProps {
  files: FileData[];
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

export const AnalysisView: React.FC<AnalysisViewProps> = ({ files }) => {
  const coincidences = useMemo(() => {
    // Map key: ISIN
    const stockMap = new Map<string, { name: string; occurrences: Coincidence['occurrences'] }>();

    files.forEach(file => {
      if (file.status !== 'completed') return;

      file.records.forEach(record => {
        // Skip records without valid ISIN to avoid grouping unrelated "N/A" items
        if (!record.isin || record.isin === 'N/A') return;

        // Limpiar el nombre del archivo de cualquier path
        const baseFileName = file.file.name.split(/[\\/]/).pop() || "";
        const cleanFileName = baseFileName.replace(/\.[^/.]+$/, "");

        const entry = {
          fileName: cleanFileName,
          currentWeight: record.currentWeight,
          previousWeight: record.previousWeight
        };

        if (stockMap.has(record.isin)) {
          stockMap.get(record.isin)?.occurrences.push(entry);
        } else {
          stockMap.set(record.isin, { name: record.name, occurrences: [entry] });
        }
      });
    });

    // Filter for >= 2 occurrences
    const result: Coincidence[] = [];
    stockMap.forEach((val, isin) => {
      if (val.occurrences.length >= 2) {
        result.push({ stockName: val.name, isin, occurrences: val.occurrences });
      }
    });

    // Sort by number of occurrences (descending), then by name as secondary sort
    return result.sort((a, b) => {
      const diff = b.occurrences.length - a.occurrences.length;
      if (diff !== 0) return diff;
      return a.stockName.localeCompare(b.stockName);
    });
  }, [files]);

  if (coincidences.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Layers size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No se encontraron coincidencias por ISIN.</p>
        <p className="text-sm">Asegúrate de procesar varios archivos que contengan las mismas acciones con códigos ISIN válidos.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-accent" />
          Análisis de Coincidencias (por ISIN)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Se encontraron {coincidences.length} acciones (identificadas por ISIN) presentes en al menos dos fondos. Ordenadas por mayor número de coincidencias.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {coincidences.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-slate-700">{item.stockName}</h3>
                 <span className="text-xs font-mono text-slate-400">ISIN: {item.isin}</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {item.occurrences.length} Fondos
              </span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Fondo</th>
                  <th className="px-6 py-3 text-right font-semibold">Peso Actual</th>
                  <th className="px-6 py-3 text-right font-semibold">Peso Anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.occurrences.map((occ, occIdx) => (
                  <tr key={occIdx} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{occ.fileName}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600">{occ.currentWeight}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600">{occ.previousWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};