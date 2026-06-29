import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Lock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface PasswordConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  danger?: boolean;
  zIndex?: string;
}

export default function PasswordConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  loading = false,
  danger = true,
  zIndex = 'z-50',
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/auth/verify-password', { password });
      onConfirm();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Incorrect password');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/50 ${zIndex} flex items-center justify-center p-4`} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-orange-100'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-600' : 'text-orange-600'} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${danger ? 'text-red-600' : 'text-orange-600'}`}>{title}</h3>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-2">{description}</p>
        <p className="text-xs text-gray-400 font-semibold mb-5">⚠️ This action cannot be undone.</p>

        {/* Password Input */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Lock size={14} />
            Enter your password to confirm
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder="Your admin password"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={verifying || loading || !password.trim()}
            className={`flex-1 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {verifying ? 'Verifying...' : loading ? 'Processing...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={verifying || loading}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
