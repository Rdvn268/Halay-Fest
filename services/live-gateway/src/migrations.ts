export const migrations = [
  {
    version: 1,
    sql: `
  CREATE TABLE game_settings (id INTEGER PRIMARY KEY CHECK(id = 1), json TEXT NOT NULL);
  CREATE TABLE event_inbox (
    source TEXT NOT NULL, room_id TEXT NOT NULL, event_id TEXT NOT NULL,
    received_at INTEGER NOT NULL, json TEXT NOT NULL,
    PRIMARY KEY(source, room_id, event_id)
  );
  CREATE INDEX event_inbox_received_at ON event_inbox(received_at);
`,
  },
  {
    version: 2,
    sql: `
    CREATE TABLE music_tracks(id TEXT PRIMARY KEY, json TEXT NOT NULL, bytes INTEGER NOT NULL);
    CREATE TABLE music_library(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
  `,
  },
] as const;
