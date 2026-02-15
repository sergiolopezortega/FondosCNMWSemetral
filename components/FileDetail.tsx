import React, { useState, useMemo } from 'react';
import { FileData } from '../types';
import { Download, Play, AlertTriangle, Eye, EyeOff, ArrowUpDown, PieChart } from 'lucide-react';

interface FileDetailProps {
  fileData: FileData;
  onProcess: (id: string) => void;
}

type SortOption = 'weight' | 'increment' | 'decrement';

export const FileDetail: React.FC<FileDetailProps> = ({ fileData, onProcess }) => {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('weight');
  
  // Obtener nombre base sin rutas
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

      switch (sortBy) {
        case 'increment': return (curB - prevB) - (curA - prevA);
        case 'decrement': return (prevB - curB) - (prevA - curA);
        case 'weight':
        default: return curB - curA;
      }
    });
  }, [fileData.records, sortBy]);

  // Cálculos para la tabla de distribución
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
      <div className="bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{fileNameOnly.replace(/\.[^/.]+$/, "")}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${
              fileData.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              fileData.status === 'error' ? 'bg-red-100 text-red-700' :
              fileData.status === 'processing' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              Status: {fileData.status.toUpperCase()}
            </span>
          </div>

          <div className="flex gap-3">
            {(fileData.status === 'pending' || fileData.status === 'error') && (
              <button 
                onClick={() => onProcess(fileData.id)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
              >
                <Play size={16} />
                Procesar
              </button>
            )}
            {fileData.status === 'completed' && (
              <>
                 <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-r border-slate-300 text-slate-600">
                    <ArrowUpDown size={16} />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 text-slate-700 bg-white outline-none text-sm cursor-pointer hover:bg-slate-50 min-w-[140px]"
                  >
                    <option value="weight">Por peso</option>
                    <option value="increment">Mayores incrementos</option>
                    <option value="decrement">Mayores decrementos</option>
                  </select>
                </div>

                <button 
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
                >
                  {showMarkdown ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showMarkdown ? 'Ocultar Markdown' : 'Ver Markdown'}
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Download size={16} />
                  Descargar MD
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla Distribución Patrimonio */}
        {fileData.status === 'completed' && distributionData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden max-w-2xl">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <PieChart size={14} />
              Distribución del Patrimonio
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-400">
                  <th className="px-4 py-2 font-medium uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Periodo Actual</th>
                  <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Periodo Anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-4 py-2 font-medium text-slate-600">Inversiones Financieras</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.invFin.actual}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.invFin.previous}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-slate-600">Liquidez (%)</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.liquidez.actual}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.liquidez.previous}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-slate-600">Resto (%)</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.resto.actual}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{distributionData.resto.previous}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {fileData.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-1" size={20} />
            <div className="text-red-700 text-sm">{fileData.errorMessage}</div>
          </div>
        )}

        {fileData.status === 'completed' && (
          <div className={`grid gap-6 h-full transition-all duration-300 ${showMarkdown ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Table View */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                <span>Renta Variable Cotizada ({sortedRecords.length})</span>
                <span className="text-xs text-slate-500 font-normal">
                  Ordenado por: {sortBy === 'weight' ? 'Peso Actual' : sortBy === 'increment' ? 'Incremento' : 'Decremento'}
                </span>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Acción</th>
                      <th className="px-6 py-3 text-right">Peso Actual</th>
                      <th className="px-6 py-3 text-right">Peso Anterior</th>
                      {(sortBy === 'increment' || sortBy === 'decrement') && (
                        <th className="px-6 py-3 text-right text-slate-400">Diferencia</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRecords.length > 0 ? (
                      sortedRecords.map((record, idx) => {
                         const cur = parseValue(record.currentWeight);
                         const prev = parseValue(record.previousWeight);
                         const diff = cur - prev;
                         const isPositive = diff > 0;
                        return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{record.name}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{record.currentWeight}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{record.previousWeight}</td>
                           {(sortBy === 'increment' || sortBy === 'decrement') && (
                            <td className={`px-6 py-3 text-right font-mono font-medium ${isPositive ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                            </td>
                          )}
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan={sortBy === 'weight' ? 3 : 4} className="px-6 py-8 text-center text-slate-400 italic">
                          No se encontraron registros de Renta Variable Cotizada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Markdown Preview */}
            {showMarkdown && (
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950 font-semibold text-slate-300 flex justify-between">
                  <span>Vista Previa Markdown</span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <pre className="font-mono text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {fileData.markdownContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {fileData.status === 'pending' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Play size={48} className="mb-4 opacity-20" />
            <p>El archivo está listo para ser procesado.</p>
          </div>
        )}

        {fileData.status === 'processing' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin mb-4">
              <Play size={48} className="opacity-20" />
            </div>
            <p>Procesando fondo...</p>
          </div>
        )}
      </div>
    </div>
  );
};