import { useState, useEffect } from 'react';
import { Plus, FileSpreadsheet, TrendingDown, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatearMoneda, exportarExcel } from '@/utlis/calculations';
import { formatearNumero } from '@/lib/formatters';
import { supabase } from '@/lib/supabaseClient';
import type { Expense, IVACalculation } from '@/types';

interface ExpenseManagerProps {
  egresos: Expense[];
  setEgresos: (egresos: Expense[]) => void;
  ivaEgresos: IVACalculation;
  totalEgresos: number;
}

export function ExpenseManager({ egresos, setEgresos, ivaEgresos, totalEgresos }: ExpenseManagerProps) {
  const [nuevoEgreso, setNuevoEgreso] = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    concepto: '',
    monto_total: '0',
    monto_sin_iva_10: '0',
    monto_sin_iva_5: '0',
    monto_exenta: '0',
    categoria: 'gastos' as 'gastos' | 'familiares',
    tipo_iva: 'exenta', // Valor inicial para el tipo de IVA
    monto_iva_10: '0', // Valor inicial para el IVA 10%
    monto_sin_iva: '0', // Valor inicial para el monto sin IVA
    monto_iva: '0', // Valor inicial para el monto de IVA
  });
  const [loading, setLoading] = useState(false);

  const agregarEgreso = async () => {
    if (!nuevoEgreso.fecha || !nuevoEgreso.proveedor) {
      alert('Por favor complete los campos obligatorios: Fecha y Proveedor');
      return;
    }

    // Convertir los valores a números divididos por 1000 para ajustarse a la precisión de la base de datos
    const montoTotal = parseFloat(nuevoEgreso.monto_total) || 0;
    if (montoTotal <= 0) {
      alert('Por favor ingrese un valor total válido mayor a 0');
      return;
    }

    const montoExenta = parseFloat(nuevoEgreso.monto_exenta) || 0;
    const montoSinIva5 = parseFloat(nuevoEgreso.monto_sin_iva_5) || 0;
    const montoSinIva10 = parseFloat(nuevoEgreso.monto_sin_iva_10) || 0;

    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      alert('Debes iniciar sesión para agregar egresos');
      setLoading(false);
      return;
    }

    // Eliminar cálculos automáticos y usar los valores ingresados directamente
    const egreso = {
      ...nuevoEgreso,
      user_id: user.id,
      tipo_iva: nuevoEgreso.tipo_iva, // Usar el tipo de IVA ingresado
      monto_sin_iva_5: parseFloat(nuevoEgreso.monto_sin_iva_5), // Reflejar valores de 5%
      monto_sin_iva_10: parseFloat(nuevoEgreso.monto_sin_iva_10), // Reflejar valores de 10%
      monto_iva_10: parseFloat(nuevoEgreso.monto_iva_10), // Usar el valor ingresado directamente
      monto_total: parseFloat(nuevoEgreso.monto_total),
      valor_total: parseFloat(nuevoEgreso.monto_total),
      monto_sin_iva: parseFloat(nuevoEgreso.monto_sin_iva), // Usar el valor ingresado directamente para monto_sin_iva
      monto_iva: parseFloat(nuevoEgreso.monto_iva), // Usar el valor ingresado directamente para monto_iva
    };

    try {
      const { data: nuevoEgresoData, error: insertError } = await supabase
        .from('egresos')
        .insert([egreso])
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar:', insertError);
        alert('Error al agregar el egreso. Por favor intente de nuevo.');
        return;
      }

      if (nuevoEgresoData) {
        setEgresos([nuevoEgresoData, ...egresos]);

        setNuevoEgreso({
          fecha: new Date().toISOString().split('T')[0],
          proveedor: '',
          concepto: '',
          monto_total: '0',
          monto_sin_iva_10: '0',
          monto_sin_iva_5: '0',
          monto_exenta: '0',
          categoria: 'gastos',
          tipo_iva: 'exenta',
          monto_iva_10: '0', // Reiniciar a valor por defecto
          monto_sin_iva: '0', // Reiniciar a valor por defecto
          monto_iva: '0', // Reiniciar a valor por defecto
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al procesar su solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const obtenerEgresos = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!user || userError) {
        console.error('Error al obtener el usuario:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'activo')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener egresos:', error);
        return;
      }

      if (data) {
        setEgresos(data);
      }
    } catch (error) {
      console.error('Error en obtenerEgresos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerEgresos();
  }, []);

  const eliminarEgreso = async (id: number) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Error de sesión:', sessionError);
        alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }

      if (!confirm('¿Está seguro que desea eliminar este egreso?')) {
        return;
      }

      setLoading(true);

      const { error: updateError } = await supabase
        .from('egresos')
        .update({
          estado: 'anulado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .eq('estado', 'activo');

      if (updateError) {
        console.error('Error al eliminar:', updateError);
        alert('Error al eliminar el egreso. ' + updateError.message);
        return;
      }

      setEgresos(egresos.filter(e => e.id !== id));
      alert('Egreso eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Ocurrió un error al eliminar el egreso.');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcelEgresos = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!user || userError) {
        console.error('Error al obtener el usuario:', userError);
        alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }

      const { data, error } = await supabase
        .from('egresos')
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

      const datos = data.map(e => [
        e.fecha,
        e.proveedor,
        e.concepto,
        formatearNumero(e.monto_exenta || 0),
        formatearNumero(e.monto_sin_iva_5 || 0),
        formatearNumero(e.monto_sin_iva_10 || 0),
        formatearNumero((e.monto_total || 0) ||
          ((e.monto_sin_iva_10 || 0) + (e.monto_sin_iva_5 || 0) +
            (e.monto_exenta || 0))),
        e.tipo_iva === 'exenta' ? 'Exenta' : `${e.tipo_iva}%`,
        e.categoria === 'gastos' ? 'Negocio' : 'Familiar'
      ]);

      const columnas = [
        'Fecha',
        'Proveedor',
        'Valor Total',
        'Concepto',
        'Monto Exenta',
        'Monto Gravada 5%',
        'Monto Gravada 10%',
        'Categoría'
      ];

      exportarExcel(datos, 'egresos', columnas);
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
              <TrendingDown className="h-6 w-6 text-expense mr-2" />
              Gestión de Egresos
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button className="flex-1 sm:flex-initial" variant="outline" onClick={obtenerEgresos} disabled={loading}>
                <TrendingDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Consultando...' : 'Consultar'}</span>
                <span className="sm:hidden">Consultar</span>
              </Button>
              <Button className="flex-1 sm:flex-initial" variant="expense" onClick={agregarEgreso} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Guardando...' : 'Guardar'}</span>
                <span className="sm:hidden">Guardar</span>
              </Button>
              <Button className="flex-1 sm:flex-initial" variant="default" onClick={exportarExcelEgresos} disabled={loading}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{loading ? 'Exportando...' : 'Exportar Excel'}</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulario de nuevo egreso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 sm:p-6 bg-muted rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={nuevoEgreso.fecha}
                onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor *</label>
              <Input
                type="text"
                placeholder="Nombre del proveedor"
                value={nuevoEgreso.proveedor}
                onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, proveedor: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Concepto</label>
              <Input
                type="text"
                placeholder="Descripción del gasto"
                value={nuevoEgreso.concepto}
                onChange={(e) => setNuevoEgreso({ ...nuevoEgreso, concepto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto *</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="₲ 0"
                value={formatearMoneda(parseFloat(nuevoEgreso.monto_total) || 0)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setNuevoEgreso({ ...nuevoEgreso, monto_total: value });
                }}
                className="text-right font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Gravada 5%</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="₲ 0"
                value={formatearMoneda(parseFloat(nuevoEgreso.monto_sin_iva_5) || 0)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setNuevoEgreso({ ...nuevoEgreso, monto_sin_iva_5: value });
                }}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Gravada 10%</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="₲ 0"
                value={formatearMoneda(parseFloat(nuevoEgreso.monto_sin_iva_10) || 0)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setNuevoEgreso({ ...nuevoEgreso, monto_sin_iva_10: value });
                }}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Exenta</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="₲ 0"
                value={formatearMoneda(parseFloat(nuevoEgreso.monto_exenta) || 0)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setNuevoEgreso({ ...nuevoEgreso, monto_exenta: value });
                }}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select
                value={nuevoEgreso.categoria}
                onValueChange={(value: 'gastos' | 'familiares') =>
                  setNuevoEgreso({ ...nuevoEgreso, categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gastos">Gastos del Negocio</SelectItem>
                  <SelectItem value="familiares">Gastos Familiares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button
                variant="expense"
                onClick={agregarEgreso}
                className="w-full mt-6"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Egreso</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </div>
          </div>

          {/* Tabla de egresos */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-sm font-medium text-foreground">Fecha</th>
                  <th className="sticky left-[120px] z-10 bg-muted px-4 py-3 text-left text-sm font-medium text-foreground">Proveedor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Concepto</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">Valor Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">Monto Exenta</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">Monto Gravada 10%</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground whitespace-nowrap">Monto Gravada 5%</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Categoría</th>
                  <th className="sticky right-0 z-10 bg-muted px-4 py-3 text-left text-sm font-medium text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {egresos.map((egreso) => (
                  <tr key={egreso.id} className="hover:bg-muted/50 transition-smooth">
                    <td className="sticky left-0 z-10 bg-white hover:bg-muted/50 px-4 py-3 text-sm">{egreso.fecha}</td>
                    <td className="sticky left-[120px] z-10 bg-white hover:bg-muted/50 px-4 py-3 text-sm font-medium">{egreso.proveedor}</td>
                    <td className="px-4 py-3 text-sm">{egreso.concepto}</td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{formatearMoneda(egreso.monto_total || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{formatearMoneda(egreso.monto_exenta || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{formatearMoneda(egreso.monto_sin_iva_10 || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">{formatearMoneda(egreso.monto_sin_iva_5 || 0)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={egreso.categoria === 'gastos' ? 'default' : 'secondary'}>
                        {egreso.categoria === 'gastos' ? 'Negocio' : 'Familiar'}
                      </Badge>
                    </td>
                    <td className="sticky right-0 z-10 bg-white hover:bg-muted/50 px-4 py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => eliminarEgreso(egreso.id)}
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

        </CardContent>
      </Card>
    </div>
  );
}
