import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileData } from './types.ts';
import { EmptyState } from './components/EmptyState.tsx';
import { FileList } from './components/FileList.tsx';
import { FileDetail } from './components/FileDetail.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { parseXBRLContent, generateMarkdown } from './utils/parser.ts';
import { BarChart3, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [triedPaths, setTriedPaths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'detail' | 'analysis'>('detail');

  const performFileProcessing = async (fileData: FileData): Promise<Partial<FileData>> => {
    try {
      const text = await fileData.file.text();
      const records = parseXBRLContent(text);
      
      // Asegurar nombre limpio para el markdown
      const cleanName = fileData.file.name.split(/[\\/]/).pop() || fileData.file.name;
      const markdown = generateMarkdown(cleanName, records);
      
      return {
        status: 'completed',
        records,
        markdownContent: markdown
      };
    } catch (error) {
      console.error(`Error processing ${fileData.file.name}:`, error);
      return {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : "Error desconocido durante el procesamiento"
      };
    }
  };

  const runSequentialProcessing = async (fileList: FileData[]) => {
    for (const fileItem of fileList) {
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'processing', errorMessage: undefined } : f));
      const resultUpdates = await performFileProcessing(fileItem);
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, ...resultUpdates } : f));
    }
  };

  const processFiles = useCallback(async (rawFiles: File[]) => {
    const validFiles = rawFiles.filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.xbrl') || name.endsWith('.xml');
    });

    if (validFiles.length === 0) return;

    const newFileData: FileData[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      status: 'pending',
      records: [],
      markdownContent: null
    }));

    newFileData.sort((a, b) => a.file.name.localeCompare(b.file.name));
    setFiles(newFileData);
    setSelectedFileId(newFileData[0].id);
    setViewMode('detail');
    runSequentialProcessing(newFileData);
  }, []);

  const handleLoadZip = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    const pathsToTry = [
      './public/fondosfiles.zip',
      './fondosfiles.zip'
    ];
    
    setTriedPaths(pathsToTry);

    let success = false;

    for (const path of pathsToTry) {
      try {
        console.log(`Intentando cargar desde: ${path}`);
        const response = await fetch(`${import.meta.env.BASE_URL}/fondosfiles.zip`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            console.warn(`Omitiendo ${path}: el servidor devolvió HTML.`);
            continue;
          }

          const blob = await response.blob();
          
          const buffer = await blob.slice(0, 4).arrayBuffer();
          const header = new Uint8Array(buffer);
          if (header[0] !== 0x50 || header[1] !== 0x4B) {
            console.warn(`Omitiendo ${path}: no es un archivo ZIP válido.`);
            continue;
          }

          const zip = await JSZip.loadAsync(blob);
          const extractedFiles: File[] = [];
          const entryPromises: Promise<void>[] = [];
          
          zip.forEach((zipPath, entry) => {
            if (!entry.dir) {
              entryPromises.push(entry.async('blob').then(content => {
                extractedFiles.push(new File([content], entry.name));
              }));
            }
          });
          
          await Promise.all(entryPromises);
          if (extractedFiles.length > 0) {
            await processFiles(extractedFiles);
            success = true;
            console.log(`¡Cargado con éxito desde ${path}!`);
            break;
          }
        }
      } catch (err) {
        console.error(`Error en ruta ${import.meta.env.BASE_URL}/fondosfiles.zip`:`, err);
      }
    }

    if (!success) {
      setLoadError(`No se pudo localizar el archivo ZIP automáticamente en la ruta: ${import.meta.env.BASE_URL}/fondosfiles.zip`);
    }
    
    setIsLoading(false);
  }, [processFiles]);

  const handleManualZip = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: File[] = [];
      const promises: Promise<void>[] = [];
      zip.forEach((path, entry) => {
        if (!entry.dir) {
          promises.push(entry.async('blob').then(content => {
            extractedFiles.push(new File([content], entry.name));
          }));
        }
      });
      await Promise.all(promises);
      await processFiles(extractedFiles);
    } catch (error) {
      alert("Error al procesar el archivo ZIP manual.");
    } finally {
      setIsLoading(false);
    }
  }, [processFiles]);

  const handleFolderSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    setIsLoading(true);
    const filesArray = Array.from(fileList);
    processFiles(filesArray).finally(() => setIsLoading(false));
  }, [processFiles]);

  useEffect(() => {
    handleLoadZip();
  }, [handleLoadZip]);

  const processSingleFile = async (id: string) => {
    const fileData = files.find(f => f.id === id);
    if (!fileData) return;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', errorMessage: undefined } : f));
    const resultUpdates = await performFileProcessing(fileData);
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...resultUpdates } : f));
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
    setViewMode('detail');
  };

  const getSelectedFile = () => files.find(f => f.id === selectedFileId);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-lg">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Analisis Semestral Fondos</h1>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="flex gap-3">
            <button 
              onClick={() => setViewMode('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'analysis'
                  ? 'bg-slate-700 text-white shadow-inner'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Layers size={16} />
              Analizar coincidencias
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden flex">
        {files.length === 0 ? (
          <div className="flex-1 p-8">
            <EmptyState 
              onLoadZip={handleLoadZip} 
              onManualUpload={handleManualZip}
              onFolderSelect={handleFolderSelect}
              isLoading={isLoading} 
              error={loadError}
              debugPaths={triedPaths}
            />
          </div>
        ) : (
          <>
            <FileList 
              files={files} 
              selectedId={viewMode === 'detail' ? selectedFileId : null} 
              onSelect={handleSelectFile} 
            />
            {viewMode === 'analysis' ? (
              <AnalysisView files={files} />
            ) : (
              selectedFileId && getSelectedFile() ? (
                <FileDetail 
                  fileData={getSelectedFile()!} 
                  onProcess={processSingleFile}
                />
              ) : (
                <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400">
                  Selecciona un fondo
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
