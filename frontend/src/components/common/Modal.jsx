// FILE: ./src/components/common/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

/**
 * A reusable Modal component
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Function to call when the modal should close
 * @param {string} props.title - The title of the modal
 * @param {React.ReactNode} props.children - The content of the modal
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark bg-opacity-50 backdrop-blur-sm transition-opacity"
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        className="relative w-full max-w-lg p-6 m-4 bg-brand-light rounded-2xl shadow-xl transform transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-secondary-dark">
          <h3 className="text-xl font-semibold text-brand-dark">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-brand-gray rounded-full hover:bg-brand-secondary-light hover:text-brand-dark"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Body */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;