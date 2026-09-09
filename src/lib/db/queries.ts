import { getDb, initDatabase } from './index';
import type { InValue } from '@libsql/client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_icon: string;
  brand_color: string;
  plan: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  status: string;
  role?: string;
}

export interface Workspace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  tenant_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  view_mode: string;
  created_at: string;
  task_count?: number;
  completed_count?: number;
}

export interface TaskList {
  id: string;
  project_id: string;
  name: string;
  position: number;
  color: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  position: number;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_title: string;
  content: string;
  created_at: string;
}

export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  list_id: string;
  tenant_id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignees: User[];
  subtasks: Subtask[];
  tags: Tag[];
  comments_count: number;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  task_id: string | null;
  task_title?: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total?: number | string;
  completed?: number | string;
  in_progress?: number | string;
  todo?: number | string;
  backlog?: number | string;
  urgent_open?: number | string;
  overdue?: number | string;
}

export interface AnalyticsWorkloadUser {
  id: string;
  name: string;
  avatar: string;
  title: string;
  assigned_count?: number | string;
  completed_count?: number | string;
}

export interface AnalyticsData {
  overview?: AnalyticsOverview;
  workload?: AnalyticsWorkloadUser[];
}

// 1. Tenants & Context
export async function getTenants(): Promise<Tenant[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute('SELECT * FROM tenants ORDER BY created_at ASC');
  return res.rows as unknown as Tenant[];
}

export async function getTenantMembers(tenantId: string): Promise<User[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT u.*, tm.role 
          FROM users u 
          JOIN tenant_members tm ON u.id = tm.user_id 
          WHERE tm.tenant_id = ? 
          ORDER BY tm.role = 'owner' DESC, tm.role = 'admin' DESC, u.name ASC`,
    args: [tenantId],
  });
  return res.rows as unknown as User[];
}

export async function getAllUsers(): Promise<User[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute('SELECT * FROM users ORDER BY name ASC');
  return res.rows as unknown as User[];
}

// 2. Workspaces & Projects
export async function getWorkspaces(tenantId: string): Promise<Workspace[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM workspaces WHERE tenant_id = ? ORDER BY name ASC',
    args: [tenantId],
  });
  return res.rows as unknown as Workspace[];
}

export async function getProjects(tenantId: string, workspaceId?: string): Promise<Project[]> {
  await initDatabase();
  const db = getDb();
  let sql = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND (t.status = 'done' OR t.completed_at IS NOT NULL)) as completed_count
    FROM projects p
    WHERE p.tenant_id = ?
  `;
  const args: InValue[] = [tenantId];

  if (workspaceId) {
    sql += ' AND p.workspace_id = ?';
    args.push(workspaceId);
  }
  sql += ' ORDER BY p.created_at ASC';

  const res = await db.execute({ sql, args });
  return res.rows as unknown as Project[];
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM projects WHERE id = ?',
    args: [projectId],
  });
  return (res.rows[0] as unknown as Project) || null;
}

export async function getTaskLists(projectId: string): Promise<TaskList[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT * FROM task_lists WHERE project_id = ? ORDER BY position ASC',
    args: [projectId],
  });
  return res.rows as unknown as TaskList[];
}

// 3. Tasks
export async function getTasks(options: {
  tenantId: string;
  projectId?: string;
  workspaceId?: string;
  userId?: string;
  status?: string;
  search?: string;
}): Promise<Task[]> {
  await initDatabase();
  const db = getDb();

  let sql = `
    SELECT t.*, p.name as project_name,
      (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comments_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.tenant_id = ?
  `;
  const args: InValue[] = [options.tenantId];

  if (options.projectId) {
    sql += ' AND t.project_id = ?';
    args.push(options.projectId);
  }

  if (options.workspaceId) {
    sql += ' AND p.workspace_id = ?';
    args.push(options.workspaceId);
  }

  if (options.userId) {
    sql += ' AND t.id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)';
    args.push(options.userId);
  }

  if (options.status) {
    sql += ' AND t.status = ?';
    args.push(options.status);
  }

  if (options.search) {
    sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    args.push(`%${options.search}%`, `%${options.search}%`);
  }

  sql += ' ORDER BY t.position ASC, t.created_at DESC';

  const res = await db.execute({ sql, args });
  const baseTasks = res.rows as unknown as (Task & { comments_count: number })[];

  // Populate assignees, subtasks, and tags
  const tasksWithDetails: Task[] = [];
  for (const task of baseTasks) {
    const [assigneesRes, subtasksRes, tagsRes] = await Promise.all([
      db.execute({
        sql: `SELECT u.* FROM users u JOIN task_assignees ta ON u.id = ta.user_id WHERE ta.task_id = ?`,
        args: [task.id],
      }),
      db.execute({
        sql: `SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC`,
        args: [task.id],
      }),
      db.execute({
        sql: `SELECT tags.* FROM tags JOIN task_tags tt ON tags.id = tt.tag_id WHERE tt.task_id = ?`,
        args: [task.id],
      }),
    ]);

    tasksWithDetails.push({
      ...task,
      assignees: assigneesRes.rows as unknown as User[],
      subtasks: subtasksRes.rows as unknown as Subtask[],
      tags: tagsRes.rows as unknown as Tag[],
      comments_count: Number(task.comments_count || 0),
    });
  }

  return tasksWithDetails;
}

