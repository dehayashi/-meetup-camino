import {
  pilgrimProfiles, activities, activityParticipants, chatMessages, ratings, donations, pushSubscriptions,
  type PilgrimProfile, type InsertPilgrimProfile,
  type Activity, type InsertActivity,
  type ActivityParticipant,
  type ChatMessage, type InsertChatMessage,
  type Rating, type InsertRating,
  type Donation, type InsertDonation,
  type PushSubscription, type InsertPushSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<PilgrimProfile | undefined>;
  upsertProfile(data: InsertPilgrimProfile): Promise<PilgrimProfile>;
  updateProfilePhoto(userId: string, photoUrl: string): Promise<void>;

  getActivities(): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  getActivityDetail(id: number, userId: string): Promise<any>;
  getMyActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]>;
  getRecommendedActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]>;
  createActivity(data: InsertActivity): Promise<Activity>;

  joinActivity(activityId: number, userId: string): Promise<void>;
  leaveActivity(activityId: number, userId: string): Promise<void>;
  getParticipants(activityId: number): Promise<PilgrimProfile[]>;
  isParticipant(activityId: number, userId: string): Promise<boolean>;

  getMessages(activityId: number): Promise<(ChatMessage & { displayName?: string; photoUrl?: string })[]>;
  createMessage(data: InsertChatMessage): Promise<ChatMessage>;

  getRatings(activityId: number): Promise<(Rating & { displayName?: string })[]>;
  createRating(data: InsertRating): Promise<Rating>;

  createDonation(data: InsertDonation): Promise<Donation>;
  updateDonationStatus(stripeSessionId: string, status: string): Promise<void>;

  savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscription(userId: string): Promise<PushSubscription | undefined>;
  deletePushSubscription(userId: string): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;

  deleteActivity(activityId: number): Promise<void>;

  getUserRankings(): Promise<{ userId: string; displayName: string; photoUrl: string | null; nationality: string | null; avgRating: number; totalRatings: number; activitiesCreated: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<PilgrimProfile | undefined> {
    const [profile] = await db.select().from(pilgrimProfiles).where(eq(pilgrimProfiles.userId, userId));
    return profile || undefined;
  }

  async upsertProfile(data: InsertPilgrimProfile): Promise<PilgrimProfile> {
    const [profile] = await db
      .insert(pilgrimProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: pilgrimProfiles.userId,
        set: {
          displayName: data.displayName,
          language: data.language,
          nationality: data.nationality,
          bio: data.bio,
          photoUrl: data.photoUrl,
          travelStartDate: data.travelStartDate,
          travelEndDate: data.travelEndDate,
          cities: data.cities,
          spokenLanguages: data.spokenLanguages,
          prefTransport: data.prefTransport,
          prefMeals: data.prefMeals,
          prefHiking: data.prefHiking,
          prefLodging: data.prefLodging,
        },
      })
      .returning();
    return profile;
  }

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    await db.update(pilgrimProfiles).set({ photoUrl }).where(eq(pilgrimProfiles.userId, userId));
  }

  async getActivities(): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]> {
    const acts = await db.select().from(activities).orderBy(desc(activities.createdAt));
    const result = [];
    for (const act of acts) {
      const [countRes] = await db.select({ count: sql<number>`count(*)::int` })
        .from(activityParticipants).where(eq(activityParticipants.activityId, act.id));
      const creator = await this.getProfile(act.creatorId);
      result.push({
        ...act,
        participantCount: (countRes?.count || 0) + 1,
        creatorName: creator?.displayName || "Peregrino",
        creatorNationality: creator?.nationality || null,
      });
    }
    return result;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [act] = await db.select().from(activities).where(eq(activities.id, id));
    return act || undefined;
  }

  async getActivityDetail(id: number, userId: string) {
    const act = await this.getActivity(id);
    if (!act) return undefined;

    const [countRes] = await db.select({ count: sql<number>`count(*)::int` })
      .from(activityParticipants).where(eq(activityParticipants.activityId, id));
    const participantCount = (countRes?.count || 0) + 1;
    const creator = await this.getProfile(act.creatorId);
    const isCreator = act.creatorId === userId;
    const isParticipant = await this.isParticipant(id, userId);
    const participantsList = await this.getParticipants(id);

    const creatorProfile = creator ? { ...creator, profileImageUrl: creator.photoUrl } : null;
    const allParticipants = creatorProfile
      ? [creatorProfile, ...participantsList.map(p => ({ ...p, profileImageUrl: p.photoUrl }))]
      : participantsList.map(p => ({ ...p, profileImageUrl: p.photoUrl }));

    return {
      ...act,
      participantCount,
      creatorName: creator?.displayName || "Peregrino",
      creatorNationality: creator?.nationality || null,
      isCreator,
      isParticipant,
      participants: allParticipants,
    };
  }

  async getMyActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string })[]> {
    const created = await db.select().from(activities).where(eq(activities.creatorId, userId));
    const joined = await db.select({ activityId: activityParticipants.activityId })
      .from(activityParticipants).where(eq(activityParticipants.userId, userId));

    const myIds = new Set([...created.map(a => a.id), ...joined.map(j => j.activityId)]);
    const all = await this.getActivities();
    return all.filter(a => myIds.has(a.id));
  }

  async getRecommendedActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string })[]> {
    const profile = await this.getProfile(userId);
    const all = await this.getActivities();

    if (!profile) return all.slice(0, 10);

    const userCities = new Set(profile.cities || []);
    const today = new Date();

    const scored = all.map(act => {
      let score = 0;
      if (userCities.has(act.city)) score += 10;

      if (act.date) {
        const actDate = new Date(act.date);
        const diffDays = Math.abs((actDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) score += 8;
        else if (diffDays <= 3) score += 5;
        else if (diffDays <= 7) score += 2;
      }

      const spotsLeft = (act.spots || 4) - act.participantCount;
      if (spotsLeft > 0) score += 3;
      if (spotsLeft > 2) score += 1;

      if (act.type === "transport" && (profile.prefTransport || 0) > 2) score += 2;
      if (act.type === "meal" && (profile.prefMeals || 0) > 2) score += 2;
      if (act.type === "hike" && (profile.prefHiking || 0) > 2) score += 2;
      if (act.type === "lodging" && (profile.prefLodging || 0) > 2) score += 2;

      if (act.creatorId === userId) score -= 100;

      return { ...act, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [act] = await db.insert(activities).values(data).returning();
    return act;
  }

  async joinActivity(activityId: number, userId: string): Promise<void> {
    const existing = await this.isParticipant(activityId, userId);
    if (!existing) {
      await db.insert(activityParticipants).values({ activityId, userId });
    }
  }

  async leaveActivity(activityId: number, userId: string): Promise<void> {
    await db.delete(activityParticipants).where(
      and(
        eq(activityParticipants.activityId, activityId),
        eq(activityParticipants.userId, userId)
      )
    );
  }

  async getParticipants(activityId: number): Promise<PilgrimProfile[]> {
    const parts = await db.select().from(activityParticipants)
      .where(eq(activityParticipants.activityId, activityId));
    const profiles = [];
    for (const p of parts) {
      const profile = await this.getProfile(p.userId);
      if (profile) profiles.push(profile);
    }
    return profiles;
  }

  async isParticipant(activityId: number, userId: string): Promise<boolean> {
    const [res] = await db.select().from(activityParticipants)
      .where(and(
        eq(activityParticipants.activityId, activityId),
        eq(activityParticipants.userId, userId)
      ));
    return !!res;
  }

  async getMessages(activityId: number): Promise<(ChatMessage & { displayName?: string; photoUrl?: string })[]> {
    const msgs = await db.select().from(chatMessages)
      .where(eq(chatMessages.activityId, activityId))
      .orderBy(asc(chatMessages.createdAt));
    const result = [];
    for (const msg of msgs) {
      const profile = await this.getProfile(msg.userId);
      result.push({
        ...msg,
        displayName: profile?.displayName || "Peregrino",
        photoUrl: profile?.photoUrl || "",
      });
    }
    return result;
  }

  async createMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db.insert(chatMessages).values(data).returning();
    return msg;
  }

  async getRatings(activityId: number): Promise<(Rating & { displayName?: string })[]> {
    const rats = await db.select().from(ratings)
      .where(eq(ratings.activityId, activityId))
      .orderBy(desc(ratings.createdAt));
    const result = [];
    for (const r of rats) {
      const profile = await this.getProfile(r.userId);
      result.push({
        ...r,
        displayName: profile?.displayName || "Peregrino",
      });
    }
    return result;
  }

  async createRating(data: InsertRating): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(data).returning();
    return rating;
  }

  async createDonation(data: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(data).returning();
    return donation;
  }

  async updateDonationStatus(stripeSessionId: string, status: string): Promise<void> {
    await db.update(donations)
      .set({ stripePaymentStatus: status })
      .where(eq(donations.stripeSessionId, stripeSessionId));
  }

  async savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, data.userId));
    const [sub] = await db.insert(pushSubscriptions).values(data).returning();
    return sub;
  }

  async getPushSubscription(userId: string): Promise<PushSubscription | undefined> {
    const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    return sub || undefined;
  }

  async deletePushSubscription(userId: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }

  async deleteActivity(activityId: number): Promise<void> {
    await db.delete(ratings).where(eq(ratings.activityId, activityId));
    await db.delete(chatMessages).where(eq(chatMessages.activityId, activityId));
    await db.delete(activityParticipants).where(eq(activityParticipants.activityId, activityId));
    await db.delete(activities).where(eq(activities.id, activityId));
  }

  async getUserRankings(): Promise<{ userId: string; displayName: string; photoUrl: string | null; nationality: string | null; avgRating: number; totalRatings: number; activitiesCreated: number }[]> {
    const allActivities = await db.select().from(activities);
    const allRatings = await db.select().from(ratings);
    const allProfiles = await db.select().from(pilgrimProfiles);

    const creatorRatings: Record<string, number[]> = {};
    const creatorActivityCount: Record<string, number> = {};

    for (const act of allActivities) {
      creatorActivityCount[act.creatorId] = (creatorActivityCount[act.creatorId] || 0) + 1;
      const actRatings = allRatings.filter(r => r.activityId === act.id);
      for (const r of actRatings) {
        if (!creatorRatings[act.creatorId]) creatorRatings[act.creatorId] = [];
        creatorRatings[act.creatorId].push(r.score);
      }
    }

    const ranked = allProfiles
      .map(p => {
        const scores = creatorRatings[p.userId] || [];
        const avgRating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          userId: p.userId,
          displayName: p.displayName,
          photoUrl: p.photoUrl,
          nationality: p.nationality || null,
          avgRating: Math.round(avgRating * 10) / 10,
          totalRatings: scores.length,
          activitiesCreated: creatorActivityCount[p.userId] || 0,
        };
      })
      .filter(u => u.totalRatings > 0 || u.activitiesCreated > 0)
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return b.totalRatings - a.totalRatings;
      });

    return ranked;
  }
}

export const storage = new DatabaseStorage();
