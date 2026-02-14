import React from 'react';
import { Package, Loader2, AlertCircle, Upload } from 'lucide-react';

interface EmptyStateProps {
  onLoadZip: () => void;
  onManualUpload: (file: File) => void;
  isLoading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onLoadZip, onManualUpload, isLoading }) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Cargando Archivos...</h2>
        <p className="text-slate-500 max-w-md">
          Extrayendo y preparando el contenido.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">No se encontró files.zip</h2>
      <p className="text-slate-500 max-w-md mb-8">
        No se pudo cargar automáticamente el archivo <code>files.zip</code> del servidor. Puedes reintentar o subir tu propio archivo ZIP manualmente.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={onLoadZip}
          className="flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all shadow-md active:transform active:scale-95 bg-accent hover:bg-blue-600 text-white"
        >
          <Package size={20} />
          Reintentar Carga
        </button>

        <div className="relative">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Seleccionar archivo ZIP"
          />
          <button className="flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all shadow-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 w-full">
             <Upload size={20} />
             Subir ZIP manualmente
          </button>
        </div>
      </div>
    </div>
  );
};