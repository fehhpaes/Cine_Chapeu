import React from 'react';

export interface CineChapeuLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  showRibbonAccent?: boolean;
}

export const CineChapeuLogo: React.FC<CineChapeuLogoProps> = ({
  className = 'w-8 h-8 text-amber-500',
  showRibbonAccent = false,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cine Chapéu Logo"
      {...props}
    >
      {/* Copa do Chapéu Fedora com vinco clássico (Crown) */}
      <path
        d="M20.5 35.5C21.2 26.5 22.8 15.5 27 13.5C29.2 12.4 31.8 14.8 33.5 14.8C35.2 14.8 37.8 12.4 40 13.5C44.2 15.5 45.8 26.5 46.5 35.5H20.5Z"
        fill="currentColor"
      />

      {/* Faixa do Chapéu (Hat Ribbon / Band) */}
      <path
        d="M19.8 35.5C20.1 33.2 20.3 31.2 20.6 30H46.4C46.7 31.2 46.9 33.2 47.2 35.5C41.8 36.8 25.2 36.8 19.8 35.5Z"
        fill={showRibbonAccent ? '#d97706' : 'currentColor'}
        opacity={showRibbonAccent ? 1 : 0.88}
      />

      {/* Aba Curva e Elegante (Curved Fedora Brim) */}
      <path
        d="M7 40C11.5 37 18 36.2 24.5 36.5C32 36.8 40 36.8 47.5 36.5C54 36.2 60.5 37 65 40C63.5 44.5 53 47.5 36 47.5C19 47.5 8.5 44.5 7 40Z"
        fill="currentColor"
      />

      {/* Brilho / Detalhe sutil de iluminação na aba */}
      <path
        d="M13 40.2C20 37.8 44 37.8 51 40.2C46 41.6 38 42.2 32 42.2C26 42.2 18 41.6 13 40.2Z"
        fill="currentColor"
        opacity="0.25"
      />
    </svg>
  );
};

export default CineChapeuLogo;
