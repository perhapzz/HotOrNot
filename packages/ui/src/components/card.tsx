import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        outlined: "border-2",
        elevated: "shadow-lg",
        flat: "shadow-none border-0",
        gradient: "bg-gradient-to-br border-0",
      },
      size: {
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(cardVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// 特殊用途的卡片组件

interface StatsCardProps extends CardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, trend, className, ...props }, ref) => (
    <Card
      ref={ref}
      className={clsx("relative overflow-hidden", className)}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center space-x-1 text-xs">
              <span
                className={clsx(
                  "inline-flex items-center",
                  trend.direction === "up" && "text-green-600",
                  trend.direction === "down" && "text-red-600",
                  trend.direction === "neutral" && "text-gray-600",
                )}
              >
                {trend.direction === "up" && "↗"}
                {trend.direction === "down" && "↙"}
                {trend.direction === "neutral" && "→"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">从上期</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ),
);
StatsCard.displayName = "StatsCard";

interface AnalysisCardProps extends CardProps {
  title: string;
  score?: number;
  maxScore?: number;
  status?: "pending" | "completed" | "failed";
  platform?: string;
  timestamp?: string;
}

const AnalysisCard = React.forwardRef<HTMLDivElement, AnalysisCardProps>(
  (
    {
      title,
      score,
      maxScore = 10,
      status,
      platform,
      timestamp,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <Card ref={ref} className={clsx("relative", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {status && (
            <div
              className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                status === "completed" && "bg-green-100 text-green-700",
                status === "pending" && "bg-yellow-100 text-yellow-700",
                status === "failed" && "bg-red-100 text-red-700",
              )}
            >
              {status === "completed" && "已完成"}
              {status === "pending" && "分析中"}
              {status === "failed" && "失败"}
            </div>
          )}
        </div>
        {(platform || timestamp) && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {platform && (
              <span
                className={`platform-${platform} px-2 py-1 rounded text-xs`}
              >
                {platform}
              </span>
            )}
            {timestamp && <span>{new Date(timestamp).toLocaleString()}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {score !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">评分</span>
              <span className="text-lg font-bold">
                {score}/{maxScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={clsx(
                  "h-2 rounded-full transition-all duration-300",
                  score >= maxScore * 0.8 && "bg-green-500",
                  score >= maxScore * 0.6 &&
                    score < maxScore * 0.8 &&
                    "bg-yellow-500",
                  score < maxScore * 0.6 && "bg-red-500",
                )}
                style={{ width: `${(score / maxScore) * 100}%` }}
              />
            </div>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  ),
);
AnalysisCard.displayName = "AnalysisCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatsCard,
  AnalysisCard,
};
