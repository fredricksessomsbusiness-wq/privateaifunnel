import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PRODUCT_AMOUNTS, PRODUCT_PRICE_IDS, type ProductType } from "@/lib/products";

interface UpsellChargeBody {
  paymentIntentId: string;
  productType: ProductType;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsellChargeBody;
    const { paymentIntentId, productType } = body;

    if (!paymentIntentId || !["upsell1", "upsell2"].includes(productType)) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const originalIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!originalIntent.customer || typeof originalIntent.customer !== "string") {
      return NextResponse.json({ error: "Original customer not found." }, { status: 400 });
    }

    const customerId = originalIntent.customer;

    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return NextResponse.json({ error: "Customer no longer exists." }, { status: 404 });
    }

    let paymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : null;

    if (!paymentMethodId) {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });
      paymentMethodId = methods.data[0]?.id ?? null;
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "No reusable payment method on file for this customer." },
        { status: 400 }
      );
    }

    const newIntent = await stripe.paymentIntents.create({
      amount: PRODUCT_AMOUNTS[productType],
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        email: originalIntent.metadata.email ?? "",
        funnel_step: productType,
        product_type: productType,
        source_payment_intent: paymentIntentId,
        price_id: PRODUCT_PRICE_IDS[productType],
      },
    });

    return NextResponse.json({ success: true, paymentIntentId: newIntent.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upsell charge failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
