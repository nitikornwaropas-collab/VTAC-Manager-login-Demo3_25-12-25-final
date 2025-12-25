
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-2xl w-full max-w-md m-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <p className="text-text-secondary mt-2">{message}</p>
        </div>
        <div className="px-6 py-4 bg-background/50 flex justify-end space-x-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold text-text-primary bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-primary hover:bg-primary-focus transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
