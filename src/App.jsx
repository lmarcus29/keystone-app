import { useState, useEffect, useRef } from "react";
import {
  Home, Users, Calendar, DollarSign, MessageSquare, FileText,
  Lock, Key, Bell, Send, Edit2, Plus, Check, Phone, Eye, EyeOff,
  Wrench, X, ChevronRight
} from "lucide-react";

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

const SEED = {
  clients: [
    { id: 1, name: "Margaret & Harold Whitfield", email: "whitfields@email.com", phone: "561-442-8801", address: "14 Pelican Cove Dr, Boca Raton FL", notes: "Up north May-Sept. Prefers texts.", season: "May-September", status: "active", codes: { garage: "4892*", alarm: "7714#", gate: "1028" }, emergency: "Daughter Karen: 561-330-9204" },
    { id: 2, name: "Dr. Robert & Anne Lassiter", email: "rlassiter@gmail.com", phone: "954-881-2200", address: "88 Coral Ridge Blvd, Fort Lauderdale FL", notes: "Dr. Lassiter uses a walker. Anne needs airport rides frequently.", season: "June-August", status: "active", codes: { garage: "3301*", alarm: "9982#", gate: "" }, emergency: "Son Brett: 954-771-0045" },
    { id: 3, name: "Frank Delgado", email: "fdelgado55@yahoo.com", phone: "786-554-6610", address: "22 Sawgrass Ln, Coral Springs FL", notes: "Winter resident only. Has a 24ft boat in side yard.", season: "November-March", status: "inactive", codes: { garage: "6640*", alarm: "2255#", gate: "5501" }, emergency: "Wife Maria: 786-554-6611" },
  ],
  jobs: [
    { id: 1, clientId: 1, type: "watching",  title: "Weekly Walkthrough",          date: "2026-03-10", time: "09:00", assignedTo: "Mike",   status: "pending",  notes: "Check sprinklers, pool level, collect mail." },
    { id: 2, clientId: 2, type: "transport", title: "Airport Ride - MIA",           date: "2026-03-07", time: "06:30", assignedTo: "Owner",  status: "pending",  notes: "Departing AA1045. Bill $65." },
    { id: 3, clientId: 1, type: "project",   title: "AC Filter Replacement",        date: "2026-03-05", time: "11:00", assignedTo: "Carlos", status: "complete", notes: "All 4 filters replaced." },
    { id: 4, clientId: 2, type: "transport", title: "Doctor Appt - Baptist Health", date: "2026-03-12", time: "14:00", assignedTo: "Owner",  status: "pending",  notes: "Both Anne and Dr. Lassiter." },
    { id: 5, clientId: 3, type: "watching",  title: "Boat Cover Check",             date: "2026-03-15", time: "10:00", assignedTo: "Carlos", status: "pending",  notes: "Check cover after last week wind." },
  ],
  invoices: [
    { id: 1, clientId: 1, amount: 320, description: "March house watching (4 visits) + AC filters", date: "2026-03-01", due: "2026-03-15", status: "pending" },
    { id: 2, clientId: 2, amount: 185, description: "Feb airport rides x2 + weekly walkthrough",    date: "2026-02-01", due: "2026-02-15", status: "overdue" },
    { id: 3, clientId: 3, amount: 240, description: "Nov-Dec boat checks (2) + walkthroughs (3)",   date: "2026-01-01", due: "2026-01-15", status: "overdue" },
  ],
  messages: [
    { id: 1, clientId: 1, from: "Margaret Whitfield", text: "Hi! Just checking - will someone be by Tuesday?", time: "Mar 5, 10:22am", fromClient: true },
    { id: 2, clientId: 1, from: "You", text: "Hi Margaret! Yes, Mike will do the full walkthrough Tuesday at 9am.", time: "Mar 5, 10:45am", fromClient: false },
    { id: 3, clientId: 2, from: "Anne Lassiter", text: "Just a reminder about Thursday morning - early flight, 6:30am pickup please!", time: "Mar 5, 3:10pm", fromClient: true },
    { id: 4, clientId: 2, from: "You", text: "All set Anne! I'll be there at 6:15. Safe travels!", time: "Mar 5, 3:22pm", fromClient: false },
  ],
  notes: [
    { id: 1, clientId: 1, title: "Pool pump failure - Mar 2025", text: "Found pool pump not running on routine check. Called ABC Pool Service. Repaired within 24 hrs.", date: "2025-03-18" },
    { id: 2, clientId: 2, title: "Front & side door rekeyed", text: "Locksmith rekeyed front and side entry per client request. New keys left in lockbox.", date: "2025-11-02" },
    { id: 3, clientId: 3, title: "Boat cover damaged by storm", text: "Found starboard side of boat cover torn after tropical storm. Frank authorized replacement up to $150.", date: "2025-09-14" },
  ],
};

