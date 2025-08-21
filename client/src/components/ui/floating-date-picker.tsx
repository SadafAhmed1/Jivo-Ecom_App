import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface FloatingDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const FloatingDatePicker = React.forwardRef<HTMLDivElement, FloatingDatePickerProps>(
  ({ date, onDateChange, label, error, helperText, required, placeholder, disabled, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const hasValue = !!date;
    const isLabelFloating = isFocused || hasValue || isOpen;

    return (
      <div ref={ref} className={cn("relative w-full", className)}>
        <div className="relative">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex h-14 w-full justify-start rounded-lg border-2 bg-background pt-4 pb-2 px-4 pr-10 text-left font-normal transition-all duration-200 ease-in-out hover:bg-background",
                  error
                    ? "border-destructive focus-visible:border-destructive"
                    : "border-input focus-visible:border-primary hover:border-primary/60",
                  "focus-visible:shadow-[0_0_0_4px] focus-visible:shadow-primary/10",
                  !date && "text-muted-foreground",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              >
                <div className="flex items-center w-full">
                  <span className={cn("flex-1", date && "text-foreground")}>
                    {date ? format(date, "PPP") : ""}
                  </span>
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent 
              className="w-auto p-0 shadow-lg animate-in fade-in-0 zoom-in-95" 
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  onDateChange(selectedDate);
                  setIsOpen(false);
                }}
                initialFocus
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
          
          <label
            className={cn(
              "absolute left-4 transition-all duration-200 ease-in-out pointer-events-none",
              isLabelFloating
                ? "top-1 text-xs font-medium"
                : "top-1/2 -translate-y-1/2 text-base",
              error
                ? "text-destructive"
                : (isFocused || isOpen)
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

FloatingDatePicker.displayName = "FloatingDatePicker";

export { FloatingDatePicker };