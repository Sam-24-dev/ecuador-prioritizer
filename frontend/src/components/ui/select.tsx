import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center">
          <select
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
