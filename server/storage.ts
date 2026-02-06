import {
  pilgrimProfiles, activities, activityParticipants, chatMessages, ratings, donations,
  type PilgrimProfile, type InsertPilgrimProfile,
  type Activity, type InsertActivity,
  type ActivityParticipant,
  type ChatMessage, type InsertChatMessage,
  type Rating, type InsertRating,
  type Donation, type InsertDonation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<PilgrimProfile | undefined>;
  upsertProfile(data: InsertPilgrimProfile): Promise<PilgrimProfile>;

  getActivities(): Promise<(Activity & { participantCount: number; creatorName: string })[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  getActivityDetail(id: number, userId: string): Promise<any>;
  getMyActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string })[]>;
  getRecommendedActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string })[]>;
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
          prefTransport: data.prefTransport,
          prefMeals: data.prefMeals,
          prefHiking: data.prefHiking,
          prefLodging: data.prefLodging,
        },
      })
      .returning();
    return profile;
  }

  async getActivities(): Promise<(Activity & { participantCount: number; creatorName: string })[]> {
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
}

export const storage = new DatabaseStorage();
