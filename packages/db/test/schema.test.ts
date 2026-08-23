import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import {
  activity,
  assets,
  bakos,
  memberships,
  uploadSessions,
  users,
  type ActivityRow,
  type AssetRow,
  type BakoRow,
  type MembershipRow,
  type UploadSessionRow,
  type UserRow,
} from "../src/index.ts";

const dir = mkdtempSync(join(tmpdir(), "omoide-db-"));
const dbPath = join(dir, "test.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

const now = 1_724_000_000_000;
const userId = "u-01893a5b-1111-7000-8000-000000000001";
const bakoId = "b-01893a5b-2222-7000-8000-000000000002";
const assetId = "a-01893a5b-3333-7000-8000-000000000003";
const sessionId = "s-01893a5b-4444-7000-8000-000000000004";
const activityId = "v-01893a5b-5555-7000-8000-000000000005";

describe("@omoide/db migrations", () => {
  it("applies committed migrations to a fresh database", () => {
    migrate(db, { migrationsFolder: "./migrations" });

    const tables = sqlite
      .prepare<{ name: string }, unknown>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all()
      .map((r) => r.name);

    for (const t of [
      "users",
      "bakos",
      "memberships",
      "assets",
      "activity",
      "upload_sessions",
    ]) {
      assert.ok(tables.includes(t), `missing table ${t}`);
    }
  });

  it("round-trips one row per table using inferred types", () => {
    const user = {
      id: userId,
      workosUserId: "wous_123",
      email: "bako@example.com",
      name: "Bako Tester",
      plan: "free",
      storageUsedBytes: 1024,
      createdAt: now,
    } satisfies typeof users.$inferInsert;
    db.insert(users).values(user).run();

    const bako = {
      id: bakoId,
      name: "Summer Trip",
      createdBy: userId,
      createdAt: now,
    } satisfies typeof bakos.$inferInsert;
    db.insert(bakos).values(bako).run();

    const membership = {
      userId,
      bakoId,
      role: "owner",
      lastReadAt: now,
    } satisfies typeof memberships.$inferInsert;
    db.insert(memberships).values(membership).run();

    const asset = {
      id: assetId,
      bakoId,
      uploaderId: userId,
      fileName: "IMG_0001.heic",
      contentType: "image/heic",
      byteSize: 2_384_712,
      contentHash: "deadbeef".repeat(8),
      thumbKey: null,
      status: "ready",
      takenAt: null,
      createdAt: now,
    } satisfies typeof assets.$inferInsert;
    db.insert(assets).values(asset).run();

    const session = {
      id: sessionId,
      bakoId,
      uploaderId: userId,
      fileName: "VID_0001.mov",
      contentType: "video/quicktime",
      byteSize: 104_857_600,
      contentHash: "cafebabe".repeat(8),
      kind: "video",
      mode: "multipart",
      r2UploadId: "r2-upload-id",
      thumbHash: null,
      status: "pending",
      assetId: null,
      createdAt: now,
    } satisfies typeof uploadSessions.$inferInsert;
    db.insert(uploadSessions).values(session).run();

    const event = {
      id: activityId,
      bakoId,
      type: "upload",
      actorId: userId,
      assetId,
      createdAt: now,
    } satisfies typeof activity.$inferInsert;
    db.insert(activity).values(event).run();

    const gotUser: UserRow | undefined = db
      .select()
      .from(users)
      .all()
      .at(0);
    const gotBako: BakoRow | undefined = db.select().from(bakos).all().at(0);
    const gotMembership: MembershipRow | undefined = db
      .select()
      .from(memberships)
      .all()
      .at(0);
    const gotAsset: AssetRow | undefined = db.select().from(assets).all().at(0);
    const gotSession: UploadSessionRow | undefined = db
      .select()
      .from(uploadSessions)
      .all()
      .at(0);
    const gotEvent: ActivityRow | undefined = db
      .select()
      .from(activity)
      .all()
      .at(0);

    assert.deepEqual(gotUser?.id, user.id);
    assert.equal(gotUser?.plan, "free");
    assert.deepEqual(gotBako, { ...bako });
    assert.deepEqual(gotMembership, { ...membership });
    assert.deepEqual(gotAsset, { ...asset });
    assert.deepEqual(gotSession, { ...session });
    assert.deepEqual(gotEvent, { ...event });
  });

  it("documents foreign_keys pragma behavior", async (t) => {
    const defaultOn =
      sqlite.pragma("foreign_keys", { simple: true }) === 1;

    // better-sqlite3 defaults to foreign_keys=ON. D1 runs with FK enforcement
    // ON as well, but cascade deletes are NOT declared in our schema (no
    // ON DELETE clauses), so deleting a user/bako with dependents fails
    // loudly rather than cascading silently. Core (T06) must delete in the
    // right order explicitly.
    t.diagnostic(
      `foreign_keys pragma at open: ${defaultOn ? "ON" : "OFF"}; schema declares no ON DELETE actions`,
    );
    assert.equal(defaultOn, true);

    await t.test("fk violation is rejected when enforced", () => {
      assert.throws(() =>
        db
          .insert(bakos)
          .values({
            id: "b-orphan",
            name: "Orphan",
            createdBy: "no-such-user",
            createdAt: now,
          })
          .run(),
      );
    });

    await t.test("cascade deletes do not happen implicitly", () => {
      // FK enforced but no ON DELETE actions declared -> deleting a parent
      // is rejected instead of silently wiping children.
      assert.throws(() => db.delete(users).run());
      const remaining = db.select().from(memberships).all().length;
      assert.equal(remaining > 0, true);
    });
  });
});
