import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { UtmParams } from "@/lib/utm";
import { sendOwnerLeadPush } from "@/lib/notify";

interface CaptureLeadBody {
  externalId: string;
  firstName: string;
  email: string;
  phone: string;
  consentMarketing: boolean;
  utms?: UtmParams;
}

function normalizePhone(input: string): string {
  return input.replace(/[^+\d]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CaptureLeadBody;
    const firstName = body.firstName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = normalizePhone(body.phone ?? "");
    const externalId = body.externalId?.trim();

    if (!externalId) {
      return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
    }
    if (!firstName) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
    }

    if (!body.consentMarketing) {
      return NextResponse.json({ error: "Consent is required to continue." }, { status: 400 });
    }

    const existing = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();

    const utms = body.utms ?? {};
    if (existing.data?.id) {
      try {
        await sendOwnerLeadPush({ firstName, email, phone, utms });
      } catch (pushError) {
        console.error("Lead push alert failed for duplicate lead", pushError);
      }

      return NextResponse.json({ success: true, duplicate: true });
    }

    const { error: leadError } = await supabaseAdmin.from("leads").insert({
      external_id: externalId,
      first_name: firstName,
      email,
      phone,
      consent_marketing: true,
      utm_source: utms.utm_source ?? null,
      utm_medium: utms.utm_medium ?? null,
      utm_campaign: utms.utm_campaign ?? null,
      utm_content: utms.utm_content ?? null,
      utm_term: utms.utm_term ?? null,
    });

    if (leadError) {
      throw new Error(leadError.message);
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({ first_name: firstName, email, phone }, { onConflict: "email" });

    if (userError) {
      throw new Error(userError.message);
    }

    try {
      await sendOwnerLeadPush({ firstName, email, phone, utms });
    } catch (pushError) {
      console.error("Lead push alert failed", pushError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to capture lead.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
