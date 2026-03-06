import { useState, useEffect, useRef } from "react";
import {
  Home, Users, Calendar, DollarSign, MessageSquare, FileText,
  Lock, Key, Bell, Send, Edit2, Plus, Check, Phone, Eye, EyeOff,
  Wrench, Car, BarChart2, X
} from "lucide-react";

// ── Versioned localStorage keys (per build standard) ──────────────────────────
const STORAGE_VERSION = "v1";
const SK = {
  clients:  `ks_${STORAGE_VERSION}_clients`,
  jobs:     `ks_${STORAGE_VERSION}_jobs`,
  invoices: `ks_${STORAGE_VERSION}_invoices`,
  messages: `ks_${STORAGE_VERSION}_messages`,
  notes:    `ks_${STORAGE_VERSION}_notes`,
};

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Seed Data ─────────────────────────────────────────────────────────────────
const SEED = {
  clients: [
    { id: 1, name: "Margaret & Harold Whitfield", email: "whitfields@email.com", phone: "561-442-8801", address: "14 Pelican Cove Dr, Boca Raton FL", notes: "Up north May–Sept. Prefers texts. Very detail-oriented. Check back porch screen door.", season: "May–September", status: "active", codes: { garage: "4892*", alarm: "7714#", gate: "1028" }, emergency: "Daughter Karen: 561-330-9204" },
    { id: 2, name: "Dr. Robert & Anne Lassiter", email: "rlassiter@gmail.com", phone: "954-881-2200", address: "88 Coral Ridge Blvd, Fort Lauderdale FL", notes: "Dr. Lassiter uses a walker. Anne needs airport rides frequently. Good tippers.", season: "June–August", status: "active", codes: { garage: "3301*", alarm: "9982#", gate: "" }, emergency: "Son Brett: 954-771-0045" },
    { id: 3, name: "Frank Delgado", email: "fdelgado55@yahoo.com", phone: "786-554-6610", address: "22 Sawgrass Ln, Coral Springs FL", notes: "Winter resident only. Has a 24ft boat in side yard — check monthly.", season: "November–March", status: "inactive", codes: { garage: "6640*", alarm: "2255#", gate: "5501" }, emergency: "Wife Maria: 786-554-6611" },
  ],
  jobs: [
    { id: 1, clientId: 1, type: "watching",   title: "Weekly Walkthrough",       date: "2026-03-10", time: "09:00", assignedTo: "Mike",  status: "pending",  notes: "Check sprinklers, pool level, collect mail." },
    { id: 2, clientId: 2, type: "transport",  title: "Airport Ride – MIA",        date: "2026-03-07", time: "06:30", assignedTo: "Owner", status: "pending",  notes: "Departing AA1045. Return pickup TBD. Bill $65 transport fee." },
    { id: 3, clientId: 1, type: "project",    title: "AC Filter Replacement",     date: "2026-03-05", time: "11:00", assignedTo: "Carlos",status: "complete", notes: "All 4 filters replaced. Left receipt on counter." },
    { id: 4, clientId: 2, type: "transport",  title: "Doctor Appt – Baptist Health", date: "2026-03-12", time: "14:00", assignedTo: "Owner", status: "pending", notes: "Both Anne and Dr. Lassiter. Allow extra time for walker." },
    { id: 5, clientId: 3, type: "watching",   title: "Boat Cover Check",          date: "2026-03-15", time: "10:00", assignedTo: "Carlos",status: "pending",  notes: "Check cover integrity after last week's wind." },
  ],
  invoices: [
    { id: 1, clientId: 1, amount: 320, description: "March house watching (4 visits) + AC filters", date: "2026-03-01", due: "2026-03-15", status: "pending" },
    { id: 2, clientId: 2, amount: 185, description: "Feb airport rides x2 + weekly walkthrough",    date: "2026-02-01", due: "2026-02-15", status: "overdue" },
    { id: 3, clientId: 3, amount: 240, description: "Nov–Dec boat checks (2) + walkthroughs (3)",   date: "2026-01-01", due: "2026-01-15", status: "overdue" },
  ],
  messages: [
    { id: 1, clientId: 1, from: "Margaret Whitfield", text: "Hi! Just checking — will someone be by Tuesday? We had a leak last year this time.", time: "Mar 5, 10:22am", fromClient: true },
    { id: 2, clientId: 1, from: "You", text: "Hi Margaret! Yes, Mike will do the full walkthrough Tuesday at 9am. He'll check under all the sinks too!", time: "Mar 5, 10:45am", fromClient: false },
    { id: 3, clientId: 2, from: "Anne Lassiter", text: "Just a reminder about Thursday morning — early flight, 6:30am pickup please!", time: "Mar 5, 3:10pm", fromClient: true },
    { id: 4, clientId: 2, from: "You", text: "All set Anne! I'll be there at 6:15. Safe travels!", time: "Mar 5, 3:22pm", fromClient: false },
  ],
  notes: [
    { id: 1, clientId: 1, title: "Pool pump failure – Mar 2025", text: "Found pool pump not running on routine check. Called ABC Pool Service. Repaired within 24 hrs. Whitfields notified via text.", date: "2025-03-18" },
    { id: 2, clientId: 2, title: "Front & side door rekeyed", text: "Locksmith rekeyed front and side entry per client request following cleaning company staff turnover. New keys left in lockbox.", date: "2025-11-02" },
    { id: 3, clientId: 3, title: "Boat cover damaged by storm", text: "Found starboard side of boat cover torn after tropical storm. Frank authorized replacement up to $150. New cover installed.", date: "2025-09-14" },
  ],
};

