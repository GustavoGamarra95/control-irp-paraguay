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
import type { Income, IVACalculation } from '@/types';

interface IncomeManagerProps {
  ingresos: Income[];
  setIngresos: (ingresos: Income[]) => void;
  ivaIngresos: IVACalculation;
  totalIngresos: number;
}

export function IncomeManager({ ingresos, setIngresos, ivaIngresos, totalIngresos }: IncomeManagerProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [nuevoIngreso, setNuevoIngreso] = useState({
    fecha: '',
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
      const montoNumerico = parseInt(montoSinFormato);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        alert('Por favor ingrese un monto válido mayor a 0');
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
        user_id: user.id
      };

      const { data: nuevoIngresoData, error: insertError } = await supabase
        .from('ingresos')
        .insert([ingreso])
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar:', insertError);
        alert('Error al agregar el ingreso. Por favor intente de nuevo.');
        return;
      }

      if (nuevoIngresoData) {
        // Actualizar el estado local inmediatamente
        setIngresos([nuevoIngresoData, ...ingresos]);
        
        // Limpiar el formulario
        setNuevoIngreso({
          fecha: '',
          cliente: '',
          concepto: '',
          monto: '',
          tipo_iva: '10',
          tipo: 'servicios'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al procesar su solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const obtenerIngresos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ingresos').select('*').order('fecha', { ascending: false });
    if (!error && data) {
      setIngresos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    obtenerIngresos();
    // eslint-disable-next-line
  }, []);

  const eliminarIngreso = (id: number) => {
    setIngresos(ingresos.filter(i => i.id !== id));
  };

  const exportarExcelIngresos = () => {
    const datos = ingresos.map(i => [
      i.fecha,
      i.cliente,
      i.concepto,
      i.monto,
      i.tipo_iva === 'exenta' ? 'Exenta' : `${i.tipo_iva}%`,
      i.tipo === 'servicios' ? 'Servicios' : 'Otros',
      i.tipo_iva === 'exenta' ? 0 : i.monto * (parseFloat(i.tipo_iva) / 100)
    ]);

    const columnas = ['Fecha', 'Cliente', 'Concepto', 'Monto', 'Tipo IVA', 'Tipo', 'IVA Calculado'];
    exportarExcel(datos, 'ingresos', columnas);
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
            <Button variant="income" onClick={exportarExcelIngresos}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
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