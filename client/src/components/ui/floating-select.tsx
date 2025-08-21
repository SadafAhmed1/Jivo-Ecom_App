import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const FloatingSelect = SelectPrimitive.Root;

const FloatingSelectGroup = SelectPrimitive.Group;

const FloatingSelectValue = SelectPrimitive.Value;

interface FloatingSelectTriggerProps extends React.ComponentProps<typeof SelectPrimitive.Trigger> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const FloatingSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  FloatingSelectTriggerProps
>(({ className, children, label, error, helperText, required, icon, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  React.useEffect(() => {
    // Check if there's a value by looking at the children
    const hasSelectedValue = React.Children.toArray(children).some(
      (child: any) => child?.props?.children && child.props.children !== label
    );
    setHasValue(hasSelectedValue);
  }, [children, label]);

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
        
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex h-14 w-full items-center justify-between rounded-lg border-2 bg-background pt-4 pb-2 transition-all duration-200 ease-in-out ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            icon ? "px-12 pr-10" : "px-4 pr-10",
            error
              ? "border-destructive focus:border-destructive"
              : "border-input focus:border-primary hover:border-primary/60",
            "focus:shadow-[0_0_0_4px] focus:shadow-primary/10",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        
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
});
FloatingSelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const FloatingSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
FloatingSelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const FloatingSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
FloatingSelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const FloatingSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      position={position}
      {...props}
    >
      <FloatingSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <FloatingSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
FloatingSelectContent.displayName = SelectPrimitive.Content.displayName;

const FloatingSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
FloatingSelectLabel.displayName = SelectPrimitive.Label.displayName;

const FloatingSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md py-2.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
FloatingSelectItem.displayName = SelectPrimitive.Item.displayName;

const FloatingSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
FloatingSelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  FloatingSelect,
  FloatingSelectGroup,
  FloatingSelectValue,
  FloatingSelectTrigger,
  FloatingSelectContent,
  FloatingSelectLabel,
  FloatingSelectItem,
  FloatingSelectSeparator,
  FloatingSelectScrollUpButton,
  FloatingSelectScrollDownButton,
};