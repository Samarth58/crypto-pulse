import React from 'react';
import { X, Bell, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '../contexts/AlertContext';
import { formatCurrency } from '../utils/formatters';

const AlertsModal = ({ isOpen, onClose, currency = 'usd' }) => {
  const { alerts, removeAlert } = useAlerts();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Alerts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">You have no active alerts.</p>
                <p className="text-sm text-slate-400 mt-2">Open a coin's details to set a price alert.</p>
              </div>
            ) : (
              <div className="space-y-3">
                 {alerts.map((alert) => (
                   <div 
                     key={alert.id} 
                     className={`flex items-center justify-between p-4 rounded-xl border transition-all ${alert.isTriggered ? 'bg-amber-50/50 border-amber-200/60 dark:bg-amber-900/10 dark:border-amber-800/40 opacity-75' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-blue-400/50 dark:hover:border-blue-500/30'}`}
                   >
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-bold text-slate-900 dark:text-white truncate">
                           {alert.coinName}
                         </span>
                         {alert.repeat && (
                           <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">Repeat</span>
                         )}
                         {alert.isTriggered && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-amber-500 text-white rounded-md">Triggered</span>
                         )}
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                         <div className="flex items-center gap-1 font-medium">
                           <span className="capitalize">{alert.condition}</span>
                           <span className="text-slate-900 dark:text-slate-200 font-bold">
                             {alert.type === 'price' ? formatCurrency(alert.targetValue, alert.currency) : `${alert.targetValue}%`}
                           </span>
                         </div>
                         
                         {alert.expiryTime && !alert.isTriggered && (
                           <div className="flex items-center gap-1 text-[10px]">
                             <span className="w-1 h-1 rounded-full bg-slate-300" />
                             <span>Expires: {new Date(alert.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     <button
                       onClick={() => removeAlert(alert.id)}
                       className="ml-4 p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                       title="Remove alert"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AlertsModal;
