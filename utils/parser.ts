import { ParsedRecord } from '../types';

/**
 * Parses the raw XML string content of an XBRL file.
 * Specific logic to extract 'InversionesFinancierasRVCotizada'.
 */
export const parseXBRLContent = (xmlContent: string): ParsedRecord[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Error parsing XML structure.");
  }

  // Find all blocks: <iic-com:InversionesFinancierasRVCotizada>
  // We use a robust search that handles potential namespace variations or lack thereof
  const blocks = Array.from(xmlDoc.getElementsByTagName("*")).filter(node => 
    node.nodeName === "iic-com:InversionesFinancierasRVCotizada" || 
    node.nodeName.endsWith(":InversionesFinancierasRVCotizada") ||
    node.nodeName === "InversionesFinancierasRVCotizada"
  );

  const results: ParsedRecord[] = [];

  for (const block of blocks) {
    // Helper to find specific children within the block safely
    const findTag = (tagName: string): Element | undefined => {
      // Direct child search or descendant search within the block
      const collection = block.getElementsByTagName(tagName);
      if (collection.length > 0) return collection[0];
      
      // Fallback: try matching without prefix if exact match failed
      const suffix = tagName.includes(":") ? tagName.split(":")[1] : tagName;
      const allChildren = block.getElementsByTagName("*");
      for (let i = 0; i < allChildren.length; i++) {
        if (allChildren[i].nodeName.endsWith(suffix)) return allChildren[i];
      }
      return undefined;
    };

    const findTags = (tagName: string): Element[] => {
        const collection = Array.from(block.getElementsByTagName(tagName));
        if (collection.length > 0) return collection;

         // Fallback
         const suffix = tagName.includes(":") ? tagName.split(":")[1] : tagName;
         return Array.from(block.getElementsByTagName("*")).filter(n => n.nodeName.endsWith(suffix));
    };

    // 1. Name: <iic-com:InversionesFinancierasDescripcion>
    const descNode = findTag("iic-com:InversionesFinancierasDescripcion");
    let name = descNode?.textContent?.trim() || "N/A";
    
    // Clean text: remove "ACCIONES|"
    name = name.replace(/^ACCIONES\|/i, "").trim();

    // Filtro solicitado: descartar el registro si el nombre coincide con los excluidos
    const upperName = name.toUpperCase();
    if (upperName === "RESTO RENTA VARIABLE EXTERIOR" || upperName === "RESTO RENTA VARIABLE INTERIOR") {
      continue;
    }

    // 2. ISIN: <iic-com:CodigoISIN>
    const isinNode = findTag("iic-com:CodigoISIN");
    const isin = isinNode?.textContent?.trim() || "N/A";

    // 3. Weights: Look for iic-com:InversionesFinancierasPorcentaje with contextRef ending in _ia or _ipp
    const pctNodes = findTags("iic-com:InversionesFinancierasPorcentaje");
    
    let currentWeight = "N/A";
    let previousWeight = "N/A";

    for (const node of pctNodes) {
        const contextRef = node.getAttribute("contextRef");
        if (contextRef) {
            if (contextRef.endsWith("_ia")) {
                currentWeight = node.textContent?.trim() || "N/A";
            } else if (contextRef.endsWith("_ipp")) {
                previousWeight = node.textContent?.trim() || "N/A";
            }
        }
    }

    results.push({
      name,
      isin,
      currentWeight,
      previousWeight
    });
  }

  // Sort results by Current Weight (descending)
  return results.sort((a, b) => {
    // Helper to parse value, handling comma decimals if present and N/A
    const parseVal = (val: string) => {
      if (!val || val === "N/A") return -Infinity;
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) ? -Infinity : num;
    };

    const wA = parseVal(a.currentWeight);
    const wB = parseVal(b.currentWeight);

    return wB - wA;
  });
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