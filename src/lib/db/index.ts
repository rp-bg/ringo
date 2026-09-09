import { createClient, type Client } from '@libsql/client';
import path from 'path';

export * from './queries';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const dbPath = path.join(process.cwd(), 'ringo-todo.sqlite');
    client = createClient({
      url: `file:${dbPath}`,
    });
  }
  return client;
}

export async function initDatabase() {
  const db = getDb();

  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_icon TEXT NOT NULL,
      brand_color TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'Team Pro',
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_members (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL DEFAULT 'Layers',
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT 'FolderKanban',
      view_mode TEXT NOT NULL DEFAULT 'board',
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_lists (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'todo',
      due_date TEXT,
      estimated_hours REAL DEFAULT 0,
      actual_hours REAL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_assignees (
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (task_id, user_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      task_id TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (task_id, tag_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Check if seed data exists
  const existingTenants = await db.execute('SELECT COUNT(*) as count FROM tenants');
  const count = Number(existingTenants.rows[0]?.count || 0);

  if (count === 0) {
    await seedDatabase(db);
  }
}

async function seedDatabase(db: Client) {
  const now = new Date().toISOString();

  // 1. Tenants
  await db.execute({
    sql: `INSERT INTO tenants (id, name, slug, logo_icon, brand_color, plan, created_at) VALUES 
      ('tenant_acme', 'Acme Systems', 'acme', 'Zap', '#6366f1', 'Enterprise', ?),
      ('tenant_nebula', 'Nebula Creative Studio', 'nebula', 'Sparkles', '#ec4899', 'Team Pro', ?)`,
    args: [now, now],
  });

  // 2. Users
  await db.execute({
    sql: `INSERT INTO users (id, name, email, avatar, title, status) VALUES 
      ('user_sarah', 'Sarah Connor', 'sarah@acme.io', 'SC', 'VP of Engineering', 'active'),
      ('user_alex', 'Alex Chen', 'alex@acme.io', 'AC', 'Staff Infrastructure Engineer', 'focus_mode'),
      ('user_maya', 'Maya Lin', 'maya@acme.io', 'ML', 'Senior Product Designer', 'in_a_meeting'),
      ('user_liam', 'Liam Davis', 'liam@acme.io', 'LD', 'Full Stack Developer', 'active'),
      ('user_elena', 'Elena Rostova', 'elena@nebula.design', 'ER', 'Creative Director', 'active')`,
    args: [],
  });

  // 3. Tenant Members
  await db.execute({
    sql: `INSERT INTO tenant_members (id, tenant_id, user_id, role, joined_at) VALUES 
      ('tm_1', 'tenant_acme', 'user_sarah', 'owner', ?),
      ('tm_2', 'tenant_acme', 'user_alex', 'admin', ?),
      ('tm_3', 'tenant_acme', 'user_maya', 'member', ?),
      ('tm_4', 'tenant_acme', 'user_liam', 'member', ?),
      ('tm_5', 'tenant_nebula', 'user_elena', 'owner', ?),
      ('tm_6', 'tenant_nebula', 'user_maya', 'guest', ?)`,
    args: [now, now, now, now, now, now],
  });

  // 4. Workspaces for Acme
  await db.execute({
    sql: `INSERT INTO workspaces (id, tenant_id, name, slug, description, icon) VALUES 
      ('ws_eng', 'tenant_acme', 'Engineering & Infra', 'engineering', 'Platform architecture, services, and reliability', 'Code'),
      ('ws_prod', 'tenant_acme', 'Product & Design', 'product', 'Design systems, UX research, and product features', 'Palette'),
      ('ws_nebula_main', 'tenant_nebula', 'Brand Studio', 'brand', 'Brand identity, client deliverables, and design sprints', 'Sparkles')`,
    args: [],
  });

  // 5. Projects
  await db.execute({
    sql: `INSERT INTO projects (id, workspace_id, tenant_id, name, description, color, icon, view_mode, created_at) VALUES 
      ('proj_v2', 'ws_eng', 'tenant_acme', 'Cloud Platform V2', 'Complete migration to distributed architecture with zero downtime', '#6366f1', 'Server', 'board', ?),
      ('proj_ds', 'ws_prod', 'tenant_acme', 'Design System 3.0', 'Accessible tokens, glassmorphic UI components, and Figma sync', '#ec4899', 'LayoutGrid', 'board', ?),
      ('proj_nebula_rebrand', 'ws_nebula_main', 'tenant_nebula', 'FinTech Client Rebrand', 'Comprehensive visual identity and design tokens', '#8b5cf6', 'Sparkles', 'board', ?)`,
    args: [now, now, now],
  });

  // 6. Task Lists for Platform V2
  await db.execute({
    sql: `INSERT INTO task_lists (id, project_id, name, position, color) VALUES 
      ('list_backlog', 'proj_v2', 'Backlog', 0, '#64748b'),
      ('list_todo', 'proj_v2', 'To Do', 1, '#0284c7'),
      ('list_in_progress', 'proj_v2', 'In Progress', 2, '#eab308'),
      ('list_review', 'proj_v2', 'In Review', 3, '#a855f7'),
      ('list_done', 'proj_v2', 'Completed', 4, '#10b981')`,
    args: [],
  });

  // Task Lists for Design System
  await db.execute({
    sql: `INSERT INTO task_lists (id, project_id, name, position, color) VALUES 
      ('list_ds_todo', 'proj_ds', 'Planning', 0, '#0284c7'),
      ('list_ds_prog', 'proj_ds', 'Designing', 1, '#eab308'),
      ('list_ds_done', 'proj_ds', 'Shipped', 2, '#10b981')`,
    args: [],
  });

  // 7. Tags
  await db.execute({
    sql: `INSERT INTO tags (id, tenant_id, name, color) VALUES 
      ('tag_urgent', 'tenant_acme', 'P0-Critical', '#ef4444'),
      ('tag_frontend', 'tenant_acme', 'Frontend', '#06b6d4'),
      ('tag_backend', 'tenant_acme', 'Backend', '#8b5cf6'),
      ('tag_infra', 'tenant_acme', 'DevOps', '#f97316'),
      ('tag_security', 'tenant_acme', 'Security', '#e11d48')`,
    args: [],
  });

  // 8. Tasks for Platform V2
  const dueDate1 = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
  const dueDate2 = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];
  const dueDate3 = new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]; // Overdue
  const dueDate4 = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  await db.execute({
    sql: `INSERT INTO tasks (id, project_id, list_id, tenant_id, title, description, priority, status, due_date, estimated_hours, actual_hours, position, created_by, created_at, updated_at, completed_at) VALUES 
      ('task_1', 'proj_v2', 'list_in_progress', 'tenant_acme', 'Implement SQLite WAL mode & Multi-tenant partitioning', 'Ensure tenant isolation at the row level with strict workspace scoping. Enable Write-Ahead Logging for high concurrency.', 'urgent', 'in_progress', ?, 8, 5.5, 0, 'user_sarah', ?, ?, NULL),
      ('task_2', 'proj_v2', 'list_todo', 'tenant_acme', 'Zero-downtime database migration strategy', 'Design automated script to apply incremental SQLite schemas without blocking active reads.', 'high', 'todo', ?, 12, 0, 1, 'user_alex', ?, ?, NULL),
      ('task_3', 'proj_v2', 'list_backlog', 'tenant_acme', 'Benchmark query latency with 100k records', 'Profile full-text search indexing and evaluate memory footprint during bulk imports.', 'medium', 'backlog', ?, 6, 0, 2, 'user_liam', ?, ?, NULL),
      ('task_4', 'proj_v2', 'list_review', 'tenant_acme', 'Audit security headers and RBAC middleware', 'Validate that viewer role cannot mutate task properties or invite new workspace members.', 'urgent', 'in_review', ?, 4, 3.5, 3, 'user_sarah', ?, ?, NULL),
      ('task_5', 'proj_v2', 'list_done', 'tenant_acme', 'Setup Next.js App Router base shell', 'Initial scaffold with modern layout, header, responsive navigation, and dark theme tokens.', 'low', 'done', ?, 4, 4, 4, 'user_maya', ?, ?, ?)`,
    args: [dueDate1, now, now, dueDate2, now, now, dueDate4, now, now, dueDate3, now, now, dueDate1, now, now, now],
  });

  // Assignees
  await db.execute({
    sql: `INSERT INTO task_assignees (task_id, user_id) VALUES 
      ('task_1', 'user_alex'),
      ('task_1', 'user_liam'),
      ('task_2', 'user_alex'),
      ('task_3', 'user_liam'),
      ('task_4', 'user_sarah'),
      ('task_5', 'user_maya')`,
    args: [],
  });

  // Subtasks
  await db.execute({
    sql: `INSERT INTO subtasks (id, task_id, title, completed, position) VALUES 
      ('sub_1', 'task_1', 'Configure PRAGMA journal_mode = WAL', 1, 0),
      ('sub_2', 'task_1', 'Implement tenant_id foreign key indexes', 1, 1),
      ('sub_3', 'task_1', 'Write benchmark integration test suite', 0, 2),
      ('sub_4', 'task_2', 'Create snapshot backup helper', 0, 0),
      ('sub_5', 'task_2', 'Test rollback mechanism with simulated failure', 0, 1),
      ('sub_6', 'task_4', 'Verify Owner vs Admin permission guard', 1, 0),
      ('sub_7', 'task_4', 'Test Member restricted project mutation', 1, 1),
      ('sub_8', 'task_4', 'Block unauthenticated access to /api endpoints', 1, 2)`,
    args: [],
  });

  // Tags mapping
  await db.execute({
    sql: `INSERT INTO task_tags (task_id, tag_id) VALUES 
      ('task_1', 'tag_infra'),
      ('task_1', 'tag_backend'),
      ('task_2', 'tag_backend'),
      ('task_4', 'tag_security'),
      ('task_4', 'tag_urgent'),
      ('task_5', 'tag_frontend')`,
    args: [],
  });

  // Comments
  await db.execute({
    sql: `INSERT INTO comments (id, task_id, user_id, content, created_at) VALUES 
      ('comm_1', 'task_1', 'user_sarah', 'Please make sure WAL checkpointing runs periodically on idle so the journal file does not grow indefinitely.', ?),
      ('comm_2', 'task_1', 'user_alex', 'Done! Tested with 50 concurrent transactions and response time stayed under 12ms.', ?)`,
    args: [now, now],
  });

  // Activity Logs
  await db.execute({
    sql: `INSERT INTO activity_logs (id, tenant_id, task_id, user_id, action, details, created_at) VALUES 
      ('act_1', 'tenant_acme', 'task_1', 'user_alex', 'status_changed', 'Moved task to In Progress', ?),
      ('act_2', 'tenant_acme', 'task_4', 'user_sarah', 'status_changed', 'Moved task to In Review for audit review', ?),
      ('act_3', 'tenant_acme', 'task_5', 'user_maya', 'completed_task', 'Completed Next.js App Router base shell setup', ?)`,
    args: [now, now, now],
  });
}
