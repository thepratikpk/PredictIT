import React from 'react';
import { Trash2, Loader } from 'lucide-react';

interface DeletingAnimationProps {
  isVisible: boolean;
  message?: string;
}

export const DeletingAnimation: React.FC<DeletingAnimationProps> = ({ 
  isVisible, 
  message = "Deleting pipeline..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
        <div className="relative mb-6">
          {/* Animated trash icon */}
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Trash2 className="w-8 h-8 text-red-600 animate-bounce" />
          </div>
          
          {/* Spinning loader */}
          <div className="absolute -top-2 -right-2">
            <Loader className="w-6 h-6 text-red-500 animate-spin" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4">
          Please wait while we clean up your data...
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};