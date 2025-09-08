export const formatearNumero = (value: string): string => {
  // Eliminar todos los caracteres no numéricos
  const numero = value.replace(/\D/g, '');
  
  // Si no hay número, retornar vacío
  if (!numero) return '';
  
  // Convertir a número y formatear con separadores de miles
  const numeroFormateado = Number(numero).toLocaleString('es-PY');
  
  return numeroFormateado;
};

// Función para remover el formato y obtener solo el número
export const desformatearNumero = (value: string): string => {
  return value.replace(/\D/g, '');
};
