import { useState, useEffect } from 'react';
import { Plus, Trash2, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatearMoneda, exportarExcel } from '@/utlis/calculations';
import { formatearNumero, desformatearNumero } from '@/lib/formatters';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { Income, IVACalculation } from '@/types';

interface IncomeManagerProps {
  ingresos: Income[];
  setIngresos: (ingresos: Income[]) => void;
  ivaIngresos: IVACalculation;
  totalIngresos: number;
}

const IncomeManager = ({ ingresos, setIngresos, ivaIngresos, totalIngresos }: IncomeManagerProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [nuevoIngreso, setNuevoIngreso] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    cliente: '',
    concepto: '',
    monto: '',
    tipo_iva: '10' as '5' | '10' | 'exenta',
    tipo: 'servicios' as 'servicios' | 'otros'
  });
  const [loading, setLoading] = useState(false);

  const agregarIngreso = async () => {
    try {
      // Validaciones
      if (!nuevoIngreso.fecha || !nuevoIngreso.cliente || !nuevoIngreso.monto) {
        alert('Por favor complete los campos obligatorios: Fecha, Cliente y Monto');
        return;
      }

      // Validar que el monto sea un número válido
      const montoSinFormato = desformatearNumero(nuevoIngreso.monto);
      const montoNumerico = parseFloat(montoSinFormato); // Cambiado a parseFloat para manejar decimales
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        alert('Por favor ingrese un monto válido mayor a 0');
        return;
      }
      
      // Validar fecha
      const fechaIngreso = new Date(nuevoIngreso.fecha);
      const fechaActual = new Date();
      if (isNaN(fechaIngreso.getTime()) || fechaIngreso > fechaActual) {
        alert('Por favor ingrese una fecha válida no posterior a hoy');
        return;
      }

      setLoading(true);

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user || userError) {
        alert('Debes iniciar sesión para agregar ingresos');
        setLoading(false);
        return;
      }
      
      const ingreso = {
        fecha: nuevoIngreso.fecha,
        cliente: nuevoIngreso.cliente,
        concepto: nuevoIngreso.concepto || '-',
        monto: montoNumerico,
        tipo_iva: nuevoIngreso.tipo_iva,
        tipo: nuevoIngreso.tipo,
        user_id: user.id,
        estado: 'activo'  // Asegurar que se crea como activo
      };

      // Agregar a Supabase
      const { data, error } = await supabase
        .from('ingresos')
        .insert([ingreso])
        .select();

      if (error) {
        console.error('Error al agregar:', error);
        alert('Error al agregar el ingreso. Por favor, intente de nuevo.');
        return;
      }

      // Actualizar estado local
      setIngresos([...ingresos, ...data]);
      
      // Limpiar el formulario
      setNuevoIngreso({
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        concepto: '',
        monto: '',
        tipo_iva: '10',
        tipo: 'servicios'
      });

      alert('Ingreso agregado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al agregar el ingreso.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Suscribirse a cambios en la tabla ingresos
    const channel = supabase
      .channel('ingresos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingresos',
          filter: 'estado=eq.activo'
        },
        (payload) => {
          console.log('Detectado cambio en ingresos:', payload);
          consultarIngresos();
        }
      )
      .subscribe();

    // Limpieza al desmontar
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const eliminarIngreso = async (id: number) => {
    console.log('Iniciando eliminación del ingreso:', id);
    
    if (!user) {
      console.error('No hay usuario autenticado');
      alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
      return;
    }

    console.log('Usuario autenticado:', user.id);

    // Mostrar confirmación antes de eliminar
    if (!confirm('¿Está seguro que desea eliminar este ingreso?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Intentando anular ingreso con ID:', id);

      // Verificar que el ingreso exista y esté activo
      const { data: checkData, error: checkError } = await supabase
        .from('ingresos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        throw new Error(`Error al verificar el ingreso: ${checkError.message}`);
      }

      if (!checkData) {
        throw new Error('No se encontró el ingreso');
      }

      if (checkData.estado !== 'activo') {
        throw new Error('El ingreso ya fue anulado');
      }

      // Realizar la anulación
      const { error: updateError } = await supabase
        .from('ingresos')
        .update({
          estado: 'anulado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Error al anular el ingreso: ${updateError.message}`);
      }

      // Actualizar el estado local directamente
      setIngresos(ingresos.filter(ingreso => ingreso.id !== id));
      alert('Ingreso anulado correctamente');

    } catch (error) {
      console.error('Error al anular ingreso:', error);
      alert(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const consultarIngresos = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user || userError) {
        alert('Debes iniciar sesión para consultar ingresos');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'activo')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al consultar ingresos:', error);
        alert('Error al consultar los ingresos. Por favor intente de nuevo.');
        return;
      }

      if (data) {
        setIngresos(data);
        alert('Datos de ingresos actualizados correctamente');
      }
    } catch (error) {
      console.error('Error al consultar ingresos:', error);
      alert('Error al consultar los ingresos. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user || userError) {
        alert('Debes iniciar sesión para guardar cambios');
        setLoading(false);
        return;
      }

      // Aquí puedes agregar lógica adicional para guardar cambios pendientes
      // Por ahora, solo refrescamos los datos
      await consultarIngresos();
      alert('Cambios guardados correctamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcelIngresos = async () => {
    setLoading(true);
    try {
      // Obtener datos actualizados de Supabase
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('estado', 'activo')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener datos:', error);
        alert('Error al exportar los datos. Por favor intente de nuevo.');
        return;
      }

      if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      const datos = data.map(i => [
        i.fecha,
        i.cliente,
        i.concepto,
        i.monto,
        i.tipo_iva === 'exenta' ? 'Exenta' : `${i.tipo_iva}%`,
        i.tipo === 'servicios' ? 'Servicios' : 'Otros',
        i.tipo_iva === 'exenta' ? 0 : i.tipo_iva === '5' ? i.monto * (5/105) : i.monto * (10/110)
      ]);

      const columnas = ['Fecha', 'Cliente', 'Concepto', 'Monto', 'Tipo IVA', 'Tipo', 'IVA Calculado'];
      exportarExcel(datos, 'ingresos', columnas);
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al exportar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 text-income mr-2" />
              Gestión de Ingresos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={consultarIngresos} disabled={loading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {loading ? 'Consultando...' : 'Consultar'}
              </Button>
              <Button variant="default" onClick={guardarCambios} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button variant="income" onClick={exportarExcelIngresos} disabled={loading}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {loading ? 'Exportando...' : 'Exportar Excel'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulario de nuevo ingreso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-muted rounded-lg">
            <Input
              type="date"
              value={nuevoIngreso.fecha}
              onChange={(e) => setNuevoIngreso({...nuevoIngreso, fecha: e.target.value})}
              placeholder="Fecha"
            />
            <Input
              type="text"
              placeholder="Cliente/Empleador"
              value={nuevoIngreso.cliente}
              onChange={(e) => setNuevoIngreso({...nuevoIngreso, cliente: e.target.value})}
            />
            <Input
              type="text"
              placeholder="Concepto"
              value={nuevoIngreso.concepto}
              onChange={(e) => setNuevoIngreso({...nuevoIngreso, concepto: e.target.value})}
            />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Monto (₲)"
              value={nuevoIngreso.monto}
              onChange={(e) => {
                const rawValue = desformatearNumero(e.target.value);
                if (rawValue === '' || /^\d+$/.test(rawValue)) {
                  const formattedValue = formatearNumero(rawValue);
                  setNuevoIngreso({...nuevoIngreso, monto: formattedValue});
                }
              }}
            />
            <Select 
              value={nuevoIngreso.tipo_iva} 
              onValueChange={(value: '5' | '10' | 'exenta') => 
                setNuevoIngreso({...nuevoIngreso, tipo_iva: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo IVA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">IVA 10%</SelectItem>
                <SelectItem value="5">IVA 5%</SelectItem>
                <SelectItem value="exenta">Exenta</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={nuevoIngreso.tipo} 
              onValueChange={(value: 'servicios' | 'otros') => 
                setNuevoIngreso({...nuevoIngreso, tipo: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ingreso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicios">Servicios Personales</SelectItem>
                <SelectItem value="otros">Otras Rentas</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="income"
              onClick={agregarIngreso}
              disabled={loading}
              className="md:col-span-3 relative"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ingreso
                </>
              )}
            </Button>
          </div>

          {/* Tabla de ingresos */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Concepto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Monto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">IVA</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingresos.map((ingreso) => (
                  <tr key={ingreso.id} className="hover:bg-muted/50 transition-smooth">
                    <td className="px-4 py-3 text-sm">{ingreso.fecha}</td>
                    <td className="px-4 py-3 text-sm font-medium">{ingreso.cliente}</td>
                    <td className="px-4 py-3 text-sm">{ingreso.concepto}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatearMoneda(ingreso.monto)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ingreso.tipo_iva === 'exenta' ? 'secondary' : 'default'}>
                        {ingreso.tipo_iva === 'exenta' ? 'Exenta' : `${ingreso.tipo_iva}%`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ingreso.tipo === 'servicios' ? 'default' : 'secondary'}>
                        {ingreso.tipo === 'servicios' ? 'Servicios' : 'Otros'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => eliminarIngreso(ingreso.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de ingresos */}
          <div className="mt-6 p-6 bg-income-light rounded-lg border border-income/20">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">Total Ingresos:</span>
              <span className="text-2xl font-bold text-income">{formatearMoneda(totalIngresos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">IVA Total:</span>
              <span className="font-medium text-income">{formatearMoneda(ivaIngresos.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IncomeManager;
