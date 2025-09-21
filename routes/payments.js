/**
 * AimHelper Pro - Payment Routes
 * Complete Stripe integration for subscription management
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get subscription status
router.get('/subscription', authMiddleware, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { subscription: true }
    });

    let subscription = null;
    if (user.stripeCustomerId && user.subscription && user.subscription.status === 'active') {
        try {
            const stripeSubscription = await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);
            subscription = {
                id: stripeSubscription.id,
                plan: user.plan,
                status: stripeSubscription.status,
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
            };
        } catch (error) {
            console.error('Error fetching Stripe subscription:', error);
        }
    }

    const features = {
        free: ['Basic training modes', 'Limited analytics', 'Public leaderboards'],
        pro: ['All training modes', 'Advanced analytics', 'Performance insights', 'Priority support'],
        team: ['Pro features', 'Team management', 'Custom branding', 'API access']
    };

    res.json({
        subscription: subscription || {
            plan: user.plan || 'free',
            status: 'inactive',
            features: features[user.plan || 'free']
        },
        features: features[user.plan || 'free']
    });
}));

// Get pricing information
router.get('/pricing', asyncHandler(async (req, res) => {
    res.json({
        plans: {
            free: {
                name: 'Free',
                price: 0,
                interval: null,
                features: [
                    'Basic training modes',
                    'Limited analytics',
                    'Public leaderboards',
                    'Community support'
                ]
            },
            pro: {
                name: 'Pro',
                price: 9.99,
                interval: 'month',
                features: [
                    'All training modes',
                    'Advanced analytics',
                    'Performance insights',
                    'Custom sensitivity profiles',
                    'Priority support'
                ]
            },
            team: {
                name: 'Team',
                price: 29.99,
                interval: 'month',
                features: [
                    'All Pro features',
                    'Team management',
                    'Custom branding',
                    'API access',
                    'Dedicated support'
                ]
            }
        },
        message: 'Payment processing will be integrated with Stripe later'
    });
}));

// Create Stripe checkout session
router.post('/checkout', authMiddleware, asyncHandler(async (req, res) => {
    const { plan } = req.body;

    if (!['pro', 'team'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user.id }
        });
        customerId = customer.id;

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId }
        });
    }

    const priceIds = {
        pro: process.env.STRIPE_PRO_PRICE_ID,
        team: process.env.STRIPE_TEAM_PRICE_ID
    };

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceIds[plan],
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/pricing`,
        metadata: {
            userId: user.id,
            plan: plan
        }
    });

    res.json({
        sessionId: session.id,
        url: session.url
    });
}));

// Stripe webhook handler - CRITICAL for subscription management
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}));

// Webhook handler functions
async function handleCheckoutCompleted(session) {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    await prisma.user.update({
        where: { id: userId },
        data: {
            plan: plan,
            planUpdatedAt: new Date()
        }
    });

    // Create or update subscription record
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await prisma.subscription.upsert({
        where: { userId: userId },
        update: {
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            plan: plan,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        },
        create: {
            userId: userId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            plan: plan,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
    });
}

async function handlePaymentSucceeded(invoice) {
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = subscription.customer;

        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId }
        });

        if (user) {
            await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {
                    status: 'active',
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                },
                create: {
                    userId: user.id,
                    stripeSubscriptionId: subscription.id,
                    status: 'active',
                    plan: user.plan,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                }
            });
        }
    }
}

async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId }
    });

    if (user) {
        await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            },
            create: {
                userId: user.id,
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                plan: user.plan,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
        });

        // Update user plan if subscription is canceled
        if (subscription.status === 'canceled') {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    plan: 'free',
                    planUpdatedAt: new Date()
                }
            });
        }
    }
}

async function handleSubscriptionCanceled(subscription) {
    const customerId = subscription.customer;
    const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId }
    });

    if (user) {
        await prisma.subscription.update({
            where: { userId: user.id },
            data: { status: 'canceled' }
        });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                plan: 'free',
                planUpdatedAt: new Date()
            }
        });
    }
}

async function handlePaymentFailed(invoice) {
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = subscription.customer;

        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId }
        });

        if (user) {
            await prisma.subscription.update({
                where: { userId: user.id },
                data: { status: 'past_due' }
            });

            // Optionally downgrade to free after multiple failures
            if (subscription.status === 'canceled') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        plan: 'free',
                        planUpdatedAt: new Date()
                    }
                });
            }
        }
    }
}

module.exports = router;