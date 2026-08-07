import React, { useState, useMemo } from 'react';
import { FileData } from '../types';
import { 
  analyzeCorrelations, 
  FundCorrelationPair, 
  SECTOR_COLORS 
} from '../utils/correlation';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Cell 
} from 'recharts';
import { 
  Network, Layers, ChevronLeft, Building2, PieChart, 
  Info, ArrowRight, Eye, CheckCircle2, Sliders, Hash,
  Wallet, TrendingUp, TrendingDown, Minus, Droplet
} from 'lucide-react';

interface CorrelationViewProps {
  files: FileData[];
  onBack: () => void;
}

export const CorrelationView: React.FC<CorrelationViewProps> = ({ files, onBack }) => {
  const analysis = useMemo(() => analyzeCorrelations(files), [files]);
  const [selectedPair, setSelectedPair] = useState<FundCorrelationPair | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'positions' | 'industries' | 'liquidity'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  const topPairsForChart = useMemo(() => {
    return analysis.topCorrelatedPairs.slice(0, 8).map(pair => ({
      name: `${pair.fund1Name} vs ${pair.fund2Name}`,
      fullName1: pair.fund1Name,
      fullName2: pair.fund2Name,
      Coincidencias: pair.sharedCount,
      Similitud: pair.jaccardSimilarity,
      SolapamientoPeso: pair.weightOverlap
    }));
  }, [analysis]);

  // Transform industry exposure data for Recharts stacked bar chart
  const industryChartData = useMemo(() => {
    return analysis.industryExposures.map(exp => {
      const row: Record<string, string | number> = {
        fundName: exp.fundName,
        fullFundName: exp.fundName
      };
      analysis.allSectors.forEach(sec => {
        row[sec] = exp.sectors[sec] || 0;
      });
      return row;
    });
  }, [analysis]);

  // Transform liquidity evolution data for Recharts grouped bar chart
  const liquidityChartData = useMemo(() => {
    return analysis.liquiditySummary.funds.map(f => ({
      name: f.fundName.length > 25 ? f.fundName.slice(0, 22) + '...' : f.fundName,
      fullName: f.fundName,
      'Liquidez Anterior (%)': f.previousLiquidity,
      'Liquidez Actual (%)': f.currentLiquidity,
      Diferencia: f.change
    }));
  }, [analysis]);

  return (
    <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-y-auto">
      {/* Header bar */}
      <div className="bg-slate-900 text-white p-4 md:p-6 shadow-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Volver"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Network size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight">Análisis de Correlación y Concentración</h2>
              <p className="text-xs text-slate-400 font-light">
                Comparativa de coincidencias en posiciones, industrias y liquidez entre {analysis.totalFunds} fondos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'positions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Posiciones
            </button>
            <button
              onClick={() => setActiveTab('industries')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'industries' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Industrias
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'liquidity' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Liquidez
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Fondos</p>
              <p className="text-lg md:text-xl font-black text-slate-900">{analysis.totalFunds}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
              <Hash size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Posic. Únicas</p>
              <p className="text-lg md:text-xl font-black text-slate-900">{analysis.totalUniquePositions}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl flex-shrink-0">
              <Network size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Máx. Coincidencia</p>
              <p className="text-lg md:text-xl font-black text-slate-900">
                {analysis.topCorrelatedPairs[0] ? `${analysis.topCorrelatedPairs[0].sharedCount} pos.` : '0 pos.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Sector Líder</p>
              <p className="text-xs md:text-sm font-bold text-slate-900 truncate">
                {analysis.sectorSummary[0]?.sector || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Liquidez Media</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg md:text-xl font-black text-slate-900">{analysis.liquiditySummary.avgCurrentLiquidity}%</p>
                <span className="text-[10px] text-slate-400 font-semibold">(Ant. {analysis.liquiditySummary.avgPreviousLiquidity}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: POSITIONS CORRELATION */}
        {(activeTab === 'all' || activeTab === 'positions') && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold">1. Correlación entre Fondos (Posiciones Idénticas)</h3>
                  <p className="text-xs text-slate-400">Fondos que comparten mayores posiciones en su cartera de renta variable</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              {/* Text Summary Page Box */}
              <div className="bg-blue-50/70 border border-blue-200/80 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg mt-0.5 flex-shrink-0">
                    <Info size={16} />
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-slate-800 leading-relaxed">
                    <h4 className="font-bold text-blue-950 uppercase tracking-wider text-xs">Resumen Ejecutivo de Posiciones Coincidentes</h4>
                    <p dangerouslySetInnerHTML={{ 
                      __html: analysis.narrativePositionsSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }} />
                  </div>
                </div>
              </div>

              {/* Chart 1: Top Pair Coincidences Bar Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Network size={16} className="text-blue-600" />
                    Gráfica 1: Parejas de Fondos con Mayor Coincidencia de Posiciones
                  </h4>
                  <span className="text-xs text-slate-500">Número de activos en común</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 h-80 md:h-[420px]">
                  {topPairsForChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={topPairsForChart} 
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          allowDecimals={false}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name"
                          width={260}
                          tick={{ fontSize: 10, fill: '#334155' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1">
                                  <p className="font-bold border-b border-slate-800 pb-1">{data.fullName1}</p>
                                  <p className="font-bold border-b border-slate-800 pb-1">{data.fullName2}</p>
                                  <p className="text-blue-400 font-semibold pt-1">
                                    Coincidencias: {data.Coincidencias} posiciones
                                  </p>
                                  <p className="text-slate-300">
                                    Índice de Similitud: {data.Similitud}%
                                  </p>
                                  <p className="text-emerald-400">
                                    Solapamiento de Peso: {data.SolapamientoPeso}%
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="Coincidencias" fill="#2563eb" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      Se necesitan al menos 2 fondos cargados para mostrar la gráfica de correlación.
                    </div>
                  )}
                </div>
              </div>

              {/* Correlation Matrix Grid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Matriz de Coincidencias Cruzadas entre Fondos
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">Índice de Similitud Jaccard de posiciones</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-semibold">
                      <tr>
                        <th className="p-3 border-b border-slate-800 min-w-[160px]">Fondo</th>
                        {analysis.matrix.map(m => (
                          <th key={m.fundId} className="p-3 border-b border-slate-800 text-center min-w-[100px] truncate max-w-[120px]" title={m.fundName}>
                            {m.fundName.length > 15 ? m.fundName.slice(0, 15) + '...' : m.fundName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.matrix.map((row) => (
                        <tr key={row.fundId} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-200 truncate max-w-[160px]" title={row.fundName}>
                            {row.fundName}
                          </td>
                          {analysis.matrix.map((col) => {
                            const isSelf = row.fundId === col.fundId;
                            const score = row.scores[col.fundId] || 0;
                            
                            let bgClass = 'bg-slate-50 text-slate-400';
                            if (!isSelf) {
                              if (score > 25) bgClass = 'bg-blue-600 text-white font-bold';
                              else if (score > 15) bgClass = 'bg-blue-500 text-white font-semibold';
                              else if (score > 5) bgClass = 'bg-blue-100 text-blue-900 font-medium';
                              else if (score > 0) bgClass = 'bg-blue-50 text-blue-800';
                            }

                            return (
                              <td 
                                key={col.fundId} 
                                className={`p-3 text-center border-r border-slate-100 transition-colors ${bgClass}`}
                              >
                                {isSelf ? '100%' : `${score}%`}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend explaining Similitud vs Peso */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Info size={14} className="text-blue-600 flex-shrink-0" />
                    <span>¿Cómo se calcula el porcentaje de similitud?</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed pt-0.5">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="font-bold text-blue-900 block mb-0.5">1. Matriz (% Similitud / Coincidencia de Posiciones)</span>
                      Mide únicamente la <strong>coincidencia de activos</strong> (Índice Jaccard: número de acciones/ISIN compartidos frente al total de activos únicos entre ambos fondos).
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="font-bold text-emerald-900 block mb-0.5">2. Solapamiento de Peso (% en detalles)</span>
                      Mide el <strong>peso asignado</strong> sumando el menor porcentaje ponderado que ambos fondos dedican a cada posición compartida (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">min(peso₁, peso₂)</code>).
                    </div>
                  </div>
                </div>
              </div>

              {/* Most Shared Positions Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Acciones Más Repetidas entre Fondos</span>
                  <span className="text-xs text-slate-500 font-normal">Top 10 activos en común</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Nombre de la Acción</th>
                        <th className="p-3 text-center">ISIN</th>
                        <th className="p-3 text-center">Fondos que la poseen</th>
                        <th className="p-3 text-right">Peso Medio</th>
                        <th className="p-3">Fondos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {analysis.mostSharedPositions.slice(0, 10).map((pos, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{pos.name}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{pos.isin}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {pos.fundsHoldingCount} fondos
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">{pos.avgWeight}%</td>
                          <td className="p-3 text-slate-500 text-[11px] truncate max-w-xs">
                            {pos.fundNames.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: INDUSTRY CORRELATION */}
        {(activeTab === 'all' || activeTab === 'industries') && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold">2. Correlación de Industrias y Sectores</h3>
                  <p className="text-xs text-slate-400">Distribución de patrimonio por sectores de inversión</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              {/* Text Summary Page Box */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg mt-0.5 flex-shrink-0">
                    <Info size={16} />
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-slate-800 leading-relaxed">
                    <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-xs">Resumen Ejecutivo de Distribución Sectorial</h4>
                    <p dangerouslySetInnerHTML={{ 
                      __html: analysis.narrativeIndustrySummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') 
                    }} />
                  </div>
                </div>
              </div>

              {/* Chart 2: Stacked Industry Distribution by Fund */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieChart size={16} className="text-emerald-600" />
                    Gráfica 2: Distribución por Sectores e Industrias por Fondo
                  </h4>
                  <span className="text-xs text-slate-500">Peso % acumulado por sector</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 h-80 md:h-[450px]">
                  {industryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical"
                        data={industryChartData} 
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          unit="%"
                          domain={[0, 100]}
                        />
                        <YAxis 
                          type="category"
                          dataKey="fundName" 
                          width={220}
                          tick={{ fontSize: 11, fill: '#334155' }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const fullTitle = payload[0]?.payload?.fullFundName || label;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1 max-w-xs">
                                  <p className="font-bold border-b border-slate-800 pb-1">{fullTitle}</p>
                                  {payload.filter(p => Number(p.value) > 0).map((p, i) => (
                                    <div key={i} className="flex justify-between items-center gap-4 text-[11px]">
                                      <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                                        {p.name}:
                                      </span>
                                      <span className="font-bold">{p.value}%</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {analysis.allSectors.map((sec) => (
                          <Bar 
                            key={sec} 
                            dataKey={sec} 
                            stackId="a" 
                            fill={SECTOR_COLORS[sec] || '#94a3b8'} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      Carga archivos de fondos para visualizar la gráfica de industrias.
                    </div>
                  )}
                </div>
              </div>


              {/* Pairwise Industry Similarity Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Alineación de Industria entre Parejas de Fondos
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Pareja de Fondos</th>
                        <th className="p-3 text-center">Similitud Sectorial</th>
                        <th className="p-3">Sectores Comunes Principales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {analysis.topIndustryPairs.slice(0, 8).map((pair, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            {pair.fund1Name} <span className="text-slate-400 font-normal">vs</span> {pair.fund2Name}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-700">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              {pair.industrySimilarity}%
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {pair.topCommonSectors.join(', ') || 'Sin sectores compartidos'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: LIQUIDITY EVOLUTION */}
        {(activeTab === 'all' || activeTab === 'liquidity') && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-600 text-white rounded-lg">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold">3. Evolución del Porcentaje de Liquidez por Fondo</h3>
                  <p className="text-xs text-slate-400">Comparativa directa de la tesorería/liquidez entre el período anterior y actual</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              {/* Executive Summary Box */}
              <div className="bg-teal-50/70 border border-teal-200/80 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-teal-600 text-white rounded-lg mt-0.5 flex-shrink-0">
                    <Info size={16} />
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-slate-800 leading-relaxed">
                    <h4 className="font-bold text-teal-950 uppercase tracking-wider text-xs">Resumen Ejecutivo de Liquidez y Tesorería</h4>
                    <p dangerouslySetInnerHTML={{ 
                      __html: analysis.liquiditySummary.narrativeLiquiditySummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }} />
                  </div>
                </div>
              </div>

              {/* Chart 3: Liquidity Comparison Bar Chart (Horizontal layout with fund names on Y axis) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Droplet size={16} className="text-teal-600" />
                    Gráfica 3: Porcentaje de Liquidez (Periodo Anterior vs. Actual)
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">% respecto al patrimonio del fondo</span>
                </div>

                <div 
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
                  style={{ height: Math.max(320, liquidityChartData.length * 65 + 80) }}
                >
                  {liquidityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical"
                        data={liquidityChartData} 
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          unit="%" 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: '#334155' }}
                          width={180}
                          interval={0}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const isPositive = data.Diferencia >= 0;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1.5">
                                  <p className="font-bold border-b border-slate-800 pb-1">{data.fullName}</p>
                                  <div className="flex justify-between items-center gap-4 text-[11px]">
                                    <span className="text-slate-300">Periodo Anterior:</span>
                                    <span className="font-bold text-slate-200">{data['Liquidez Anterior (%)']}%</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-4 text-[11px]">
                                    <span className="text-blue-400">Periodo Actual:</span>
                                    <span className="font-bold text-blue-300">{data['Liquidez Actual (%)']}%</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-4 text-[11px] pt-1 border-t border-slate-800">
                                    <span className="text-slate-400">Variación:</span>
                                    <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {isPositive ? `+${data.Diferencia}` : data.Diferencia} pp
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                        <Bar dataKey="Liquidez Anterior (%)" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Liquidez Actual (%)" fill="#2563eb" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      Carga archivos de fondos para visualizar la gráfica de liquidez.
                    </div>
                  )}
                </div>
              </div>

              {/* Fund Liquidity Evolution Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Tabla Comparativa de Liquidez entre Periodos
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left divide-y divide-slate-100">
                    <thead className="bg-slate-900 text-white font-semibold">
                      <tr>
                        <th className="p-3">Fondo / Entidad</th>
                        <th className="p-3 text-center">Liquidez Anterior</th>
                        <th className="p-3 text-center">Liquidez Actual</th>
                        <th className="p-3 text-center">Variación (pp)</th>
                        <th className="p-3">Estrategia de Tesorería</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {analysis.liquiditySummary.funds.map((fund) => {
                        const isPos = fund.change > 0;
                        const isZero = fund.change === 0;

                        return (
                          <tr key={fund.fundId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{fund.fundName}</td>
                            <td className="p-3 text-center text-slate-600 font-semibold">{fund.previousLiquidity}%</td>
                            <td className="p-3 text-center text-blue-700 font-bold">{fund.currentLiquidity}%</td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                                isZero 
                                  ? 'bg-slate-100 text-slate-700' 
                                  : isPos 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isPos ? `+${fund.change} pp` : `${fund.change} pp`}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              {isPos 
                                ? 'Aumento del porcentaje disponible en caja' 
                                : isZero 
                                ? 'Sin cambios significativos de tesorería' 
                                : 'Uso de liquidez para inversión o rebalanceo'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