export async function getTaskDetails(taskId: string): Promise<{
  task: Task;
  comments: Comment[];
  activity: ActivityLog[];
} | null> {
  await initDatabase();
  const db = getDb();

  const taskRes = await db.execute({
    sql: `SELECT t.*, p.name as project_name,
            (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comments_count
          FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE t.id = ?`,
    args: [taskId],
  });

  if (taskRes.rows.length === 0) return null;
  const rawTask = taskRes.rows[0] as unknown as Task;

  const [assigneesRes, subtasksRes, tagsRes, commentsRes, activityRes] = await Promise.all([
    db.execute({
      sql: `SELECT u.* FROM users u JOIN task_assignees ta ON u.id = ta.user_id WHERE ta.task_id = ?`,
      args: [taskId],
    }),
    db.execute({
      sql: `SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC`,
      args: [taskId],
    }),
    db.execute({
      sql: `SELECT tags.* FROM tags JOIN task_tags tt ON tags.id = tt.tag_id WHERE tt.task_id = ?`,
      args: [taskId],
    }),
    db.execute({
      sql: `SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.title as user_title
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC`,
      args: [taskId],
    }),
    db.execute({
      sql: `SELECT a.*, u.name as user_name, u.avatar as user_avatar
            FROM activity_logs a
            JOIN users u ON a.user_id = u.id
            WHERE a.task_id = ?
            ORDER BY a.created_at DESC`,
      args: [taskId],
    }),
  ]);

  const task: Task = {
    ...rawTask,
    assignees: assigneesRes.rows as unknown as User[],
    subtasks: subtasksRes.rows as unknown as Subtask[],
    tags: tagsRes.rows as unknown as Tag[],
    comments_count: Number(rawTask.comments_count || 0),
  };

  return {
    task,
    comments: commentsRes.rows as unknown as Comment[],
    activity: activityRes.rows as unknown as ActivityLog[],
  };
}

