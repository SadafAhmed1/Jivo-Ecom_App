import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, helperText, required, icon, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <div className={cn(
                "transition-colors duration-200",
                error ? "text-destructive" : isFocused ? "text-primary" : "text-muted-foreground"
              )}>
                {icon}
              </div>
            </div>
          )}
          
          <input
            ref={inputRef}
            type={type}
            className={cn(
              "peer flex h-14 w-full rounded-lg border-2 bg-background pt-4 pb-2 transition-all duration-200 ease-in-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
              icon ? "px-12" : "px-4",
              error
                ? "border-destructive focus-visible:border-destructive"
                : "border-input focus-visible:border-primary hover:border-primary/60",
              "focus-visible:shadow-[0_0_0_4px] focus-visible:shadow-primary/10",
              className
            )}
            placeholder={label}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          
          <label
            className={cn(
              "absolute transition-all duration-200 ease-in-out pointer-events-none",
              icon ? "left-12" : "left-4",
              isLabelFloating
                ? "top-1 text-xs font-medium"
                : "top-1/2 -translate-y-1/2 text-base",
              error
                ? "text-destructive"
                : isFocused
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        </div>
        
        {(error || helperText) && (
          <div className="mt-2 min-h-[1.25rem]">
            {error ? (
              <p className="text-sm text-destructive font-medium animate-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            ) : helperText ? (
              <p className="text-sm text-muted-foreground">{helperText}</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };