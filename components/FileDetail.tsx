
import React, { useState, useMemo } from 'react';
import { FileData } from '../types';
import { Download, Play, AlertTriangle, Eye, EyeOff, ArrowUpDown, PieChart, ChevronLeft } from 'lucide-react';

interface FileDetailProps {
  fileData: FileData;
  onProcess: (id: string) => void;
  onBack?: () => void;
}

type SortOption = 'weight' | 'increment' | 'decrement';

export const FileDetail: React.FC<FileDetailProps> = ({ fileData, onProcess, onBack }) => {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('weight');
  
  const fileNameOnly = useMemo(() => {
    return fileData.file.name.split(/[\\/]/).pop() || "";
  }, [fileData.file.name]);

  const handleDownload = () => {
    if (!fileData.markdownContent) return;
    const blob = new Blob([fileData.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameOnly.replace(/\.[^/.]+$/, "")}_extracted.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseValue = (val: string): number => {
    if (!val || val === 'N/A') return 0;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const sortedRecords = useMemo(() => {
    const records = [...fileData.records];
    return records.sort((a, b) => {
      const curA = parseValue(a.currentWeight);
      const prevA = parseValue(a.previousWeight);
      const curB = parseValue(b.currentWeight);
      const prevB = parseValue(b.previousWeight);

      const diffA = curA - prevA;
      const diffB = curB - prevB;

      switch (sortBy) {
        case 'increment': 
          // Orden descendente por diferencia (mayor incremento primero)
          return diffB - diffA;
        case 'decrement': 
          // Orden ascendente por diferencia (mayor caída/menor valor primero)
          return diffA - diffB;
        case 'weight':
        default: 
          // Orden descendente por peso actual
          return curB - curA;
      }
    });
  }, [fileData.records, sortBy]);

  const distributionData = useMemo(() => {
    if (!fileData.distribution) return null;
    const dist = fileData.distribution;
    const formatCurrency = (val: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
    const getPercent = (num: number, total: number) => total === 0 ? "0,00%" : ((num / total) * 100).toFixed(2).replace('.', ',') + "%";

    return {
      invFin: {
        actual: formatCurrency(dist.inversionesFinancieras.actual),
        previous: formatCurrency(dist.inversionesFinancieras.previous)
      },
      liquidez: {
        actual: getPercent(dist.liquidez.actual, dist.inversionesFinancieras.actual),
        previous: getPercent(dist.liquidez.previous, dist.inversionesFinancieras.previous)
      },
      resto: {
        actual: getPercent(dist.resto.actual, dist.inversionesFinancieras.actual),
        previous: getPercent(dist.resto.previous, dist.inversionesFinancieras.previous)
      }
    };
  }, [fileData.distribution]);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6 flex flex-col gap-4 md:gap-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 break-all">
                {fileNameOnly.replace(/\.[^/.]+$/, "")}
              </h2>
              <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                fileData.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                fileData.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {fileData.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {fileData.status === 'completed' && (
              <>
                <div className="flex flex-1 md:flex-none items-center bg-white border border-slate-300 rounded overflow-hidden">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 text-slate-700 bg-white outline-none text-xs md:text-sm cursor-pointer"
                  >
                    <option value="weight">Por peso</option>
                    <option value="increment">Incrementos</option>
                    <option value="decrement">Decrementos</option>
                  </select>
                </div>

                <button 
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className="p-2 md:px-4 md:py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                  title={showMarkdown ? 'Ocultar Markdown' : 'Ver Markdown'}
                >
                  {showMarkdown ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded hover:bg-blue-600 shadow-sm text-sm font-semibold"
                >
                  <Download size={16} />
                  <span className="md:inline">MD</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Distribución Patrimonial Adaptada */}
        {fileData.status === 'completed' && distributionData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden w-full max-w-2xl">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-semibold text-xs md:text-sm">
              <PieChart size={14} />
              Distribución Patrimonio
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] md:text-xs text-left min-w-full">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-400">
                    <th className="px-4 py-2 font-medium">Categoría</th>
                    <th className="px-4 py-2 text-right">Actual</th>
                    <th className="px-4 py-2 text-right">Anterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2 font-medium text-slate-600">Inv. Financieras</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.invFin.actual}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.invFin.previous}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-slate-600">Liquidez (%)</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.liquidez.actual}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.liquidez.previous}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
        {fileData.status === 'completed' && (
          <div className={`grid gap-6 h-full ${showMarkdown ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 text-xs md:text-sm">
                Renta Variable ({sortedRecords.length})
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {/* Vista Escritorio: Tabla tradicional */}
                <table className="hidden md:table w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Acción</th>
                      <th className="px-6 py-3 text-right">Peso Actual</th>
                      <th className="px-6 py-3 text-right">Peso Anterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRecords.length > 0 ? (
                      sortedRecords.map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{record.name}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{record.currentWeight}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{record.previousWeight}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">Sin registros.</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Vista Móvil: Lista de bloques sin scroll horizontal */}
                <div className="md:hidden divide-y divide-slate-100">
                  {sortedRecords.length > 0 ? (
                    sortedRecords.map((record, idx) => (
                      <div key={idx} className="p-4 flex flex-col gap-2 hover:bg-slate-50">
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          {record.name}
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-slate-400 uppercase font-semibold">Peso Actual</span>
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{record.currentWeight}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-400 uppercase font-semibold">Peso Anterior</span>
                            <span className="font-mono text-slate-500">{record.previousWeight}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic text-sm">Sin registros.</div>
                  )}
                </div>
              </div>
            </div>

            {showMarkdown && (
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex flex-col overflow-hidden min-h-[300px]">
                <div className="p-4 border-b border-slate-800 bg-slate-950 font-semibold text-slate-300 text-xs">
                  Vista Previa Markdown
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <pre className="font-mono text-[10px] md:text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {fileData.markdownContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