// 4. Task Mutations
export async function createTask(data: {
  projectId: string;
  listId: string;
  tenantId: string;
  title: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string | null;
  estimatedHours?: number;
  createdBy: string;
  assigneeIds?: string[];
  tagIds?: string[];
}): Promise<string> {
  await initDatabase();
  const db = getDb();
  const taskId = 'task_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  // Get max position in list
  const maxPosRes = await db.execute({
    sql: 'SELECT MAX(position) as max_pos FROM tasks WHERE list_id = ?',
    args: [data.listId],
  });
  const position = (Number(maxPosRes.rows[0]?.max_pos) || 0) + 1;

  // Determine initial status based on list
  const listRes = await db.execute({
    sql: 'SELECT name FROM task_lists WHERE id = ?',
    args: [data.listId],
  });
  const listName = (listRes.rows[0]?.name as string)?.toLowerCase() || '';
  let status: Task['status'] = 'todo';
  if (listName.includes('backlog')) status = 'backlog';
  else if (listName.includes('progress')) status = 'in_progress';
  else if (listName.includes('review')) status = 'in_review';
  else if (listName.includes('done') || listName.includes('completed')) status = 'done';

  await db.execute({
    sql: `INSERT INTO tasks (
      id, project_id, list_id, tenant_id, title, description, priority, status,
      due_date, estimated_hours, position, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      taskId,
      data.projectId,
      data.listId,
      data.tenantId,
      data.title,
      data.description || '',
      data.priority || 'medium',
      status,
      data.dueDate || null,
      data.estimatedHours || 0,
      position,
      data.createdBy,
      now,
      now,
    ],
  });

  // Assignees
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    for (const userId of data.assigneeIds) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)',
        args: [taskId, userId],
      });
    }
  }

  // Tags
  if (data.tagIds && data.tagIds.length > 0) {
    for (const tagId of data.tagIds) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)',
        args: [taskId, tagId],
      });
    }
  }

  // Log activity
  await db.execute({
    sql: `INSERT INTO activity_logs (id, tenant_id, task_id, user_id, action, details, created_at)
          VALUES (?, ?, ?, ?, 'created_task', ?, ?)`,
    args: [
      'act_' + Math.random().toString(36).substring(2, 9),
      data.tenantId,
      taskId,
      data.createdBy,
      `Created task "${data.title}"`,
      now,
    ],
  });

  return taskId;
}

export async function updateTask(taskId: string, updates: Partial<Task>, currentUserId: string): Promise<void> {
  await initDatabase();
  const db = getDb();
  const now = new Date().toISOString();

  const currentTaskRes = await db.execute({
    sql: 'SELECT * FROM tasks WHERE id = ?',
    args: [taskId],
  });
  if (currentTaskRes.rows.length === 0) return;
  const current = currentTaskRes.rows[0] as unknown as Task;

  const setClauses: string[] = ['updated_at = ?'];
  const args: InValue[] = [now];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    args.push(updates.title);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    args.push(updates.description);
  }
  if (updates.priority !== undefined) {
    setClauses.push('priority = ?');
    args.push(updates.priority);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    args.push(updates.status);
    if (updates.status === 'done' && !current.completed_at) {
      setClauses.push('completed_at = ?');
      args.push(now);
    } else if (updates.status !== 'done') {
      setClauses.push('completed_at = NULL');
    }
  }
  if (updates.list_id !== undefined) {
    setClauses.push('list_id = ?');
    args.push(updates.list_id);
  }
  if (updates.due_date !== undefined) {
    setClauses.push('due_date = ?');
    args.push(updates.due_date);
  }
  if (updates.estimated_hours !== undefined) {
    setClauses.push('estimated_hours = ?');
    args.push(updates.estimated_hours);
  }
  if (updates.actual_hours !== undefined) {
    setClauses.push('actual_hours = ?');
    args.push(updates.actual_hours);
  }
  if (updates.position !== undefined) {
    setClauses.push('position = ?');
    args.push(updates.position);
  }

  args.push(taskId);

  await db.execute({
    sql: `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  // Log activity for meaningful changes
  if (updates.status && updates.status !== current.status) {
    await db.execute({
      sql: `INSERT INTO activity_logs (id, tenant_id, task_id, user_id, action, details, created_at)
            VALUES (?, ?, ?, ?, 'status_changed', ?, ?)`,
      args: [
        'act_' + Math.random().toString(36).substring(2, 9),
        current.tenant_id,
        taskId,
        currentUserId,
        `Changed status from ${current.status} to ${updates.status}`,
        now,
      ],
    });
  }
}

export async function moveTask(
  taskId: string,
  targetListId: string,
  newPosition: number,
  newStatus: Task['status'],
  userId: string
): Promise<void> {
  await initDatabase();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `UPDATE tasks 
          SET list_id = ?, position = ?, status = ?, 
              completed_at = (CASE WHEN ? = 'done' THEN ? ELSE NULL END),
              updated_at = ? 
          WHERE id = ?`,
    args: [targetListId, newPosition, newStatus, newStatus, now, now, taskId],
  });

  await db.execute({
    sql: `INSERT INTO activity_logs (id, tenant_id, task_id, user_id, action, details, created_at)
          VALUES (?, (SELECT tenant_id FROM tasks WHERE id = ?), ?, ?, 'status_changed', ?, ?)`,
    args: [
      'act_' + Math.random().toString(36).substring(2, 9),
      taskId,
      taskId,
      userId,
      `Moved task to ${newStatus}`,
      now,
    ],
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await initDatabase();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM tasks WHERE id = ?',
    args: [taskId],
  });
}

// 5. Subtasks
export async function addSubtask(taskId: string, title: string): Promise<Subtask> {
  await initDatabase();
  const db = getDb();
  const id = 'sub_' + Math.random().toString(36).substring(2, 9);

  const posRes = await db.execute({
    sql: 'SELECT MAX(position) as max_pos FROM subtasks WHERE task_id = ?',
    args: [taskId],
  });
  const position = (Number(posRes.rows[0]?.max_pos) || 0) + 1;

  await db.execute({
    sql: 'INSERT INTO subtasks (id, task_id, title, completed, position) VALUES (?, ?, ?, 0, ?)',
    args: [id, taskId, title, position],
  });

  return { id, task_id: taskId, title, completed: 0, position };
}

export async function toggleSubtask(subtaskId: string, completed: boolean): Promise<void> {
  await initDatabase();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE subtasks SET completed = ? WHERE id = ?',
    args: [completed ? 1 : 0, subtaskId],
  });
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  await initDatabase();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM subtasks WHERE id = ?',
    args: [subtaskId],
  });
}

