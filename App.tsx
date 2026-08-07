
import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileData } from './types.ts';
import { EmptyState } from './components/EmptyState.tsx';
import { FileList } from './components/FileList.tsx';
import { FileDetail } from './components/FileDetail.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { CorrelationView } from './components/CorrelationView.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { parseXBRLContent, generateMarkdown } from './utils/parser.ts';
import { BarChart3, Layers, ChevronLeft, RefreshCw, Upload, ShieldCheck, LogOut, Lock, KeyRound, Network } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [triedPaths, setTriedPaths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'detail' | 'analysis' | 'correlation'>('detail');

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/admin' || pathname.startsWith('/admin') || hash === '#admin') {
        setShowAdminModal(true);
      }
    };

    checkAdminRoute();

    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('isAdmin', 'true');
    setShowAdminModal(false);
    if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isAdmin');
  };

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
    const pathsToTry = [
      '/fondosfiles.zip',
      '/fondosFiles.zip',
      '/files.zip',
      '/fondos.zip'
    ];
    setTriedPaths(pathsToTry);

    let success = false;
    const timestamp = Date.now();
    for (const path of pathsToTry) {
      try {
        const response = await fetch(`${path}?t=${timestamp}`);
        const contentType = response.headers.get('content-type') || '';
        
        // Skip if response is HTML (Vite SPA fallback 404) or not HTTP 200
        if (response.ok && !contentType.includes('text/html')) {
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
      } catch (err) { 
        console.warn(`No se pudo cargar el archivo desde ${path}:`, err); 
      }
    }

    if (!success) setLoadError(`No se encontró un archivo ZIP de datos en la carpeta public/. Puedes cargar un archivo ZIP manualmente o seleccionar una carpeta local.`);
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
      alert("No se pudo descompilar el archivo. Verifica que sea un archivo .zip válido."); 
    } finally { 
      setIsLoading(false); 
    }
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
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          {(isDetailViewActive || isAnalysisViewActive) && (
            <button 
              onClick={() => { setSelectedFileId(null); setViewMode('detail'); }}
              className="md:hidden p-1 -ml-1 hover:bg-slate-800 rounded-full flex-shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="bg-accent p-1.5 md:p-2 rounded-lg shadow-lg shadow-blue-500/20 flex-shrink-0">
            <BarChart3 size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm md:text-xl font-bold tracking-tight truncate leading-tight">
              Analizador Fondos
            </h1>
            <div className="mt-0.5">
              <p className="text-[9px] md:text-xs font-medium opacity-90 leading-tight truncate">
                Periodo de referencia: 1 de julio de 2025 al 31 de diciembre de 2025
              </p>
              <p className="text-[8px] md:text-[10px] opacity-70 leading-tight truncate font-light">
                Datos recogidos de la CNMV correspondientes al primer semestre de 2025
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {isAdmin ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/60 text-blue-200 border border-blue-700/50">
                <ShieldCheck size={14} className="text-blue-400" />
                <span>Admin</span>
              </div>

              <button
                onClick={handleLoadZip}
                disabled={isLoading}
                title="Recargar ZIP desde servidor"
                className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs md:text-sm font-medium transition-all shadow border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                <span className="hidden lg:inline">Recargar ZIP</span>
              </button>

              <label 
                title="Cargar otro ZIP manualmente"
                className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs md:text-sm font-medium transition-all shadow border border-slate-700 cursor-pointer"
              >
                <Upload size={15} />
                <span className="hidden lg:inline">Cargar ZIP</span>
                <input 
                  type="file" 
                  accept=".zip" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleManualZip(e.target.files[0]);
                    }
                  }} 
                />
              </label>

              <button
                onClick={() => setViewMode('correlation')}
                title="Generar Análisis de Correlación entre Fondos"
                className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold transition-all shadow border border-blue-500 flex-shrink-0"
              >
                <Network size={15} />
                <span className="hidden lg:inline">Generar Análisis</span>
              </button>

              <button
                onClick={() => setShowChangePasswordModal(true)}
                title="Cambiar contraseña de administrador"
                className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs md:text-sm font-medium transition-all shadow border border-slate-700"
              >
                <KeyRound size={15} />
                <span className="hidden lg:inline">Cambiar contraseña</span>
              </button>

              <button
                onClick={handleAdminLogout}
                title="Salir del modo administración"
                className="p-1.5 md:p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 transition-colors border border-slate-700"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              onDoubleClick={() => {
                window.history.pushState({}, '', '/admin');
                setShowAdminModal(true);
              }}
              aria-label="Acceso reservado"
              className="w-8 h-8 opacity-0 cursor-default select-none focus:outline-none"
            />
          )}

          {files.length > 0 && (
            <>
              <button 
                onClick={() => setViewMode('analysis')}
                className={`flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-xs md:text-sm flex-shrink-0 ${
                  viewMode === 'analysis'
                    ? 'bg-blue-700 text-white ring-2 ring-white/30 translate-y-0.5'
                    : 'bg-accent hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                <Layers size={16} className={viewMode === 'analysis' ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">Comparativa</span>
                <span className="sm:hidden">Comparativa</span>
              </button>

              <button 
                onClick={() => setViewMode('correlation')}
                className={`flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-xs md:text-sm flex-shrink-0 ${
                  viewMode === 'correlation'
                    ? 'bg-blue-700 text-white ring-2 ring-white/30 translate-y-0.5'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                }`}
              >
                <Network size={16} className={viewMode === 'correlation' ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">Análisis Correlación</span>
                <span className="sm:hidden">Correlación</span>
              </button>
            </>
          )}
        </div>
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
            <div className={`${(isDetailViewActive || isAnalysisViewActive || viewMode === 'correlation') ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
              <FileList 
                files={files} 
                selectedId={viewMode === 'detail' ? selectedFileId : null} 
                onSelect={handleSelectFile} 
              />
            </div>
            
            {/* Contenido Principal */}
            <div className={`${(isDetailViewActive || isAnalysisViewActive || viewMode === 'correlation') ? 'flex' : 'hidden md:flex'} flex-1 overflow-hidden`}>
              {viewMode === 'analysis' ? (
                <AnalysisView files={files} onBack={() => { setViewMode('detail'); setSelectedFileId(null); }} />
              ) : viewMode === 'correlation' ? (
                <CorrelationView files={files} onBack={() => { setViewMode('detail'); setSelectedFileId(null); }} />
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

      <AdminModal 
        isOpen={showAdminModal} 
        onClose={() => {
          setShowAdminModal(false);
          if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
            window.history.pushState({}, '', '/');
          }
        }} 
        onLoginSuccess={handleAdminSuccess} 
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default App;
