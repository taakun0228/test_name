
import React from 'react';

interface ImageModalProps {
  url: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img 
        src={url} 
        alt="Expanded view" 
        className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageModal;
