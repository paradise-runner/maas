import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'maas.db');

let db: any;

import { Database } from "bun:sqlite";
db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS service_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface ServiceLabel {
  id: number;
  label: string;
  created_at: string;
}

export class ServiceLabelsDB {
  static getAllLabels(): ServiceLabel[] {
    const stmt = db.prepare('SELECT * FROM service_labels ORDER BY label');
    return stmt.all() as ServiceLabel[];
  }

  static addLabel(label: string): ServiceLabel {
    const stmt = db.prepare('INSERT INTO service_labels (label) VALUES (?)');
    const result = stmt.run(label);
    
    const getStmt = db.prepare('SELECT * FROM service_labels WHERE id = ?');
    return getStmt.get(result.lastInsertRowid) as ServiceLabel;
  }

  static removeLabel(id: number): boolean {
    const stmt = db.prepare('DELETE FROM service_labels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static removeLabelByName(label: string): boolean {
    const stmt = db.prepare('DELETE FROM service_labels WHERE label = ?');
    const result = stmt.run(label);
    return result.changes > 0;
  }
}

export default db;