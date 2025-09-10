import { Calculator, Download, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatearMoneda } from '@/utlis/calculations';
import type { IRPCalculation, IVACalculation } from '@/types';

interface TaxSummaryProps {
  resumenIRP: IRPCalculation;
  ivaIngresos: IVACalculation;
  ivaEgresos: IVACalculation;
  onExportData: () => void;
}

export function TaxSummary({ resumenIRP, ivaIngresos, ivaEgresos, onExportData }: TaxSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Resúmenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen IVA */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Resumen IVA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-income mb-3">IVA Ingresos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monto Gravada 5%:</span>
                    <span className="font-medium">{formatearMoneda(ivaIngresos.iva5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto Gravada 10%:</span>
                    <span className="font-medium">{formatearMoneda(ivaIngresos.iva10)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total:</span>
                    <span className="text-income">{formatearMoneda(ivaIngresos.total)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-expense mb-3">IVA Egresos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monto Gravada 5%:</span>
                    <span className="font-medium">{formatearMoneda(ivaEgresos.iva5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto Gravada 10%:</span>
                    <span className="font-medium">{formatearMoneda(ivaEgresos.iva10)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total:</span>
                    <span className="text-expense">{formatearMoneda(ivaEgresos.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-tax-light rounded-lg border border-tax/20">
                <div className="flex justify-between font-bold text-lg">
                  <span>IVA a Pagar:</span>
                  <span className="text-tax">{formatearMoneda(resumenIRP.ivaAPagar)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen IRP */}
        <Card className="shadow-medium border-tax/20">
          <CardHeader>
            <CardTitle className="flex items-center text-tax">
              <Calculator className="h-5 w-5 mr-2" />
              Cálculo IRP - Servicios Personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Ingresos por Servicios:</span>
                <span className="font-medium">{formatearMoneda(resumenIRP.ingresosServicios)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Egresos Deducibles:</span>
                <span className="font-medium">{formatearMoneda(resumenIRP.egresosDeducibles)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Familiares a Cargo:</span>
                <span className="font-medium">{formatearMoneda(resumenIRP.deduccionFamiliares)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Gastos Personales:</span>
                <span className="font-medium">{formatearMoneda(resumenIRP.deduccionGastosPersonales)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-medium text-base">
                <span>Base Imponible:</span>
                <span className="text-tax">{formatearMoneda(resumenIRP.baseImponible)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tasa Aplicada:</span>
                <span>{resumenIRP.tasaAplicada}</span>
              </div>
              <div className="p-4 bg-tax-light rounded-lg border border-tax/20">
                <div className="flex justify-between font-bold text-lg">
                  <span>IRP a Pagar:</span>
                  <span className="text-tax">{formatearMoneda(resumenIRP.irpAPagar)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total a Pagar */}
      <Card className="shadow-strong bg-gradient-tax text-tax-foreground border-0">
        <CardHeader>
          <CardTitle className="text-xl text-center">Resumen Final - Total a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">{formatearMoneda(resumenIRP.ivaAPagar)}</p>
              <p className="text-sm opacity-90 mt-2">IVA</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatearMoneda(resumenIRP.irpAPagar)}</p>
              <p className="text-sm opacity-90 mt-2">IRP</p>
            </div>
            <div className="md:border-l border-tax-foreground/20">
              <p className="text-4xl font-bold">{formatearMoneda(resumenIRP.ivaAPagar + resumenIRP.irpAPagar)}</p>
              <p className="font-medium opacity-95 mt-2">Total a Pagar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información importante */}
      <Alert className="bg-primary-light/10 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          <h3 className="font-semibold text-primary mb-2">Información Importante - IRP Servicios Personales</h3>
          <div className="text-sm space-y-1">
            <p>• <strong>Obligación de inscripción:</strong> Ingresos anuales &gt; G. 80.000.000</p>
            <p>• <strong>Tasas progresivas:</strong> 8% hasta G. 24MM, 9% de G. 24MM a G. 36MM, 10% más de G. 36MM</p>
            <p>• <strong>Deducciones:</strong> G. 12.000.000 por familiar a cargo + gastos personales hasta G. 15.000.000</p>
            <p>• <strong>Vencimiento IRP:</strong> Marzo del año siguiente</p>
            <p>• <strong>Vencimiento IVA:</strong> Mensual, hasta el día 15 del mes siguiente</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Botón de exportar */}
      <div className="flex justify-end">
        <Button variant="default" size="lg" onClick={onExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Datos Completos (JSON)
        </Button>
      </div>
    </div>
  );
}