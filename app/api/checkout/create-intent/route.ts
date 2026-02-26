import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { BUMP_PRODUCTS, PRODUCT_AMOUNTS, type ProductType } from "@/lib/products";
import type { UtmParams } from "@/lib/utm";

interface CreateIntentBody {
  email: string;
  bumps: ProductType[];
  utms?: UtmParams;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateIntentBody;
    const email = body.email?.trim().toLowerCase();
    const bumps = body.bumps ?? [];

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const validBumps = bumps.filter((bump): bump is (typeof BUMP_PRODUCTS)[number] => BUMP_PRODUCTS.includes(bump as (typeof BUMP_PRODUCTS)[number]));

    const amount = PRODUCT_AMOUNTS.entry + validBumps.reduce((sum, bump) => sum + PRODUCT_AMOUNTS[bump], 0);

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      existingCustomers.data[0] ??
      (await stripe.customers.create({
        email,
      }));

    const utms = body.utms ?? {};

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      metadata: {
        email,
        funnel_step: "checkout",
        product_type: "entry",
        bumps: JSON.stringify(validBumps),
        utm_source: utms.utm_source ?? "",
        utm_medium: utms.utm_medium ?? "",
        utm_campaign: utms.utm_campaign ?? "",
        utm_content: utms.utm_content ?? "",
        utm_term: utms.utm_term ?? "",
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment intent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
