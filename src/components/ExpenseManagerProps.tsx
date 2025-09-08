import { useState, useEffect } from 'react';
import { Plus, Trash2, FileSpreadsheet, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatearMoneda, exportarExcel } from '@/utlis/calculations';
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
    fecha: '',
    proveedor: '',
    concepto: '',
    monto: '',
    tipoIva: '10' as '5' | '10' | 'exenta',
    categoria: 'gastos' as 'gastos' | 'familiares'
  });
  const [loading, setLoading] = useState(false);

  const agregarEgreso = () => {
    if (!nuevoEgreso.fecha || !nuevoEgreso.proveedor || !nuevoEgreso.monto) return;
    setLoading(true);
    const egreso = {
      fecha: nuevoEgreso.fecha,
      proveedor: nuevoEgreso.proveedor,
      concepto: nuevoEgreso.concepto,
      monto: parseFloat(nuevoEgreso.monto),
      tipoIva: nuevoEgreso.tipoIva,
      categoria: nuevoEgreso.categoria
    };
    supabase
      .from('egresos')
      .insert([egreso])
      .then(({ error }) => {
        if (!error) {
          obtenerEgresos();
          setNuevoEgreso({
            fecha: '',
            proveedor: '',
            concepto: '',
            monto: '',
            tipoIva: '10',
            categoria: 'gastos'
          });
        }
        setLoading(false);
      });
  };

  const obtenerEgresos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('egresos').select('*').order('fecha', { ascending: false });
    if (!error && data) {
      setEgresos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    obtenerEgresos();
    // eslint-disable-next-line
  }, []);

  const eliminarEgreso = (id: number) => {
    setEgresos(egresos.filter(e => e.id !== id));
  };

  const exportarExcelEgresos = () => {
    const datos = egresos.map(e => [
      e.fecha,
      e.proveedor,
      e.concepto,
      e.monto,
      e.tipoIva === 'exenta' ? 'Exenta' : `${e.tipoIva}%`,
      e.categoria === 'gastos' ? 'Negocio' : 'Familiar',
      e.tipoIva === 'exenta' ? 0 : e.monto * (parseFloat(e.tipoIva) / 100)
    ]);

    const columnas = ['Fecha', 'Proveedor', 'Concepto', 'Monto', 'Tipo IVA', 'Categoría', 'IVA Calculado'];
    exportarExcel(datos, 'egresos', columnas);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <TrendingDown className="h-6 w-6 text-expense mr-2" />
              Gestión de Egresos
            </CardTitle>
            <Button variant="expense" onClick={exportarExcelEgresos}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulario de nuevo egreso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-muted rounded-lg">
            <Input
              type="date"
              value={nuevoEgreso.fecha}
              onChange={(e) => setNuevoEgreso({...nuevoEgreso, fecha: e.target.value})}
              placeholder="Fecha"
            />
            <Input
              type="text"
              placeholder="Proveedor"
              value={nuevoEgreso.proveedor}
              onChange={(e) => setNuevoEgreso({...nuevoEgreso, proveedor: e.target.value})}
            />
            <Input
              type="text"
              placeholder="Concepto"
              value={nuevoEgreso.concepto}
              onChange={(e) => setNuevoEgreso({...nuevoEgreso, concepto: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Monto (₲)"
              value={nuevoEgreso.monto}
              onChange={(e) => setNuevoEgreso({...nuevoEgreso, monto: e.target.value})}
            />
            <Select 
              value={nuevoEgreso.tipoIva} 
              onValueChange={(value: '5' | '10' | 'exenta') => 
                setNuevoEgreso({...nuevoEgreso, tipoIva: value})
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
              value={nuevoEgreso.categoria} 
              onValueChange={(value: 'gastos' | 'familiares') => 
                setNuevoEgreso({...nuevoEgreso, categoria: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gastos">Gastos del Negocio</SelectItem>
                <SelectItem value="familiares">Gastos Familiares</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="expense"
              onClick={agregarEgreso}
              className="md:col-span-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Egreso
            </Button>
          </div>

          {/* Tabla de egresos */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Proveedor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Concepto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Monto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">IVA</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {egresos.map((egreso) => (
                  <tr key={egreso.id} className="hover:bg-muted/50 transition-smooth">
                    <td className="px-4 py-3 text-sm">{egreso.fecha}</td>
                    <td className="px-4 py-3 text-sm font-medium">{egreso.proveedor}</td>
                    <td className="px-4 py-3 text-sm">{egreso.concepto}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatearMoneda(egreso.monto)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={egreso.tipoIva === 'exenta' ? 'secondary' : 'default'}>
                        {egreso.tipoIva === 'exenta' ? 'Exenta' : `${egreso.tipoIva}%`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={egreso.categoria === 'gastos' ? 'default' : 'secondary'}>
                        {egreso.categoria === 'gastos' ? 'Negocio' : 'Familiar'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => eliminarEgreso(egreso.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de egresos */}
          <div className="mt-6 p-6 bg-expense-light rounded-lg border border-expense/20">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">Total Egresos:</span>
              <span className="text-2xl font-bold text-expense">{formatearMoneda(totalEgresos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">IVA Total:</span>
              <span className="font-medium text-expense">{formatearMoneda(ivaEgresos.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}