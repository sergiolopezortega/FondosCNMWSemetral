import { FileData, ParsedRecord } from '../types';

export interface SharedPosition {
  name: string;
  isin: string;
  weight1: number;
  weight2: number;
}

export interface FundCorrelationPair {
  fund1Id: string;
  fund1Name: string;
  fund2Id: string;
  fund2Name: string;
  sharedCount: number;
  jaccardSimilarity: number; // 0 to 100
  weightOverlap: number; // 0 to 100 %
  sharedPositions: SharedPosition[];
}

export interface IndustrySectorData {
  sector: string;
  color: string;
  totalWeight: number; // % relativo sobre el total clasificado (suma 100%)
  rawWeight: number;   // % medio absoluto en cartera
  positionsCount: number;
  fundsCount: number;
}

export interface FundIndustryExposure {
  fundId: string;
  fundName: string;
  sectors: Record<string, number>; // sector name -> weight %
}

export interface MostSharedPosition {
  name: string;
  isin: string;
  fundsHoldingCount: number;
  fundNames: string[];
  avgWeight: number;
}

export interface IndustryPairCorrelation {
  fund1Name: string;
  fund2Name: string;
  industrySimilarity: number; // 0 to 100 %
  topCommonSectors: string[];
}

export interface FundLiquidityEvolution {
  fundId: string;
  fundName: string;
  previousLiquidity: number;
  currentLiquidity: number;
  change: number;
  trend: 'increase' | 'decrease' | 'stable';
  hasData: boolean;
}

export interface LiquiditySummary {
  funds: FundLiquidityEvolution[];
  avgPreviousLiquidity: number;
  avgCurrentLiquidity: number;
  avgChange: number;
  narrativeLiquiditySummary: string;
}

export interface CorrelationAnalysisResult {
  totalFunds: number;
  totalUniquePositions: number;
  allFundNames: string[];
  topCorrelatedPairs: FundCorrelationPair[];
  matrix: { fundId: string; fundName: string; scores: Record<string, number> }[];
  mostSharedPositions: MostSharedPosition[];
  industryExposures: FundIndustryExposure[];
  sectorSummary: IndustrySectorData[];
  topIndustryPairs: IndustryPairCorrelation[];
  allSectors: string[];
  narrativePositionsSummary: string;
  narrativeIndustrySummary: string;
  liquiditySummary: LiquiditySummary;
}

// Colors assigned to industry sectors
export const SECTOR_COLORS: Record<string, string> = {
  'Tecnología': '#3b82f6', // blue
  'Servicios Financieros': '#10b981', // emerald
  'Salud y Biotecnología': '#ec4899', // pink
  'Energía y Petróleo': '#f59e0b', // amber
  'Servicios Públicos (Utilities)': '#8b5cf6', // purple
  'Consumo y Retail': '#06b6d4', // cyan
  'Bienes Industriales y Construcción': '#64748b', // slate
  'Telecomunicaciones y Medios': '#6366f1', // indigo
  'Inmobiliario (Real Estate)': '#14b8a6', // teal
  'Automoción y Transporte': '#ef4444', // red
  'Materias Primas y Química': '#d97706', // amber dark
  'Fondos e Índices / ETF': '#84cc16', // lime
  'Otros / Diversificado': '#94a3b8', // slate muted
};

