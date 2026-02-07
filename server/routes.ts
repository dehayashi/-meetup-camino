import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import { seedDatabase } from "./seed";
import { z } from "zod";
import { insertPilgrimProfileSchema, insertActivitySchema, insertChatMessageSchema, insertRatingSchema, insertDonationSchema, REPORT_REASONS } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import webpush from "web-push";
import crypto from "crypto";

const profileBodySchema = insertPilgrimProfileSchema.omit({ userId: true });
const activityBodySchema = insertActivitySchema.omit({ creatorId: true });
const messageBodySchema = z.object({ content: z.string().min(1).max(2000) });
const ratingBodySchema = z.object({ score: z.number().int().min(1).max(5), comment: z.string().max(500).nullable().optional() });
const donationBodySchema = z.object({ amount: z.number().positive(), message: z.string().max(500).nullable().optional() });
const inviteValidateSchema = z.object({ code: z.string().min(1).max(50) });
const inviteCreateSchema = z.object({ maxUses: z.number().int().min(1).max(1000).optional(), expiresAt: z.string().optional() });
const reportCreateSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(2000).optional(),
  activityId: z.number().int().optional(),
  messageId: z.number().int().optional(),
});
const reportUpdateSchema = z.object({ status: z.enum(["open", "reviewing", "closed"]), adminNotes: z.string().max(2000).optional() });
const suspendSchema = z.object({ userId: z.string().min(1), reason: z.string().min(1).max(500) });
const acceptTermsSchema = z.object({ inviteCode: z.string().min(1), termsVersion: z.string(), privacyVersion: z.string() });

async function checkMembership(activityId: number, userId: string): Promise<boolean> {
  const act = await storage.getActivity(activityId);
  if (!act) return false;
  if (act.creatorId === userId) return true;
  return storage.isParticipant(activityId, userId);
}

async function isVerifiedUser(req: any): Promise<boolean> {
  const userId = req.user?.claims?.sub;
  if (!userId) return false;
  if (await isAdminUser(req)) return true;
  const profile = await storage.getProfile(userId);
  return profile?.verificationStatus === "verified";
}

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

async function isAdminUser(req: any): Promise<boolean> {
  const userId = req.user?.claims?.sub;
  const email = req.user?.claims?.email;
  if (!userId) return false;
  if (isAdminEmail(email)) return true;
  const profile = await storage.getProfile(userId);
  return profile?.isAdmin === true;
}

