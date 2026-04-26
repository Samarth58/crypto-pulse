import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const SafeImage = ({ src, alt, className, ...props }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full ${className}`} {...props}>
        <ImageOff size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default SafeImage;