export function parseWeightNum(val: string | undefined | null): number {
  if (!val || val === 'N/A' || val.trim() === '') return 0;
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

export function classifyRecordIndustry(record: ParsedRecord): string {
  const name = record.name.toUpperCase();
  const isin = record.isin.toUpperCase();

  // Technology
  if (
    name.includes('MICROSOFT') || name.includes('APPLE') || name.includes('NVIDIA') ||
    name.includes('ALPHABET') || name.includes('GOOGLE') || name.includes('AMAZON') ||
    name.includes('META') || name.includes('ASML') || name.includes('SAP') ||
    name.includes('BROADCOM') || name.includes('TAIWAN SEMI') || name.includes('INTEL') ||
    name.includes('AMD') || name.includes('CISCO') || name.includes('ADOBE') ||
    name.includes('ORACLE') || name.includes('SALESFORCE') || name.includes('SOFTWARE') ||
    name.includes('TECH') || name.includes('SEMI') || name.includes('CYBER')
  ) {
    return 'Tecnología';
  }

  // Financial Services
  if (
    name.includes('BANCO') || name.includes('BANK') || name.includes('SANTANDER') ||
    name.includes('BBVA') || name.includes('CAIXABANK') || name.includes('SABADELL') ||
    name.includes('BNP') || name.includes('ING') || name.includes('INTESA') ||
    name.includes('UBS') || name.includes('CREDIT') || name.includes('JPMORGAN') ||
    name.includes('GOLDMAN') || name.includes('MORGAN STANLEY') || name.includes('ALLIANZ') ||
    name.includes('AXA') || name.includes('MAPFRE') || name.includes('VISCOFAN') ||
    name.includes('FINANCIER') || name.includes('INSURANCE')
  ) {
    return 'Servicios Financieros';
  }

  // Healthcare & Pharma
  if (
    name.includes('PHARMA') || name.includes('HEALTH') || name.includes('GRIFOLS') ||
    name.includes('ROVI') || name.includes('PFIZER') || name.includes('NOVARTIS') ||
    name.includes('ROCHE') || name.includes('SANOFI') || name.includes('ASTRAZENECA') ||
    name.includes('NOVO NORDISK') || name.includes('JOHNSON') || name.includes('MERCK') ||
    name.includes('LILLY') || name.includes('BIOTECH') || name.includes('THERAPEUTIC') ||
    name.includes('MEDTRONIC') || name.includes('BAYER')
  ) {
    return 'Salud y Biotecnología';
  }

  // Energy & Oil
  if (
    name.includes('REPSOL') || name.includes('SHELL') || name.includes('TOTAL') ||
    name.includes('BP') || name.includes('EXXON') || name.includes('CHEVRON') ||
    name.includes('PETRO') || name.includes('GAS') || name.includes('OIL') ||
    name.includes('ENERGY') || name.includes('SAIPEM') || name.includes('GALP') ||
    name.includes('ENI') || name.includes('EQUINOR')
  ) {
    return 'Energía y Petróleo';
  }

  // Utilities
  if (
    name.includes('IBERDROLA') || name.includes('ENDESA') || name.includes('NATURGY') ||
    name.includes('ENEL') || name.includes('RED ELECTRICA') || name.includes('REDEIA') ||
    name.includes('ACCIONA ENERGIA') || name.includes('EDP') || name.includes('VEOLIA') ||
    name.includes('ENGIE') || name.includes('UTILITIES') || name.includes('ELECTRIC') ||
    name.includes('POWER')
  ) {
    return 'Servicios Públicos (Utilities)';
  }

  // Consumer & Retail
  if (
    name.includes('INDITEX') || name.includes('LVMH') || name.includes('KERING') ||
    name.includes('HERMES') || name.includes('NESTLE') || name.includes('DANONE') ||
    name.includes('HEINEKEN') || name.includes('UNILEVER') || name.includes('PROCTER') ||
    name.includes('COCA') || name.includes('PEPSI') || name.includes('MCDONALD') ||
    name.includes('NIKE') || name.includes('L\'OREAL') || name.includes('CARREFOUR') ||
    name.includes('WALMART') || name.includes('RETAIL') || name.includes('CONSUMER') ||
    name.includes('FOOD') || name.includes('BEVERAGE')
  ) {
    return 'Consumo y Retail';
  }

  // Industrials & Aerospace
  if (
    name.includes('FERROVIAL') || name.includes('ACS') || name.includes('ACCIONA') ||
    name.includes('SIEMENS') || name.includes('AIRBUS') || name.includes('BOEING') ||
    name.includes('CATERPILLAR') || name.includes('GENERAL ELECTRIC') || name.includes('SCHNEIDER') ||
    name.includes('SAFRAN') || name.includes('VINCI') || name.includes('EIFFAGE') ||
    name.includes('INDUSTRIAL') || name.includes('AEROSPACE') || name.includes('DEFENSE')
  ) {
    return 'Bienes Industriales y Construcción';
  }

  // Telecoms & Media
  if (
    name.includes('TELEFONICA') || name.includes('CELLNEX') || name.includes('VODAFONE') ||
    name.includes('DEUTSCHE TELEKOM') || name.includes('ORANGE') || name.includes('COMCAST') ||
    name.includes('DISNEY') || name.includes('NETFLIX') || name.includes('MEDIA') ||
    name.includes('TELECOM') || name.includes('COMMUNICATION')
  ) {
    return 'Telecomunicaciones y Medios';
  }

  // Real Estate
  if (
    name.includes('MERLIN') || name.includes('COLONIAL') || name.includes('REIT') ||
    name.includes('REAL ESTATE') || name.includes('INMOBILIARIA') || name.includes('VONOVIA') ||
    name.includes('UNIBAIL')
  ) {
    return 'Inmobiliario (Real Estate)';
  }

  // Automotive & Transport
  if (
    name.includes('BMW') || name.includes('MERCEDES') || name.includes('VOLKSWAGEN') ||
    name.includes('PORSCHE') || name.includes('STELLANTIS') || name.includes('RENAULT') ||
    name.includes('TOYOTA') || name.includes('TESLA') || name.includes('AUTO') ||
    name.includes('MOTOR') || name.includes('AIRLINES') || name.includes('IAG') ||
    name.includes('LUFTHANSA') || name.includes('RYANAIR')
  ) {
    return 'Automoción y Transporte';
  }

  // Basic Materials & Chemicals
  if (
    name.includes('BASF') || name.includes('LINDE') || name.includes('ARCELORMITTAL') ||
    name.includes('ACERINOX') || name.includes('RIO TINTO') || name.includes('BHP') ||
    name.includes('CHEMICAL') || name.includes('STEEL') || name.includes('MINING')
  ) {
    return 'Materias Primas y Química';
  }

  // ETFs & Funds
  if (
    name.includes('ETF') || name.includes('ISHARES') || name.includes('LYXOR') ||
    name.includes('AMUNDI') || name.includes('VANGUARD') || name.includes('SPDR') ||
    name.includes('INDEX') || name.includes('FUND') || name.includes('ACCIONES|')
  ) {
    return 'Fondos e Índices / ETF';
  }

  return 'Otros / Diversificado';
}

export function cleanFundName(rawName: string): string {
  if (!rawName) return '';
  // Extract filename if path contains slashes or backslashes
  let cleaned = rawName.split(/[\\/]/).pop() || rawName;
  // Remove explicit folder prefix like "fondosfiles_" if appended
  cleaned = cleaned.replace(/^fondosfiles_?/i, "");
  // Remove file extension (.md, .xml, .zip, etc.)
  cleaned = cleaned.replace(/\.[^/.]+$/, "");
  // Remove date prefixes like 31_12_2023_ or 2023_12_31_
  cleaned = cleaned.replace(/^(0[1-9]|[12][0-9]|3[01])_(0[1-9]|1[0-2])_\d{4}_/i, "");
  cleaned = cleaned.replace(/^\d{4}_\d{2}_\d{2}_/i, "");
  // Replace underscores with spaces
  cleaned = cleaned.replace(/_/g, " ").trim();
  return cleaned || rawName;
}

export function analyzeCorrelations(files: FileData[]): CorrelationAnalysisResult {
  const completedFiles = files.filter(f => f.status === 'completed' && f.records && f.records.length > 0);
  
  const totalFunds = completedFiles.length;
  const allFundNames = completedFiles.map(f => cleanFundName(f.file.name));

  // Map each record to a normalized key
  const getRecordKey = (r: ParsedRecord) => {
    if (r.isin && r.isin !== 'N/A' && r.isin.trim().length > 3) {
      return r.isin.toUpperCase().trim();
    }
    return r.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  // 1. Process positions per fund
  const fundPositionsMap = new Map<string, Map<string, { record: ParsedRecord; weight: number }>>();
  const allUniquePositionsMap = new Map<string, { name: string; isin: string; fundsHolding: Set<string>; totalWeightSum: number }>();

  completedFiles.forEach((f, idx) => {
    const fundName = allFundNames[idx];
    const posMap = new Map<string, { record: ParsedRecord; weight: number }>();

    f.records.forEach(r => {
      const key = getRecordKey(r);
      const weight = parseWeightNum(r.currentWeight);
      posMap.set(key, { record: r, weight });

      if (!allUniquePositionsMap.has(key)) {
        allUniquePositionsMap.set(key, {
          name: r.name,
          isin: r.isin,
          fundsHolding: new Set([fundName]),
          totalWeightSum: weight
        });
      } else {
        const item = allUniquePositionsMap.get(key)!;
        item.fundsHolding.add(fundName);
        item.totalWeightSum += weight;
        if ((!item.isin || item.isin === 'N/A') && r.isin && r.isin !== 'N/A') {
          item.isin = r.isin;
        }
      }
    });

    fundPositionsMap.set(f.id, posMap);
  });

  const totalUniquePositions = allUniquePositionsMap.size;

  // Most shared positions across all funds
  const mostSharedPositions: MostSharedPosition[] = Array.from(allUniquePositionsMap.values())
    .map(p => ({
      name: p.name,
      isin: p.isin,
      fundsHoldingCount: p.fundsHolding.size,
      fundNames: Array.from(p.fundsHolding),
      avgWeight: Number((p.totalWeightSum / (p.fundsHolding.size || 1)).toFixed(2))
    }))
    .sort((a, b) => b.fundsHoldingCount - a.fundsHoldingCount || b.avgWeight - a.avgWeight)
    .slice(0, 15);

  // 2. Pairwise fund correlation (Posiciones)
  const allPairs: FundCorrelationPair[] = [];
  const matrixData: { fundId: string; fundName: string; scores: Record<string, number> }[] = [];

  for (let i = 0; i < completedFiles.length; i++) {
    const f1 = completedFiles[i];
    const name1 = allFundNames[i];
    const map1 = fundPositionsMap.get(f1.id)!;

    const scoresRow: Record<string, number> = {};

    for (let j = 0; j < completedFiles.length; j++) {
      const f2 = completedFiles[j];
      const name2 = allFundNames[j];
      const map2 = fundPositionsMap.get(f2.id)!;

      if (i === j) {
        scoresRow[f2.id] = 100;
        continue;
      }

      // Shared positions count & weights
      const sharedPositionsList: SharedPosition[] = [];
      let weightOverlapSum = 0;

      map1.forEach((val1, key) => {
        if (map2.has(key)) {
          const val2 = map2.get(key)!;
          sharedPositionsList.push({
            name: val1.record.name,
            isin: val1.record.isin !== 'N/A' ? val1.record.isin : val2.record.isin,
            weight1: val1.weight,
            weight2: val2.weight
          });
          weightOverlapSum += Math.min(val1.weight, val2.weight);
        }
      });

      const totalUniquePair = new Set([...map1.keys(), ...map2.keys()]).size;
      const sharedCount = sharedPositionsList.length;
      const jaccardSim = totalUniquePair > 0 ? Number(((sharedCount / totalUniquePair) * 100).toFixed(1)) : 0;
      const weightOverlap = Number(weightOverlapSum.toFixed(2));

      scoresRow[f2.id] = jaccardSim;

      if (i < j) {
        allPairs.push({
          fund1Id: f1.id,
          fund1Name: name1,
          fund2Id: f2.id,
          fund2Name: name2,
          sharedCount,
          jaccardSimilarity: jaccardSim,
          weightOverlap,
          sharedPositions: sharedPositionsList.sort((a, b) => (b.weight1 + b.weight2) - (a.weight1 + a.weight2))
        });
      }
    }

    matrixData.push({
      fundId: f1.id,
      fundName: name1,
      scores: scoresRow
    });
  }

  const topCorrelatedPairs = [...allPairs].sort((a, b) => b.sharedCount - a.sharedCount || b.jaccardSimilarity - a.jaccardSimilarity);

  // 3. Industry Classification
  const fundIndustryExposures: FundIndustryExposure[] = [];
  const sectorMap = new Map<string, { totalWeightSum: number; positionsCount: number; funds: Set<string> }>();

  completedFiles.forEach((f, idx) => {
    const fundName = allFundNames[idx];
    const rawSectorWeights: Record<string, number> = {};

    f.records.forEach(r => {
      const sector = classifyRecordIndustry(r);
      if (sector === 'Otros / Diversificado') return;
      const w = parseWeightNum(r.currentWeight);

      rawSectorWeights[sector] = (rawSectorWeights[sector] || 0) + w;

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { totalWeightSum: 0, positionsCount: 1, funds: new Set([fundName]) });
      } else {
        const secData = sectorMap.get(sector)!;
        secData.positionsCount += 1;
        secData.funds.add(fundName);
      }
    });

    // Normalize sector weights for this fund so they sum to 100%
    const fundClassifiedSum = Object.values(rawSectorWeights).reduce((a, b) => a + b, 0);
    const normalizedSectorWeights: Record<string, number> = {};

    if (fundClassifiedSum > 0) {
      let currentFundSum = 0;
      const entries = Object.entries(rawSectorWeights);

      entries.forEach(([sec, w]) => {
        const normVal = Number(((w / fundClassifiedSum) * 100).toFixed(2));
        normalizedSectorWeights[sec] = normVal;
        currentFundSum += normVal;
      });

      // Adjust rounding on largest sector if needed so sum is exactly 100.00%
      const diff = Number((100 - currentFundSum).toFixed(2));
      if (Math.abs(diff) > 0 && Math.abs(diff) < 1 && entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        const largestSec = entries[0][0];
        normalizedSectorWeights[largestSec] = Number((normalizedSectorWeights[largestSec] + diff).toFixed(2));
      }
    }

    // Add normalized weights to global sectorMap
    Object.entries(normalizedSectorWeights).forEach(([sec, normW]) => {
      if (sectorMap.has(sec)) {
        sectorMap.get(sec)!.totalWeightSum += normW;
      }
    });

    fundIndustryExposures.push({
      fundId: f.id,
      fundName,
      sectors: normalizedSectorWeights
    });
  });

  const rawSectorSummary = Array.from(sectorMap.entries()).map(([sector, data]) => {
    const avgPercent = data.totalWeightSum / (totalFunds || 1);
    return {
      sector,
      color: SECTOR_COLORS[sector] || '#94a3b8',
      totalWeight: Number(avgPercent.toFixed(2)),
      rawWeight: Number(avgPercent.toFixed(2)),
      positionsCount: data.positionsCount,
      fundsCount: data.funds.size
    };
  });

  // Adjust rounding on largest item so exact global sum is 100.00%
  if (rawSectorSummary.length > 0) {
    const currentSum = rawSectorSummary.reduce((acc, curr) => acc + curr.totalWeight, 0);
    const diff = Number((100 - currentSum).toFixed(2));
    if (Math.abs(diff) > 0 && Math.abs(diff) < 1) {
      rawSectorSummary.sort((a, b) => b.totalWeight - a.totalWeight);
      rawSectorSummary[0].totalWeight = Number((rawSectorSummary[0].totalWeight + diff).toFixed(2));
    }
  }

  const sectorSummary: IndustrySectorData[] = rawSectorSummary.sort((a, b) => b.totalWeight - a.totalWeight || b.positionsCount - a.positionsCount);

  const allSectors = sectorSummary.map(s => s.sector);

  // Pairwise Industry Correlation
  const topIndustryPairs: IndustryPairCorrelation[] = [];
  for (let i = 0; i < fundIndustryExposures.length; i++) {
    for (let j = i + 1; j < fundIndustryExposures.length; j++) {
      const exp1 = fundIndustryExposures[i];
      const exp2 = fundIndustryExposures[j];

      // Overlap weight in same industries
      let overlapSum = 0;
      const commonSecs: string[] = [];

      allSectors.forEach(sec => {
        const w1 = exp1.sectors[sec] || 0;
        const w2 = exp2.sectors[sec] || 0;
        if (w1 > 0 && w2 > 0) {
          commonSecs.push(sec);
          overlapSum += Math.min(w1, w2);
        }
      });

      topIndustryPairs.push({
        fund1Name: exp1.fundName,
        fund2Name: exp2.fundName,
        industrySimilarity: Number(overlapSum.toFixed(1)),
        topCommonSectors: commonSecs
      });
    }
  }

  topIndustryPairs.sort((a, b) => b.industrySimilarity - a.industrySimilarity);

  // 4. Generate Spanish Narrative Summaries
  let narrativePositionsSummary = '';
  if (totalFunds < 2) {
    narrativePositionsSummary = `Se ha analizado 1 fondo con un total de ${totalUniquePositions} posiciones en cartera. Para realizar un análisis de correlación entre fondos se requiere disponer de al menos 2 fondos cargados.`;
  } else {
    const topPair = topCorrelatedPairs[0];
    const topHolding = mostSharedPositions[0];

    narrativePositionsSummary = `El análisis comparativo de la cartera de **${totalFunds} fondos** revela un catálogo total de **${totalUniquePositions} posiciones individuales únicas**. ` +
      (topPair && topPair.sharedCount > 0
        ? `La pareja de fondos con mayor concordancia en activos es **${topPair.fund1Name}** y **${topPair.fund2Name}**, coincidiendo en **${topPair.sharedCount} posiciones idénticas** (un índice de similitud de **${topPair.jaccardSimilarity}%** y un peso asignado solapado del **${topPair.weightOverlap}%** en cartera). `
        : `Los fondos presentan carteras altamente diversificadas y diferenciadas entre sí. `) +
      (topHolding && topHolding.fundsHoldingCount > 1
        ? `El activo más común en las carteras es **${topHolding.name}** (${topHolding.isin !== 'N/A' ? topHolding.isin : 'Renta Variable'}), estando presente simultáneamente en **${topHolding.fundsHoldingCount} de los ${totalFunds} fondos** analizados con un peso medio del **${topHolding.avgWeight}%**.`
        : `No se observan posiciones masivamente repetidas en la totalidad de los fondos.`);
  }

  let narrativeIndustrySummary = '';
  if (sectorSummary.length === 0) {
    narrativeIndustrySummary = `No hay suficientes datos de distribución industrial para calcular la correlación por sectores.`;
  } else {
    const topSector = sectorSummary[0];
    const secondSector = sectorSummary[1];
    const topIndPair = topIndustryPairs[0];

    narrativeIndustrySummary = `En la distribución por sectores e industrias, el sector con mayor ponderación agregada en el conjunto de los fondos es **${topSector.sector}**, representando un peso total acumulado del **${topSector.totalWeight}%** y presente en **${topSector.fundsCount} fondos**.` +
      (secondSector ? ` Le sigue el sector **${secondSector.sector}** con un **${secondSector.totalWeight}%** del patrimonio analizado. ` : ` `) +
      (topIndPair && topIndPair.industrySimilarity > 0
        ? `A nivel sectorial, los fondos **${topIndPair.fund1Name}** y **${topIndPair.fund2Name}** muestran la mayor alineación estratégica de industria, coincidiendo activamente en sectores clave como *${topIndPair.topCommonSectors.slice(0, 3).join(', ')}* con un solapamiento ponderado industrial del **${topIndPair.industrySimilarity}%**.`
        : `Las políticas de inversión muestran una variada dispersión sectorial entre la muestra analizada.`);
  }

  // 5. Liquidity Evolution Analysis
  const liquidityFunds: FundLiquidityEvolution[] = completedFiles.map((f, idx) => {
    const fundName = allFundNames[idx];
    const dist = f.distribution;
    let prev = 0;
    let curr = 0;

    if (dist && dist.inversionesFinancieras) {
      const invPrev = dist.inversionesFinancieras.previous || 0;
      const invCurr = dist.inversionesFinancieras.actual || 0;
      const liqPrev = dist.liquidez?.previous || 0;
      const liqCurr = dist.liquidez?.actual || 0;

      prev = invPrev > 0 ? (liqPrev / invPrev) * 100 : 0;
      curr = invCurr > 0 ? (liqCurr / invCurr) * 100 : 0;
    }

    const change = Number((curr - prev).toFixed(2));
    let trend: 'increase' | 'decrease' | 'stable' = 'stable';
    if (change > 0.05) trend = 'increase';
    else if (change < -0.05) trend = 'decrease';

    return {
      fundId: f.id,
      fundName,
      previousLiquidity: Number(prev.toFixed(2)),
      currentLiquidity: Number(curr.toFixed(2)),
      change,
      trend,
      hasData: !!f.distribution
    };
  });

  const validLiquidityFunds = liquidityFunds.filter(l => l.hasData);
  const totalValidLiquidity = validLiquidityFunds.length;

  let avgPreviousLiquidity = 0;
  let avgCurrentLiquidity = 0;
  let avgLiquidityChange = 0;

  if (totalValidLiquidity > 0) {
    avgPreviousLiquidity = Number((validLiquidityFunds.reduce((sum, f) => sum + f.previousLiquidity, 0) / totalValidLiquidity).toFixed(2));
    avgCurrentLiquidity = Number((validLiquidityFunds.reduce((sum, f) => sum + f.currentLiquidity, 0) / totalValidLiquidity).toFixed(2));
    avgLiquidityChange = Number((avgCurrentLiquidity - avgPreviousLiquidity).toFixed(2));
  }

  let narrativeLiquiditySummary = '';
  if (totalValidLiquidity === 0) {
    narrativeLiquiditySummary = `No se dispone de desglose de tesorería y liquidez en los estados analizados.`;
  } else {
    const sortedByCurrent = [...validLiquidityFunds].sort((a, b) => b.currentLiquidity - a.currentLiquidity);
    const sortedByChange = [...validLiquidityFunds].sort((a, b) => b.change - a.change);

    const highestLiquidityFund = sortedByCurrent[0];
    const largestIncreaseFund = sortedByChange[0];

    narrativeLiquiditySummary = `El nivel medio de tesorería y liquidez entre los **${totalValidLiquidity} fondos** analizados se sitúa en un **${avgCurrentLiquidity}%**, frente al **${avgPreviousLiquidity}%** del periodo anterior ` +
      (avgLiquidityChange > 0
        ? `(un incremento medio de **+${avgLiquidityChange} pp** en liquidez acumulada). `
        : avgLiquidityChange < 0
        ? `(una reducción media de **${avgLiquidityChange} pp**, indicando mayor asignación hacia activos invertidos). `
        : `(manteniéndose en niveles equivalentes). `) +
      (highestLiquidityFund
        ? `El fondo con mayor nivel de liquidez en el periodo actual es **${highestLiquidityFund.fundName}** (**${highestLiquidityFund.currentLiquidity}%**). `
        : ``) +
      (largestIncreaseFund && largestIncreaseFund.change > 0
        ? `La mayor acumulación de tesorería corresponde a **${largestIncreaseFund.fundName}** (+**${largestIncreaseFund.change} pp**).`
        : ` `);
  }

  const liquiditySummary: LiquiditySummary = {
    funds: liquidityFunds,
    avgPreviousLiquidity,
    avgCurrentLiquidity,
    avgChange: avgLiquidityChange,
    narrativeLiquiditySummary
  };

  return {
    totalFunds,
    totalUniquePositions,
    allFundNames,
    topCorrelatedPairs,
    matrix: matrixData,
    mostSharedPositions,
    industryExposures: fundIndustryExposures,
    sectorSummary,
    topIndustryPairs,
    allSectors,
    narrativePositionsSummary,
    narrativeIndustrySummary,
    liquiditySummary
  };
}
