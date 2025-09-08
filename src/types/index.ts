export interface Income {
  id: number;
  fecha: string;
  cliente: string;
  concepto: string;
  monto: number;
  tipo_iva: '5' | '10' | 'exenta';
  tipo: 'servicios' | 'otros';
}

export interface Expense {
  id: number;
  fecha: string;
  proveedor: string;
  concepto: string;
  monto: number;
  tipoIva: '5' | '10' | 'exenta';
  categoria: 'gastos' | 'familiares';
}

export interface Configuration {
  tipoContribuyente: 'servicios' | 'mixto';
  familiaresACargo: number;
  gastosPersonales: number;
}

export interface IRPCalculation {
  totalIngresos: number;
  totalEgresos: number;
  ingresosServicios: number;
  egresosDeducibles: number;
  deduccionFamiliares: number;
  deduccionGastosPersonales: number;
  baseImponible: number;
  irpAPagar: number;
  ivaAPagar: number;
  debeInscribirse: boolean;
  tasaAplicada: string;
}

export interface IVACalculation {
  iva5: number;
  iva10: number;
  exentas: number;
  total: number;
}

export interface Statistics {
  totalIngresos: number;
  totalEgresos: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  promedioIngresos: number;
  promedioEgresos: number;
}