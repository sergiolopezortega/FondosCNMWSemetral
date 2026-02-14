import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileData } from './types.ts';
import { EmptyState } from './components/EmptyState.tsx';
import { FileList } from './components/FileList.tsx';
import { FileDetail } from './components/FileDetail.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { parseXBRLContent, generateMarkdown } from './utils/parser.ts';
import { RefreshCw, X, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detail' | 'analysis'>('detail');

  const performFileProcessing = async (fileData: FileData): Promise<Partial<FileData>> => {
    try {
      const text = await fileData.file.text();
      const records = parseXBRLContent(text);
      const markdown = generateMarkdown(fileData.file.name, records);
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
    
    // URL Busting para evitar cachés de errores 404
    const zipUrl = `/files.zip?t=${Date.now()}`;
    
    try {
      const response = await fetch(zipUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);
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
        if (extractedFiles.length > 0) {
          await processFiles(extractedFiles);
        }
      } else {
        const msg = `Error ${response.status}: El archivo no se encuentra en ${window.location.origin}/files.zip`;
        setLoadError(msg);
        console.error(msg);
      }
    } catch (error) {
      const msg = "Error de red al intentar cargar el archivo ZIP.";
      setLoadError(msg);
      console.error(msg, error);
    } finally {
      setIsLoading(false);
    }
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

  const resetApp = () => {
    setFiles([]);
    setSelectedFileId(null);
    setLoadError(null);
    setViewMode('detail');
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
            <RefreshCw size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Analisis Semestral Fondos</h1>
            <p className="text-xs text-slate-400">Renta Variable Cotizada Parser</p>
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
            <button 
              onClick={resetApp}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              title="Cerrar Carpeta"
            >
              <X size={20} />
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
                  Selecciona un archivo
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