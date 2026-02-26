import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ACCESS_COLUMN_BY_PRODUCT,
  BUMP_PRODUCTS,
  PRODUCT_AMOUNTS,
  PRODUCT_LABELS,
  PRODUCT_WHOP_ROLES,
  type AccessColumns,
  type ProductType,
} from "@/lib/products";
import { addWhopRole, createWhopMembership, removeWhopRole } from "@/lib/whop";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type DbUser = {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  whop_user_id: string | null;
};

function parseProductType(value: string | undefined): ProductType | null {
  if (!value) return null;
  if (["entry", "bump1", "bump2", "bump3", "upsell1", "upsell2"].includes(value)) {
    return value as ProductType;
  }
  return null;
}

function parseBumps(value: string | undefined): (typeof BUMP_PRODUCTS)[number][] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as string[];
    return parsed.filter((item): item is (typeof BUMP_PRODUCTS)[number] =>
      BUMP_PRODUCTS.includes(item as (typeof BUMP_PRODUCTS)[number])
    );
  } catch {
    return [];
  }
}

async function upsertUser(email: string, customerId: string | null): Promise<DbUser> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        email,
        stripe_customer_id: customerId,
      },
      {
        onConflict: "email",
      }
    )
    .select("id, email, stripe_customer_id, whop_user_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to upsert user");
  }

  return data as DbUser;
}

async function unlockProducts(userId: string, products: ProductType[]): Promise<void> {
  const update: Partial<AccessColumns> = {};
  products.forEach((product) => {
    const column = ACCESS_COLUMN_BY_PRODUCT[product];
    update[column] = true;
  });

  const { error } = await supabaseAdmin.from("access").upsert(
    {
      user_id: userId,
      ...update,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function lockProduct(userId: string, product: ProductType): Promise<void> {
  const column = ACCESS_COLUMN_BY_PRODUCT[product];
  const { error } = await supabaseAdmin
    .from("access")
    .update({ [column]: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function insertPurchases(userId: string, paymentIntentId: string, products: ProductType[]): Promise<void> {
  const rows = products.map((product) => ({
    user_id: userId,
    product_type: product,
    amount: PRODUCT_AMOUNTS[product],
    stripe_payment_intent_id: `${paymentIntentId}:${product}`,
  }));

  const { error } = await supabaseAdmin.from("purchases").insert(rows);
  if (error && !error.message.includes("duplicate key")) {
    throw new Error(error.message);
  }
}

async function ensureWhopAccess(user: DbUser, products: ProductType[]): Promise<void> {
  const roles = products
    .map((product) => PRODUCT_WHOP_ROLES[product])
    .filter((role): role is string => Boolean(role));

  if (roles.length === 0) return;

  let whopUserId = user.whop_user_id;

  if (!whopUserId) {
    whopUserId = await createWhopMembership(user.email, roles);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ whop_user_id: whopUserId })
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  await Promise.all(
    roles.map(async (roleId) => {
      await addWhopRole(whopUserId!, roleId);
    })
  );
}

async function sendConfirmationEmail(email: string, products: ProductType[]): Promise<void> {
  if (!resend) return;

  const purchasedItems = products.map((product) => `<li>${PRODUCT_LABELS[product]}</li>`).join("");

  await resend.emails.send({
    from: "Private AI Automation <onboarding@resend.dev>",
    to: email,
    subject: "Your Private AI Access Is Ready",
    html: `
      <h1>Purchase Confirmed</h1>
      <p>Your access is being provisioned now.</p>
      <ul>${purchasedItems}</ul>
      <p>Login URL: <a href="${siteUrl}/thank-you">${siteUrl}/thank-you</a></p>
    `,
  });
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const email = (intent.metadata.email || intent.receipt_email || "").toLowerCase();
  if (!email) {
    throw new Error("Missing email in payment intent metadata");
  }

  const productType = parseProductType(intent.metadata.product_type);
  const products: ProductType[] =
    productType === "entry"
      ? ["entry", ...parseBumps(intent.metadata.bumps)]
      : productType
        ? [productType]
        : ["entry"];

  const customerId = typeof intent.customer === "string" ? intent.customer : null;
  const user = await upsertUser(email, customerId);

  await insertPurchases(user.id, intent.id, products);
  await unlockProducts(user.id, products);
  await ensureWhopAccess(user, products);
  await sendConfirmationEmail(email, products);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const customerId = typeof charge.customer === "string" ? charge.customer : null;
  if (!customerId) return;

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, whop_user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !userData) return;

  let product = parseProductType(charge.metadata.product_type);

  if (!product && charge.payment_intent && typeof charge.payment_intent === "string") {
    const { data: purchase } = await supabaseAdmin
      .from("purchases")
      .select("product_type")
      .ilike("stripe_payment_intent_id", `${charge.payment_intent}%`)
      .limit(1)
      .maybeSingle();

    product = parseProductType(purchase?.product_type);
  }

  if (!product) return;

  await lockProduct(userData.id as string, product);

  const roleId = PRODUCT_WHOP_ROLES[product];
  if (userData.whop_user_id && roleId) {
    await removeWhopRole(userData.whop_user_id as string, roleId);
  }
}

function handlePaymentFailed(intent: Stripe.PaymentIntent): void {
  console.error("Payment failed", {
    id: intent.id,
    customer: intent.customer,
    lastPaymentError: intent.last_payment_error?.message,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }

    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "payment_intent.payment_failed":
        handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
