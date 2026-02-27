interface PixelEvent {
  eventName: string;
  parameters?: Record<string, string | number | string[]>;
  options?: { eventID?: string };
}

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

function enqueueEvent(event: PixelEvent): void {
  if (typeof window === "undefined") return;
  if (!window.__pixelQueue) {
    window.__pixelQueue = [];
  }
  window.__pixelQueue.push(event);
}

function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | string[]>,
  options?: { eventID?: string }
): void {
  if (!canTrack()) {
    enqueueEvent({ eventName, parameters, options });
    return;
  }
  window.fbq!("track", eventName, parameters, options);
}

export const pixelViewContent = (): void => {
  trackEvent("ViewContent");
};

export const pixelInitiateCheckout = (): void => {
  trackEvent("InitiateCheckout");
};

export const pixelLead = (): void => {
  trackEvent("Lead");
};

export const pixelAddToCart = (productType: string, value: number): void => {
  trackEvent("AddToCart", {
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
  trackEvent(
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
  trackEvent("CustomizeProduct", {
    step,
    action: "declined",
  });
};
