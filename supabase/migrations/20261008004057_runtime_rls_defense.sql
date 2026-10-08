-- Internal API compatibility schema: never exposed to anonymous/client roles.
-- These policies authorize only the trusted server role. Per-user ownership
-- remains enforced by API handlers until migration to Supabase JWT identities.
do $$
declare item record;
begin
  for item in select tablename from pg_tables where schemaname='runtime' loop
    execute format('alter table runtime.%I enable row level security', item.tablename);
    execute format('alter table runtime.%I force row level security', item.tablename);
    execute format('create policy server_runtime_only on runtime.%I for all to yaviya_runtime using (true) with check (true)', item.tablename);
  end loop;
end $$;
revoke all on schema runtime from public, anon, authenticated;
revoke all on all tables in schema runtime from public, anon, authenticated;
