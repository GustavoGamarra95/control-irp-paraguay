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
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className="bg-card shadow-soft border-b border-border mb-6 sticky top-0 z-10 w-full">
      <div className="max-w-7xl mx-auto px-2 md:px-4">
        <nav className="flex flex-nowrap overflow-x-auto scrollbar-hide -mx-2 md:mx-0">
          <div className="flex w-full md:w-auto md:justify-start min-w-full md:min-w-0">
            {navegacionItems.map(({ key, label, icon: Icon }) => {
              const isActive = vistaActual === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setVistaActual(key)}
                  className={`
                    flex-1 md:flex-initial min-w-[80px] md:min-w-[120px]
                    flex items-center justify-center gap-1.5 md:gap-2
                    px-2 md:px-4 py-2.5 md:py-3
                    text-[12px] md:text-sm font-medium
                    rounded-none border-b-2 border-transparent
                    transition-all duration-200
                    ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'hover:text-primary hover:bg-primary/5'}
                    ${isMobile ? 'flex-col' : 'flex-row'}
                  `}
                  data-active={isActive}
                >
                  <Icon className={`${isMobile ? 'h-5 w-5 mb-1' : 'h-4 w-4'}`} />
                  <span className={`${isMobile ? 'text-center' : ''} whitespace-nowrap`}>{label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}