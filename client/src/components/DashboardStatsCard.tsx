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
  className,
}: DashboardStatsCardProps) {
  return (
    <div className={cn("bg-white overflow-hidden shadow rounded-lg", className)}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", `bg-${iconColor}/10`)}>
            <i className={cn(icon, `text-${iconColor}`)}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== 0 && (
                  <div
                    className={cn(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      change > 0 ? "text-success" : "text-error"
                    )}
                  >
                    <i className={cn("fas", change > 0 ? "fa-arrow-up" : "fa-arrow-down")}></i>
                    <span className="sr-only">{change > 0 ? "Increased by" : "Decreased by"}</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
