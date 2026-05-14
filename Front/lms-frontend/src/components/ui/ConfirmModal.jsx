import React from 'react';
import Modal from './Modal';
import { Button } from './Button';
import { AlertCircle, HelpCircle, Info, CheckCircle2 } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận hành động", 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy bỏ",
  type = "question", // question, warning, danger, success
  isLoading = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'danger':
        return <AlertCircle className="text-rose-500" size={48} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-500" size={48} />;
      case 'info':
        return <Info className="text-indigo-500" size={48} />;
      default:
        return <HelpCircle className="text-amber-500" size={48} />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20";
      case 'success':
        return "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20";
      case 'warning':
        return "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20";
      default:
        return "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center" role="document">
        <div className="mb-4 p-4 rounded-full bg-slate-50 border border-slate-100" aria-hidden="true">
          {getIcon()}
        </div>
        
        <p className="text-slate-600 mb-8 leading-relaxed" id="confirm-modal-message">
          {message}
        </p>

        <div className="flex gap-3 w-full" role="group" aria-label="Hành động xác nhận">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            aria-label="Hủy bỏ"
          >
            {cancelText}
          </button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 ${getConfirmButtonStyles()} rounded-2xl py-3 font-semibold text-white shadow-lg transition-all active:scale-95`}
            aria-describedby="confirm-modal-message"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
