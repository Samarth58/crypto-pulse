import React from 'react';

const SectionCard = ({ title, icon: Icon, children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
      {title && (
        <div className={`flex items-center gap-2.5 mb-4 ${noPadding ? 'px-6 pt-6' : ''}`}>
          {Icon && (
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Icon size={18} className="text-blue-500" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
};

export default SectionCard;
