import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-card ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
