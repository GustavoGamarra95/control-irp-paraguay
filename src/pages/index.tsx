import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { IncomeManager } from '@/components/IncomeManager';
import { ExpenseManager } from '@/components/ExpenseManagerProps';
import { TaxSummary } from '@/components/TaxSummary';
import { calcularIva, calcularIRP } from '@/utlis/calculations';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { Income, Expense, Configuration, Statistics } from '@/types';
import UserMenu from './UserMenu.tsx';

const Index = () => {
  // State declarations (removed duplicates)
  const [ingresos, setIngresos] = useState<Income[]>([]);
  const [egresos, setEgresos] = useState<Expense[]>([]);
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [configuracion, setConfiguracion] = useState<Configuration>({
    tipoContribuyente: 'servicios',
    familiaresACargo: 0,
    gastosPersonales: 0,
  });
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const ingresosGuardados = JSON.parse(localStorage.getItem('irp-ingresos') || '[]');
    const egresosGuardados = JSON.parse(localStorage.getItem('irp-egresos') || '[]');
    const configGuardada = JSON.parse(
      localStorage.getItem('irp-configuracion') ||
        '{"tipoContribuyente":"servicios","familiaresACargo":0,"gastosPersonales":0}'
    );
    setIngresos(ingresosGuardados);
    setEgresos(egresosGuardados);
    setConfiguracion(configGuardada);
  }, []);

  // ...otras funciones auxiliares y lógica (guardarDatosEnSupabase, leerDatosDeSupabase, exportarDatos, renderContenido)...

  // Calcula valores derivados
  const ivaIngresos = calcularIva(ingresos);
  const ivaEgresos = calcularIva(egresos);
  const resumenIRP = calcularIRP(ingresos, egresos, configuracion);
  const estadisticas: Statistics = {
    totalIngresos: ingresos.reduce((sum, i) => sum + i.monto, 0),
    totalEgresos: egresos.reduce((sum, e) => sum + e.monto, 0),
    cantidadIngresos: ingresos.length,
    cantidadEgresos: egresos.length,
    promedioIngresos: ingresos.length > 0 ? ingresos.reduce((sum, i) => sum + i.monto, 0) / ingresos.length : 0,
    promedioEgresos: egresos.length > 0 ? egresos.reduce((sum, e) => sum + e.monto, 0) / egresos.length : 0,
  };

  const guardarDatosEnSupabase = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para guardar tus datos.' });
      return;
    }
    const { error } = await supabase.from('irp_data').insert({
      user_id: user.id,
      ingresos: JSON.stringify(ingresos),
      egresos: JSON.stringify(egresos),
      configuracion: JSON.stringify(configuracion),
      resumen: JSON.stringify(resumenIRP),
      fecha: new Date().toISOString(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message });
    } else {
      toast({ title: 'Datos guardados', description: 'Tus datos fiscales se guardaron en la nube.' });
    }
  };

  const leerDatosDeSupabase = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para recuperar tus datos.' });
      return;
    }
    const { data, error } = await supabase
      .from('irp_data')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message });
    } else if (data && data.length > 0) {
      setIngresos(JSON.parse(data[0].ingresos));
      setEgresos(JSON.parse(data[0].egresos));
      setConfiguracion(JSON.parse(data[0].configuracion));
      toast({ title: 'Datos recuperados', description: 'Tus datos fiscales se han restaurado.' });
    } else {
      toast({ title: 'Sin datos', description: 'No se encontraron datos guardados en la nube.' });
    }
  };

  const exportarDatos = () => {
    const datos = {
      ingresos,
      egresos,
      configuracion,
      resumen: resumenIRP,
      fechaExportacion: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control-irp-servicios-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Datos exportados',
      description: 'Los datos se han exportado correctamente como archivo JSON.',
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
        <div className="px-6 py-8 border-b border-border bg-gradient-primary flex items-center justify-between">
          <div className="text-center text-primary-foreground flex-1">
            <h1 className="text-4xl font-bold mb-2">Control IRP Paraguay</h1>
          </div>
          {/* Avatar y menú usuario */}
          <UserMenu />
        </div>
        {/* Navigation */}
        <Navigation vistaActual={vistaActual} setVistaActual={setVistaActual} />
        {/* Content */}
        <div className="px-6 pb-8">
          <div className="flex gap-4 mb-4">
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={guardarDatosEnSupabase}
            >
              Guardar en la nube
            </button>
            <button
              className="px-4 py-2 bg-secondary text-white rounded"
              onClick={leerDatosDeSupabase}
            >
              Recuperar de la nube
            </button>
          </div>
          {renderContenido()}
        </div>
      </div>
    </div>
  );
};

export default Index;