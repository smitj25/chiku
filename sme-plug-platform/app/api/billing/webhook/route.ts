import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    // Stripe sends webhook events here after checkout, subscription updates, etc.
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    // TODO: Verify webhook signature with Stripe SDK
    // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // Stub: parse and log event type
    try {
        const event = JSON.parse(body);
        console.log(`[Stripe Webhook] Received event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed":
                // TODO: Activate plugin for tenant
                break;
            case "invoice.paid":
                // TODO: Record payment
                break;
            case "customer.subscription.deleted":
                // TODO: Deactivate plugin
                break;
            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
}
