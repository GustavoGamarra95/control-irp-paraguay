import { Info, AlertTriangle, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatCard } from '@/components/StatCard';
import { formatearMoneda } from '@/utlis/calculations';
import type { Configuration, Statistics, IRPCalculation } from '@/types';

interface DashboardProps {
  configuracion: Configuration;
  setConfiguracion: (config: Configuration) => void;
  estadisticas: Statistics;
  resumenIRP: IRPCalculation;
}

export function Dashboard({ configuracion, setConfiguracion, estadisticas, resumenIRP }: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 text-primary mr-2" />
            Configuración del Contribuyente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="familiares" className="text-sm font-medium">Familiares a Cargo</Label>
              <Input
                id="familiares"
                type="number"
                value={configuracion.familiaresACargo}
                onChange={(e) => setConfiguracion({
                  ...configuracion, 
                  familiaresACargo: parseInt(e.target.value) || 0
                })}
                placeholder="0"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">G. 12.000.000 por familiar</p>
            </div>
            <div>
              <Label htmlFor="gastos" className="text-sm font-medium">Gastos Personales Anuales</Label>
              <Input
                id="gastos"
                type="number"
                value={configuracion.gastosPersonales}
                onChange={(e) => setConfiguracion({
                  ...configuracion, 
                  gastosPersonales: parseInt(e.target.value) || 0
                })}
                placeholder="0"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Máximo G. 15.000.000</p>
            </div>
            <div>
              <Label htmlFor="tipo" className="text-sm font-medium">Tipo de Contribuyente</Label>
              <Select 
                value={configuracion.tipoContribuyente} 
                onValueChange={(value: 'servicios' | 'mixto') => 
                  setConfiguracion({...configuracion, tipoContribuyente: value})
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicios">Solo Servicios Personales</SelectItem>
                  <SelectItem value="mixto">Servicios + Otras Rentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de inscripción */}
      {resumenIRP.debeInscribirse && (
        <Alert className="border-warning bg-warning-light">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Obligación de Inscripción:</strong> Sus ingresos superan los G. 80.000.000 anuales. Debe inscribirse en el IRP-RSP.
          </AlertDescription>
        </Alert>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Ingresos"
          value={formatearMoneda(estadisticas.totalIngresos)}
          subtitle={`${estadisticas.cantidadIngresos} registros`}
          icon={TrendingUp}
          variant="income"
          gradient
        />
        <StatCard
          title="Total Egresos"
          value={formatearMoneda(estadisticas.totalEgresos)}
          subtitle={`${estadisticas.cantidadEgresos} registros`}
          icon={TrendingDown}
          variant="expense"
          gradient
        />
        <StatCard
          title="IRP a Pagar"
          value={formatearMoneda(resumenIRP.irpAPagar)}
          subtitle={`Tasa ${resumenIRP.tasaAplicada}`}
          icon={Calculator}
          variant="tax"
          gradient
        />
        <StatCard
          title="IVA a Pagar"
          value={formatearMoneda(resumenIRP.ivaAPagar)}
          subtitle="Neto de débitos/créditos"
          icon={Calculator}
          variant="tax"
          gradient
        />
      </div>

      {/* Gráficos simples con barras CSS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Ingresos</span>
                  <span className="text-income font-bold">{formatearMoneda(estadisticas.totalIngresos)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-income h-3 rounded-full transition-smooth" 
                    style={{
                      width: `${Math.min(100, (estadisticas.totalIngresos / Math.max(estadisticas.totalIngresos, estadisticas.totalEgresos)) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Egresos</span>
                  <span className="text-expense font-bold">{formatearMoneda(estadisticas.totalEgresos)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-expense h-3 rounded-full transition-smooth" 
                    style={{
                      width: `${Math.min(100, (estadisticas.totalEgresos / Math.max(estadisticas.totalIngresos, estadisticas.totalEgresos)) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Resumen Base Imponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-income font-medium">Ingresos por Servicios:</span>
                <span className="font-bold">{formatearMoneda(resumenIRP.ingresosServicios)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-expense font-medium">(-) Egresos Deducibles:</span>
                <span className="font-bold">{formatearMoneda(resumenIRP.egresosDeducibles)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-expense font-medium">(-) Deducciones:</span>
                <span className="font-bold">{formatearMoneda(resumenIRP.deduccionFamiliares + resumenIRP.deduccionGastosPersonales)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold text-lg">
                <span>Base Imponible:</span>
                <span className="text-primary">{formatearMoneda(resumenIRP.baseImponible)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}