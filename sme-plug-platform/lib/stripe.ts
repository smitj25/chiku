// lib/stripe.ts — Stripe client and helpers

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn(
        "[Stripe] STRIPE_SECRET_KEY not set — billing features will use mock mode"
    );
}

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : (null as unknown as Stripe);

/** Create a Stripe Checkout session for a plugin purchase */
export async function createCheckoutSession({
    pluginName,
    priceInCents,
    tenantId,
    successUrl,
    cancelUrl,
}: {
    pluginName: string;
    priceInCents: number;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
}) {
    if (!stripe) {
        // Mock mode — return fake URL
        return {
            url: `${successUrl}?session_id=mock_${Date.now()}`,
            id: `mock_${Date.now()}`,
        };
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: { name: `SME-Plug: ${pluginName}` },
                    unit_amount: priceInCents,
                    recurring: { interval: "month" },
                },
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { tenantId },
    });

    return { url: session.url, id: session.id };
}

/** Create a Stripe billing portal session for plan management */
export async function createPortalSession(customerId: string, returnUrl: string) {
    if (!stripe) {
        return { url: returnUrl };
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return { url: session.url };
}
