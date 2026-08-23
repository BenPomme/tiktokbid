import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/**
 * Lazy Stripe SDK singleton from STRIPE_SECRET_KEY.
 * @throws if the secret key env var is missing/empty
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}
