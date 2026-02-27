interface Window {
  fbq?: (
    event: "track" | "init",
    eventNameOrPixelId: string,
    parameters?: Record<string, string | number | string[]>,
    options?: { eventID?: string }
  ) => void;
  __pixelQueue?: Array<{
    eventName: string;
    parameters?: Record<string, string | number | string[]>;
    options?: { eventID?: string };
  }>;
}
