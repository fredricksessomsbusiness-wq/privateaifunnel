import type { UtmParams } from "@/lib/utm";

interface LeadAlertInput {
  firstName: string;
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

function buildLeadAlertMessage({ firstName, email, phone, utms }: LeadAlertInput): string {
  const source = utms?.utm_source ?? "direct";
  const campaign = utms?.utm_campaign ?? "none";
  return `NEW FUNNEL LEAD\nName: ${firstName}\nPhone: ${phone}\nEmail: ${email}\nSource: ${source}\nCampaign: ${campaign}\nCall now.`;
}

export async function sendOwnerLeadPush(input: LeadAlertInput): Promise<void> {
  const token = getRequired("PUSHOVER_APP_TOKEN");
  const user = getRequired("PUSHOVER_USER_KEY");

  const body = new URLSearchParams({
    token,
    user,
    title: "New Funnel Lead",
    message: buildLeadAlertMessage(input),
    priority: "1",
    sound: "siren",
  });

  const response = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pushover push failed: ${errorText}`);
  }
}
