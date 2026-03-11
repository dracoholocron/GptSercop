import type { ReactNode } from 'react';

export interface ToastProps {
  message: ReactNode;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ message, type = 'info', onDismiss, className = '' }: ToastProps) {
  const variants = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div
      role="alert"
      className={`flex items-center justify-between rounded border px-4 py-3 ${variants[type]} ${className}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-4 rounded p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}
