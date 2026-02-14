import React, { useRef } from 'react';
import { Package, Loader2, AlertCircle, Upload, FolderOpen, RefreshCw, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  onLoadZip: () => void;
  onManualUpload: (file: File) => void;
  onFolderSelect: (files: FileList | null) => void;
  isLoading: boolean;
  error?: string | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onLoadZip, onManualUpload, onFolderSelect, isLoading, error }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onManualUpload(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="bg-blue-50 p-6 rounded-full mb-6">
          <Loader2 size={48} className="text-accent animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Cargando Datos...</h2>
        <p className="text-slate-500 max-w-md">
          Esto puede tardar unos segundos dependiendo del volumen de archivos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="bg-slate-50 p-6 rounded-full mb-6">
        <Package size={48} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido al Analizador de Fondos</h2>
      
      {error ? (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl text-left">
          <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
            <AlertCircle size={18} />
            Carga automática fallida
          </div>
          <p className="text-sm text-amber-800 mb-3">{error}</p>
          <div className="flex items-start gap-2 bg-white/50 p-3 rounded border border-amber-100">
            <HelpCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              <b>Tip para Vercel:</b> Si el archivo está en el repositorio pero recibes este error, intenta moverlo a una carpeta llamada <code>public/</code> en la raíz de tu proyecto (ej: <code>public/files.zip</code>). Vercel sirve automáticamente el contenido de esa carpeta.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-slate-500 max-w-md mb-8">
          Puedes seleccionar una carpeta local o subir un archivo ZIP con tus reportes XBRL para comenzar el análisis.
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-accent hover:bg-blue-50/50 transition-all group flex flex-col items-center">
          <FolderOpen size={32} className="text-slate-400 group-hover:text-accent mb-4" />
          <h3 className="font-bold text-slate-700 mb-1">Seleccionar Carpeta</h3>
          <p className="text-xs text-slate-500 mb-4">Carga todos los archivos .xml/.xbrl de una carpeta local.</p>
          <input
            type="file"
            webkitdirectory="true"
            directory="true"
            className="hidden"
            ref={folderInputRef}
            onChange={(e) => onFolderSelect(e.target.files)}
          />
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Abrir Carpeta
          </button>
        </div>

        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-accent hover:bg-blue-50/50 transition-all group flex flex-col items-center">
          <Upload size={32} className="text-slate-400 group-hover:text-accent mb-4" />
          <h3 className="font-bold text-slate-700 mb-1">Subir archivo ZIP</h3>
          <p className="text-xs text-slate-500 mb-4">Si tienes los archivos comprimidos en un solo .zip.</p>
          <div className="relative w-full">
            <input
              type="file"
              accept=".zip"
              onChange={handleZipChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Seleccionar ZIP
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 w-full max-w-2xl">
        <button 
          onClick={onLoadZip}
          className="text-xs text-accent hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <RefreshCw size={12} />
          Reintentar carga automática de /files.zip
        </button>
      </div>
    </div>
  );
};