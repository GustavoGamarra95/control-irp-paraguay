import { BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';

interface NavigationProps {
  vistaActual: string;
  setVistaActual: (vista: string) => void;
}

const navegacionItems = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { key: 'egresos', label: 'Egresos', icon: TrendingDown },
  { key: 'resumen', label: 'Resumen Fiscal', icon: Calculator }
];

export function Navigation({ vistaActual, setVistaActual }: NavigationProps) {
  const { isMobile } = useResponsive();

  return (
    <div className="bg-card shadow-soft border-b border-border mb-6 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between sm:justify-start overflow-x-auto scrollbar-hide">
          {navegacionItems.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={vistaActual === key ? "default" : "ghost"}
              onClick={() => setVistaActual(key)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-3 sm:px-4 sm:py-4 text-[13px] sm:text-sm font-medium rounded-none border-b-2 border-transparent transition-colors duration-200 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:text-primary"
              data-active={vistaActual === key}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}