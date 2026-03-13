const stores = new Map();

function getStore(tier) {
  if (!stores.has(tier)) {
    stores.set(tier, new Map());
  }
  return stores.get(tier);
}

const TIERS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  mutation: { max: 30, windowMs: 60 * 1000 },
  read: { max: 120, windowMs: 60 * 1000 },
};

export function rateLimit(tier, request) {
  const config = TIERS[tier];
  if (!config) throw new Error(`Unknown rate limit tier: ${tier}`);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const store = getStore(tier);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1 };
  }

  entry.count++;
  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  return { allowed: true, remaining: config.max - entry.count };
}
