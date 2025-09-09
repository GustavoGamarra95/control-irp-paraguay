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

  const obtenerIngresos = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user || userError) {
        console.error('Error al obtener el usuario:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'activo')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener ingresos:', error);
        alert('Error al consultar los ingresos. Por favor, intente de nuevo.');
        return;
      }

      if (data) {
        setIngresos(data);
      }
    } catch (error) {
      console.error('Error en obtenerIngresos:', error);
      alert('Ocurrió un error al obtener los ingresos.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar ingresos al montar el componente
  useEffect(() => {
    obtenerIngresos();
  }, []);

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user || userError) {
        console.error('Error al obtener el usuario:', userError);
        alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Obtener datos actualizados de Supabase
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'activo')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener datos:', error);
        alert('Error al exportar los datos. Por favor intente de nuevo.');
        return;
      }

      if (!data || data.length === 0) {
        alert('No hay datos activos para exportar');
        return;
      }

      const datos = data.map(i => [
        i.fecha,
        i.cliente,
        i.concepto,
        formatearMoneda(i.monto),
        i.tipo_iva === 'exenta' ? 'Exenta' : `${i.tipo_iva}%`,
        i.tipo === 'servicios' ? 'Servicios' : 'Otros',
        formatearMoneda(i.tipo_iva === 'exenta' ? 0 : i.tipo_iva === '5' ? i.monto * (5/105) : i.monto * (10/110))
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 text-income mr-2" />
              Gestión de Ingresos
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button className="flex-1 sm:flex-initial" variant="outline" onClick={obtenerIngresos} disabled={loading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Consultando...' : 'Consultar'}</span>
                <span className="sm:hidden">Consultar</span>
              </Button>
              <Button className="flex-1 sm:flex-initial" variant="income" onClick={agregarIngreso} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Guardando...' : 'Guardar'}</span>
                <span className="sm:hidden">Guardar</span>
              </Button>
              <Button className="flex-1 sm:flex-initial" variant="default" onClick={exportarExcelIngresos} disabled={loading}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Exportando...' : 'Exportar Excel'}</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulario de nuevo ingreso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 sm:p-6 bg-muted rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha *</label>
              <Input
                type="date"
                value={nuevoIngreso.fecha}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, fecha: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente/Empleador *</label>
              <Input
                type="text"
                placeholder="Nombre del cliente"
                value={nuevoIngreso.cliente}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, cliente: e.target.value})}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Concepto</label>
              <Input
                type="text"
                placeholder="Descripción del ingreso"
                value={nuevoIngreso.concepto}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, concepto: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto *</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="₲ 0"
                value={nuevoIngreso.monto}
                onChange={(e) => {
                  const rawValue = desformatearNumero(e.target.value);
                  if (rawValue === '' || /^\d+$/.test(rawValue)) {
                    const formattedValue = formatearNumero(rawValue);
                    setNuevoIngreso({...nuevoIngreso, monto: formattedValue});
                  }
                }}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de IVA *</label>
              <Select 
                value={nuevoIngreso.tipo_iva} 
                onValueChange={(value: '5' | '10' | 'exenta') => 
                  setNuevoIngreso({...nuevoIngreso, tipo_iva: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">IVA 10%</SelectItem>
                  <SelectItem value="5">IVA 5%</SelectItem>
                  <SelectItem value="exenta">Exenta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ingreso *</label>
              <Select 
                value={nuevoIngreso.tipo} 
                onValueChange={(value: 'servicios' | 'otros') => 
                  setNuevoIngreso({...nuevoIngreso, tipo: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicios">Servicios Personales</SelectItem>
                  <SelectItem value="otros">Otras Rentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button 
                variant="income"
                onClick={agregarIngreso}
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="hidden sm:inline">Agregando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Agregar Ingreso</span>
                    <span className="sm:hidden">Agregar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabla de ingresos */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-sm font-medium text-foreground">Fecha</th>
                  <th className="sticky left-[120px] z-10 bg-muted px-4 py-3 text-left text-sm font-medium text-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Concepto</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground whitespace-nowrap">Monto</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">IVA</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">Tipo</th>
                  <th className="sticky right-0 z-10 bg-muted px-4 py-3 text-center text-sm font-medium text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingresos.map((ingreso) => (
                  <tr key={ingreso.id} className="hover:bg-muted/50 transition-smooth">
                    <td className="sticky left-0 z-10 bg-white hover:bg-muted/50 px-4 py-3 text-sm">{ingreso.fecha}</td>
                    <td className="sticky left-[120px] z-10 bg-white hover:bg-muted/50 px-4 py-3 text-sm font-medium">{ingreso.cliente}</td>
                    <td className="px-4 py-3 text-sm">{ingreso.concepto}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right whitespace-nowrap">{formatearMoneda(ingreso.monto)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge variant={ingreso.tipo_iva === 'exenta' ? 'secondary' : 'default'}>
                        {ingreso.tipo_iva === 'exenta' ? 'Exenta' : `${ingreso.tipo_iva}%`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge variant={ingreso.tipo === 'servicios' ? 'default' : 'secondary'}>
                        {ingreso.tipo === 'servicios' ? 'Servicios' : 'Otros'}
                      </Badge>
                    </td>
                    <td className="sticky right-0 z-10 bg-white hover:bg-muted/50 px-4 py-3 text-center">
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
          <div className="mt-6 p-4 sm:p-6 bg-income-light rounded-lg border border-income/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Servicios Personales:</span>
                  <span className="font-medium">{formatearMoneda(ingresos.reduce((total, ingreso) => 
                    ingreso.tipo === 'servicios' ? total + (ingreso.monto || 0) : total, 0
                  ))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Otras Rentas:</span>
                  <span className="font-medium">{formatearMoneda(ingresos.reduce((total, ingreso) => 
                    ingreso.tipo === 'otros' ? total + (ingreso.monto || 0) : total, 0
                  ))}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IncomeManager;
