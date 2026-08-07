import React, { useState } from 'react';
import { Lock, Shield, X, AlertCircle } from 'lucide-react';
import { verifyPassword } from '../utils/crypto.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const isValid = await verifyPassword(password.trim());
      if (isValid) {
        setError(false);
        setPassword('');
        onLoginSuccess();
      } else {
        setError(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transition-all">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/30 text-blue-400 p-2.5 rounded-xl border border-blue-500/30">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Acceso Administrador</h2>
              <p className="text-xs text-slate-400 font-light">Introduce la contraseña para habilitar funciones de carga</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contraseña de Administrador
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Contraseña"
                autoFocus
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none transition-all ${
                  error 
                    ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/50' 
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900'
                }`}
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5">
                <AlertCircle size={14} /> Contraseña incorrecta. Inténtalo de nuevo.
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Shield size={14} /> Acceder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
