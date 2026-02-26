const WHOP_BASE_URL = "https://api.whop.com/api/v2";

function getWhopHeaders(): HeadersInit {
  if (!process.env.WHOP_API_KEY) {
    throw new Error("Missing WHOP_API_KEY");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
  };
}

export interface CreatedMembership {
  membershipId: string;
  whopUserId: string | null;
}

export async function createWhopMembership(email: string, productId: string): Promise<CreatedMembership> {
  const companyId = process.env.WHOP_COMPANY_ID;
  const response = await fetch(`${WHOP_BASE_URL}/memberships`, {
    method: "POST",
    headers: getWhopHeaders(),
    body: JSON.stringify({
      product_id: productId,
      email,
      ...(companyId ? { company_id: companyId } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to create Whop membership for product ${productId}: ${body}`
    );
  }

  const data = (await response.json()) as { id?: string; user_id?: string; user?: { id?: string } };
  if (!data.id) {
    throw new Error("Whop membership response missing membership id");
  }

  return {
    membershipId: data.id,
    whopUserId: data.user_id ?? data.user?.id ?? null,
  };
}

interface WhopMembership {
  id: string;
  product?: { id?: string };
  status?: string;
  valid?: boolean;
  user?: { id?: string; email?: string };
  email?: string;
}

async function listWhopMemberships(productId: string): Promise<WhopMembership[]> {
  const url = new URL(`${WHOP_BASE_URL}/memberships`);
  url.searchParams.set("product_ids", productId);
  url.searchParams.set("per", "50");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getWhopHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to list Whop memberships: ${body}`);
  }

  const payload = (await response.json()) as { data?: WhopMembership[] } | WhopMembership[];
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

async function terminateWhopMembership(membershipId: string): Promise<void> {
  const response = await fetch(`${WHOP_BASE_URL}/memberships/${membershipId}/terminate`, {
    method: "POST",
    headers: getWhopHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to terminate Whop membership: ${body}`);
  }
}

export async function terminateWhopMembershipByEmail(
  email: string,
  productId: string
): Promise<boolean> {
  const targetEmail = email.toLowerCase();
  const memberships = await listWhopMemberships(productId);

  const activeMembership = memberships.find((membership) => {
    const membershipEmail = (membership.user?.email ?? membership.email ?? "").toLowerCase();
    const active = membership.status ? membership.status !== "terminated" : membership.valid !== false;
    return membershipEmail === targetEmail && active;
  });

  if (!activeMembership) {
    return false;
  }

  await terminateWhopMembership(activeMembership.id);
  return true;
}
