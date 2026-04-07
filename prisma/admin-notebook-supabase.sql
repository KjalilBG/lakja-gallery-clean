create table if not exists public."AdminNotebook" (
  "ownerEmail" text primary key,
  "content" text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create or replace function public.set_admin_notebook_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists admin_notebook_set_updated_at on public."AdminNotebook";

create trigger admin_notebook_set_updated_at
before update on public."AdminNotebook"
for each row
execute function public.set_admin_notebook_updated_at();

alter table public."AdminNotebook" enable row level security;