// ── Tag colors ────────────────────────────────────────────────────────────────
const TAG = {
  active:    "bg-green-900/30 text-green-400 border border-green-700/50",
  inactive:  "bg-slate-700/30 text-slate-400 border border-slate-600/50",
  pending:   "bg-amber-900/20 text-amber-400 border border-amber-600/40",
  complete:  "bg-green-900/30 text-green-400 border border-green-700/50",
  paid:      "bg-green-900/30 text-green-400 border border-green-700/50",
  overdue:   "bg-red-900/20 text-red-400 border border-red-700/40",
  watching:  "bg-green-900/20 text-green-300 border border-green-700/40",
  transport: "bg-blue-900/20 text-blue-300 border border-blue-700/40",
  project:   "bg-amber-900/20 text-amber-300 border border-amber-700/40",
};

const Tag = ({ type }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${TAG[type] || TAG.inactive}`}>
    {type}
  </span>
);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [clients, setClients] = useState(() => load(SK.clients,  SEED.clients));
  const [jobs,    setJobs]    = useState(() => load(SK.jobs,     SEED.jobs));
  const [invoices,setInvoices]= useState(() => load(SK.invoices, SEED.invoices));
  const [messages,setMessages]= useState(() => load(SK.messages, SEED.messages));
  const [notes,   setNotes]   = useState(() => load(SK.notes,    SEED.notes));
  const [modal,   setModal]   = useState(null);
  const [selClient,setSelClient] = useState(null);
  const [draft,   setDraft]   = useState("");

  useEffect(() => save(SK.clients,  clients),  [clients]);
  useEffect(() => save(SK.jobs,     jobs),     [jobs]);
  useEffect(() => save(SK.invoices, invoices), [invoices]);
  useEffect(() => save(SK.messages, messages), [messages]);
  useEffect(() => save(SK.notes,    notes),    [notes]);

  const gc = id => clients.find(c => c.id === id);
  const overdue     = invoices.filter(i => i.status === "overdue");
  const pendingJobs = jobs.filter(j => j.status === "pending");

  const saveClient = d => { d.id ? setClients(p => p.map(c => c.id===d.id ? d : c)) : setClients(p => [...p, { ...d, id: Date.now(), codes: { garage:"", alarm:"", gate:"" } }]); setModal(null); };
  const saveJob    = d => { d.id ? setJobs(p => p.map(j => j.id===d.id ? d : j))    : setJobs(p => [...p, { ...d, id: Date.now(), status: "pending" }]);                          setModal(null); };
  const saveInv    = d => { d.id ? setInvoices(p => p.map(i => i.id===d.id ? d : i)): setInvoices(p => [...p, { ...d, id: Date.now(), status: "pending" }]);                       setModal(null); };
  const saveNote   = d => { d.id ? setNotes(p => p.map(n => n.id===d.id ? d : n))   : setNotes(p => [...p, { ...d, id: Date.now() }]);                                            setModal(null); };

  const sendMsg = () => {
    if (!draft.trim() || !selClient) return;
    setMessages(p => [...p, { id: Date.now(), clientId: selClient.id, from: "You", text: draft, time: "Just now", fromClient: false }]);
    setDraft("");
  };
  const markPaid = id => setInvoices(p => p.map(i => i.id===id ? { ...i, status:"paid" } : i));
  const doneJob  = id => setJobs(p => p.map(j => j.id===id ? { ...j, status:"complete" } : j));
  const goMsg    = c  => { setSelClient(c); setTab("messages"); };

  const nav = [
    { id:"dashboard", label:"Dashboard",    Icon: Home },
    { id:"clients",   label:"Clients",      Icon: Users },
    { id:"schedule",  label:"Schedule",     Icon: Calendar },
    { id:"billing",   label:"Billing",      Icon: DollarSign },
    { id:"messages",  label:"Messages",     Icon: MessageSquare },
    { id:"notes",     label:"Notes",        Icon: FileText },
    { id:"access",    label:"Access Codes", Icon: Lock },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B2A] text-[#F5F0E8]">

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 h-14 bg-[#080f1a]/95 border-b border-amber-600/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Key size={16} className="text-[#0D1B2A]" />
          </div>
          <div>
            <div className="font-serif text-base text-[#F5F0E8] leading-none">KeyStone</div>
            <div className="text-[10px] text-amber-500 tracking-widest">HOUSE SERVICES</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <button onClick={() => setTab("billing")}
              className="flex items-center gap-1.5 bg-red-900/20 border border-red-700/40 rounded-full px-3 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors">
              <Bell size={12} />
              {overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""}
            </button>
          )}
          <span className="text-xs text-[#F5F0E8]/40 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
          </span>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <nav className="w-52 flex-shrink-0 bg-[#080f1a]/70 border-r border-amber-600/10 px-2.5 py-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden md:block">
          <p className="text-[9px] tracking-widest text-[#F5F0E8]/25 px-2 mb-2">NAVIGATION</p>
          {nav.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all text-left border-l-2
                ${tab === id
                  ? "bg-amber-500/14 text-amber-400 border-amber-500"
                  : "text-[#F5F0E8]/50 border-transparent hover:bg-amber-500/10 hover:text-[#F5F0E8]"}`}>
              <Icon size={15} />
              {label}
            </button>
          ))}

          <hr className="border-amber-600/12 my-4" />
          <p className="text-[9px] tracking-widest text-[#F5F0E8]/25 px-2 mb-3">QUICK STATS</p>
          {[
            { label: "Active Clients", val: clients.filter(c => c.status==="active").length, color: "text-amber-400" },
            { label: "Open Jobs",      val: pendingJobs.length,                              color: "text-amber-400" },
            { label: "Overdue $",      val: `$${overdue.reduce((s,i) => s+i.amount, 0)}`,    color: "text-red-400"   },
          ].map((s, i) => (
            <div key={i} className="px-2 mb-3">
              <div className="text-[10px] text-[#F5F0E8]/40">{s.label}</div>
              <div className={`font-serif text-2xl font-bold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </nav>

        {/* Main */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto min-w-0" key={tab}>
          {tab === "dashboard" && <Dashboard clients={clients} jobs={jobs} invoices={invoices} gc={gc} setTab={setTab} doneJob={doneJob} />}
          {tab === "clients"   && <Clients   clients={clients} setModal={setModal} goMsg={goMsg} />}
          {tab === "schedule"  && <Schedule  jobs={jobs} gc={gc} setModal={setModal} doneJob={doneJob} />}
          {tab === "billing"   && <Billing   invoices={invoices} gc={gc} setModal={setModal} markPaid={markPaid} />}
          {tab === "messages"  && <Messages  clients={clients} sel={selClient} setSel={setSelClient} allMsgs={messages} draft={draft} setDraft={setDraft} sendMsg={sendMsg} />}
          {tab === "notes"     && <Notes     notes={notes} gc={gc} setModal={setModal} />}
          {tab === "access"    && <Access    clients={clients} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080f1a]/97 border-t border-amber-600/18 flex z-50">
        {nav.slice(0, 5).map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors
              ${tab === id ? "text-amber-400" : "text-[#F5F0E8]/40"}`}>
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {modal?.type === "client"  && <ClientModal data={modal.data} clients={clients} onSave={saveClient} onClose={() => setModal(null)} />}
      {modal?.type === "job"     && <JobModal    data={modal.data} clients={clients} onSave={saveJob}    onClose={() => setModal(null)} />}
      {modal?.type === "invoice" && <InvModal    data={modal.data} clients={clients} onSave={saveInv}    onClose={() => setModal(null)} />}
      {modal?.type === "note"    && <NoteModal   data={modal.data} clients={clients} onSave={saveNote}   onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-[#1B4F72]/30 border border-amber-600/18 rounded-xl p-5 hover:border-amber-600/40 transition-colors ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, Icon, color }) => (
  <div className="bg-[#1B4F72]/35 border border-amber-600/12 rounded-xl p-4 md:p-5">
    <div className="flex justify-between items-start mb-2.5">
      <span className="text-xs text-[#F5F0E8]/40 font-medium">{label}</span>
      <Icon size={14} className={color} />
    </div>
    <div className={`font-serif text-3xl font-bold ${color}`}>{value}</div>
  </div>
);

const Row = ({ children, className = "" }) => (
  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-lg mb-1.5 bg-[#1B4F72]/18 border border-amber-600/8 hover:bg-[#1B4F72]/35 transition-colors ${className}`}>
    {children}
  </div>
);

const SectionHead = ({ title, sub, onAdd, addLabel = "Add" }) => (
  <div className="flex justify-between items-end mb-5">
    <div>
      <h1 className="font-serif text-2xl mb-1">{title}</h1>
      <p className="text-sm text-[#F5F0E8]/40">{sub}</p>
    </div>
    {onAdd && (
      <button onClick={onAdd} className="flex items-center gap-1.5 bg-amber-500 text-[#0D1B2A] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors">
        <Plus size={14} />{addLabel}
      </button>
    )}
  </div>
);

const Empty = ({ msg = "Nothing here yet" }) => (
  <div className="text-center py-10 text-[#F5F0E8]/28 text-sm">{msg}</div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ clients, jobs, invoices, gc, setTab, doneJob }) {
  const today      = new Date().toISOString().split("T")[0];
  const todayJobs  = jobs.filter(j => j.date === today && j.status === "pending");
  const upcoming   = jobs.filter(j => j.date > today  && j.status === "pending").sort((a,b) => a.date.localeCompare(b.date)).slice(0, 5);
  const overdue    = invoices.filter(i => i.status === "overdue");
  const outstanding= invoices.filter(i => i.status !== "paid").reduce((s,i) => s+i.amount, 0);

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <h1 className="font-serif text-3xl mb-1">Good morning 👋</h1>
      <p className="text-sm text-[#F5F0E8]/40 mb-5">Here's what's happening across your properties today.</p>

      {overdue.length > 0 && (
        <div onClick={() => setTab("billing")} className="cursor-pointer bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400 mb-5 hover:bg-amber-500/15 transition-colors">
          ⚠️ <strong>{overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""}</strong> totaling <strong>${overdue.reduce((s,i) => s+i.amount, 0)}</strong> — click to open billing.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Clients" value={clients.filter(c=>c.status==="active").length} Icon={Users}       color="text-green-400" />
        <StatCard label="Open Jobs"      value={pendingJobs => jobs.filter(j=>j.status==="pending").length}       Icon={Calendar}    color="text-amber-400" />
        <StatCard label="Outstanding"    value={`$${outstanding}`}                               Icon={DollarSign}  color="text-red-400" />
        <StatCard label="Jobs Done"      value={jobs.filter(j=>j.status==="complete").length}    Icon={Check}       color="text-blue-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-4">
            <Calendar size={14} /> Today's Schedule
          </div>
          {todayJobs.length === 0
            ? <Empty msg="Nothing on the books today 🌴" />
            : todayJobs.map(j => (
              <div key={j.id} className="flex justify-between items-center py-2.5 border-b border-amber-600/10 last:border-0 gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{j.title}</div>
                  <div className="text-xs text-[#F5F0E8]/42 mt-0.5">{gc(j.clientId)?.name} · {j.time} · {j.assignedTo}</div>
                </div>
                <button onClick={() => doneJob(j.id)} className="text-xs border border-amber-500 text-amber-400 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 flex-shrink-0">✓ Done</button>
              </div>
            ))
          }
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-4">
            <Wrench size={14} /> Coming Up
          </div>
          {upcoming.length === 0
            ? <Empty msg="Schedule is clear ahead" />
            : upcoming.map(j => (
              <div key={j.id} className="py-2.5 border-b border-amber-600/8 last:border-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium">{j.title}</span>
                  <Tag type={j.type} />
                </div>
                <div className="text-xs text-[#F5F0E8]/40 mt-1">{gc(j.clientId)?.name} · {j.date} · {j.assignedTo}</div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}

// ── Clients ───────────────────────────────────────────────────────────────────
function Clients({ clients, setModal, goMsg }) {
  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SectionHead title="Clients" sub="Manage your homeowner accounts" onAdd={() => setModal({ type:"client", data:null })} addLabel="Add Client" />
      {clients.map(c => (
        <Row key={c.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-serif text-base">{c.name}</span>
              <Tag type={c.status} />
            </div>
            <div className="text-xs text-[#F5F0E8]/45">{c.address}</div>
            <div className="text-xs text-[#F5F0E8]/35 mt-0.5">Away: {c.season} · {c.phone}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => goMsg(c)} title="Message" className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"><MessageSquare size={13} /></button>
            <button onClick={() => setModal({ type:"client", data:c })} title="Edit" className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"><Edit2 size={13} /></button>
          </div>
        </Row>
      ))}
      {clients.length === 0 && <Empty msg="No clients yet — add your first homeowner!" />}
    </div>
  );
}

// ── Schedule ──────────────────────────────────────────────────────────────────
function Schedule({ jobs, gc, setModal, doneJob }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all","pending","complete","watching","transport","project"];
  const list = [...jobs].filter(j => filter==="all" ? true : j.type===filter || j.status===filter).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SectionHead title="Schedule" sub="All jobs, rides, and service visits" onAdd={() => setModal({ type:"job", data:null })} addLabel="New Job" />
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors border
              ${filter===f ? "bg-amber-500 text-[#0D1B2A] border-amber-500" : "text-amber-400 border-amber-500 hover:bg-amber-500/10"}`}>
            {f}
          </button>
        ))}
      </div>
      {list.map(j => (
        <Row key={j.id}>
          <div className="text-center w-12 flex-shrink-0">
            <div className="text-xs text-amber-400 font-semibold">{j.date.slice(5).replace("-","/")}</div>
            <div className="text-xs text-[#F5F0E8]/45">{j.time}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium">{j.title}</span>
              <Tag type={j.type} /><Tag type={j.status} />
            </div>
            <div className="text-xs text-[#F5F0E8]/42">{gc(j.clientId)?.name} · {j.assignedTo}</div>
            {j.notes && <div className="text-xs text-[#F5F0E8]/30 mt-0.5">{j.notes}</div>}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {j.status === "pending" && <button onClick={() => doneJob(j.id)} className="text-xs border border-amber-500 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/10">✓</button>}
            <button onClick={() => setModal({ type:"job", data:j })} className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10"><Edit2 size={12} /></button>
          </div>
        </Row>
      ))}
      {list.length === 0 && <Empty msg="No jobs match this filter" />}
    </div>
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────
function Billing({ invoices, gc, setModal, markPaid }) {
  const [filter, setFilter] = useState("all");
  const total = s => invoices.filter(i => i.status===s).reduce((a,i) => a+i.amount, 0);
  const list  = invoices.filter(i => filter==="all" ? true : i.status===filter);

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SectionHead title="Billing" sub="Invoices & payments — bookkeeping center" onAdd={() => setModal({ type:"invoice", data:null })} addLabel="New Invoice" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label:"Overdue",   val:`$${total("overdue")}`,  color:"text-red-400"   },
          { label:"Pending",   val:`$${total("pending")}`,  color:"text-amber-400" },
          { label:"Collected", val:`$${total("paid")}`,     color:"text-green-400" },
        ].map((s, i) => (
          <div key={i} className="bg-[#1B4F72]/35 border border-amber-600/12 rounded-xl p-4">
            <div className="text-xs text-[#F5F0E8]/40 mb-2">{s.label}</div>
            <div className={`font-serif text-2xl font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {["all","pending","overdue","paid"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors border
              ${filter===f ? "bg-amber-500 text-[#0D1B2A] border-amber-500" : "text-amber-400 border-amber-500 hover:bg-amber-500/10"}`}>
            {f}
          </button>
        ))}
      </div>

      {list.map(inv => (
        <Row key={inv.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium">{gc(inv.clientId)?.name}</span>
              <Tag type={inv.status} />
            </div>
            <div className="text-xs text-[#F5F0E8]/48">{inv.description}</div>
            <div className="text-xs text-[#F5F0E8]/30 mt-0.5">Issued {inv.date} · Due {inv.due}</div>
          </div>
          <div className={`font-serif text-xl font-bold flex-shrink-0 mx-3 ${inv.status==="overdue" ? "text-red-400" : "text-amber-400"}`}>${inv.amount}</div>
          <div className="flex gap-1.5 flex-shrink-0">
            {inv.status !== "paid" && <button onClick={() => markPaid(inv.id)} className="bg-amber-500 text-[#0D1B2A] font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-400">Mark Paid</button>}
            <button onClick={() => setModal({ type:"invoice", data:inv })} className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10"><Edit2 size={12} /></button>
          </div>
        </Row>
      ))}
      {list.length === 0 && <Empty msg="No invoices found" />}
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
function Messages({ clients, sel, setSel, allMsgs, draft, setDraft, sendMsg }) {
  const msgs   = sel ? allMsgs.filter(m => m.clientId === sel.id) : [];
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  return (
    <div className="animate-[fadeIn_.3s_ease] flex gap-4 h-[calc(100vh-120px)]">
      <div className="w-48 flex-shrink-0">
        <h2 className="font-serif text-base mb-3">Conversations</h2>
        {clients.map(c => (
          <button key={c.id} onClick={() => setSel(c)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all border
              ${sel?.id===c.id ? "bg-amber-500/14 border-amber-500/38" : "bg-[#1B4F72]/18 border-transparent hover:bg-[#1B4F72]/30"}`}>
            <div className="text-xs font-medium">{c.name}</div>
            <div className="text-[10px] text-[#F5F0E8]/36 mt-0.5">{c.phone}</div>
          </button>
        ))}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-w-0 !p-4">
        {sel ? (
          <>
            <div className="pb-3 border-b border-amber-600/12 mb-3">
              <div className="font-serif text-base">{sel.name}</div>
              <div className="text-xs text-[#F5F0E8]/42">{sel.phone} · {sel.email}</div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3">
              {msgs.length === 0 && <Empty msg="No messages yet — say hello!" />}
              {msgs.map(m => (
                <div key={m.id} className={`flex ${m.fromClient ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[76%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl
                    ${m.fromClient
                      ? "bg-[#1B4F72]/50 border border-[#1B4F72]/85 rounded-tl-sm"
                      : "bg-amber-500/18 border border-amber-500/33 rounded-tr-sm"}`}>
                    <div className="text-[10px] text-[#F5F0E8]/40 mb-1">{m.from} · {m.time}</div>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2">
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMsg()}
                placeholder="Type a message…"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0D1B2A]/65 border border-amber-600/28 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/30 outline-none focus:border-amber-500" />
              <button onClick={sendMsg} className="bg-amber-500 text-[#0D1B2A] px-3.5 py-2.5 rounded-lg hover:bg-amber-400 transition-colors">
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <Empty msg="Select a client to view messages" />
        )}
      </Card>
    </div>
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function Notes({ notes, gc, setModal }) {
  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SectionHead title="Property Notes" sub="Log incidents, repairs, and observations" onAdd={() => setModal({ type:"note", data:null })} addLabel="Add Note" />
      {notes.map(n => (
        <Card key={n.id} className="mb-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-semibold text-sm mb-0.5">{n.title}</div>
              <div className="text-xs text-[#F5F0E8]/42">{gc(n.clientId)?.name} · {n.date}</div>
            </div>
            <button onClick={() => setModal({ type:"note", data:n })} className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10"><Edit2 size={12} /></button>
          </div>
          <p className="text-sm text-[#F5F0E8]/65 leading-relaxed">{n.text}</p>
        </Card>
      ))}
      {notes.length === 0 && <Empty msg="No notes yet" />}
    </div>
  );
}

// ── Access Codes ──────────────────────────────────────────────────────────────
function Access({ clients }) {
  const [shown, setShown] = useState({});
  const toggle = (id, k) => setShown(p => ({ ...p, [`${id}-${k}`]: !p[`${id}-${k}`] }));

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <h1 className="font-serif text-2xl mb-1">Access Codes</h1>
      <p className="text-sm text-[#F5F0E8]/40 mb-4">Reveal only when needed — stored locally on this device</p>
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400 mb-5">
        🔒 Codes are saved in your browser on this device only. Never share this app with unauthorized people.
      </div>
      {clients.map(c => (
        <Card key={c.id} className="mb-4">
          <div className="font-serif text-lg mb-0.5">{c.name}</div>
          <div className="text-xs text-[#F5F0E8]/42 mb-4">{c.address}</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{l:"🚗 Garage",k:"garage"},{l:"🔔 Alarm",k:"alarm"},{l:"🚪 Gate",k:"gate"}].map(({ l, k }) => (
              <div key={k} className="bg-[#0D1B2A]/50 border border-amber-600/18 rounded-lg p-3">
                <div className="text-xs text-[#F5F0E8]/40 mb-2">{l}</div>
                {c.codes[k] ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg tracking-widest text-amber-400">
                      {shown[`${c.id}-${k}`] ? c.codes[k] : "••••••"}
                    </span>
                    <button onClick={() => toggle(c.id, k)} className="border border-amber-500 text-amber-400 p-1 rounded hover:bg-amber-500/10">
                      {shown[`${c.id}-${k}`] ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </div>
                ) : <span className="text-xs text-[#F5F0E8]/25">Not set</span>}
              </div>
            ))}
          </div>
          {c.emergency && (
            <div className="flex items-center gap-1.5 text-xs text-[#F5F0E8]/42">
              <Phone size={11} className="text-amber-500" /> Emergency: {c.emergency}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── Modal base ────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSave, saveLabel="Save", children }) => (
  <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-[#0d2236] border border-amber-600/30 rounded-2xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto animate-[fadeIn_.25s_ease]" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-serif text-xl">{title}</h2>
        <button onClick={onClose} className="border border-amber-500 text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10"><X size={14} /></button>
      </div>
      {children}
      <div className="flex gap-3 justify-end mt-5">
        <button onClick={onClose} className="border border-amber-500 text-amber-400 px-4 py-2 rounded-lg text-sm hover:bg-amber-500/10">Cancel</button>
        <button onClick={onSave}  className="bg-amber-500 text-[#0D1B2A] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-400">{saveLabel}</button>
      </div>
    </div>
  </div>
);

const FG = ({ label, children }) => (
  <div className="mb-3.5">
    <label className="block text-xs text-[#F5F0E8]/55 font-semibold uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#0D1B2A]/65 border border-amber-600/28 text-sm text-[#F5F0E8] outline-none focus:border-amber-500 placeholder-[#F5F0E8]/30";
const selCls   = `${inputCls} appearance-none cursor-pointer bg-[#0D1B2A]/85`;

// ── Modals ────────────────────────────────────────────────────────────────────
function ClientModal({ data, onSave, onClose }) {
  const [f, setF] = useState(data || { name:"", email:"", phone:"", address:"", season:"", status:"active", notes:"", emergency:"", codes:{ garage:"", alarm:"", gate:"" } });
  const s  = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sc = (k, v) => setF(p => ({ ...p, codes: { ...p.codes, [k]: v } }));

  return (
    <Modal title={data ? "Edit Client" : "New Client"} onClose={onClose} onSave={() => onSave(f)} saveLabel="Save Client">
      <div className="grid grid-cols-2 gap-3">
        <FG label="Full Name"><input className={inputCls} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Name(s)"/></FG>
        <FG label="Status"><select className={selCls} value={f.status} onChange={e=>s("status",e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></FG>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Email"><input className={inputCls} value={f.email} onChange={e=>s("email",e.target.value)}/></FG>
        <FG label="Phone"><input className={inputCls} value={f.phone} onChange={e=>s("phone",e.target.value)}/></FG>
      </div>
      <FG label="Property Address"><input className={inputCls} value={f.address} onChange={e=>s("address",e.target.value)}/></FG>
      <FG label="Season Away"><input className={inputCls} value={f.season} onChange={e=>s("season",e.target.value)} placeholder="e.g. May–September"/></FG>
      <FG label="Emergency Contact"><input className={inputCls} value={f.emergency} onChange={e=>s("emergency",e.target.value)}/></FG>
      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
      <p className="text-xs text-amber-500 font-semibold tracking-wider mb-3">ACCESS CODES</p>
      <div className="grid grid-cols-3 gap-3">
        <FG label="Garage"><input className={inputCls} value={f.codes.garage} onChange={e=>sc("garage",e.target.value)}/></FG>
        <FG label="Alarm"><input className={inputCls} value={f.codes.alarm}  onChange={e=>sc("alarm",e.target.value)}/></FG>
        <FG label="Gate"><input className={inputCls} value={f.codes.gate}   onChange={e=>sc("gate",e.target.value)}/></FG>
      </div>
    </Modal>
  );
}

function JobModal({ data, clients, onSave, onClose }) {
  const [f, setF] = useState(data || { clientId:clients[0]?.id, type:"watching", title:"", date:"", time:"", assignedTo:"Owner", notes:"", status:"pending" });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <Modal title={data ? "Edit Job" : "New Job"} onClose={onClose} onSave={() => onSave(f)} saveLabel="Save Job">
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Job Type"><select className={selCls} value={f.type} onChange={e=>s("type",e.target.value)}><option value="watching">House Watch</option><option value="transport">Transport / Ride</option><option value="project">Project / Task</option></select></FG>
        <FG label="Assigned To"><select className={selCls} value={f.assignedTo} onChange={e=>s("assignedTo",e.target.value)}><option>Owner</option><option>Mike</option><option>Carlos</option></select></FG>
      </div>
      <FG label="Job Title"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)} placeholder="e.g. Airport ride – MIA, AA1045"/></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Time"><input className={inputCls} type="time" value={f.time} onChange={e=>s("time",e.target.value)}/></FG>
      </div>
      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

function InvModal({ data, clients, onSave, onClose }) {
  const [f, setF] = useState(data || { clientId:clients[0]?.id, amount:"", description:"", date:new Date().toISOString().split("T")[0], due:"", status:"pending" });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <Modal title={data ? "Edit Invoice" : "New Invoice"} onClose={onClose} onSave={() => onSave(f)} saveLabel="Save Invoice">
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Amount ($)"><input className={inputCls} type="number" value={f.amount} onChange={e=>s("amount",Number(e.target.value))}/></FG>
        <FG label="Status"><select className={selCls} value={f.status} onChange={e=>s("status",e.target.value)}><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></FG>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Invoice Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Due Date"><input className={inputCls} type="date" value={f.due} onChange={e=>s("due",e.target.value)}/></FG>
      </div>
      <FG label="Services Rendered"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.description} onChange={e=>s("description",e.target.value)}/></FG>
    </Modal>
  );
}

function NoteModal({ data, clients, onSave, onClose }) {
  const [f, setF] = useState(data || { clientId:clients[0]?.id, title:"", text:"", date:new Date().toISOString().split("T")[0] });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <Modal title={data ? "Edit Note" : "New Property Note"} onClose={onClose} onSave={() => onSave(f)} saveLabel="Save Note">
      <FG label="Property / Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Title"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Brief summary"/></FG>
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
      </div>
      <FG label="Note"><textarea className={`${inputCls} resize-y min-h-[100px]`} value={f.text} onChange={e=>s("text",e.target.value)} placeholder="What happened, what was done, who was contacted…"/></FG>
    </Modal>
  );
}

