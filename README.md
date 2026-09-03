# Sistema de Asistencia QR Estudiantil

Monorepo para la gestión de estudiantes, docentes, aulas y asistencias mediante códigos QR. Incluye paneles para administración, docentes y apoderados, reportes PDF/Excel, comunicados segmentados, chat privado y persistencia en MySQL.

## Arquitectura

```text
apps/
├── frontend/   React 19 + TypeScript + Vite + Tailwind CSS
└── backend/    Node.js + Express + MySQL
```

La raíz utiliza **npm workspaces** para instalar, ejecutar y compilar ambas aplicaciones con un solo conjunto de comandos.

En desarrollo:

- Frontend: `http://localhost:3000`
- Backend/API: `http://localhost:3001`
- Vite redirige automáticamente las solicitudes `/api` al backend.

En producción, Express entrega los archivos compilados del frontend y la API desde el mismo dominio. Esto mantiene un único servicio compatible con Railway.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- MySQL 8 o superior

## Instalación local

1. Ejecuta `npm install` en la raíz.
2. Copia `.env.example` como `.env` y configura MySQL.
3. Ejecuta `apps/backend/database/database.sql` en MySQL.
4. Opcionalmente ejecuta `npm run seed:demo`.
5. Inicia todo el monorepo con `npm run dev`.
6. Abre `http://localhost:3000`.

## Comandos desde la raíz

- `npm run dev`: inicia frontend y backend simultáneamente.
- `npm run dev:frontend`: inicia solamente Vite.
- `npm run dev:backend`: inicia solamente Express.
- `npm run lint`: verifica TypeScript en los dos workspaces.
- `npm run build`: compila frontend y backend.
- `npm run seed:demo`: carga datos demostrativos sin duplicarlos.
- `npm start`: inicia el backend compilado y sirve el frontend de producción.
- `npm run clean`: elimina los resultados de compilación de ambos workspaces.

También puedes ejecutar un comando directamente en un workspace:

```powershell
npm run build --workspace @josdic/frontend
npm run lint --workspace @josdic/backend
```

## Variables de entorno

- `APP_URL`: dirección pública o local del frontend.
- `BACKEND_PORT`: puerto local de la API; por defecto `3001`.
- `PORT`: puerto asignado automáticamente por Railway.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: conexión MySQL.
- `VITE_API_PROXY_TARGET`: destino opcional del proxy de desarrollo.

## Cuentas de demostración

- Administrador: `admin@colegio.edu.pe` / `admin123`
- Docente: `docente.demo1@colegio.edu.pe` / `DocenteDemo123`
- Apoderada: `familia.demo1@colegio.edu.pe` / `82000001`

## Despliegue en Railway

Railway puede seguir desplegando desde la raíz:

- Build: `npm run build`
- Start: `npm start`

El backend usa `PORT` y sirve `apps/frontend/dist`, por lo que frontend y API conservan el mismo dominio.

El archivo SQL permanece dentro del repositorio privado/local y no se expone como descarga pública.

> Este proyecto es un prototipo. Antes de utilizar datos personales reales se deben reforzar la autenticación, el cifrado de contraseñas y la autorización de cada endpoint.
