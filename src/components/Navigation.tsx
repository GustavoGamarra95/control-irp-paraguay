import { BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  return (
    <div className="bg-card shadow-soft border-b border-border mb-6">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex space-x-2">
          {navegacionItems.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={vistaActual === key ? "default" : "ghost"}
              onClick={() => setVistaActual(key)}
              className="flex items-center px-4 py-4 text-sm font-medium rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={vistaActual === key}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}