const BADGE = {
  active:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive:  "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  pending:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  complete:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  paid:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  overdue:   "bg-red-50 text-red-700 ring-1 ring-red-200",
  watching:  "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  transport: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  project:   "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
};

const Badge = ({ type }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${BADGE[type] || BADGE.inactive}`}>
    {type}
  </span>
);

export default function App() {
  const [tab,       setTab]       = useState("dashboard");
  const [clients,   setClients]   = useState(() => load(SK.clients,  SEED.clients));
  const [jobs,      setJobs]      = useState(() => load(SK.jobs,     SEED.jobs));
  const [invoices,  setInvoices]  = useState(() => load(SK.invoices, SEED.invoices));
  const [messages,  setMessages]  = useState(() => load(SK.messages, SEED.messages));
  const [notes,     setNotes]     = useState(() => load(SK.notes,    SEED.notes));
  const [modal,     setModal]     = useState(null);
  const [selClient, setSelClient] = useState(null);
  const [draft,     setDraft]     = useState("");

  useEffect(() => save(SK.clients,  clients),  [clients]);
  useEffect(() => save(SK.jobs,     jobs),     [jobs]);
  useEffect(() => save(SK.invoices, invoices), [invoices]);
  useEffect(() => save(SK.messages, messages), [messages]);
  useEffect(() => save(SK.notes,    notes),    [notes]);

  const gc      = id => clients.find(c => c.id === id);
  const overdue = invoices.filter(i => i.status === "overdue");

  const saveClient = d => { d.id ? setClients(p => p.map(c => c.id===d.id ? d : c)) : setClients(p => [...p, { ...d, id: Date.now(), codes:{garage:"",alarm:"",gate:""} }]); setModal(null); };
  const saveJob    = d => { d.id ? setJobs(p => p.map(j => j.id===d.id ? d : j))    : setJobs(p => [...p, { ...d, id: Date.now(), status:"pending" }]);                       setModal(null); };
  const saveInv    = d => { d.id ? setInvoices(p => p.map(i => i.id===d.id ? d : i)): setInvoices(p => [...p, { ...d, id: Date.now(), status:"pending" }]);                    setModal(null); };
  const saveNote   = d => { d.id ? setNotes(p => p.map(n => n.id===d.id ? d : n))   : setNotes(p => [...p, { ...d, id: Date.now() }]);                                        setModal(null); };

  const sendMsg = () => {
    if (!draft.trim() || !selClient) return;
    setMessages(p => [...p, { id: Date.now(), clientId: selClient.id, from: "You", text: draft, time: "Just now", fromClient: false }]);
    setDraft("");
  };
  const markPaid = id => setInvoices(p => p.map(i => i.id===id ? {...i, status:"paid"} : i));
  const doneJob  = id => setJobs(p => p.map(j => j.id===id ? {...j, status:"complete"} : j));
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
    <div style={{fontFamily:"'DM Sans',sans-serif"}} className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Key size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none tracking-tight">KeyStone</div>
            <div className="text-[10px] text-blue-600 tracking-widest font-medium">HOUSE SERVICES</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <button onClick={() => setTab("billing")} className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1 text-xs text-red-600 font-medium hover:bg-red-100 transition-colors">
              <Bell size={11} />{overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""}
            </button>
          )}
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 flex-shrink-0 bg-white border-r border-gray-200 px-3 py-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden md:block">
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 px-2 mb-2">MENU</p>
          {nav.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all text-left
                ${tab === id ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <Icon size={15} />{label}
            </button>
          ))}
          <hr className="border-gray-100 my-4" />
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 px-2 mb-3">OVERVIEW</p>
          {[
            { label:"Active Clients", val: clients.filter(c=>c.status==="active").length, color:"text-blue-600" },
            { label:"Open Jobs",      val: jobs.filter(j=>j.status==="pending").length,   color:"text-blue-600" },
            { label:"Overdue $",      val: `$${overdue.reduce((s,i)=>s+i.amount,0)}`,     color:"text-red-500"  },
          ].map((s,i) => (
            <div key={i} className="px-2 mb-3">
              <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </nav>

        <main className="flex-1 p-6 overflow-y-auto min-w-0" key={tab}>
          {tab==="dashboard" && <Dashboard clients={clients} jobs={jobs} invoices={invoices} gc={gc} setTab={setTab} doneJob={doneJob} />}
          {tab==="clients"   && <Clients   clients={clients} setModal={setModal} goMsg={goMsg} />}
          {tab==="schedule"  && <Schedule  jobs={jobs} gc={gc} setModal={setModal} doneJob={doneJob} />}
          {tab==="billing"   && <Billing   invoices={invoices} gc={gc} setModal={setModal} markPaid={markPaid} />}
          {tab==="messages"  && <Messages  clients={clients} sel={selClient} setSel={setSelClient} allMsgs={messages} draft={draft} setDraft={setDraft} sendMsg={sendMsg} />}
          {tab==="notes"     && <Notes     notes={notes} gc={gc} setModal={setModal} />}
          {tab==="access"    && <Access    clients={clients} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {nav.slice(0,5).map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${tab===id ? "text-blue-600" : "text-gray-400"}`}>
            <Icon size={19} />{label}
          </button>
        ))}
      </nav>

      {modal?.type==="client"  && <ClientModal data={modal.data} clients={clients} onSave={saveClient} onClose={()=>setModal(null)} />}
      {modal?.type==="job"     && <JobModal    data={modal.data} clients={clients} onSave={saveJob}    onClose={()=>setModal(null)} />}
      {modal?.type==="invoice" && <InvModal    data={modal.data} clients={clients} onSave={saveInv}    onClose={()=>setModal(null)} />}
      {modal?.type==="note"    && <NoteModal   data={modal.data} clients={clients} onSave={saveNote}   onClose={()=>setModal(null)} />}
    </div>
  );
}

