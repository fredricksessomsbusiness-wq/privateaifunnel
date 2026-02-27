function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export const pixelViewContent = (): void => {
  if (!canTrack()) return;
  window.fbq!("track", "ViewContent");
};

export const pixelInitiateCheckout = (): void => {
  if (!canTrack()) return;
  window.fbq!("track", "InitiateCheckout");
};

export const pixelLead = (): void => {
  if (!canTrack()) return;
  window.fbq!("track", "Lead");
};

export const pixelAddToCart = (productType: string, value: number): void => {
  if (!canTrack()) return;
  window.fbq!("track", "AddToCart", {
    content_name: productType,
    value,
    currency: "USD",
  });
};

export const pixelPurchase = (
  value: number,
  contentIds: string[],
  currency: string,
  eventId: string
): void => {
  if (!canTrack()) return;
  window.fbq!(
    "track",
    "Purchase",
    {
      value,
      currency,
      content_ids: contentIds,
    },
    { eventID: eventId }
  );
};

export const pixelUpsellDeclined = (step: number): void => {
  if (!canTrack()) return;
  window.fbq!("track", "CustomizeProduct", {
    step,
    action: "declined",
  });
};
