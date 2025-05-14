import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string | number;
  change: number;
  className?: string;
}

export function DashboardStatsCard({
  icon,
  iconColor,
  title,
  value,
  change,
  className
}: DashboardStatsCardProps) {
  const isPositive = change >= 0;
  
  const getIconColorClass = () => {
    switch (iconColor) {
      case 'primary':
        return 'bg-primary/10 text-primary';
      case 'secondary':
        return 'bg-blue-50 text-blue-600';
      case 'accent':
        return 'bg-purple-50 text-purple-600';
      case 'success':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-primary/10 text-primary';
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <div className="mt-1">
              <span className={cn(
                "inline-flex items-center text-sm font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                <span className={cn(
                  "mr-1",
                  isPositive ? "text-green-600" : "text-red-600"
                )}>
                  <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'}`}></i>
                </span>
                {Math.abs(change)}%
                <span className="ml-1 text-gray-500">vs. last month</span>
              </span>
            </div>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            getIconColorClass()
          )}>
            <i className={`${icon} text-xl`}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}