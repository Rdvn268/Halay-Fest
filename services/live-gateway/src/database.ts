import { DatabaseSync } from "node:sqlite";
import { defaultSettings, settingsSchema } from "@halay/contracts";
import type { GameSettings, LiveEvent } from "@halay/contracts";
import { migrations } from "./migrations.js";

export class LocalStore {
  readonly db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);",
    );
    for (const migration of migrations) {
      if (
        this.db
          .prepare("SELECT version FROM schema_migrations WHERE version=?")
          .get(migration.version)
      )
        continue;
      this.db.exec("BEGIN IMMEDIATE");
      try {
        this.db.exec(migration.sql);
        this.db
          .prepare("INSERT INTO schema_migrations(version) VALUES (?)")
          .run(migration.version);
        this.db.exec("COMMIT");
      } catch (error) {
        this.db.exec("ROLLBACK");
        this.db.close();
        throw error;
      }
    }
    // Demo data only: bounded retention, including records from previous launches.
    this.db
      .prepare("DELETE FROM event_inbox WHERE received_at < ?")
      .run(Date.now() - 86_400_000);
  }
  loadSettings(): GameSettings {
    const row = this.db
      .prepare("SELECT json FROM game_settings WHERE id=1")
      .get();
    return row
      ? settingsSchema.parse(JSON.parse(String(row["json"])))
      : { ...defaultSettings };
  }
  saveSettings(settings: GameSettings): void {
    this.db
      .prepare(
        "INSERT INTO game_settings(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
      )
      .run(JSON.stringify(settings));
  }
  record(event: LiveEvent): boolean {
    const result = this.db
      .prepare("INSERT OR IGNORE INTO event_inbox VALUES(?,?,?,?,?)")
      .run(
        event.source,
        event.roomId,
        event.eventId,
        event.receivedAt,
        JSON.stringify(event),
      );
    this.db.exec(
      "DELETE FROM event_inbox WHERE rowid NOT IN (SELECT rowid FROM event_inbox ORDER BY received_at DESC, rowid DESC LIMIT 1000)",
    );
    return Number(result.changes) === 1;
  }
  close(): void {
    this.db.close();
  }
}
