-- Create webhook_logs table for audit trail
create table if not exists public.webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null check (status in ('success', 'failed', 'pending')),
  error_message text,
  processing_time_ms integer,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.webhook_logs enable row level security;

-- RLS Policies (admins only)
create policy "Admins can view webhook logs"
  on public.webhook_logs for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

-- Create indexes for performance
create index idx_webhook_logs_event_name on public.webhook_logs(event_name);
create index idx_webhook_logs_event_type on public.webhook_logs(event_type);
create index idx_webhook_logs_status on public.webhook_logs(status);
create index idx_webhook_logs_created_at on public.webhook_logs(created_at desc);
create index idx_webhook_logs_user_id on public.webhook_logs(user_id) where user_id is not null;

-- Create function to clean up old webhook logs (keep last 90 days)
create or replace function public.cleanup_old_webhook_logs()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.webhook_logs
  where created_at < now() - interval '90 days';
end;
$$;

-- Add comment
comment on table public.webhook_logs is 'Audit trail for all incoming webhook events from LemonSqueezy and other services';
