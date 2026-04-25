update otp_methods
set provider_name = 'platform_sms',
    updated_at = now()
where provider_name = 'demo_sms';

alter table otp_challenges
  alter column provider_name set default 'platform_sms';
