export * from "./schema.ts";

import {
  activity,
  assets,
  bakos,
  memberships,
  uploadSessions,
  users,
} from "./schema.ts";

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type BakoRow = typeof bakos.$inferSelect;
export type NewBakoRow = typeof bakos.$inferInsert;
export type MembershipRow = typeof memberships.$inferSelect;
export type NewMembershipRow = typeof memberships.$inferInsert;
export type AssetRow = typeof assets.$inferSelect;
export type NewAssetRow = typeof assets.$inferInsert;
export type ActivityRow = typeof activity.$inferSelect;
export type NewActivityRow = typeof activity.$inferInsert;
export type UploadSessionRow = typeof uploadSessions.$inferSelect;
export type NewUploadSessionRow = typeof uploadSessions.$inferInsert;
