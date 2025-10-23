import { cn } from "@/lib/utils";

interface CircleLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2", 
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4"
};

const variantClasses = {
  primary: "border-gray-300 border-t-blue-600",
  secondary: "border-gray-300 border-t-gray-600", 
  success: "border-gray-300 border-t-green-600",
  warning: "border-gray-300 border-t-orange-600"
};

export function CircleLoader({ 
  size = "md", 
  variant = "primary", 
  className 
}: CircleLoaderProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

export default CircleLoader;