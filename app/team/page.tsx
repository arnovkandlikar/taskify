"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleUserRound,
  LayoutGrid,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  color: string;
  created_at: string;
};

type MemberDraft = {
  name: string;
  role: string;
  email: string;
  color: string;
};

const defaultMembers: TeamMember[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", name: "Arnov K.", role: "Product Lead", email: "arnov@example.com", color: "#ff1e00", created_at: "2026-08-18T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", name: "Maya Chen", role: "Product Designer", email: "maya@example.com", color: "#df6d91", created_at: "2026-08-19T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", name: "Noah Kim", role: "Frontend Engineer", email: "noah@example.com", color: "#3c8fd6", created_at: "2026-08-20T12:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", name: "Liam Patel", role: "Backend Engineer", email: "liam@example.com", color: "#e78c46", created_at: "2026-08-21T12:00:00Z" },
];

const colors = ["#ff1e00", "#df6d91", "#3c8fd6", "#e78c46", "#24a476", "#7559dc"];

const emptyDraft: MemberDraft = {
  name: "",
  role: "Frontend Engineer",
  email: "",
  color: "#ff1e00",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function supabaseFromEnv(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dabeqikhaozsqgtawiyg.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? "sb_publishable_3FbaN1DZGf_SD6o--xWsHg_0w81P4a8";
  return url && key ? createClient(url, key) : null;
}

function MemberModal({
  open,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  open: boolean;
  draft: MemberDraft;
  setDraft: (draft: MemberDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  const update = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setDraft({ ...draft, [key]: value });

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal team-modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">New team member</span>
            <h2 id="member-modal-title">Add to the grid</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="modal-body">
          <div className="member-preview">
            <span className="member-avatar preview" style={{ background: draft.color }}>
              {draft.name ? getInitials(draft.name) : <CircleUserRound size={24} />}
            </span>
            <div><strong>{draft.name || "New teammate"}</strong><small>{draft.role}</small></div>
          </div>
          <label className="field full">
            <span>Full name</span>
            <input autoFocus placeholder="e.g. Jordan Lee" value={draft.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Role</span>
              <select value={draft.role} onChange={(event) => update("role", event.target.value)}>
                <option>Product Lead</option>
                <option>Product Designer</option>
                <option>Frontend Engineer</option>
                <option>Backend Engineer</option>
                <option>Data Analyst</option>
                <option>QA Engineer</option>
              </select>
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" placeholder="name@example.com" value={draft.email} onChange={(event) => update("email", event.target.value)} />
            </label>
          </div>
          <div className="field">
            <span>Driver color</span>
            <div className="color-picker">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={draft.color === color ? "selected" : ""}
                  style={{ background: color }}
                  aria-label={`Choose ${color}`}
                  onClick={() => update("color", color)}
                >
                  {draft.color === color && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <span />
          <div>
            <button className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" onClick={onSave} disabled={!draft.name.trim() || !draft.email.trim()}>
              <UserPlus size={15} /> Add member
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [ready, setReady] = useState(false);
  const [dataMode, setDataMode] = useState<"syncing" | "cloud" | "local">("syncing");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(emptyDraft);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const client = supabaseFromEnv();
      if (client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          let session = sessionData.session;
          if (!session) session = (await client.auth.signInAnonymously()).data.session;
          if (!session) throw new Error("Guest session unavailable");
          const result = await client.from("team_members").select("*").order("created_at", { ascending: true });
          if (result.error) throw result.error;
          let memberRows = (result.data as TeamMember[]) ?? [];
          if (!memberRows.length) {
            const seeded = await client.from("team_members").upsert(defaultMembers.map((member) => ({ ...member, user_id: session.user.id }))).select();
            if (seeded.error) throw seeded.error;
            memberRows = (seeded.data as TeamMember[]) ?? defaultMembers;
          }
          if (mounted) {
            setMembers(memberRows.length ? memberRows : defaultMembers);
            setDataMode("cloud");
            setReady(true);
          }
          return;
        } catch {
          // Use the local demo store if Supabase has not been configured yet.
        }
      }
      const saved = window.localStorage.getItem("taskify.members.v1");
      if (mounted) {
        setMembers(saved ? JSON.parse(saved) : defaultMembers);
        setDataMode("local");
        setReady(true);
      }
    }
    load();
    setModalOpen(new URLSearchParams(window.location.search).get("add") === "1");
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (ready && dataMode === "local") {
      window.localStorage.setItem("taskify.members.v1", JSON.stringify(members));
    }
  }, [members, ready, dataMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const roles = useMemo(() => Array.from(new Set(members.map((member) => member.role))).sort(), [members]);
  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesText = !normalized || `${member.name} ${member.role} ${member.email}`.toLowerCase().includes(normalized);
      return matchesText && (role === "all" || member.role === role);
    });
  }, [members, query, role]);

  const engineeringCount = members.filter((member) => member.role.includes("Engineer")).length;

  async function saveMember() {
    if (!draft.name.trim() || !draft.email.trim()) return;
    const member: TeamMember = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      role: draft.role,
      email: draft.email.trim(),
      color: draft.color,
      created_at: new Date().toISOString(),
    };
    setMembers((current) => [...current, member]);
    const client = supabaseFromEnv();
    if (dataMode === "cloud" && client) {
      const { data: auth } = await client.auth.getUser();
      await client.from("team_members").insert({ ...member, user_id: auth.user?.id });
    }
    setDraft(emptyDraft);
    setModalOpen(false);
    setToast(`${member.name} joined the team`);
  }

  async function deleteMember(member: TeamMember) {
    setMembers((current) => current.filter((item) => item.id !== member.id));
    const client = supabaseFromEnv();
    if (dataMode === "cloud" && client) await client.from("team_members").delete().eq("id", member.id);
    setToast(`${member.name} removed`);
  }

  return (
    <div className="app-shell team-app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link className="brand" href="/"><span className="brand-mark">T</span><span>TASKIFY</span><i>01</i></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/"><LayoutGrid size={18} /><span>Race control</span></Link>
          <Link href="/team" className="active"><Users size={18} /><span>Team</span><span className="nav-pill">{members.length}</span></Link>
        </nav>
        <div className="sidebar-section team-side-panel">
          <div className="sidebar-label"><span>Team status</span></div>
          <div className="side-stat"><Zap size={16} /><div><strong>{members.length}</strong><small>Active members</small></div></div>
          <div className="side-stat"><ShieldCheck size={16} /><div><strong>{engineeringCount}</strong><small>Engineers</small></div></div>
        </div>
        <div className="sidebar-team">
          <div className="sidebar-label"><span>On the grid</span></div>
          <div className="avatar-stack">
            {members.slice(0, 6).map((member) => (
              <span className="avatar" style={{ background: member.color }} title={member.name} key={member.id}>{getInitials(member.name)}</span>
            ))}
          </div>
        </div>
        <div className="sidebar-bottom">
          <Link href="/" className="workspace-card"><span className="avatar" style={{ background: "#ff1e00" }}>AK</span><div><strong>Arnov&apos;s paddock</strong><small>Back to race control</small></div><ChevronDown size={16} /></Link>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="workspace team-workspace">
        <div className="race-band"><span>TEAM GRID</span><p>Build the crew. Share the load.</p><strong>ROSTER LIVE <i /></strong></div>
        <header className="topbar team-topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <div><span className="crumb">TASKIFY / PADDOCK / TEAM</span><h1>Team <em>roster</em></h1></div>
          </div>
          <div className="topbar-actions">
            <div className={`sync-status ${dataMode}`}><span />{dataMode === "syncing" ? "Connecting" : dataMode === "cloud" ? "Synced" : "Demo mode"}</div>
            <button className="primary-button" onClick={() => setModalOpen(true)}><UserPlus size={16} /> Add member</button>
          </div>
        </header>

        <section className="team-stats">
          <article><span>01</span><div><strong>{members.length}</strong><small>Total crew</small></div></article>
          <article><span>02</span><div><strong>{engineeringCount}</strong><small>Engineering</small></div></article>
          <article><span>03</span><div><strong>{Math.max(0, members.length - engineeringCount)}</strong><small>Product & design</small></div></article>
          <div className="team-capacity"><div><small>Team capacity</small><strong>{Math.min(100, members.length * 18)}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, members.length * 18)}%` }} /></div></div>
        </section>

        <section className="team-content">
          <div className="team-tools">
            <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the roster..." aria-label="Search team members" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</label>
            <label className="select-filter"><Users size={16} /><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option>{roles.map((item) => <option value={item} key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
          </div>

          {!ready ? (
            <div className="loading-board"><span className="spinner" /><strong>Loading the team grid</strong><small>Preparing your roster...</small></div>
          ) : visibleMembers.length ? (
            <div className="member-grid">
              {visibleMembers.map((member, index) => (
                <article className="member-card" key={member.id}>
                  <div className="member-position">P{String(index + 1).padStart(2, "0")}</div>
                  <div className="member-card-top">
                    <span className="member-avatar" style={{ background: member.color }}>{getInitials(member.name)}</span>
                    <button aria-label={`More options for ${member.name}`}><MoreHorizontal size={18} /></button>
                  </div>
                  <h2>{member.name}</h2>
                  <p>{member.role}</p>
                  <a href={`mailto:${member.email}`}><Mail size={14} />{member.email}</a>
                  <div className="member-card-footer">
                    <span><i /> Available</span>
                    <button onClick={() => deleteMember(member)} aria-label={`Remove ${member.name}`}><Trash2 size={14} /> Remove</button>
                  </div>
                </article>
              ))}
              <button className="add-member-card" onClick={() => setModalOpen(true)}>
                <span><Plus size={22} /></span><strong>Add a teammate</strong><small>Expand your crew for the next sprint</small>
              </button>
            </div>
          ) : (
            <div className="team-empty"><Search size={24} /><strong>No teammates found</strong><p>Try another name or role.</p><button className="secondary-button" onClick={() => { setQuery(""); setRole("all"); }}>Clear filters</button></div>
          )}
        </section>
      </main>

      <MemberModal open={modalOpen} draft={draft} setDraft={setDraft} onClose={() => setModalOpen(false)} onSave={saveMember} />
      {toast && <div className="toast"><span><Check size={15} /></span>{toast}</div>}
    </div>
  );
}
