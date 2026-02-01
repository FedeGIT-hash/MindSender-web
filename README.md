# MindSender

MindSender es una aplicación de planificación de tareas diseñada para ayudarte a recordar tus pendientes y reflexionar sobre tus dificultades.

## Características

- **Registro de Usuarios**: Nombre, Sexo, Edad, Correo.
- **Verificación**: Código OTP enviado al correo.
- **Dashboard**: Calendario interactivo.
- **Tareas**: Agrega tareas con Materia y Descripción (Animaciones GSAP).
- **Recordatorios**: Notificaciones por correo 4 horas antes de la tarea.

## Tecnologías

- Frontend: React, TypeScript, Tailwind CSS, GSAP.
- Backend/Base de Datos: Supabase (Auth & Database).
- Scripts: Node.js (Servicio de recordatorios).

## Configuración Local

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Copia `.env.example` a `.env` y completa tus credenciales de Supabase y SMTP (para correos).

    ```env
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...
    SMTP_HOST=...
    ```

3.  **Base de Datos**:
    Ejecuta el contenido de `supabase/schema.sql` en el Editor SQL de tu proyecto en Supabase.

4.  **Iniciar Frontend**:
    ```bash
    npm run dev
    ```

5.  **Probar Recordatorios (Local)**:
    ```bash
    node scripts/reminder-service.js
    ```

## Despliegue en Vercel

1.  Sube este repositorio a GitHub.
2.  Importa el proyecto en Vercel.
3.  Configura las variables de entorno en el panel de Vercel.
4.  ¡Listo!

## Recordatorios Automáticos

Para producción, puedes configurar el script de recordatorios como un Cron Job en Vercel o usar Supabase Edge Functions.
