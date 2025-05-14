import { cn } from "@/lib/utils";

interface MarketingCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
}

export function MarketingCard({ title, description, icon, className }: MarketingCardProps) {
  return (
    <div className={cn("border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow", className)}>
      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
        <i className={`${icon} text-2xl`}></i>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-500">{description}</p>
    </div>
  );
}
