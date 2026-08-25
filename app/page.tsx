"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Clock3,
  Command,
  Flag,
  GripVertical,
  LayoutGrid,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";

type Status = "todo" | "in_progress" | "in_review" | "done";
type Priority = "low" | "normal" | "high";

type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assignee: string;
  assignee_color: string;
  labels: string[];
  comments: number;
  created_at: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  color: string;
  created_at: string;
};

const columns: { id: Status; label: string; color: string }[] = [
  { id: "todo", label: "To do", color: "#b7b9c0" },
  { id: "in_progress", label: "In progress", color: "#ff1e00" },
  { id: "in_review", label: "In review", color: "#ff8a00" },
  { id: "done", label: "Done", color: "#28a96b" },
];

const seedTasks: Task[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Create onboarding flow",
    description: "Map the new-user journey and reduce time to first value.",
    status: "todo",
    priority: "high",
    due_date: "2026-08-27",
    assignee: "Maya Chen",
    assignee_color: "#df6d91",
    labels: ["Design"],
    comments: 3,
    created_at: "2026-08-21T14:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Improve empty states",
    description: "Add useful prompts and clear actions throughout the app.",
    status: "todo",
    priority: "normal",
    due_date: "2026-09-03",
    assignee: "Noah Kim",
    assignee_color: "#3c8fd6",
    labels: ["Design", "UX"],
    comments: 1,
    created_at: "2026-08-22T10:30:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Build dashboard components",
    description: "Ship the reusable KPI, chart, and activity modules.",
    status: "in_progress",
    priority: "high",
    due_date: "2026-08-25",
    assignee: "Arnov K.",
    assignee_color: "#6c5ce7",
    labels: ["Frontend"],
    comments: 5,
    created_at: "2026-08-18T16:00:00Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Implement search API",
    description: "Support fast title and label search with ranked results.",
    status: "in_progress",
    priority: "normal",
    due_date: "2026-08-29",
    assignee: "Liam Patel",
    assignee_color: "#e78c46",
    labels: ["Backend"],
    comments: 2,
    created_at: "2026-08-19T11:00:00Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Polish mobile navigation",
    description: "Make the project navigation feel native on small screens.",
    status: "in_review",
    priority: "normal",
    due_date: "2026-08-26",
    assignee: "Maya Chen",
    assignee_color: "#df6d91",
    labels: ["Frontend", "UX"],
    comments: 4,
    created_at: "2026-08-20T09:45:00Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Set up analytics events",
    description: "Track activation, task creation, and workflow completion.",
    status: "done",
    priority: "low",
    due_date: "2026-08-22",
    assignee: "Noah Kim",
    assignee_color: "#3c8fd6",
    labels: ["Analytics"],
    comments: 0,
    created_at: "2026-08-15T12:00:00Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Document API conventions",
    description: "Capture naming, pagination, errors, and versioning decisions.",
    status: "done",
    priority: "normal",
    due_date: "2026-08-20",
    assignee: "Liam Patel",
    assignee_color: "#e78c46",
    labels: ["Docs"],
    comments: 2,
    created_at: "2026-08-14T15:00:00Z",
  },
];

const labelColors: Record<string, string> = {
  Design: "purple",
  UX: "pink",
  Frontend: "blue",
  Backend: "amber",
  Analytics: "green",
  Docs: "gray",
};

const defaultMembers: TeamMember[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", name: "Arnov K.", role: "Product Lead", email: "arnov@example.com", color: "#ff1e00", created_at: "2026-08-18T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", name: "Maya Chen", role: "Product Designer", email: "maya@example.com", color: "#df6d91", created_at: "2026-08-19T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", name: "Noah Kim", role: "Frontend Engineer", email: "noah@example.com", color: "#3c8fd6", created_at: "2026-08-20T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", name: "Liam Patel", role: "Backend Engineer", email: "liam@example.com", color: "#e78c46", created_at: "2026-08-21T12:00:00Z" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string | null) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function dueTone(task: Task) {
  if (!task.due_date || task.status === "done") return "normal";
  const due = new Date(`${task.due_date}T23:59:59`).getTime();
  const now = Date.now();
  if (due < now) return "overdue";
  if (due - now < 3 * 86400000) return "soon";
  return "normal";
}

function supabaseFromEnv(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dabeqikhaozsqgtawiyg.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? "sb_publishable_3FbaN1DZGf_SD6o--xWsHg_0w81P4a8";
  return url && key ? createClient(url, key) : null;
}

