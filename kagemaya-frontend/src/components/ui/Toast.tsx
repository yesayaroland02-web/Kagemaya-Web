'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      border: 'border-kage-success/50',
      bg: 'bg-kage-yoru',
      text: 'text-kage-success',
      icon: <CheckCircle2 className="w-4 h-4 text-kage-success shrink-0" />,
    },
    error: {
      border: 'border-kage-error/50',
      bg: 'bg-kage-yoru',
      text: 'text-kage-error',
      icon: <AlertCircle className="w-4 h-4 text-kage-error shrink-0" />,
    },
    info: {
      border: 'border-kage-gold/50',
      bg: 'bg-kage-yoru',
      text: 'text-kage-gold',
      icon: <Info className="w-4 h-4 text-kage-gold shrink-0" />,
    },
  }[type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded border ${typeConfig.border} ${typeConfig.bg} shadow-2xl text-xs max-w-md backdrop-blur-md`}
      >
        {typeConfig.icon}
        <span className="text-kage-washi flex-1 font-medium leading-relaxed">{message}</span>
        <button
          onClick={onClose}
          className="text-kage-mist-dim hover:text-kage-washi p-1 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
