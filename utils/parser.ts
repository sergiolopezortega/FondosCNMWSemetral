import { ParsedRecord, PatrimonioDistribution } from '../types';

/**
 * Parses the raw XML string content of an XBRL file.
 * Specific logic to extract 'InversionesFinancierasRVCotizada' and 'DistribucionPatrimonioFIM'.
 */
export const parseXBRLContent = (xmlContent: string): { records: ParsedRecord[], distribution?: PatrimonioDistribution } => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Error parsing XML structure.");
  }

  // Helper to parse values with potentially commas as decimals
  const parseVal = (val: string | null | undefined): number => {
    if (!val || val.trim() === "" || val === "N/A") return 0;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  // --- 1. Extraer Distribución del Patrimonio ---
  let distribution: PatrimonioDistribution | undefined = undefined;

  const findGlobalTag = (tagName: string): Element[] => {
    const suffix = tagName.includes(":") ? tagName.split(":")[1] : tagName;
    return Array.from(xmlDoc.getElementsByTagName("*")).filter(n => n.nodeName === tagName || n.nodeName.endsWith(":" + suffix) || n.nodeName === suffix);
  };

  const invFinancierasNodes = findGlobalTag("iic-com:DistribucionPatrimonioInversionesFinancieras");
  const liquidezNodes = findGlobalTag("iic-com:DistribucionPatrimonioLiquidez");
  const restoNodes = findGlobalTag("iic-com:DistribucionPatrimonioResto");

  if (invFinancierasNodes.length > 0) {
    distribution = {
      inversionesFinancieras: { actual: 0, previous: 0 },
      liquidez: { actual: 0, previous: 0 },
      resto: { actual: 0, previous: 0 }
    };

    const mapContexts = (nodes: Element[], target: { actual: number, previous: number }) => {
      nodes.forEach(node => {
        const ctx = node.getAttribute("contextRef");
        if (ctx?.endsWith("_ia")) target.actual = parseVal(node.textContent);
        else if (ctx?.endsWith("_ipp")) target.previous = parseVal(node.textContent);
      });
    };

    mapContexts(invFinancierasNodes, distribution.inversionesFinancieras);
    mapContexts(liquidezNodes, distribution.liquidez);
    mapContexts(restoNodes, distribution.resto);
  }

  // --- 2. Extraer Inversiones Financieras RVCotizada ---
  const blocks = Array.from(xmlDoc.getElementsByTagName("*")).filter(node => 
    node.nodeName === "iic-com:InversionesFinancierasRVCotizada" || 
    node.nodeName.endsWith(":InversionesFinancierasRVCotizada") ||
    node.nodeName === "InversionesFinancierasRVCotizada"
  );

  const results: ParsedRecord[] = [];

  for (const block of blocks) {
    const findTagInBlock = (tagName: string): Element | undefined => {
      const collection = block.getElementsByTagName(tagName);
      if (collection.length > 0) return collection[0];
      const suffix = tagName.includes(":") ? tagName.split(":")[1] : tagName;
      const allChildren = block.getElementsByTagName("*");
      for (let i = 0; i < allChildren.length; i++) {
        if (allChildren[i].nodeName.endsWith(suffix)) return allChildren[i];
      }
      return undefined;
    };

    const findTagsInBlock = (tagName: string): Element[] => {
      const collection = Array.from(block.getElementsByTagName(tagName));
      if (collection.length > 0) return collection;
      const suffix = tagName.includes(":") ? tagName.split(":")[1] : tagName;
      return Array.from(block.getElementsByTagName("*")).filter(n => n.nodeName.endsWith(suffix));
    };

    const descNode = findTagInBlock("iic-com:InversionesFinancierasDescripcion");
    let name = descNode?.textContent?.trim() || "N/A";
    name = name.replace(/^ACCIONES\|/i, "").trim();

    const upperName = name.toUpperCase();
    if (upperName === "RESTO RENTA VARIABLE EXTERIOR" || upperName === "RESTO RENTA VARIABLE INTERIOR") {
      continue;
    }

    const isinNode = findTagInBlock("iic-com:CodigoISIN");
    const isin = isinNode?.textContent?.trim() || "N/A";

    const pctNodes = findTagsInBlock("iic-com:InversionesFinancierasPorcentaje");
    let currentWeight = "N/A";
    let previousWeight = "N/A";

    for (const node of pctNodes) {
      const contextRef = node.getAttribute("contextRef");
      if (contextRef) {
        if (contextRef.endsWith("_ia")) currentWeight = node.textContent?.trim() || "N/A";
        else if (contextRef.endsWith("_ipp")) previousWeight = node.textContent?.trim() || "N/A";
      }
    }

    results.push({ name, isin, currentWeight, previousWeight });
  }

  const sortedRecords = results.sort((a, b) => {
    const wA = parseVal(a.currentWeight);
    const wB = parseVal(b.currentWeight);
    return wB - wA;
  });

  return { records: sortedRecords, distribution };
};

export const generateMarkdown = (filename: string, records: ParsedRecord[]): string => {
  const header = `# Reporte de Extracción - ${filename}\n\n`;
  const tableHeader = `| Nombre de la Acción | Codigo ISIN | Peso Actual | Peso Anterior |\n| :--- | :--- | :---: | :---: |\n`;
  
  const tableRows = records.map(r => 
    `| ${r.name.replace(/\|/g, '-')} | ${r.isin} | ${r.currentWeight} | ${r.previousWeight} |`
  ).join("\n");

  if (records.length === 0) {
    return header + "_No se encontraron datos de Renta Variable Cotizada en este archivo._";
  }

  return header + tableHeader + tableRows;
};