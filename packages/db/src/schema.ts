import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  workosUserId: text("workos_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["free", "paid"] }).notNull(),
  storageUsedBytes: integer("storage_used_bytes").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const bakos = sqliteTable("bakos", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at").notNull(),
});

export const memberships = sqliteTable(
  "memberships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    bakoId: text("bako_id")
      .notNull()
      .references(() => bakos.id),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
    lastReadAt: integer("last_read_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bakoId] })],
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    bakoId: text("bako_id")
      .notNull()
      .references(() => bakos.id),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    contentHash: text("content_hash").notNull(),
    thumbKey: text("thumb_key"),
    status: text("status", {
      enum: ["pending", "ready", "over_quota", "failed"],
    }).notNull(),
    takenAt: integer("taken_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("assets_bako_created_idx").on(t.bakoId, t.createdAt)],
);

export const activity = sqliteTable(
  "activity",
  {
    id: text("id").primaryKey(),
    bakoId: text("bako_id")
      .notNull()
      .references(() => bakos.id),
    type: text("type", { enum: ["upload", "join"] }).notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    assetId: text("asset_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("activity_bako_created_idx").on(t.bakoId, t.createdAt)],
);

export const uploadSessions = sqliteTable("upload_sessions", {
  id: text("id").primaryKey(),
  bakoId: text("bako_id")
    .notNull()
    .references(() => bakos.id),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  contentHash: text("content_hash").notNull(),
  kind: text("kind", { enum: ["image", "video"] }).notNull(),
  mode: text("mode", { enum: ["single", "multipart"] }).notNull(),
  r2UploadId: text("r2_upload_id"),
  thumbHash: text("thumb_hash"),
  status: text("status", {
    enum: ["pending", "completed", "aborted"],
  }).notNull(),
  assetId: text("asset_id"),
  createdAt: integer("created_at").notNull(),
});
