import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const pilgrimProfiles = pgTable("pilgrim_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  language: text("language").default("en"),
  nationality: text("nationality"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  travelStartDate: text("travel_start_date"),
  travelEndDate: text("travel_end_date"),
  cities: text("cities").array(),
  spokenLanguages: text("spoken_languages").array(),
  prefTransport: integer("pref_transport").default(0),
  prefMeals: integer("pref_meals").default(0),
  prefHiking: integer("pref_hiking").default(0),
  prefLodging: integer("pref_lodging").default(0),
  isAdmin: boolean("is_admin").default(false),
  canInvite: boolean("can_invite").default(false),
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  acceptedTermsAt: timestamp("accepted_terms_at"),
  acceptedPrivacyAt: timestamp("accepted_privacy_at"),
  termsVersion: text("terms_version"),
  privacyVersion: text("privacy_version"),
  verificationStatus: text("verification_status").default("unverified"),
  documentUrl: text("document_url"),
  selfieUrl: text("selfie_url"),
  verificationSubmittedAt: timestamp("verification_submitted_at"),
  verificationReviewedAt: timestamp("verification_reviewed_at"),
  verificationReviewedBy: varchar("verification_reviewed_by"),
  verificationReason: text("verification_reason"),
});

export const pilgrimProfileRelations = relations(pilgrimProfiles, ({ many }) => ({
  activities: many(activities),
  participants: many(activityParticipants),
}));

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  city: text("city").notNull(),
  date: text("date").notNull(),
  time: text("time"),
  spots: integer("spots").default(4),
  lat: real("lat"),
  lng: real("lng"),
  transportFrom: text("transport_from"),
  transportTo: text("transport_to"),
  transportRouteId: text("transport_route_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityRelations = relations(activities, ({ one, many }) => ({
  creator: one(pilgrimProfiles, { fields: [activities.creatorId], references: [pilgrimProfiles.userId] }),
  participants: many(activityParticipants),
  messages: many(chatMessages),
  ratings: many(ratings),
}));

export const activityParticipants = pgTable("activity_participants", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const participantRelations = relations(activityParticipants, ({ one }) => ({
  activity: one(activities, { fields: [activityParticipants.activityId], references: [activities.id] }),
  profile: one(pilgrimProfiles, { fields: [activityParticipants.userId], references: [pilgrimProfiles.userId] }),
}));

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  activity: one(activities, { fields: [chatMessages.activityId], references: [activities.id] }),
  profile: one(pilgrimProfiles, { fields: [chatMessages.userId], references: [pilgrimProfiles.userId] }),
}));

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratingRelations = relations(ratings, ({ one }) => ({
  activity: one(activities, { fields: [ratings.activityId], references: [activities.id] }),
  profile: one(pilgrimProfiles, { fields: [ratings.userId], references: [pilgrimProfiles.userId] }),
}));

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  amount: real("amount").notNull(),
  message: text("message"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentStatus: text("stripe_payment_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code").notNull().unique(),
  createdBy: varchar("created_by").notNull(),
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
  isDisabled: boolean("is_disabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteRedemptions = pgTable("invite_redemptions", {
  id: serial("id").primaryKey(),
  inviteId: integer("invite_id").notNull(),
  userId: varchar("user_id").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: varchar("blocker_id").notNull(),
  blockedId: varchar("blocked_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").notNull(),
  reportedId: varchar("reported_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  activityId: integer("activity_id"),
  messageId: integer("message_id"),
  status: text("status").default("open"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export const insertPilgrimProfileSchema = createInsertSchema(pilgrimProfiles).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({ id: true, usedCount: true, createdAt: true });
export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({ id: true, createdAt: true });
export const insertUserReportSchema = createInsertSchema(userReports).omit({ id: true, status: true, adminNotes: true, resolvedAt: true, createdAt: true });

export type PilgrimProfile = typeof pilgrimProfiles.$inferSelect;
export type InsertPilgrimProfile = z.infer<typeof insertPilgrimProfileSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ActivityParticipant = typeof activityParticipants.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = z.infer<typeof insertUserBlockSchema>;
export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;

export const REPORT_REASONS = [
  "harassment",
  "offensive_language",
  "threat_violence",
  "scam_suspicious",
  "illegal_items",
  "sexual_content",
  "other",
] as const;

export type ReportReason = typeof REPORT_REASONS[number];
