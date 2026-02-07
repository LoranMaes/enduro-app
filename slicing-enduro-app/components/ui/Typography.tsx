import React from 'react';
import { cn } from '../../lib/utils';

// Enforces the "Heading" rule: Inter, tight tracking, specific weights
export const Heading: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 }> = ({ 
  className, 
  level = 2, 
  children, 
  ...props 
}) => {
  const baseStyles = "font-sans tracking-tight text-white";
  const sizes = {
    1: "text-2xl font-light", // Page titles
    2: "text-lg font-medium", // Section headers
    3: "text-base font-medium", // Card headers
    4: "text-sm font-semibold", // Small headers
  };
  
  const Component = `h${level}` as any;
  
  return (
    <Component className={cn(baseStyles, sizes[level], className)} {...props}>
      {children}
    </Component>
  );
};

// Enforces the "Data" rule: JetBrains Mono, specific sizing
export const DataValue: React.FC<React.HTMLAttributes<HTMLSpanElement> & { size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className,
  size = 'md',
  children,
  ...props
}) => {
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <span className={cn("font-mono font-light text-white", sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

// Enforces the "Label" rule: Uppercase, tracking wider, muted color
export const Label: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("text-[10px] uppercase tracking-wider text-zinc-500 font-sans", className)} {...props}>
      {children}
    </div>
  );
};
