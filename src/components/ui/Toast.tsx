import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const TOAST_STYLES: Record<ToastType, { bg: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: 'bg-white border-green-200', icon: CheckCircle, iconColor: 'text-green-500' },
  error: { bg: 'bg-white border-red-200', icon: XCircle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-white border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info: { bg: 'bg-white border-blue-200', icon: Info, iconColor: 'text-blue-500' },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300);
    }, toast.duration ?? 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg max-w-sm w-full
        ${style.bg} transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <Icon className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${style.iconColor}`} size={18} />
      <p className="text-sm text-gray-700 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}
