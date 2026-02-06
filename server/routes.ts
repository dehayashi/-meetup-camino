import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { seedDatabase } from "./seed";
import { z } from "zod";
import { insertPilgrimProfileSchema, insertActivitySchema, insertChatMessageSchema, insertRatingSchema, insertDonationSchema } from "@shared/schema";

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

  app.post("/api/donations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = donationBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid donation data" });
      const donation = await storage.createDonation({
        userId,
        amount: parsed.data.amount,
        message: parsed.data.message || null,
      });
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Failed to process donation" });
    }
  });

  await seedDatabase();

  return httpServer;
}
