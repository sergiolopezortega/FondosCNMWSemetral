import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileData, ParsedRecord } from './types';
import { EmptyState } from './components/EmptyState';
import { FileList } from './components/FileList';
import { FileDetail } from './components/FileDetail';
import { AnalysisView } from './components/AnalysisView';
import { parseXBRLContent, generateMarkdown } from './utils/parser';
import { RefreshCw, X, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [viewMode, setViewMode] = useState<'detail' | 'analysis'>('detail');

  // Core processing logic extracted to be used by both auto-process and manual re-process
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
    // Process files one by one
    for (const fileItem of fileList) {
      // 1. Set status to processing
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'processing', errorMessage: undefined } : f));
      
      // 2. Small delay to ensure UI updates and browser doesn't freeze
      await new Promise(resolve => setTimeout(resolve, 50)); 

      // 3. Process
      const resultUpdates = await performFileProcessing(fileItem);

      // 4. Update result
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, ...resultUpdates } : f));
    }
  };

  const processZipBlob = useCallback(async (blob: Blob) => {
    // Load zip content
    const zip = await JSZip.loadAsync(blob);
    const newFiles: FileData[] = [];
    const promises: Promise<void>[] = [];

    // Iterate over zip files
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return; // Skip directories
      
      const lowerName = zipEntry.name.toLowerCase();
      if (lowerName.endsWith('.xbrl') || lowerName.endsWith('.xml')) {
        // Convert zip object to Blob/File so it works with existing logic
        const promise = zipEntry.async('blob').then((fileBlob) => {
          const file = new File([fileBlob], zipEntry.name, { 
              type: lowerName.endsWith('.xml') ? 'text/xml' : 'application/x-xbrl-xml' 
          });

          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            status: 'pending',
            records: [],
            markdownContent: null
          });
        });
        promises.push(promise);
      }
    });

    await Promise.all(promises);

    if (newFiles.length === 0) {
      console.warn("El archivo ZIP no contiene ficheros XBRL o XML válidos.");
      if (files.length === 0) {
          // No op, remains in empty state
      }
    } else {
      // Sort files by name for consistency
      newFiles.sort((a, b) => a.file.name.localeCompare(b.file.name));
      
      // Set initial state
      setFiles(newFiles);
      setSelectedFileId(newFiles[0].id);
      setViewMode('detail');

      // Trigger automatic sequential processing
      // We pass newFiles directly to avoid waiting for state update
      runSequentialProcessing(newFiles);
    }
  }, [files.length]);

  const handleLoadZip = useCallback(async () => {
    setIsLoadingZip(true);
    try {
      const response = await fetch('./files.zip');
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo files.zip (Status: ${response.status})`);
      }
      const blob = await response.blob();
      await processZipBlob(blob);

    } catch (error) {
      console.error("Error loading zip:", error);
    } finally {
      setIsLoadingZip(false);
    }
  }, [processZipBlob]);

  const handleManualUpload = useCallback(async (file: File) => {
    setIsLoadingZip(true);
    try {
      await processZipBlob(file);
    } catch (error) {
      console.error("Error processing manual zip:", error);
      alert("Error al procesar el archivo ZIP. Asegúrate de que es un archivo válido.");
    } finally {
      setIsLoadingZip(false);
    }
  }, [processZipBlob]);

  // Auto-load on mount
  useEffect(() => {
    handleLoadZip();
  }, [handleLoadZip]);

  // Single file reprocessing (triggered from FileDetail)
  const processSingleFile = async (id: string) => {
    const fileData = files.find(f => f.id === id);
    if (!fileData) return;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', errorMessage: undefined } : f));
    
    // Simulate slight delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 100));

    const resultUpdates = await performFileProcessing(fileData);
    
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...resultUpdates } : f));
  };

  const resetApp = () => {
    setFiles([]);
    setSelectedFileId(null);
    setViewMode('detail');
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
    setViewMode('detail');
  };

  const getSelectedFile = () => files.find(f => f.id === selectedFileId);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* App Header */}
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

      {/* Main Body */}
      <main className="flex-1 overflow-hidden flex">
        {files.length === 0 ? (
          <div className="flex-1 p-8">
            <EmptyState 
              onLoadZip={handleLoadZip} 
              onManualUpload={handleManualUpload} 
              isLoading={isLoadingZip} 
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