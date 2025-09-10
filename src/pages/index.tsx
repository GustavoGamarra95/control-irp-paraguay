import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import IncomeManager from '@/components/IncomeManager';
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

  // Cargar y suscribirse a los datos de Supabase
  useEffect(() => {
    // Función para cargar los datos iniciales
    const cargarDatos = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        toast({ title: 'Error', description: 'Debes iniciar sesión para ver tus datos.' });
        return;
      }

      try {
        const [ingresosResult, egresosResult, configResult] = await Promise.all([
          supabase.from('ingresos')
            .select('*')
            .eq('user_id', user.id)
            .eq('estado', 'activo')
            .order('fecha', { ascending: false }),
          supabase.from('egresos')
            .select('*')
            .eq('user_id', user.id)
            .eq('estado', 'activo')
            .order('fecha', { ascending: false }),
          supabase.from('configuracion')
            .select('*')
            .eq('user_id', user.id)
            .eq('estado', 'activo')
            .maybeSingle()
        ]);

        if (ingresosResult.data) setIngresos(ingresosResult.data);
        if (egresosResult.data) setEgresos(egresosResult.data);
        if (configResult.data) setConfiguracion(configResult.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({ title: 'Error', description: 'Error al cargar los datos.' });
      }
    };

    // Cargar datos iniciales
    cargarDatos();

    // Suscribirse a cambios en ingresos
    const ingresosSubscription = supabase
      .channel('ingresos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ingresos'
      }, cargarDatos)
      .subscribe();

    // Suscribirse a cambios en egresos
    const egresosSubscription = supabase
      .channel('egresos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'egresos'
      }, cargarDatos)
      .subscribe();

    // Suscribirse a cambios en configuración
    const configSubscription = supabase
      .channel('config_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'configuracion'
      }, cargarDatos)
      .subscribe();

    // Limpiar suscripciones al desmontar
    return () => {
      ingresosSubscription.unsubscribe();
      egresosSubscription.unsubscribe();
      configSubscription.unsubscribe();
    };
  }, []);

  // Validar datos de ingresos y egresos antes de calcular IVA e IRP
  // Actualizar la validación para manejar ingresos sin monto_total
  const validarDatos = (items) => {
    return items.filter(item => {
      if (!item.tipo_iva || !['5', '10', 'exenta'].includes(item.tipo_iva)) {
        console.warn("Elemento con tipo_iva inválido:", item);
        return false;
      }
      if ((!item.monto_total && !item.monto) || isNaN(item.monto_total || item.monto)) {
        console.warn("Elemento con monto_total o monto inválido:", item);
        return false;
      }
      // Si monto_total no está definido, usar monto como respaldo
      if (!item.monto_total) {
        item.monto_total = item.monto;
      }
      return true;
    });
  };

  const ingresosValidados = validarDatos(ingresos);
  const egresosValidados = validarDatos(egresos);

  console.log("Ingresos validados:", ingresosValidados);
  console.log("Egresos validados:", egresosValidados);

  const ivaIngresos = calcularIva(ingresosValidados);
  console.log("Resultado de calcularIva para ingresos:", ivaIngresos);

  const ivaEgresos = calcularIva(egresosValidados);
  console.log("Resultado de calcularIva para egresos:", ivaEgresos);

  const resumenIRP = calcularIRP(ingresosValidados, egresosValidados, configuracion);
  console.log("Resumen IRP calculado:", resumenIRP);

  const estadisticas: Statistics = {
    totalIngresos: ingresos.reduce((sum, i) => sum + i.monto, 0),
    totalEgresos: egresos.reduce((sum, e) => sum + (e.monto_total || 
      ((e.monto_sin_iva || 0) + (e.monto_iva || 0)) || 
      ((e.monto_sin_iva_10 || 0) + (e.monto_iva_10 || 0) + (e.monto_sin_iva_5 || 0) + (e.monto_iva_5 || 0) + (e.monto_exenta || 0))), 0),
    cantidadIngresos: ingresos.length,
    cantidadEgresos: egresos.length,
    promedioIngresos: ingresos.length > 0 ? ingresos.reduce((sum, i) => sum + i.monto, 0) / ingresos.length : 0,
    promedioEgresos: egresos.length > 0 ? egresos.reduce((sum, e) => sum + (e.monto_total || 
      ((e.monto_sin_iva || 0) + (e.monto_iva || 0)) || 
      ((e.monto_sin_iva_10 || 0) + (e.monto_iva_10 || 0) + (e.monto_sin_iva_5 || 0) + (e.monto_iva_5 || 0) + (e.monto_exenta || 0))), 0) / egresos.length : 0,
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



  const exportarDatos = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (!user || userError) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para exportar tus datos.' });
      return;
    }

    try {
      // Obtener datos actualizados de Supabase
      const [ingresosResult, egresosResult, configResult] = await Promise.all([
        supabase.from('ingresos').select('*').order('fecha', { ascending: false }),
        supabase.from('egresos').select('*').order('fecha', { ascending: false }),
        supabase.from('configuracion').select('*').eq('user_id', user.id).single()
      ]);

      if (ingresosResult.error || egresosResult.error || configResult.error) {
        toast({ title: 'Error', description: 'Error al obtener los datos para exportar.' });
        return;
      }

      const ingresosActualizados = ingresosResult.data || [];
      const egresosActualizados = egresosResult.data || [];
      const configActualizada = configResult.data || configuracion;

      // Calcular el resumen con los datos actualizados
      const resumenActualizado = calcularIRP(ingresosActualizados, egresosActualizados, configActualizada);

      const datos = {
        ingresos: ingresosActualizados,
        egresos: egresosActualizados,
        configuracion: configActualizada,
        resumen: resumenActualizado,
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
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al exportar los datos.',
      });
    }
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
            <h1 className="text-2xl font-bold mb-2">Control IRP Paraguay</h1>
          </div>
          {/* Avatar y menú usuario */}
          <UserMenu />
        </div>
        {/* Navigation */}
        <Navigation vistaActual={vistaActual} setVistaActual={setVistaActual} />
        {/* Content */}
        <div className="px-6 pb-8">
          {/* Aquí estaba el botón de recuperar de la nube - eliminado porque ahora la sincronización es automática */}
          {renderContenido()}
        </div>
      </div>
    </div>
  );
};

export default Index;