function TaskCard({ task, onOpen, overlay = false }: { task: Task; onOpen?: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: overlay,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const tone = dueTone(task);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? "dragging" : ""} ${overlay ? "overlay" : ""}`}
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onOpen?.()}
    >
      <div className="task-topline">
        <div className="task-labels">
          {task.labels.map((label) => (
            <span className={`tag ${labelColors[label] ?? "gray"}`} key={label}>
              {label}
            </span>
          ))}
        </div>
        <button
          className="drag-handle"
          aria-label={`Drag ${task.title}`}
          onClick={(event) => event.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </button>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="task-meta">
        <span className={`priority priority-${task.priority}`}>
          <Flag size={13} /> {task.priority}
        </span>
        {task.due_date && (
          <span className={`due due-${tone}`}>
            <CalendarDays size={13} /> {formatDate(task.due_date)}
          </span>
        )}
      </div>
      <div className="task-footer">
        <span className="avatar small" style={{ background: task.assignee_color }} title={task.assignee}>
          {getInitials(task.assignee)}
        </span>
        {task.comments > 0 && (
          <span className="comments">
            <MessageCircle size={14} /> {task.comments}
          </span>
        )}
      </div>
    </article>
  );
}

function Column({
  column,
  tasks,
  onAdd,
  onOpen,
}: {
  column: (typeof columns)[number];
  tasks: Task[];
  onAdd: (status: Status) => void;
  onOpen: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });
  return (
    <section ref={setNodeRef} className={`board-column ${isOver ? "is-over" : ""}`}>
      <header className="column-header">
        <div className="column-title">
          <span className="status-dot" style={{ background: column.color }} />
          <h2>{column.label}</h2>
          <span className="count">{tasks.length}</span>
        </div>
        <div className="column-actions">
          <button aria-label={`Add task to ${column.label}`} onClick={() => onAdd(column.id)}>
            <Plus size={17} />
          </button>
          <button aria-label={`${column.label} options`}>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </header>
      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={() => onOpen(task)} />
        ))}
        {tasks.length === 0 && (
          <button className="empty-state" onClick={() => onAdd(column.id)}>
            <span><Sparkles size={18} /></span>
            <strong>Clear for now</strong>
            <small>Add a task or drag one here</small>
          </button>
        )}
      </div>
      <button className="add-inline" onClick={() => onAdd(column.id)}>
        <Plus size={16} /> Add task
      </button>
    </section>
  );
}

type Draft = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string;
  assignee: string;
  labels: string;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  status: "todo",
  priority: "normal",
  due_date: "",
  assignee: "Arnov K.",
  labels: "",
};

function TaskModal({
  open,
  draft,
  setDraft,
  editing,
  onClose,
  onSave,
  onDelete,
  members,
}: {
  open: boolean;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  editing: Task | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  members: TeamMember[];
}) {
  if (!open) return null;
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">{editing ? "Task details" : "New task"}</span>
            <h2 id="task-modal-title">{editing ? "Update the work" : "What needs to get done?"}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="modal-body">
          <label className="field full">
            <span>Task title</span>
            <input autoFocus placeholder="e.g. Review launch checklist" value={draft.title} onChange={(e) => update("title", e.target.value)} />
          </label>
          <label className="field full">
            <span>Description</span>
            <textarea placeholder="Add context, goals, or links..." value={draft.description} onChange={(e) => update("description", e.target.value)} />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Status</span>
              <select value={draft.status} onChange={(e) => update("status", e.target.value as Status)}>
                {columns.map((column) => <option value={column.id} key={column.id}>{column.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={draft.priority} onChange={(e) => update("priority", e.target.value as Priority)}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
              </select>
            </label>
            <label className="field">
              <span>Assignee</span>
              <select value={draft.assignee} onChange={(e) => update("assignee", e.target.value)}>
                {members.map((member) => <option value={member.name} key={member.id}>{member.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input type="date" value={draft.due_date} onChange={(e) => update("due_date", e.target.value)} />
            </label>
          </div>
          <label className="field full">
            <span>Labels <em>separate with commas</em></span>
            <input placeholder="Design, Frontend" value={draft.labels} onChange={(e) => update("labels", e.target.value)} />
          </label>
          {editing && (
            <div className="activity-box">
              <div className="activity-icon"><Clock3 size={16} /></div>
              <div><strong>Activity</strong><p>Task opened for review · just now</p></div>
            </div>
          )}
        </div>
        <footer className="modal-footer">
          {editing ? <button className="danger-button" onClick={onDelete}>Delete task</button> : <span />}
          <div><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={onSave} disabled={!draft.title.trim()}>{editing ? "Save changes" : "Create task"}</button></div>
        </footer>
      </section>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>(defaultMembers);
  const [ready, setReady] = useState(false);
  const [dataMode, setDataMode] = useState<"syncing" | "cloud" | "local">("syncing");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }), useSensor(KeyboardSensor));

  useEffect(() => {
    let mounted = true;
    async function load() {
      const client = supabaseFromEnv();
      if (client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          let session = sessionData.session;
          if (!session) {
            const result = await client.auth.signInAnonymously();
            session = result.data.session;
          }
          if (!session) throw new Error("Guest session unavailable");
          const result = await client.from("tasks").select("*").order("created_at", { ascending: true });
          if (result.error) throw result.error;
          let taskRows = (result.data as Task[]) ?? [];
          if (!taskRows.length) {
            const seeded = await client.from("tasks").upsert(seedTasks.map((task) => ({ ...task, user_id: session.user.id }))).select();
            if (seeded.error) throw seeded.error;
            taskRows = (seeded.data as Task[]) ?? seedTasks;
          }
          const memberResult = await client.from("team_members").select("*").order("created_at", { ascending: true });
          let memberRows = memberResult.error ? [] : (memberResult.data as TeamMember[]) ?? [];
          if (!memberRows.length) {
            const seededMembers = await client.from("team_members").upsert(defaultMembers.map((member) => ({ ...member, user_id: session.user.id }))).select();
            if (!seededMembers.error) memberRows = (seededMembers.data as TeamMember[]) ?? defaultMembers;
          }
          if (mounted) {
            setTasks(taskRows);
            setMembers(memberRows.length ? memberRows : defaultMembers);
            setDataMode("cloud");
            setReady(true);
          }
          return;
        } catch {
          // Continue with a local demo so the interface remains fully usable.
        }
      }
      const saved = window.localStorage.getItem("taskify.tasks.v1") ?? window.localStorage.getItem("momentum.tasks.v1");
      const savedMembers = window.localStorage.getItem("taskify.members.v1");
      if (mounted) {
        setTasks(saved ? JSON.parse(saved) : seedTasks);
        setMembers(savedMembers ? JSON.parse(savedMembers) : defaultMembers);
        setDataMode("local");
        setReady(true);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (ready && dataMode === "local") window.localStorage.setItem("taskify.tasks.v1", JSON.stringify(tasks));
  }, [tasks, ready, dataMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery = !normalized || `${task.title} ${task.description} ${task.labels.join(" ")}`.toLowerCase().includes(normalized);
      return matchesQuery && (priority === "all" || task.priority === priority);
    });
  }, [tasks, query, priority]);

  const completed = tasks.filter((task) => task.status === "done").length;
  const overdue = tasks.filter((task) => dueTone(task) === "overdue").length;

  function showToast(message: string) { setToast(message); }

  async function persist(task: Task) {
    const client = supabaseFromEnv();
    if (dataMode !== "cloud" || !client) return;
    const { data: auth } = await client.auth.getUser();
    await client.from("tasks").upsert({ ...task, user_id: auth.user?.id });
  }

  async function remove(id: string) {
    const client = supabaseFromEnv();
    if (dataMode === "cloud" && client) await client.from("tasks").delete().eq("id", id);
  }

  function openNew(status: Status = "todo") {
    setEditing(null);
    setDraft({ ...emptyDraft, status });
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      assignee: task.assignee,
      labels: task.labels.join(", "),
    });
    setModalOpen(true);
  }

  function saveTask() {
    if (!draft.title.trim()) return;
    const member = members.find((item) => item.name === draft.assignee) ?? members[0] ?? defaultMembers[0];
    const next: Task = {
      id: editing?.id ?? crypto.randomUUID(),
      title: draft.title.trim(),
      description: draft.description.trim() || "No description added yet.",
      status: draft.status,
      priority: draft.priority,
      due_date: draft.due_date || null,
      assignee: member.name,
      assignee_color: member.color,
      labels: draft.labels.split(",").map((label) => label.trim()).filter(Boolean).slice(0, 3),
      comments: editing?.comments ?? 0,
      created_at: editing?.created_at ?? new Date().toISOString(),
    };
    setTasks((current) => editing ? current.map((task) => task.id === editing.id ? next : task) : [...current, next]);
    void persist(next);
    setModalOpen(false);
    showToast(editing ? "Task updated" : "Task created");
  }

  function deleteTask() {
    if (!editing) return;
    setTasks((current) => current.filter((task) => task.id !== editing.id));
    void remove(editing.id);
    setModalOpen(false);
    showToast("Task deleted");
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || active.id === over.id) return;
    const task = tasks.find((item) => item.id === active.id);
    if (!task) return;
    const overId = String(over.id);
    let nextStatus: Status | undefined;
    if (overId.startsWith("column:")) nextStatus = overId.replace("column:", "") as Status;
    else nextStatus = tasks.find((item) => item.id === over.id)?.status;
    if (!nextStatus || nextStatus === task.status) return;
    const updated = { ...task, status: nextStatus };
    setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    void persist(updated);
    showToast(`Moved to ${columns.find((column) => column.id === nextStatus)?.label}`);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark">T</span><span>TASKIFY</span><i>01</i></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className="active"><LayoutGrid size={18} /><span>Race control</span><span className="nav-pill">{tasks.length}</span></button>
          <Link href="/team"><Users size={18} /><span>Team</span><span className="coming-soon">{members.length}</span></Link>
        </nav>
        <div className="sidebar-section">
          <div className="sidebar-label"><span>Active sprints</span><button aria-label="Add project"><Plus size={15} /></button></div>
          <button className="project-item selected"><span className="project-icon purple"><Sparkles size={14} /></span><span>Product launch</span><b>LIVE</b></button>
          <button className="project-item"><span className="project-icon blue"><Command size={14} /></span><span>Website refresh</span></button>
          <button className="project-item"><span className="project-icon amber"><Circle size={14} /></span><span>Mobile app</span></button>
        </div>
        <div className="sidebar-team">
          <div className="sidebar-label"><span>Team</span><Link href="/team?add=1" aria-label="Add teammate"><Plus size={15} /></Link></div>
          <div className="avatar-stack">
            {members.slice(0, 5).map((member) => <span className="avatar" style={{ background: member.color }} title={member.name} key={member.id}>{getInitials(member.name)}</span>)}
            <Link className="avatar add-avatar" href="/team?add=1" aria-label="Add teammate"><Plus size={14} /></Link>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="workspace-card"><span className="avatar" style={{ background: "#ff1e00" }}>AK</span><div><strong>Arnov&apos;s paddock</strong><small>{dataMode === "cloud" ? "Guest · Synced" : "Guest · Demo"}</small></div><ChevronDown size={16} /></div>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="workspace">
        <div className="race-band"><span>SPRINT 06</span><p>Plan. Execute. Finish.</p><strong>LIVE BOARD <i /></strong></div>
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><span className="crumb">TASKIFY / RACE CONTROL / SPRINT 06</span><h1>Product launch <em>board</em></h1></div></div>
          <div className="topbar-actions">
            <div className={`sync-status ${dataMode}`}><span />{dataMode === "syncing" ? "Connecting" : dataMode === "cloud" ? "Synced" : "Demo mode"}</div>
            <button className="avatar user-avatar">AK</button>
            <button className="primary-button desktop-create" onClick={() => openNew()}><Plus size={17} /> Add task</button>
          </div>
        </header>

        <section className="board-head">
          <div className="summary-row">
            <div className="summary-item"><span className="summary-icon violet"><LayoutGrid size={17} /></span><div><strong>{tasks.length}</strong><small>Total tasks</small></div></div>
            <div className="summary-item"><span className="summary-icon green"><Check size={17} /></span><div><strong>{completed}</strong><small>Completed</small></div></div>
            <div className="summary-item"><span className="summary-icon coral"><Clock3 size={17} /></span><div><strong>{overdue}</strong><small>Overdue</small></div></div>
            <div className="progress-summary"><div><span>Sprint progress</span><strong>{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</strong></div><div className="progress-track"><span style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} /></div></div>
          </div>

          <div className="tools-row">
            <label className="search-box"><Search size={17} /><input aria-label="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</label>
            <div className="filters">
              <label className="select-filter"><SlidersHorizontal size={16} /><select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "all")} aria-label="Filter by priority"><option value="all">All priorities</option><option value="high">High priority</option><option value="normal">Normal priority</option><option value="low">Low priority</option></select><ChevronDown size={14} /></label>
              <div className="view-toggle" aria-label="View mode"><button className="active"><LayoutGrid size={16} /> Board</button></div>
            </div>
          </div>
        </section>

        {!ready ? (
          <div className="loading-board"><span className="spinner" /><strong>Preparing your workspace</strong><small>Starting a secure guest session...</small></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(event) => setActiveTask(tasks.find((task) => task.id === event.active.id) ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setActiveTask(null)}>
            <div className="board-scroll">
              <div className="board-grid">
                {columns.map((column) => (
                  <Column key={column.id} column={column} tasks={visibleTasks.filter((task) => task.status === column.id)} onAdd={openNew} onOpen={openEdit} />
                ))}
              </div>
            </div>
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
          </DndContext>
        )}
        <button className="mobile-create" onClick={() => openNew()} aria-label="New task"><Plus size={23} /></button>
      </main>

      <TaskModal open={modalOpen} draft={draft} setDraft={setDraft} editing={editing} onClose={() => setModalOpen(false)} onSave={saveTask} onDelete={deleteTask} members={members} />
      {toast && <div className="toast"><span><Check size={15} /></span>{toast}</div>}
    </div>
  );
}
