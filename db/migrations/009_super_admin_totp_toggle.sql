alter table credentials
  add column if not exists totp_required boolean not null default true;

update credentials
set totp_required = false,
    updated_at = now()
where is_privileged = true
  and is_break_glass = false;
