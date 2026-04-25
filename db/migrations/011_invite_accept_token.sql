alter table workspace_invitations
  add column if not exists accept_token text,
  add column if not exists phone        text;

alter table workspace_invitations
  drop constraint if exists workspace_invitations_accept_token_unique;

alter table workspace_invitations
  add constraint workspace_invitations_accept_token_unique unique (accept_token);

-- Backfill tokens for any existing pending invitations
update workspace_invitations
set accept_token = gen_random_uuid()::text
where accept_token is null
  and status = 'pending';
