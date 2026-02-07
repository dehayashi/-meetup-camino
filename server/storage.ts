import {
  pilgrimProfiles, activities, activityParticipants, chatMessages, ratings, donations, pushSubscriptions,
  inviteCodes, inviteRedemptions, userBlocks, userReports,
  type PilgrimProfile, type InsertPilgrimProfile,
  type Activity, type InsertActivity,
  type ActivityParticipant,
  type ChatMessage, type InsertChatMessage,
  type Rating, type InsertRating,
  type Donation, type InsertDonation,
  type PushSubscription, type InsertPushSubscription,
  type InviteCode, type InsertInviteCode,
  type UserBlock, type InsertUserBlock,
  type UserReport, type InsertUserReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, ne } from "drizzle-orm";

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

  createInviteCode(data: InsertInviteCode): Promise<InviteCode>;
  getInviteByCode(code: string): Promise<InviteCode | undefined>;
  consumeInvite(code: string, userId: string): Promise<boolean>;
  getAllInvites(): Promise<InviteCode[]>;
  disableInvite(id: number): Promise<void>;
  hasRedeemedAnyInvite(userId: string): Promise<boolean>;
  getInvitesByCreator(userId: string): Promise<InviteCode[]>;
  setCanInvite(userId: string, canInvite: boolean): Promise<void>;

  blockUser(blockerId: string, blockedId: string): Promise<UserBlock>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUserIds(blockerId: string): Promise<string[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  createReport(data: InsertUserReport): Promise<UserReport>;
  getAllReports(): Promise<(UserReport & { reporterName?: string; reportedName?: string })[]>;
  updateReportStatus(id: number, status: string, adminNotes?: string): Promise<void>;

  suspendUser(userId: string, reason: string): Promise<void>;
  unsuspendUser(userId: string): Promise<void>;
  setAdmin(userId: string, isAdmin: boolean): Promise<void>;
  acceptTerms(userId: string, termsVersion: string, privacyVersion: string): Promise<void>;

  submitVerification(userId: string, documentUrl: string, selfieUrl: string): Promise<void>;
  reviewVerification(userId: string, reviewedBy: string, status: string, reason?: string): Promise<void>;
  getPendingVerifications(): Promise<PilgrimProfile[]>;
  getAllVerifications(): Promise<PilgrimProfile[]>;
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

  async getMyActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]> {
    const created = await db.select().from(activities).where(eq(activities.creatorId, userId));
    const joined = await db.select({ activityId: activityParticipants.activityId })
      .from(activityParticipants).where(eq(activityParticipants.userId, userId));

    const myIds = new Set([...created.map(a => a.id), ...joined.map(j => j.activityId)]);
    const all = await this.getActivities();
    return all.filter(a => myIds.has(a.id));
  }

  async getRecommendedActivities(userId: string): Promise<(Activity & { participantCount: number; creatorName: string; creatorNationality: string | null })[]> {
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

  async createInviteCode(data: InsertInviteCode): Promise<InviteCode> {
    const [invite] = await db.insert(inviteCodes).values(data).returning();
    return invite;
  }

  async getInviteByCode(code: string): Promise<InviteCode | undefined> {
    const [invite] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return invite || undefined;
  }

  async consumeInvite(code: string, userId: string): Promise<boolean> {
    const invite = await this.getInviteByCode(code);
    if (!invite) return false;
    if (invite.isDisabled) return false;
    if (invite.expiresAt && new Date() > invite.expiresAt) return false;
    if (invite.maxUses && (invite.usedCount || 0) >= invite.maxUses) return false;

    await db.update(inviteCodes)
      .set({ usedCount: (invite.usedCount || 0) + 1 })
      .where(eq(inviteCodes.id, invite.id));

    await db.insert(inviteRedemptions).values({
      inviteId: invite.id,
      userId,
    });

    return true;
  }

  async getAllInvites(): Promise<InviteCode[]> {
    return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }

  async disableInvite(id: number): Promise<void> {
    await db.update(inviteCodes).set({ isDisabled: true }).where(eq(inviteCodes.id, id));
  }

  async hasRedeemedAnyInvite(userId: string): Promise<boolean> {
    const [res] = await db.select().from(inviteRedemptions)
      .where(eq(inviteRedemptions.userId, userId));
    return !!res;
  }

  async getInvitesByCreator(userId: string): Promise<InviteCode[]> {
    return db.select().from(inviteCodes)
      .where(eq(inviteCodes.createdBy, userId))
      .orderBy(desc(inviteCodes.createdAt));
  }

  async setCanInvite(userId: string, canInvite: boolean): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({ canInvite })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async blockUser(blockerId: string, blockedId: string): Promise<UserBlock> {
    const existing = await this.isBlocked(blockerId, blockedId);
    if (existing) {
      const [block] = await db.select().from(userBlocks)
        .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
      return block;
    }
    const [block] = await db.insert(userBlocks).values({ blockerId, blockedId }).returning();
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.delete(userBlocks).where(
      and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId))
    );
  }

  async getBlockedUserIds(blockerId: string): Promise<string[]> {
    const blocks = await db.select({ blockedId: userBlocks.blockedId })
      .from(userBlocks).where(eq(userBlocks.blockerId, blockerId));
    return blocks.map(b => b.blockedId);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [res] = await db.select().from(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
    return !!res;
  }

  async createReport(data: InsertUserReport): Promise<UserReport> {
    const [report] = await db.insert(userReports).values(data).returning();
    return report;
  }

  async getAllReports(): Promise<(UserReport & { reporterName?: string; reportedName?: string })[]> {
    const reports = await db.select().from(userReports).orderBy(desc(userReports.createdAt));
    const result = [];
    for (const r of reports) {
      const reporter = await this.getProfile(r.reporterId);
      const reported = await this.getProfile(r.reportedId);
      result.push({
        ...r,
        reporterName: reporter?.displayName || "Unknown",
        reportedName: reported?.displayName || "Unknown",
      });
    }
    return result;
  }

  async updateReportStatus(id: number, status: string, adminNotes?: string): Promise<void> {
    const set: any = { status };
    if (adminNotes !== undefined) set.adminNotes = adminNotes;
    if (status === "closed") set.resolvedAt = new Date();
    await db.update(userReports).set(set).where(eq(userReports.id, id));
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({ isSuspended: true, suspensionReason: reason })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async unsuspendUser(userId: string): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({ isSuspended: false, suspensionReason: null })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async setAdmin(userId: string, isAdmin: boolean): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({ isAdmin })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async acceptTerms(userId: string, termsVersion: string, privacyVersion: string): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
        termsVersion,
        privacyVersion,
      })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async submitVerification(userId: string, documentUrl: string, selfieUrl: string): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({
        verificationStatus: "pending",
        documentUrl,
        selfieUrl,
        verificationSubmittedAt: new Date(),
        verificationReviewedAt: null,
        verificationReviewedBy: null,
        verificationReason: null,
      })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async reviewVerification(userId: string, reviewedBy: string, status: string, reason?: string): Promise<void> {
    await db.update(pilgrimProfiles)
      .set({
        verificationStatus: status,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: reviewedBy,
        verificationReason: reason || null,
      })
      .where(eq(pilgrimProfiles.userId, userId));
  }

  async getPendingVerifications(): Promise<PilgrimProfile[]> {
    return db.select().from(pilgrimProfiles)
      .where(eq(pilgrimProfiles.verificationStatus, "pending"))
      .orderBy(asc(pilgrimProfiles.verificationSubmittedAt));
  }

  async getAllVerifications(): Promise<PilgrimProfile[]> {
    return db.select().from(pilgrimProfiles)
      .where(ne(pilgrimProfiles.verificationStatus, "unverified"))
      .orderBy(desc(pilgrimProfiles.verificationSubmittedAt));
  }
}

export const storage = new DatabaseStorage();
