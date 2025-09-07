import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { IncomeManager } from '@/components/IncomeManager';
import { ExpenseManager } from '@/components/ExpenseManagerProps';
import { TaxSummary } from '@/components/TaxSummary';
import { calcularIva, calcularIRP } from '@/utlis/calculations';
import { useToast } from '@/hooks/use-toast';
import type { Income, Expense, Configuration, Statistics } from '@/types';

const Index = () => {
  const [ingresos, setIngresos] = useState<Income[]>([]);
  const [egresos, setEgresos] = useState<Expense[]>([]);
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [configuracion, setConfiguracion] = useState<Configuration>({
    tipoContribuyente: 'servicios',
    familiaresACargo: 0,
    gastosPersonales: 0
  });
  const { toast } = useToast();

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const ingresosGuardados = JSON.parse(localStorage.getItem('irp-ingresos') || '[]');
    const egresosGuardados = JSON.parse(localStorage.getItem('irp-egresos') || '[]');
    const configGuardada = JSON.parse(localStorage.getItem('irp-configuracion') || '{"tipoContribuyente":"servicios","familiaresACargo":0,"gastosPersonales":0}');
    setIngresos(ingresosGuardados);
    setEgresos(egresosGuardados);
    setConfiguracion(configGuardada);
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('irp-ingresos', JSON.stringify(ingresos));
  }, [ingresos]);

  useEffect(() => {
    localStorage.setItem('irp-egresos', JSON.stringify(egresos));
  }, [egresos]);

  useEffect(() => {
    localStorage.setItem('irp-configuracion', JSON.stringify(configuracion));
  }, [configuracion]);

  // Cálculos
  const ivaIngresos = calcularIva(ingresos);
  const ivaEgresos = calcularIva(egresos);
  const resumenIRP = calcularIRP(ingresos, egresos, configuracion);

  const estadisticas: Statistics = {
    totalIngresos: ingresos.reduce((sum, i) => sum + i.monto, 0),
    totalEgresos: egresos.reduce((sum, e) => sum + e.monto, 0),
    cantidadIngresos: ingresos.length,
    cantidadEgresos: egresos.length,
    promedioIngresos: ingresos.length > 0 ? ingresos.reduce((sum, i) => sum + i.monto, 0) / ingresos.length : 0,
    promedioEgresos: egresos.length > 0 ? egresos.reduce((sum, e) => sum + e.monto, 0) / egresos.length : 0
  };

  const exportarDatos = () => {
    const datos = {
      ingresos,
      egresos,
      configuracion,
      resumen: resumenIRP,
      fechaExportacion: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control-irp-servicios-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Datos exportados",
      description: "Los datos se han exportado correctamente como archivo JSON.",
    });
  };

  const renderContenido = () => {
    switch (vistaActual) {
      case 'dashboard':
        return (
          <Dashboard
            configuracion={configuracion}
            setConfiguracion={setConfiguracion}
            estadisticas={estadisticas}
            resumenIRP={resumenIRP}
          />
        );
      case 'ingresos':
        return (
          <IncomeManager
            ingresos={ingresos}
            setIngresos={setIngresos}
            ivaIngresos={ivaIngresos}
            totalIngresos={estadisticas.totalIngresos}
          />
        );
      case 'egresos':
        return (
          <ExpenseManager
            egresos={egresos}
            setEgresos={setEgresos}
            ivaEgresos={ivaEgresos}
            totalEgresos={estadisticas.totalEgresos}
          />
        );
      case 'resumen':
        return (
          <TaxSummary
            resumenIRP={resumenIRP}
            ivaIngresos={ivaIngresos}
            ivaEgresos={ivaEgresos}
            onExportData={exportarDatos}
          />
        );
      default:
        return (
          <Dashboard
            configuracion={configuracion}
            setConfiguracion={setConfiguracion}
            estadisticas={estadisticas}
            resumenIRP={resumenIRP}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-6 py-8 border-b border-border bg-gradient-primary">
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl font-bold mb-2">Control IRP Paraguay</h1>
            <p className="text-lg opacity-90">Sistema completo de control fiscal para prestadores de servicios personales</p>
          </div>
        </div>

        {/* Navigation */}
        <Navigation vistaActual={vistaActual} setVistaActual={setVistaActual} />

        {/* Content */}
        <div className="px-6 pb-8">
          {renderContenido()}
        </div>
      </div>
    </div>
  );
};

export default Index;