// 6. Comments
export async function addComment(taskId: string, userId: string, content: string): Promise<Comment> {
  await initDatabase();
  const db = getDb();
  const id = 'comm_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO comments (id, task_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [id, taskId, userId, content, now],
  });

  const userRes = await db.execute({
    sql: 'SELECT name, avatar, title FROM users WHERE id = ?',
    args: [userId],
  });
  const user = userRes.rows[0];

  return {
    id,
    task_id: taskId,
    user_id: userId,
    user_name: (user?.name as string) || 'User',
    user_avatar: (user?.avatar as string) || 'U',
    user_title: (user?.title as string) || 'Member',
    content,
    created_at: now,
  };
}

// 7. Activity Logs & Analytics
export async function getActivityLogs(tenantId: string, limit = 20): Promise<ActivityLog[]> {
  await initDatabase();
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT a.*, u.name as user_name, u.avatar as user_avatar, t.title as task_title
          FROM activity_logs a
          JOIN users u ON a.user_id = u.id
          LEFT JOIN tasks t ON a.task_id = t.id
          WHERE a.tenant_id = ?
          ORDER BY a.created_at DESC
          LIMIT ?`,
    args: [tenantId, limit],
  });
  return res.rows as unknown as ActivityLog[];
}

export async function getTenantAnalytics(tenantId: string): Promise<AnalyticsData> {
  await initDatabase();
  const db = getDb();

  const totalTasksRes = await db.execute({
    sql: `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'done' OR completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
            SUM(CASE WHEN status = 'backlog' THEN 1 ELSE 0 END) as backlog,
            SUM(CASE WHEN priority = 'urgent' AND status != 'done' THEN 1 ELSE 0 END) as urgent_open,
            SUM(CASE WHEN due_date < date('now') AND (status != 'done' AND completed_at IS NULL) THEN 1 ELSE 0 END) as overdue
          FROM tasks WHERE tenant_id = ?`,
    args: [tenantId],
  });

  const workloadRes = await db.execute({
    sql: `SELECT u.id, u.name, u.avatar, u.title,
            COUNT(ta.task_id) as assigned_count,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_count
          FROM users u
          JOIN tenant_members tm ON u.id = tm.user_id
          LEFT JOIN task_assignees ta ON u.id = ta.user_id
          LEFT JOIN tasks t ON ta.task_id = t.id AND t.tenant_id = ?
          WHERE tm.tenant_id = ?
          GROUP BY u.id
          ORDER BY assigned_count DESC`,
    args: [tenantId, tenantId],
  });

  return {
    overview: (totalTasksRes.rows[0] as unknown as AnalyticsOverview) || undefined,
    workload: (workloadRes.rows as unknown as AnalyticsWorkloadUser[]) || [],
  };
}

// 8. Organization / Settings
export async function updateTenantSettings(
  tenantId: string,
  settings: { name?: string; brandColor?: string; plan?: string }
): Promise<void> {
  await initDatabase();
  const db = getDb();
  const setClauses: string[] = [];
  const args: InValue[] = [];

  if (settings.name) {
    setClauses.push('name = ?');
    args.push(settings.name);
  }
  if (settings.brandColor) {
    setClauses.push('brand_color = ?');
    args.push(settings.brandColor);
  }
  if (settings.plan) {
    setClauses.push('plan = ?');
    args.push(settings.plan);
  }

  if (setClauses.length > 0) {
    args.push(tenantId);
    await db.execute({
      sql: `UPDATE tenants SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });
  }
}

export async function inviteTenantMember(
  tenantId: string,
  email: string,
  name: string,
  role: string
): Promise<User> {
  await initDatabase();
  const db = getDb();
  const now = new Date().toISOString();

  // Check if user exists
  const userCheck = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });

  let userId: string;
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'TM';

  if (userCheck.rows.length > 0) {
    userId = userCheck.rows[0].id as string;
  } else {
    userId = 'user_' + Math.random().toString(36).substring(2, 9);
    await db.execute({
      sql: 'INSERT INTO users (id, name, email, avatar, title, status) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, name, email, avatar, 'Team Member', 'active'],
    });
  }

  const memberId = 'tm_' + Math.random().toString(36).substring(2, 9);
  await db.execute({
    sql: 'INSERT OR REPLACE INTO tenant_members (id, tenant_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)',
    args: [memberId, tenantId, userId, role, now],
  });

  return {
    id: userId,
    name,
    email,
    avatar,
    title: 'Team Member',
    status: 'active',
    role,
  };
}
