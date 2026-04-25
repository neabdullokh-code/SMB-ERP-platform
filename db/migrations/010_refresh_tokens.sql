create table refresh_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id),
  token_hash  text not null unique,
  session_id  text not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index refresh_tokens_user_id_idx   on refresh_tokens(user_id);
create index refresh_tokens_expires_at_idx on refresh_tokens(expires_at) where revoked_at is null;
