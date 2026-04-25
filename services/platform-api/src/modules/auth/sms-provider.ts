import { Buffer } from "node:buffer";
import { loadEnv } from "@sqb/config";

const env = loadEnv();

type SmsProviderStatus =
  | { ready: true; providerName: "log_sms" | "twilio_sms" }
  | { ready: false; reason: string };

function truncate(value: string, maxLength = 220) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export function getSmsProviderStatus(): SmsProviderStatus {
  switch (env.OTP_SMS_PROVIDER) {
    case "disabled":
      return {
        ready: false,
        reason: "SMS OTP delivery is disabled. Configure OTP_SMS_PROVIDER before enabling SMS login."
      };
    case "log":
      if (env.NODE_ENV === "production") {
        return {
          ready: false,
          reason: "OTP_SMS_PROVIDER=log is only allowed outside production. Use a real SMS provider for staging or production."
        };
      }

      return { ready: true, providerName: "log_sms" };
    case "twilio":
      if (!env.OTP_SMS_FROM || !env.OTP_SMS_TWILIO_ACCOUNT_SID || !env.OTP_SMS_TWILIO_AUTH_TOKEN) {
        return {
          ready: false,
          reason: "Twilio SMS delivery requires OTP_SMS_FROM, OTP_SMS_TWILIO_ACCOUNT_SID, and OTP_SMS_TWILIO_AUTH_TOKEN."
        };
      }

      return { ready: true, providerName: "twilio_sms" };
  }
}

export async function sendOtpCodeViaSms(destination: string, code: string) {
  const provider = getSmsProviderStatus();
  if (!provider.ready) {
    throw new Error(provider.reason);
  }

  const message = `Your ${env.OTP_ISSUER} verification code is ${code}. It expires in ${Math.ceil(env.OTP_TTL_SECONDS / 60)} minutes.`;

  if (provider.providerName === "log_sms") {
    console.info(`[otp][log_sms] destination=${destination} code=${code}`);
    return { providerName: provider.providerName };
  }

  const credentials = Buffer.from(`${env.OTP_SMS_TWILIO_ACCOUNT_SID}:${env.OTP_SMS_TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.OTP_SMS_TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        To: destination,
        From: env.OTP_SMS_FROM ?? "",
        Body: message
      })
    }
  );

  if (!response.ok) {
    const body = truncate(await response.text());
    throw new Error(`Twilio SMS delivery failed with status ${response.status}: ${body}`);
  }

  return { providerName: provider.providerName };
}
