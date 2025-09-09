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
  // Campos para el formato nuevo
  monto_sin_iva?: number;
  monto_iva?: number;
  monto_total?: number;
  tipo_iva?: '5' | '10' | 'exenta';
  // Campos para el formato anterior
  monto_sin_iva_10?: number;
  monto_iva_10?: number;
  monto_sin_iva_5?: number;
  monto_iva_5?: number;
  monto_exenta?: number;
  categoria: 'gastos' | 'familiares';
  estado: 'activo' | 'inactivo';
  created_at?: string;
  updated_at?: string;
  user_id: string;
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
  monto5: number;
  monto10: number;
  montoExenta: number;
}

export interface Statistics {
  totalIngresos: number;
  totalEgresos: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  promedioIngresos: number;
  promedioEgresos: number;
}