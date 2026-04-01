import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  index,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const gameSourceEnum = pgEnum("game_source", ["igdb", "user"]);
export const entryStatusEnum = pgEnum("entry_status", [
  "planning",
  "playing",
  "completed",
  "on_hold",
  "dropped",
]);
export const listVisibilityEnum = pgEnum("list_visibility", [
  "public",
  "unlisted",
  "private",
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "completed",
  "started",
  "rated",
  "dropped",
  "on_hold",
]);

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "declined",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    handle: varchar("handle", { length: 32 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    favoriteGameIds: jsonb("favorite_game_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("users_handle_idx").on(t.handle)]
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: gameSourceEnum("source").notNull(),
    igdbId: integer("igdb_id"),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    summary: text("summary"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    coverUrl: text("cover_url"),
    platforms: jsonb("platforms").$type<string[] | null>(),
    /** IGDB + local: [{ id, name }] for genre chips / filters */
    genres: jsonb("genres").$type<{ id: number; name: string }[] | null>(),
    developerName: varchar("developer_name", { length: 300 }),
    /** IGDB critic score 0–100 */
    aggregatedRating: integer("aggregated_rating"),
    aggregatedRatingCount: integer("aggregated_rating_count"),
    /** IGDB user score 0–100 */
    totalRating: integer("total_rating"),
    totalRatingCount: integer("total_rating_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    submittedBy: uuid("submitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reportCount: integer("report_count").default(0).notNull(),
    moderationStatus: varchar("moderation_status", { length: 32 }),
  },
  (t) => [
    uniqueIndex("games_igdb_id_unique").on(t.igdbId),
    index("games_title_idx").on(t.title),
    index("games_slug_idx").on(t.slug),
  ]
);

export const libraryEntries = pgTable(
  "library_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    status: entryStatusEnum("status").notNull().default("planning"),
    rating: integer("rating"),
    notes: text("notes"),
    progressPercent: integer("progress_percent"),
    progressNote: varchar("progress_note", { length: 500 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("library_user_game_unique").on(t.userId, t.gameId),
    index("library_user_idx").on(t.userId),
    index("library_game_idx").on(t.gameId),
  ]
);

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    visibility: listVisibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lists_user_slug_unique").on(t.userId, t.slug)]
);

export const listMemberships = pgTable(
  "list_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    libraryEntryId: uuid("library_entry_id")
      .notNull()
      .references(() => libraryEntries.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("list_entry_unique").on(t.listId, t.libraryEntryId),
    index("list_memberships_list_idx").on(t.listId),
  ]
);

export const characterRoutes = pgTable(
  "character_routes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    libraryEntryId: uuid("library_entry_id")
      .notNull()
      .references(() => libraryEntries.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    imageUrl: text("image_url"),
    status: entryStatusEnum("status").notNull().default("planning"),
    rating: integer("rating"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("routes_entry_idx").on(t.libraryEntryId)]
);

export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userA: uuid("user_a")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userB: uuid("user_b")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("friendships_pair_unique").on(t.userA, t.userB),
    index("friendships_user_b_idx").on(t.userB),
  ]
);

export const friendRequests = pgTable(
  "friend_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("friend_requests_pair_unique").on(t.senderId, t.receiverId),
    index("friend_requests_receiver_idx").on(t.receiverId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    referenceId: uuid("reference_id"),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_user_read_idx").on(t.userId, t.read),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    libraryEntryId: uuid("library_entry_id").references(() => libraryEntries.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activities_user_created_idx").on(t.userId, t.createdAt)]
);

export const usersRelations = relations(users, ({ many }) => ({
  libraryEntries: many(libraryEntries),
  lists: many(lists),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  libraryEntries: many(libraryEntries),
}));

export const libraryEntriesRelations = relations(libraryEntries, ({ one, many }) => ({
  user: one(users, { fields: [libraryEntries.userId], references: [users.id] }),
  game: one(games, { fields: [libraryEntries.gameId], references: [games.id] }),
  routes: many(characterRoutes),
  listMemberships: many(listMemberships),
  activities: many(activities),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, { fields: [lists.userId], references: [users.id] }),
  memberships: many(listMemberships),
}));

export const listMembershipsRelations = relations(listMemberships, ({ one }) => ({
  list: one(lists, { fields: [listMemberships.listId], references: [lists.id] }),
  libraryEntry: one(libraryEntries, {
    fields: [listMemberships.libraryEntryId],
    references: [libraryEntries.id],
  }),
}));

export const characterRoutesRelations = relations(characterRoutes, ({ one }) => ({
  libraryEntry: one(libraryEntries, {
    fields: [characterRoutes.libraryEntryId],
    references: [libraryEntries.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  userARef: one(users, {
    fields: [friendships.userA],
    references: [users.id],
    relationName: "friendshipsA",
  }),
  userBRef: one(users, {
    fields: [friendships.userB],
    references: [users.id],
    relationName: "friendshipsB",
  }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
    relationName: "sentFriendRequests",
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
    relationName: "receivedFriendRequests",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "notifications",
  }),
  senderUser: one(users, {
    fields: [notifications.senderUserId],
    references: [users.id],
    relationName: "sentNotifications",
  }),
}));
