import React, { useState } from 'react';
import { ExternalLink, Globe, Hash, Calendar, Tag, Info, ChevronDown } from 'lucide-react';

const CoinAboutSection = ({ coinDetails }) => {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!coinDetails) return null;

  // Safe extractors
  const description = coinDetails.description?.en || '';
  const cleanDescription = description.replace(/<[^>]*>?/gm, ''); 
  
  const sentences = cleanDescription.split('. ');
  const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');

  const genesisDate = coinDetails.genesis_date;
  const hashingAlgo = coinDetails.hashing_algorithm;
  const categories = coinDetails.categories || [];
  const homepage = coinDetails.links?.homepage?.[0];
  const explorer = coinDetails.links?.blockchain_site?.[0];

  const hasInfo = genesisDate || hashingAlgo || categories.length > 0 || homepage || explorer;

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
            <Info size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">About {coinDetails.name}</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Historical Data & Links</p>
          </div>
        </div>
        <div className={`p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-700 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Description Text */}
        <div className="p-4 sm:p-5">
          {cleanDescription ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-all duration-300">
                {showFullDesc ? cleanDescription : summary}
              </p>
              {sentences.length > 3 && (
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showFullDesc ? 'Show Less' : 'Read More...'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No description available for this asset.</p>
          )}
        </div>

        {/* Structured Info Grid */}
        {hasInfo && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            
            {/* Launch Date */}
            {genesisDate && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <Calendar size={14} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Launched</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(genesisDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {/* Hashing Algorithm */}
            {hashingAlgo && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <Hash size={14} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Algorithm</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{hashingAlgo}</p>
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm mt-1">
                  <Tag size={14} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1.5">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.slice(0, 4).map((cat, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-md">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Official Website */}
            {homepage && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <Globe size={14} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Official Site</p>
                  <a 
                    href={homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Visit Website <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            )}

            {/* Blockchain Explorer */}
            {explorer && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <ExternalLink size={14} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Explorer</p>
                  <a 
                    href={explorer} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View Ledger <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}
    </div>
  );
};

export default CoinAboutSection;
