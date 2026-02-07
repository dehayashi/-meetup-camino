import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { seedDatabase } from "./seed";
import { z } from "zod";
import { insertPilgrimProfileSchema, insertActivitySchema, insertChatMessageSchema, insertRatingSchema, insertDonationSchema } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import webpush from "web-push";

const profileBodySchema = insertPilgrimProfileSchema.omit({ userId: true });
const activityBodySchema = insertActivitySchema.omit({ creatorId: true });
const messageBodySchema = z.object({ content: z.string().min(1).max(2000) });
const ratingBodySchema = z.object({ score: z.number().int().min(1).max(5), comment: z.string().max(500).nullable().optional() });
const donationBodySchema = z.object({ amount: z.number().positive(), message: z.string().max(500).nullable().optional() });

async function checkMembership(activityId: number, userId: string): Promise<boolean> {
  const act = await storage.getActivity(activityId);
  if (!act) return false;
  if (act.creatorId === userId) return true;
  return storage.isParticipant(activityId, userId);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = profileBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid profile data", errors: parsed.error.flatten() });
      const profile = await storage.upsertProfile({ ...parsed.data, userId });
      res.json(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.post("/api/profile/photo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { photoData } = req.body;
      if (!photoData || typeof photoData !== 'string') {
        return res.status(400).json({ message: "No photo data provided" });
      }
      if (!photoData.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format" });
      }
      if (photoData.length > 2 * 1024 * 1024 * 1.37) {
        return res.status(400).json({ message: "Image too large (max 2MB)" });
      }
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found. Create a profile first." });
      }
      await storage.updateProfilePhoto(userId, photoData);
      res.json({ photoUrl: photoData });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const acts = await storage.getActivities();
      res.json(acts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/recommended", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const acts = await storage.getRecommendedActivities(userId);
      res.json(acts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommended activities" });
    }
  });

  app.get("/api/activities/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const acts = await storage.getMyActivities(userId);
      res.json(acts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch my activities" });
    }
  });

  app.get("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      const detail = await storage.getActivityDetail(id, userId);
      if (!detail) return res.status(404).json({ message: "Activity not found" });
      res.json(detail);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = activityBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid activity data", errors: parsed.error.flatten() });
      const act = await storage.createActivity({ ...parsed.data, creatorId: userId });
      res.json(act);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.post("/api/activities/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      const act = await storage.getActivity(id);
      if (!act) return res.status(404).json({ message: "Activity not found" });
      if (act.creatorId === userId) return res.status(400).json({ message: "You are the creator" });
      const alreadyJoined = await storage.isParticipant(id, userId);
      if (alreadyJoined) return res.status(400).json({ message: "Already joined" });
      const detail = await storage.getActivityDetail(id, userId);
      const spotsLeft = (act.spots || 4) - (detail?.participantCount || 1);
      if (spotsLeft <= 0) return res.status(400).json({ message: "No spots available" });
      await storage.joinActivity(id, userId);
      res.json({ message: "Joined" });
    } catch (error) {
      res.status(500).json({ message: "Failed to join" });
    }
  });

  app.post("/api/activities/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      await storage.leaveActivity(id, userId);
      res.json({ message: "Left" });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave" });
    }
  });

  app.get("/api/activities/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      const isMember = await checkMembership(id, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this activity" });
      const msgs = await storage.getMessages(id);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/activities/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityId = parseInt(req.params.id);
      if (isNaN(activityId)) return res.status(400).json({ message: "Invalid activity ID" });
      const isMember = await checkMembership(activityId, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this activity" });
      const parsed = messageBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid message data" });
      const msg = await storage.createMessage({
        activityId,
        userId,
        content: parsed.data.content,
      });

      try {
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) throw new Error("no vapid");
        const act = await storage.getActivity(activityId);
        const participants = await storage.getParticipants(activityId);
        const senderProfile = await storage.getProfile(userId);
        const senderName = senderProfile?.displayName || "Peregrino";
        const allUserIds = [act?.creatorId, ...participants.map(p => p.userId)].filter(id => id && id !== userId);

        for (const uid of allUserIds) {
          if (!uid) continue;
          const sub = await storage.getPushSubscription(uid);
          if (!sub) continue;
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: `${senderName} no ${act?.title || "atividade"}`,
                body: parsed.data.content.substring(0, 100),
              })
            );
          } catch (pushErr: any) {
            if (String(pushErr).includes("410") || String(pushErr).includes("404")) {
              await storage.deletePushSubscription(uid);
            }
          }
        }
      } catch (pushErr) {}

      res.json(msg);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/activities/:id/ratings", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      const rats = await storage.getRatings(id);
      res.json(rats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post("/api/activities/:id/ratings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityId = parseInt(req.params.id);
      if (isNaN(activityId)) return res.status(400).json({ message: "Invalid activity ID" });
      const isMember = await checkMembership(activityId, userId);
      if (!isMember) return res.status(403).json({ message: "Not a member of this activity" });
      const parsed = ratingBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid rating data" });
      const rating = await storage.createRating({
        activityId,
        userId,
        score: parsed.data.score,
        comment: parsed.data.comment || null,
      });
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  app.get("/api/stripe/publishable-key", isAuthenticated, async (_req: any, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Stripe key" });
    }
  });

  app.post("/api/donations/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = donationBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid donation data" });

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Doação - Caminho Companion',
              description: parsed.data.message || 'Apoio ao projeto Caminho Companion',
            },
            unit_amount: Math.round(parsed.data.amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/donate?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate?status=cancelled`,
        metadata: {
          userId,
          donationMessage: parsed.data.message || '',
        },
      });

      const donation = await storage.createDonation({
        userId,
        amount: parsed.data.amount,
        message: parsed.data.message || null,
        stripeSessionId: session.id,
        stripePaymentStatus: 'pending',
      });

      res.json({ url: session.url, donationId: donation.id });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.get("/api/donations/status/:sessionId", isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId || !sessionId.startsWith('cs_')) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        await storage.updateDonationStatus(sessionId, 'paid');
      }

      res.json({
        status: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
      });
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.code === 'resource_missing') {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(500).json({ message: "Failed to check donation status" });
    }
  });

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:contato@caminho-companion.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  app.get("/api/push/vapid-key", (_req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ message: "Push not configured" });
    res.json({ publicKey: key });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return res.status(503).json({ message: "Push notifications not configured" });
      }
      const userId = req.user.claims.sub;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }
      await storage.savePushSubscription({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  app.delete("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deletePushSubscription(userId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove subscription" });
    }
  });

  app.get("/api/push/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sub = await storage.getPushSubscription(userId);
      res.json({ subscribed: !!sub });
    } catch (error) {
      res.status(500).json({ message: "Failed to check push status" });
    }
  });

  app.post("/api/push/test", isAuthenticated, async (req: any, res) => {
    try {
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return res.status(503).json({ message: "Push notifications not configured" });
      }
      const userId = req.user.claims.sub;
      const sub = await storage.getPushSubscription(userId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      await webpush.sendNotification(
        pushSub,
        JSON.stringify({
          title: "Caminho Companion",
          body: "As notificações estão funcionando! Bom Caminho!",
        })
      );
      res.json({ ok: true });
    } catch (error: any) {
      const uid = req.user.claims.sub;
      if (String(error).includes("410") || String(error).includes("404")) {
        await storage.deletePushSubscription(uid);
        return res.status(410).json({ message: "Subscription expired" });
      }
      console.error("Push test error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  app.get("/api/rankings", isAuthenticated, async (_req: any, res) => {
    try {
      const rankings = await storage.getUserRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  await seedDatabase();

  return httpServer;
}
