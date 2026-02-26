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

export async function createWhopMembership(email: string, roles: string[]): Promise<string> {
  const productId = process.env.WHOP_PRODUCT_ID;
  if (!productId) {
    throw new Error("Missing WHOP_PRODUCT_ID");
  }

  const response = await fetch(`${WHOP_BASE_URL}/memberships`, {
    method: "POST",
    headers: getWhopHeaders(),
    body: JSON.stringify({
      product_id: productId,
      email,
      role_ids: roles,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create Whop membership: ${body}`);
  }

  const data = (await response.json()) as { user_id?: string; id?: string };
  const whopUserId = data.user_id ?? data.id;
  if (!whopUserId) {
    throw new Error("Whop membership response missing user id");
  }

  return whopUserId;
}

export async function addWhopRole(whopUserId: string, roleId: string): Promise<void> {
  const response = await fetch(`${WHOP_BASE_URL}/memberships/${whopUserId}/roles`, {
    method: "POST",
    headers: getWhopHeaders(),
    body: JSON.stringify({ role_id: roleId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to add Whop role: ${body}`);
  }
}

export async function removeWhopRole(whopUserId: string, roleId: string): Promise<void> {
  const response = await fetch(`${WHOP_BASE_URL}/memberships/${whopUserId}/roles/${roleId}`, {
    method: "DELETE",
    headers: getWhopHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to remove Whop role: ${body}`);
  }
}
