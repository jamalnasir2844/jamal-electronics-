import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

const textColors = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-blue-800',
};

let toastId = 0;
let addToastFn = null;

export const toast = {
  success: (message) => addToastFn?.({ id: ++toastId, type: 'success', message }),
  error: (message) => addToastFn?.({ id: ++toastId, type: 'error', message }),
  warning: (message) => addToastFn?.({ id: ++toastId, type: 'warning', message }),
  info: (message) => addToastFn?.({ id: ++toastId, type: 'info', message }),
};

const Toast = ({ id, type, message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors[type]} shadow-lg max-w-sm w-full animate-[fadeIn_0.2s_ease]`}
    >
      {icons[type]}
      <p className={`text-sm font-medium flex-1 ${textColors[type]}`}>{message}</p>
      <button
        onClick={() => onRemove(id)}
        className={`${textColors[type]} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => setToasts((prev) => [...prev, t]);
    return () => { addToastFn = null; };
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
};
