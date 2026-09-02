# Sistema de Asistencia QR Estudiantil

Prototipo web para gestionar estudiantes, docentes, aulas y asistencias mediante códigos QR. Incluye paneles para administración, docentes y apoderados, reportes en PDF/Excel y persistencia centralizada en MySQL.

## Tecnologías

- React 19, TypeScript, Vite y Tailwind CSS
- Node.js y Express
- MySQL
- QRCode, html5-qrcode, jsPDF, SheetJS y Recharts

## Ejecución local

Requisitos: Node.js y MySQL 8 o superior.

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` y configura la conexión MySQL.
3. Ejecuta `database.sql` en MySQL para crear el esquema.
4. Inicia el proyecto con `npm run dev`.
5. Abre `http://localhost:3000`.

## Comandos

- `npm run dev`: inicia frontend y servidor en desarrollo.
- `npm run lint`: verifica los tipos de TypeScript.
- `npm run build`: genera la versión de producción.
- `npm start`: ejecuta la compilación de producción.

## Cuenta inicial

El script SQL y el modo local incluyen únicamente la cuenta administradora definida para el prototipo. Cambia su contraseña antes de utilizar el sistema fuera de un entorno de demostración.

## Despliegue

El servidor utiliza la variable `PORT` asignada por el proveedor y las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` para conectarse a MySQL.

> Este proyecto es un prototipo. No debe utilizarse con datos personales reales sin reforzar la autenticación, el almacenamiento de contraseñas y la autorización de la API.
