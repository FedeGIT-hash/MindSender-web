
begin;
  alter publication supabase_realtime add table direct_messages;
  alter publication supabase_realtime add table friend_requests;
commit;
