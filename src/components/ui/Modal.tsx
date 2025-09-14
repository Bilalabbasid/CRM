import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  
}) => {
  if (!isOpen) return null;
  

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};