const Card = ({ children, className="" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>{children}</div>
);

const StatCard = ({ label, value, Icon, color, bg }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex justify-between items-start mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}><Icon size={14} className={color} /></div>
    </div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
  </div>
);

const Row = ({ children, className="" }) => (
  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-2 bg-white border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all ${className}`}>{children}</div>
);

const SectionHead = ({ title, sub, onAdd, addLabel="Add" }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
    {onAdd && (
      <button onClick={onAdd} className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
        <Plus size={14} />{addLabel}
      </button>
    )}
  </div>
);

const Empty = ({ msg="Nothing here yet" }) => (
  <div className="text-center py-12 text-gray-400 text-sm">{msg}</div>
);

function Dashboard({ clients, jobs, invoices, gc, setTab, doneJob }) {
  const today     = new Date().toISOString().split("T")[0];
  const todayJobs = jobs.filter(j => j.date===today && j.status==="pending");
  const upcoming  = jobs.filter(j => j.date>today && j.status==="pending").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const overdue   = invoices.filter(i => i.status==="overdue");
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Good morning!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your properties today.</p>
      </div>
      {overdue.length > 0 && (
        <div onClick={() => setTab("billing")} className="cursor-pointer flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6 hover:bg-red-100 transition-colors">
          <span>Warning: <strong>{overdue.length} overdue invoice{overdue.length>1?"s":""}</strong> totaling <strong>${overdue.reduce((s,i)=>s+i.amount,0)}</strong></span>
          <ChevronRight size={15} />
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Clients" value={clients.filter(c=>c.status==="active").length} Icon={Users}       color="text-blue-600"    bg="bg-blue-50" />
        <StatCard label="Open Jobs"      value={jobs.filter(j=>j.status==="pending").length}   Icon={Calendar}    color="text-violet-600"  bg="bg-violet-50" />
        <StatCard label="Outstanding"    value={`$${invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+i.amount,0)}`} Icon={DollarSign} color="text-red-500" bg="bg-red-50" />
        <StatCard label="Jobs Completed" value={jobs.filter(j=>j.status==="complete").length}  Icon={Check}       color="text-emerald-600" bg="bg-emerald-50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center"><Calendar size={13} className="text-blue-600"/></div>
            Today's Schedule
          </div>
          {todayJobs.length===0 ? <Empty msg="Nothing scheduled for today" /> : todayJobs.map(j => (
            <div key={j.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800">{j.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{gc(j.clientId)?.name} - {j.time} - {j.assignedTo}</div>
              </div>
              <button onClick={() => doneJob(j.id)} className="text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 flex-shrink-0 font-medium">Done</button>
            </div>
          ))}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center"><Wrench size={13} className="text-violet-600"/></div>
            Coming Up
          </div>
          {upcoming.length===0 ? <Empty msg="Schedule is clear ahead" /> : upcoming.map(j => (
            <div key={j.id} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{j.title}</span>
                <Badge type={j.type} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{gc(j.clientId)?.name} - {j.date} - {j.assignedTo}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Clients({ clients, setModal, goMsg }) {
  return (
    <div>
      <SectionHead title="Clients" sub="Manage your homeowner accounts" onAdd={() => setModal({type:"client",data:null})} addLabel="Add Client" />
      {clients.map(c => (
        <Row key={c.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{c.name}</span><Badge type={c.status} />
            </div>
            <div className="text-xs text-gray-500">{c.address}</div>
            <div className="text-xs text-gray-400 mt-0.5">Away: {c.season} - {c.phone}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => goMsg(c)} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><MessageSquare size={13}/></button>
            <button onClick={() => setModal({type:"client",data:c})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={13}/></button>
          </div>
        </Row>
      ))}
      {clients.length===0 && <Empty msg="No clients yet" />}
    </div>
  );
}

function Schedule({ jobs, gc, setModal, doneJob }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all","pending","complete","watching","transport","project"];
  const list = [...jobs].filter(j => filter==="all" ? true : j.type===filter||j.status===filter).sort((a,b)=>a.date.localeCompare(b.date));
  return (
    <div>
      <SectionHead title="Schedule" sub="All jobs, rides, and service visits" onAdd={() => setModal({type:"job",data:null})} addLabel="New Job" />
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter===f ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
            {f}
          </button>
        ))}
      </div>
      {list.map(j => (
        <Row key={j.id}>
          <div className="text-center w-12 flex-shrink-0 bg-gray-50 rounded-lg py-1.5">
            <div className="text-xs font-bold text-blue-600">{j.date.slice(5).replace("-","/")}</div>
            <div className="text-xs text-gray-400">{j.time}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-gray-800">{j.title}</span>
              <Badge type={j.type}/><Badge type={j.status}/>
            </div>
            <div className="text-xs text-gray-500">{gc(j.clientId)?.name} - {j.assignedTo}</div>
            {j.notes && <div className="text-xs text-gray-400 mt-0.5">{j.notes}</div>}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {j.status==="pending" && <button onClick={() => doneJob(j.id)} className="text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 font-medium">Done</button>}
            <button onClick={() => setModal({type:"job",data:j})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
      {list.length===0 && <Empty msg="No jobs match this filter" />}
    </div>
  );
}

function Billing({ invoices, gc, setModal, markPaid }) {
  const [filter, setFilter] = useState("all");
  const total = s => invoices.filter(i=>i.status===s).reduce((a,i)=>a+i.amount,0);
  const list  = invoices.filter(i => filter==="all" ? true : i.status===filter);
  return (
    <div>
      <SectionHead title="Billing" sub="Invoices and payments" onAdd={() => setModal({type:"invoice",data:null})} addLabel="New Invoice" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"Overdue",   val:`$${total("overdue")}`,  color:"text-red-600",     bg:"bg-red-50",     border:"border-red-100"     },
          { label:"Pending",   val:`$${total("pending")}`,  color:"text-blue-600",    bg:"bg-blue-50",    border:"border-blue-100"    },
          { label:"Collected", val:`$${total("paid")}`,     color:"text-emerald-600", bg:"bg-emerald-50", border:"border-emerald-100" },
        ].map((s,i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        {["all","pending","overdue","paid"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter===f ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
            {f}
          </button>
        ))}
      </div>
      {list.map(inv => (
        <Row key={inv.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{gc(inv.clientId)?.name}</span><Badge type={inv.status}/>
            </div>
            <div className="text-xs text-gray-500">{inv.description}</div>
            <div className="text-xs text-gray-400 mt-0.5">Issued {inv.date} - Due {inv.due}</div>
          </div>
          <div className={`text-xl font-bold flex-shrink-0 mx-3 ${inv.status==="overdue" ? "text-red-500" : "text-gray-800"}`}>${inv.amount}</div>
          <div className="flex gap-1.5 flex-shrink-0">
            {inv.status!=="paid" && <button onClick={() => markPaid(inv.id)} className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm">Mark Paid</button>}
            <button onClick={() => setModal({type:"invoice",data:inv})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
      {list.length===0 && <Empty msg="No invoices found" />}
    </div>
  );
}

function Messages({ clients, sel, setSel, allMsgs, draft, setDraft, sendMsg }) {
  const msgs   = sel ? allMsgs.filter(m => m.clientId===sel.id) : [];
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <div className="w-52 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base mb-3">Conversations</h2>
        {clients.map(c => (
          <button key={c.id} onClick={() => setSel(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl mb-1.5 transition-all border
              ${sel?.id===c.id ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}>
            <div className={`text-xs font-semibold ${sel?.id===c.id ? "text-white" : "text-gray-800"}`}>{c.name}</div>
            <div className={`text-[10px] mt-0.5 ${sel?.id===c.id ? "text-blue-100" : "text-gray-400"}`}>{c.phone}</div>
          </button>
        ))}
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden min-w-0 !p-4">
        {sel ? (
          <>
            <div className="pb-3 border-b border-gray-100 mb-3">
              <div className="font-bold text-gray-900">{sel.name}</div>
              <div className="text-xs text-gray-500">{sel.phone} - {sel.email}</div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3">
              {msgs.length===0 && <Empty msg="No messages yet" />}
              {msgs.map(m => (
                <div key={m.id} className={`flex ${m.fromClient ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] px-3.5 py-2.5 text-sm rounded-2xl leading-relaxed
                    ${m.fromClient ? "bg-gray-100 text-gray-800 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"}`}>
                    <div className={`text-[10px] mb-1 ${m.fromClient ? "text-gray-400" : "text-blue-200"}`}>{m.from} - {m.time}</div>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2">
              <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 placeholder-gray-400" />
              <button onClick={sendMsg} className="bg-blue-600 text-white px-3.5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <Send size={15}/>
              </button>
            </div>
          </>
        ) : <Empty msg="Select a client to view messages" />}
      </Card>
    </div>
  );
}

function Notes({ notes, gc, setModal }) {
  return (
    <div>
      <SectionHead title="Property Notes" sub="Log incidents, repairs, and observations" onAdd={() => setModal({type:"note",data:null})} addLabel="Add Note" />
      {notes.map(n => (
        <Card key={n.id} className="mb-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-semibold text-gray-900">{n.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{gc(n.clientId)?.name} - {n.date}</div>
            </div>
            <button onClick={() => setModal({type:"note",data:n})} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{n.text}</p>
        </Card>
      ))}
      {notes.length===0 && <Empty msg="No notes yet" />}
    </div>
  );
}

function Access({ clients }) {
  const [shown, setShown] = useState({});
  const toggle = (id,k) => setShown(p => ({...p, [`${id}-${k}`]: !p[`${id}-${k}`]}));
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Access Codes</h1>
      <p className="text-sm text-gray-500 mb-4">Reveal only when needed - stored locally on this device</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
        Codes are saved in your browser only. Never share this screen with unauthorized people.
      </div>
      {clients.map(c => (
        <Card key={c.id} className="mb-4">
          <div className="font-bold text-gray-900 text-base mb-0.5">{c.name}</div>
          <div className="text-xs text-gray-400 mb-4">{c.address}</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{l:"Garage",k:"garage"},{l:"Alarm",k:"alarm"},{l:"Gate",k:"gate"}].map(({l,k}) => (
              <div key={k} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{l}</div>
                {c.codes[k] ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg tracking-widest text-gray-800">{shown[`${c.id}-${k}`] ? c.codes[k] : "......"}</span>
                    <button onClick={() => toggle(c.id,k)} className="border border-gray-200 text-gray-400 p-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      {shown[`${c.id}-${k}`] ? <EyeOff size={11}/> : <Eye size={11}/>}
                    </button>
                  </div>
                ) : <span className="text-xs text-gray-300">Not set</span>}
              </div>
            ))}
          </div>
          {c.emergency && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Phone size={11} className="text-blue-500"/> Emergency: {c.emergency}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

const Modal = ({ title, onClose, onSave, saveLabel="Save", children }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto border border-gray-100" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-gray-100"><X size={14}/></button>
      </div>
      {children}
      <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={onSave}  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 shadow-sm">{saveLabel}</button>
      </div>
    </div>
  </div>
);

const FG = ({ label, children }) => (
  <div className="mb-3.5">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 placeholder-gray-400 transition-all";
const selCls   = `${inputCls} appearance-none cursor-pointer`;

function ClientModal({ data, onSave, onClose }) {
  const [f,setF] = useState(data || {name:"",email:"",phone:"",address:"",season:"",status:"active",notes:"",emergency:"",codes:{garage:"",alarm:"",gate:""}});
  const s  = (k,v) => setF(p=>({...p,[k]:v}));
  const sc = (k,v) => setF(p=>({...p,codes:{...p.codes,[k]:v}}));
  return (
    <Modal title={data?"Edit Client":"New Client"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Client">
      <div className="grid grid-cols-2 gap-3">
        <FG label="Full Name"><input className={inputCls} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Name(s)"/></FG>
        <FG label="Status"><select className={selCls} value={f.status} onChange={e=>s("status",e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></FG>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Email"><input className={inputCls} value={f.email} onChange={e=>s("email",e.target.value)}/></FG>
        <FG label="Phone"><input className={inputCls} value={f.phone} onChange={e=>s("phone",e.target.value)}/></FG>
      </div>
      <FG label="Property Address"><input className={inputCls} value={f.address} onChange={e=>s("address",e.target.value)}/></FG>
      <FG label="Season Away"><input className={inputCls} value={f.season} onChange={e=>s("season",e.target.value)} placeholder="e.g. May-September"/></FG>
      <FG label="Emergency Contact"><input className={inputCls} value={f.emergency} onChange={e=>s("emergency",e.target.value)}/></FG>
      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-1">Access Codes</p>
      <div className="grid grid-cols-3 gap-3">
        <FG label="Garage"><input className={inputCls} value={f.codes.garage} onChange={e=>sc("garage",e.target.value)}/></FG>
        <FG label="Alarm"><input className={inputCls} value={f.codes.alarm}  onChange={e=>sc("alarm",e.target.value)}/></FG>
        <FG label="Gate"><input className={inputCls} value={f.codes.gate}   onChange={e=>sc("gate",e.target.value)}/></FG>
      </div>
    </Modal>
  );
}

function JobModal({ data, clients, onSave, onClose }) {
  const [f,setF] = useState(data || {clientId:clients[0]?.id,type:"watching",title:"",date:"",time:"",assignedTo:"Owner",notes:"",status:"pending"});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Job":"New Job"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Job">
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Job Type"><select className={selCls} value={f.type} onChange={e=>s("type",e.target.value)}><option value="watching">House Watch</option><option value="transport">Transport / Ride</option><option value="project">Project / Task</option></select></FG>
        <FG label="Assigned To"><select className={selCls} value={f.assignedTo} onChange={e=>s("assignedTo",e.target.value)}><option>Owner</option><option>Mike</option><option>Carlos</option></select></FG>
      </div>
      <FG label="Job Title"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)} placeholder="e.g. Airport ride - MIA"/></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Time"><input className={inputCls} type="time" value={f.time} onChange={e=>s("time",e.target.value)}/></FG>
      </div>
      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

function InvModal({ data, clients, onSave, onClose }) {
  const [f,setF] = useState(data || {clientId:clients[0]?.id,amount:"",description:"",date:new Date().toISOString().split("T")[0],due:"",status:"pending"});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Invoice":"New Invoice"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Invoice">
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
  const [f,setF] = useState(data || {clientId:clients[0]?.id,title:"",text:"",date:new Date().toISOString().split("T")[0]});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Note":"New Property Note"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Note">
      <FG label="Property / Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FG>
      <div className="grid grid-cols-2 gap-3">
        <FG label="Title"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Brief summary"/></FG>
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
      </div>
      <FG label="Note"><textarea className={`${inputCls} resize-y min-h-[100px]`} value={f.text} onChange={e=>s("text",e.target.value)} placeholder="What happened, what was done, who was contacted..."/></FG>
    </Modal>
  );
}
