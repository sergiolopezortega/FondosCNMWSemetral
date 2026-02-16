
import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileData } from './types.ts';
import { EmptyState } from './components/EmptyState.tsx';
import { FileList } from './components/FileList.tsx';
import { FileDetail } from './components/FileDetail.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { parseXBRLContent, generateMarkdown } from './utils/parser.ts';
import { BarChart3, Layers, ChevronLeft } from 'lucide-react';

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
      const { records, distribution } = parseXBRLContent(text);
      
      const cleanName = fileData.file.name.split(/[\\/]/).pop() || fileData.file.name;
      const markdown = generateMarkdown(cleanName, records);
      
      return {
        status: 'completed',
        records,
        distribution,
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
    const pathsToTry = ['/fondosfiles.zip'];
    setTriedPaths(pathsToTry);

    let success = false;
    for (const path of pathsToTry) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
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
            break;
          }
        }
      } catch (err) { console.error(err); }
    }

    if (!success) setLoadError(`No se pudo localizar el archivo ZIP automáticamente.`);
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
    } catch (error) { alert("Error"); } finally { setIsLoading(false); }
  }, [processFiles]);

  const handleFolderSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    setIsLoading(true);
    processFiles(Array.from(fileList)).finally(() => setIsLoading(false));
  }, [processFiles]);

  useEffect(() => { handleLoadZip(); }, [handleLoadZip]);

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
    setViewMode('detail');
  };

  const getSelectedFile = () => files.find(f => f.id === selectedFileId);

  const isDetailViewActive = viewMode === 'detail' && selectedFileId !== null;
  const isAnalysisViewActive = viewMode === 'analysis';

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <header className="bg-primary text-white p-3 md:p-4 shadow-md flex justify-between items-center z-20 border-b border-slate-800">
        <div className="flex items-center gap-2 md:gap-3">
          {(isDetailViewActive || isAnalysisViewActive) && (
            <button 
              onClick={() => { setSelectedFileId(null); setViewMode('detail'); }}
              className="md:hidden p-1 -ml-1 hover:bg-slate-800 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="bg-accent p-1.5 md:p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <BarChart3 size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h1 className="text-sm md:text-xl font-bold tracking-tight truncate max-w-[150px] md:max-w-none">
            Analizador Fondos
          </h1>
        </div>
        
        {files.length > 0 && (
          <button 
            onClick={() => setViewMode('analysis')}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-xs md:text-sm ${
              viewMode === 'analysis'
                ? 'bg-blue-700 text-white ring-2 ring-white/30 translate-y-0.5'
                : 'bg-accent hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            <Layers size={16} className={viewMode === 'analysis' ? 'animate-pulse' : ''} />
            <span className="hidden xs:inline">Comparativa</span>
            <span className="xs:hidden">Comparativa</span>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-hidden flex relative">
        {files.length === 0 ? (
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
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
            {/* Sidebar: oculto en móvil si hay algo seleccionado */}
            <div className={`${(isDetailViewActive || isAnalysisViewActive) ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
              <FileList 
                files={files} 
                selectedId={viewMode === 'detail' ? selectedFileId : null} 
                onSelect={handleSelectFile} 
              />
            </div>
            
            {/* Contenido Principal */}
            <div className={`${(isDetailViewActive || isAnalysisViewActive) ? 'flex' : 'hidden md:flex'} flex-1 overflow-hidden`}>
              {viewMode === 'analysis' ? (
                <AnalysisView files={files} onBack={() => { setViewMode('detail'); setSelectedFileId(null); }} />
              ) : (
                selectedFileId && getSelectedFile() ? (
                  <FileDetail 
                    fileData={getSelectedFile()!} 
                    onProcess={(id) => {}} // Placeholder
                    onBack={() => setSelectedFileId(null)}
                  />
                ) : (
                  <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400 text-center p-8">
                    <div>
                      <BarChart3 size={48} className="mx-auto mb-4 opacity-10" />
                      <p>Selecciona un fondo del listado para ver el detalle</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
