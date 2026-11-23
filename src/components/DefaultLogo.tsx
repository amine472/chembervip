import React from 'react';

interface LogoProps {
  logoDataUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppLogo: React.FC<LogoProps> = ({ logoDataUrl, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }[size];

  if (logoDataUrl) {
    return (
      <div
        className={`${sizeClasses} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src={logoDataUrl}
          alt="Logo de l'établissement"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-white ${className}`}
      aria-label="Logo Base de Vie"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/4 h-3/4"
      >
        <path
          d="M8 38V17L24 8L40 17V38H8Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 38V24H32V38"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M21 18H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 15V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5 38H43" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};
