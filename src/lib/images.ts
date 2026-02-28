const FALLBACKS = {
  card: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  hero: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80",
};

const ALLOWED_HOSTS = new Set(["images.unsplash.com"]);

export function safeEventImage(url: string | null | undefined, kind: keyof typeof FALLBACKS = "card") {
  if (!url) return FALLBACKS[kind];
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.has(parsed.hostname)) return FALLBACKS[kind];
    return parsed.toString();
  } catch {
    return FALLBACKS[kind];
  }
}
