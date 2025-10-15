import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const neoButtonVariants = cva(
  'font-bold border-4 border-border rounded-lg transition-all duration-150 active:translate-x-1 active:translate-y-1 active:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-0.5 hover:translate-y-0.5',
        primary: 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-0.5 hover:translate-y-0.5',
        blue: 'bg-[hsl(var(--neo-blue))] text-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-0.5 hover:translate-y-0.5',
        green: 'bg-[hsl(var(--neo-green))] text-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-0.5 hover:translate-y-0.5',
        pink: 'bg-[hsl(var(--neo-pink))] text-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-0.5 hover:translate-y-0.5',
      },
      size: {
        default: 'px-6 py-3 text-base',
        sm: 'px-4 py-2 text-sm',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neoButtonVariants> {}

const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(neoButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

NeoButton.displayName = 'NeoButton';

export { NeoButton, neoButtonVariants };
