# Control IRP Paraguay

Sistema web para el control fiscal de prestadores de servicios personales en Paraguay. Permite gestionar ingresos, egresos, cálculos de IRP, autenticación de usuarios y almacenamiento seguro en la nube con Supabase.

## Características
- Registro y login de usuarios con validación por email
- Recuperación y cambio de contraseña
- Gestión de ingresos y egresos
- Cálculo automático de IRP e IVA
- Exportación y respaldo de datos en Supabase
- Interfaz moderna y responsiva

## Instalación
1. Clona el repositorio:
	```sh
	git clone https://github.com/GustavoGamarra95/control-irp-paraguay.git
	cd control-irp-paraguay
	```
2. Instala dependencias:
	```sh
	npm install
	```
3. Configura las variables de entorno:
	- Crea un archivo `.env` en la raíz **(no lo subas al repositorio público)**
	- Ejemplo:
	  ```env
	  VITE_SUPABASE_URL=tu_url_supabase
	  VITE_SUPABASE_KEY=tu_api_key
	  ```

## Scripts disponibles
- `npm run dev` — Ejecuta la app en modo desarrollo
- `npm run build` — Compila la app para producción
- `npm test` — Ejecuta los tests

## Despliegue en Vercel
1. Sube tu proyecto a GitHub
2. Conecta el repo en [Vercel](https://vercel.com/)
3. Configura las variables de entorno en Vercel (no subas `.env` público)
4. Actualiza la URL de tu app en Supabase (Authentication > URL Configuration)

## Seguridad
**¡Importante!** Nunca subas tu archivo `.env` ni claves privadas al repositorio público. Si lo hiciste, elimina el archivo del repo y genera nuevas claves en Supabase.

## Licencia
MIT

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
