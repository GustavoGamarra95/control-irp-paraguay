

export const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0
  }).format(valor);
};

export const calcularIva = (items) => {
  // Para IVA 5%, el monto de IVA es: monto * 5/105
  const iva5 = items
    .filter(i => i.tipo_iva === '5')
    .reduce((sum, i) => sum + (i.monto * 5/105), 0);

  // Para IVA 10%, el monto de IVA es: monto * 10/110
  const iva10 = items
    .filter(i => i.tipo_iva === '10')
    .reduce((sum, i) => sum + (i.monto * 10/110), 0);

  // Montos exentos
  const exentas = items
    .filter(i => i.tipo_iva === 'exenta')
    .reduce((sum, i) => sum + i.monto, 0);

  return { 
    iva5: Math.round(iva5), 
    iva10: Math.round(iva10), 
    exentas, 
    total: Math.round(iva5 + iva10) 
  };
};

export const calcularIRP = (ingresos, egresos, configuracion) => {
  const ivaIngresos = calcularIva(ingresos);
  const ivaEgresos = calcularIva(egresos);
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);
  
  // Ingresos de servicios personales (sin IVA)
  const ingresosServicios = ingresos
    .filter(i => i.tipo === 'servicios')
    .reduce((sum, i) => {
      // Descontar el IVA solo si no es exenta
      if (i.tipo_iva === 'exenta') return sum + i.monto;
      const iva = i.tipo_iva === '10' ? i.monto / 1.1 : i.monto / 1.05;
      return sum + iva;
    }, 0);

  // Egresos deducibles para servicios personales
  const egresosDeducibles = egresos
    .filter(e => e.categoria === 'gastos')
    .reduce((sum, e) => {
      // Descontar el IVA solo si no es exenta
      if (e.tipo_iva === 'exenta') return sum + e.monto;
      const iva = e.tipo_iva === '10' ? e.monto / 1.1 : e.monto / 1.05;
      return sum + iva;
    }, 0);

  // Deducciones por familiares a cargo (G. 12.000.000 por familiar)
  const deduccionFamiliares = configuracion.familiaresACargo * 12000000;

  // Gastos personales deducibles (hasta G. 15.000.000)
  const deduccionGastosPersonales = Math.min(configuracion.gastosPersonales, 15000000);

  // Base imponible
  const baseImponible = Math.max(0, ingresosServicios - egresosDeducibles - deduccionFamiliares - deduccionGastosPersonales);

  // Cálculo de IRP según escala progresiva para servicios personales
  let irpAPagar = 0;
  if (baseImponible > 36000000) {
    // Más de G. 36.000.000 = 10%
    irpAPagar = baseImponible * 0.10;
  } else if (baseImponible > 24000000) {
    // Entre G. 24.000.000 y G. 36.000.000 = 9%
    irpAPagar = baseImponible * 0.09;
  } else if (baseImponible > 0) {
    // Hasta G. 24.000.000 = 8%
    irpAPagar = baseImponible * 0.08;
  }

  // IVA a pagar
  const ivaAPagar = Math.max(0, ivaIngresos.total - ivaEgresos.total);

  // Verificar si debe inscribirse (más de G. 80.000.000 anuales)
  const debeInscribirse = ingresosServicios > 80000000;

  return {
    totalIngresos,
    totalEgresos,
    ingresosServicios,
    egresosDeducibles,
    deduccionFamiliares,
    deduccionGastosPersonales,
    baseImponible,
    irpAPagar,
    ivaAPagar,
    debeInscribirse,
    tasaAplicada: baseImponible > 36000000 ? '10%' : baseImponible > 24000000 ? '9%' : '8%'
  };
};

export const exportarExcel = (datos, nombreArchivo, columnas) => {
  const csvContent = [
    columnas,
    ...datos
  ];
  
  const csvString = csvContent.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  URL.revokeObjectURL(url);
};