import { Loader2, Clock, AlertCircle, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "blue" | "gray" | "green" | "red";
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  color = "blue"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const colorClasses = {
    blue: "text-blue-500",
    gray: "text-gray-500",
    green: "text-green-500",
    red: "text-red-500"
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )} 
    />
  );
}

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCard?: boolean;
}

export function LoadingState({ 
  message = "Loading...",
  submessage,
  size = "md",
  className,
  showCard = true
}: LoadingStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <LoadingSpinner size={size === "sm" ? "md" : size === "md" ? "lg" : "xl"} className="mb-3" />
      <div className="text-sm font-medium text-gray-700 mb-1">{message}</div>
      {submessage && (
        <div className="text-xs text-gray-500 max-w-xs">{submessage}</div>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card className="w-full">
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showCard?: boolean;
  variant?: "error" | "warning" | "info";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
  showCard = true,
  variant = "error"
}: ErrorStateProps) {
  const variantStyles = {
    error: {
      bg: "bg-red-50 border-red-200",
      iconBg: "bg-red-100",
      icon: "text-red-600",
      title: "text-red-800",
      message: "text-red-700",
      button: "bg-red-600 hover:bg-red-700 text-white"
    },
    warning: {
      bg: "bg-orange-50 border-orange-200", 
      iconBg: "bg-orange-100",
      icon: "text-orange-600",
      title: "text-orange-800",
      message: "text-orange-700",
      button: "bg-orange-600 hover:bg-orange-700 text-white"
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100", 
      icon: "text-blue-600",
      title: "text-blue-800",
      message: "text-blue-700",
      button: "bg-blue-600 hover:bg-blue-700 text-white"
    }
  };

  const styles = variantStyles[variant];
  const Icon = variant === "error" ? AlertCircle : variant === "warning" ? Clock : AlertCircle;

  const content = (
    <div className={cn("text-center max-w-md mx-auto", className)}>
      <div className={cn("rounded-lg p-6 border", styles.bg)}>
        <div className="flex items-center justify-center mb-4">
          <div className={cn("rounded-full p-3", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
        <h3 className={cn("text-lg font-semibold mb-2", styles.title)}>{title}</h3>
        <p className={cn("text-sm leading-relaxed mb-6", styles.message)}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
              styles.button
            )}
          >
            <LoadingSpinner size="sm" className="mr-2 text-current" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className="w-full">
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
  showCard?: boolean;
}

export function EmptyState({
  title = "No data found",
  message = "There's nothing to show here yet.",
  actionLabel,
  onAction,
  icon,
  className,
  showCard = true
}: EmptyStateProps) {
  const content = (
    <div className={cn("text-center max-w-md mx-auto", className)}>
      <div className="bg-gray-50 rounded-lg p-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-100 rounded-full p-4">
            {icon || <Package className="h-8 w-8 text-gray-400" />}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className="w-full">
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

// Page-level loading wrapper
interface PageLoadingProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  loadingMessage?: string;
  errorTitle?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onRetry?: () => void;
  onEmptyAction?: () => void;
  children: React.ReactNode;
}

export function PageLoading({
  isLoading,
  error,
  isEmpty = false,
  loadingMessage = "Loading data...",
  errorTitle = "Failed to load data",
  emptyTitle = "No data available",
  emptyMessage = "There's nothing to show here yet.",
  emptyActionLabel,
  onRetry,
  onEmptyAction,
  children
}: PageLoadingProps) {
  if (isLoading) {
    return (
      <LoadingState 
        message={loadingMessage}
        submessage="Please wait while we fetch your data"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children}</>;
}