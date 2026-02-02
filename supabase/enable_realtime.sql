-- IMPORTANTE: Ejecuta este código en el SQL Editor de Supabase para activar el chat en tiempo real

-- Habilitar Realtime para las tablas de chat y solicitudes
begin;
  -- Habilitar replicación para la tabla de mensajes
  alter publication supabase_realtime add table direct_messages;
  
  -- Habilitar replicación para la tabla de solicitudes de amistad (para notificaciones en vivo)
  alter publication supabase_realtime add table friend_requests;
commit;