function sanitizeText(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
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
      const requiresVerification = ["transport", "lodging"].includes(parsed.data.type);
      if (requiresVerification) {
        const verified = await isVerifiedUser(req);
        if (!verified) return res.status(403).json({ message: "Identity verification required for transport and lodging activities" });
      }
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
      const verified = await isVerifiedUser(req);
      if (!verified) return res.status(403).json({ message: "Identity verification required" });
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

  app.delete("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid activity ID" });
      const act = await storage.getActivity(id);
      if (!act) return res.status(404).json({ message: "Activity not found" });
      if (act.creatorId !== userId) return res.status(403).json({ message: "Only the creator can delete this activity" });
      await storage.deleteActivity(id);
      res.json({ message: "Activity deleted" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
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

  app.get("/api/access/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const email = req.user.claims.email;
      const profile = await storage.getProfile(userId);

      if (profile?.isSuspended) {
        return res.json({
          status: "suspended",
          reason: profile.suspensionReason || "",
        });
      }

      if (!profile) {
        const hasRedeemed = await storage.hasRedeemedAnyInvite(userId);
        const isConfiguredAdmin = isAdminEmail(email);
        return res.json({
          status: hasRedeemed || isConfiguredAdmin ? "needs_profile" : "needs_invite",
          isAdmin: !!isConfiguredAdmin,
        });
      }

      if (!profile.acceptedTermsAt) {
        const hasRedeemed = await storage.hasRedeemedAnyInvite(userId);
        const isConfiguredAdmin = isAdminEmail(email);
        return res.json({
          status: hasRedeemed || isConfiguredAdmin ? "needs_terms" : "needs_invite",
          isAdmin: !!isConfiguredAdmin || profile.isAdmin,
        });
      }

      const admin = await isAdminUser(req);
      return res.json({
        status: "active",
        isAdmin: admin,
        profile,
      });
    } catch (error) {
      console.error("Error checking access status:", error);
      res.status(500).json({ message: "Failed to check access status" });
    }
  });

  app.post("/api/invites/validate", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = inviteValidateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "invalid_code" });
      const invite = await storage.getInviteByCode(parsed.data.code.trim().toUpperCase());
      if (!invite) return res.status(400).json({ message: "invalid_code" });
      if (invite.isDisabled) return res.status(400).json({ message: "invite_disabled" });
      if (invite.expiresAt && new Date() > invite.expiresAt) return res.status(400).json({ message: "invite_expired" });
      if (invite.maxUses && (invite.usedCount || 0) >= invite.maxUses) return res.status(400).json({ message: "invite_used" });
      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post("/api/invites/redeem", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = acceptTermsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

      const email = req.user.claims.email;
      const isConfiguredAdmin = isAdminEmail(email);

      if (!isConfiguredAdmin) {
        const consumed = await storage.consumeInvite(parsed.data.inviteCode.trim().toUpperCase(), userId);
        if (!consumed) return res.status(400).json({ message: "invalid_code" });
      }

      const existingProfile = await storage.getProfile(userId);
      if (existingProfile) {
        await storage.acceptTerms(userId, parsed.data.termsVersion, parsed.data.privacyVersion);
        if (isConfiguredAdmin && !existingProfile.isAdmin) {
          await storage.setAdmin(userId, true);
          await storage.setCanInvite(userId, true);
        }
      } else {
        const displayName = `${req.user.claims.first_name || ""} ${req.user.claims.last_name || ""}`.trim() || "Peregrino";
        await storage.upsertProfile({
          userId,
          displayName,
          language: "pt-BR",
        });
        await storage.acceptTerms(userId, parsed.data.termsVersion, parsed.data.privacyVersion);
        if (isConfiguredAdmin) {
          await storage.setAdmin(userId, true);
          await storage.setCanInvite(userId, true);
        }
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Error redeeming invite:", error);
      res.status(500).json({ message: "Failed to redeem invite" });
    }
  });

  app.post("/api/invites/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await isAdminUser(req);
      const profile = await storage.getProfile(userId);
      const canInvite = admin || profile?.canInvite === true;
      if (!canInvite) return res.status(403).json({ message: "Invite permission required" });

      const parsed = inviteCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid invite data" });

      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      const invite = await storage.createInviteCode({
        code,
        createdBy: userId,
        maxUses: parsed.data.maxUses || 1,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        isDisabled: false,
      });

      res.json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.get("/api/invites", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const invites = await storage.getAllInvites();
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.get("/api/invites/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      const admin = await isAdminUser(req);
      const canInvite = admin || profile?.canInvite === true;
      if (!canInvite) return res.json([]);
      const invites = await storage.getInvitesByCreator(userId);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.post("/api/invites/:id/disable", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid invite ID" });
      await storage.disableInvite(id);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to disable invite" });
    }
  });

  app.post("/api/blocks", isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims.sub;
      const { blockedId } = req.body;
      if (!blockedId || typeof blockedId !== "string") return res.status(400).json({ message: "Invalid user ID" });
      if (blockerId === blockedId) return res.status(400).json({ message: "Cannot block yourself" });
      const block = await storage.blockUser(blockerId, blockedId);
      res.json(block);
    } catch (error) {
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.delete("/api/blocks/:blockedId", isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims.sub;
      const { blockedId } = req.params;
      await storage.unblockUser(blockerId, blockedId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  app.get("/api/blocks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const blockedIds = await storage.getBlockedUserIds(userId);
      res.json(blockedIds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.get("/api/blocks/check/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims.sub;
      const { userId } = req.params;
      const blocked = await storage.isBlocked(blockerId, userId);
      res.json({ blocked });
    } catch (error) {
      res.status(500).json({ message: "Failed to check block status" });
    }
  });

  app.post("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const reporterId = req.user.claims.sub;
      const parsed = reportCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid report data" });
      if (reporterId === parsed.data.reportedId) return res.status(400).json({ message: "Cannot report yourself" });

      const report = await storage.createReport({
        reporterId,
        reportedId: parsed.data.reportedId,
        reason: parsed.data.reason,
        details: parsed.data.details ? sanitizeText(parsed.data.details) : undefined,
        activityId: parsed.data.activityId,
        messageId: parsed.data.messageId,
      });
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/admin/reports", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.patch("/api/admin/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID" });
      const parsed = reportUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid status data" });
      await storage.updateReportStatus(id, parsed.data.status, parsed.data.adminNotes);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  app.post("/api/admin/suspend", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const parsed = suspendSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      await storage.suspendUser(parsed.data.userId, parsed.data.reason);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/unsuspend", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      await storage.unsuspendUser(userId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });

  app.post("/api/admin/grant-invite", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const { userId, canInvite } = req.body;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      await storage.setCanInvite(userId, canInvite !== false);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update invite permission" });
    }
  });

  registerObjectStorageRoutes(app);

  const objectStorageService = new ObjectStorageService();

  app.post("/api/verification/upload-url", isAuthenticated, async (req: any, res) => {
    try {
      const { name, size, contentType, type } = req.body;
      if (!name || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!["document", "selfie"].includes(type)) {
        return res.status(400).json({ message: "Invalid upload type" });
      }
      if (!contentType || !contentType.startsWith("image/")) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }
      if (size && size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large (max 10MB)" });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (error) {
      console.error("Error generating verification upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post("/api/verification/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentPath, selfiePath } = req.body;
      if (!documentPath || !selfiePath) {
        return res.status(400).json({ message: "Both document and selfie are required" });
      }

      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.verificationStatus === "verified") {
        return res.status(400).json({ message: "Already verified" });
      }

      try {
        await objectStorageService.trySetObjectEntityAclPolicy(documentPath, {
          owner: userId,
          visibility: "private",
        });
        await objectStorageService.trySetObjectEntityAclPolicy(selfiePath, {
          owner: userId,
          visibility: "private",
        });
      } catch (aclErr) {
        console.error("ACL set warning:", aclErr);
      }

      await storage.submitVerification(userId, documentPath, selfiePath);
      res.json({ ok: true, status: "pending" });
    } catch (error) {
      console.error("Error submitting verification:", error);
      res.status(500).json({ message: "Failed to submit verification" });
    }
  });

  app.get("/api/verification/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.json({ status: "unverified" });
      }
      res.json({
        status: profile.verificationStatus || "unverified",
        submittedAt: profile.verificationSubmittedAt,
        reviewedAt: profile.verificationReviewedAt,
        reason: profile.verificationReason,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification status" });
    }
  });

  app.get("/api/admin/verifications", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.get("/api/admin/verifications/pending", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const verifications = await storage.getPendingVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });

  app.post("/api/admin/verifications/:userId/review", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const { userId } = req.params;
      const { status, reason } = req.body;
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'verified' or 'rejected'" });
      }
      if (status === "rejected" && !reason) {
        return res.status(400).json({ message: "Reason required for rejection" });
      }
      const reviewedBy = req.user.claims.sub;
      await storage.reviewVerification(userId, reviewedBy, status, reason);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error reviewing verification:", error);
      res.status(500).json({ message: "Failed to review verification" });
    }
  });

  app.get("/api/admin/verification-document/:userId/:type", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await isAdminUser(req);
      if (!admin) return res.status(403).json({ message: "Admin access required" });
      const { userId, type } = req.params;
      if (!["document", "selfie"].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
      }
      const profile = await storage.getProfile(userId);
      if (!profile) return res.status(404).json({ message: "User not found" });
      const objectPath = type === "document" ? profile.documentUrl : profile.selfieUrl;
      if (!objectPath) return res.status(404).json({ message: "File not found" });

      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving verification document:", error);
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  await seedDatabase();

  return httpServer;
}
