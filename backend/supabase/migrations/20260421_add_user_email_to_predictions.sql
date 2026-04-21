alter table if exists public.predictions
add column if not exists user_email text;

create index if not exists predictions_user_email_idx
on public.predictions (user_email);