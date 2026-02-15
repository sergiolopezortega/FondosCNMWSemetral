import React from 'react';
import { FileData } from '../types';
import { FileText, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';

interface FileListProps {
  files: FileData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, selectedId, onSelect }) => {
  return (
    <div className="w-80 border-r border-slate-200 bg-white h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <FileText size={18} />
          Fondos ({files.length})
        </h3>
      </div>
      <div className="overflow-y-auto flex-1">
        {files.map((file) => {
          // Extraer solo el nombre del archivo (quitar paths si existen)
          const baseName = file.file.name.split(/[\\/]/).pop() || "";
          const displayName = baseName.replace(/\.[^/.]+$/, "");

          return (
            <button
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={`w-full text-left p-3 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                selectedId === file.id ? 'bg-blue-50 border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex-shrink-0">
                {file.status === 'pending' && <Circle size={18} className="text-slate-300" />}
                {file.status === 'processing' && <Loader2 size={18} className="text-accent animate-spin" />}
                {file.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {file.status === 'error' && <AlertCircle size={18} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${selectedId === file.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {displayName}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};