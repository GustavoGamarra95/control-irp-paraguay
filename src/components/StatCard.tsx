import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'income' | 'expense' | 'tax' | 'default';
  gradient?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', gradient = false }: StatCardProps) {
  const getCardClasses = () => {
    const baseClasses = "p-6 transition-smooth hover:shadow-medium";
    
    if (!gradient) return baseClasses;
    
    switch (variant) {
      case 'income':
        return `${baseClasses} bg-gradient-income text-income-foreground border-0`;
      case 'expense':
        return `${baseClasses} bg-gradient-expense text-expense-foreground border-0`;
      case 'tax':
        return `${baseClasses} bg-gradient-tax text-tax-foreground border-0`;
      default:
        return `${baseClasses} bg-gradient-primary text-primary-foreground border-0`;
    }
  };

  const getIconClasses = () => {
    if (gradient) return "h-8 w-8 text-current";
    
    switch (variant) {
      case 'income':
        return "h-8 w-8 text-income";
      case 'expense':
        return "h-8 w-8 text-expense";
      case 'tax':
        return "h-8 w-8 text-tax";
      default:
        return "h-8 w-8 text-primary";
    }
  };

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0">
        <div className="flex items-center">
          <Icon className={getIconClasses()} />
          <div className="ml-4">
            <p className={`text-sm font-medium ${gradient ? 'text-current' : 'text-muted-foreground'}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${gradient ? 'text-current' : 'text-foreground'}`}>
              {value}
            </p>
          </div>
        </div>
        {subtitle && (
          <p className={`text-sm mt-2 ${gradient ? 'text-current/80' : 'text-muted-foreground'}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}