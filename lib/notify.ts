import type { UtmParams } from "@/lib/utm";

interface LeadAlertInput {
  email: string;
  phone: string;
  utms?: UtmParams;
}

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function buildLeadAlertMessage({ email, phone, utms }: LeadAlertInput): string {
  const source = utms?.utm_source ?? "direct";
  const campaign = utms?.utm_campaign ?? "none";
  return `NEW FUNNEL LEAD\nEmail: ${email}\nPhone: ${phone}\nSource: ${source}\nCampaign: ${campaign}\nCall now.`;
}

export async function sendOwnerLeadSms(input: LeadAlertInput): Promise<void> {
  const accountSid = getRequired("TWILIO_ACCOUNT_SID");
  const authToken = getRequired("TWILIO_AUTH_TOKEN");
  const from = getRequired("TWILIO_FROM_NUMBER");
  const to = getRequired("OWNER_ALERT_PHONE");

  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: buildLeadAlertMessage(input),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS failed: ${errorText}`);
  }
}
