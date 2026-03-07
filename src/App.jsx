import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Users, Calendar, DollarSign, MessageSquare, FileText,
  Lock, Key, Bell, Send, Edit2, Plus, Check, Phone, Eye, EyeOff,
  Wrench, X, ChevronRight, Search, Download, Filter, AlertTriangle,
  AlertCircle, Info, Car, Plane, Stethoscope, MapPin, Clock,
  CreditCard, Printer, ChevronDown, Star, ToggleLeft, ToggleRight,
  History, Tag, Percent, Package, User, Home as HomeIcon
} from "lucide-react";

// ── Storage ───────────────────────────────────────────────────────────────────
const V = "v2";
const SK = {
  clients:  `ks_${V}_clients`,
  jobs:     `ks_${V}_jobs`,
  invoices: `ks_${V}_invoices`,
  payments: `ks_${V}_payments`,
  messages: `ks_${V}_messages`,
  notes:    `ks_${V}_notes`,
  services: `ks_${V}_services`,
};
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Helpers ───────────────────────────────────────────────────────────────────
const genAcct = () => String(Math.floor(10000 + Math.random() * 90000));
const today = () => new Date().toISOString().split("T")[0];
const fmt$ = n => `$${Number(n||0).toFixed(2)}`;
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "";

// ── Default services ──────────────────────────────────────────────────────────
const DEFAULT_SERVICES = [
  { id:1, name:"House Walkthrough",      fee:45,  category:"watching" },
  { id:2, name:"Extended House Watch",   fee:75,  category:"watching" },
  { id:3, name:"Airport Transportation", fee:65,  category:"transport" },
  { id:4, name:"Medical Transportation", fee:55,  category:"transport" },
  { id:5, name:"General Transportation", fee:50,  category:"transport" },
  { id:6, name:"AC Filter Replacement",  fee:35,  category:"project" },
  { id:7, name:"Mail Collection",        fee:15,  category:"project" },
  { id:8, name:"Pool Check",             fee:25,  category:"project" },
  { id:9, name:"Storm Preparation",      fee:85,  category:"project" },
  { id:10,name:"Other / Custom",         fee:0,   category:"other" },
];

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED = {
  clients: [
    { id:1, acct:"47382", firstName:"Margaret", lastName:"Whitfield", secondaryName:"Harold Whitfield", email:"whitfields@email.com", phone:"561-442-8801",
      street:"14 Pelican Cove Dr", city:"Boca Raton", state:"FL", zip:"33428",
      notes:"Prefers texts. Very detail-oriented. Check back porch screen door.",
      seasonStart:"2026-05-01", seasonEnd:"2026-09-30", status:"active", isHome:false,
      monitoringFee:150,
      codes:{ garage:"4892*", alarm:"7714#", gate:"1028" },
      emergency:{ name:"Karen Whitfield", phone:"561-330-9204", email:"karen.w@gmail.com", relationship:"Daughter" }
    },
    { id:2, acct:"82951", firstName:"Robert", lastName:"Lassiter", secondaryName:"Anne Lassiter", email:"rlassiter@gmail.com", phone:"954-881-2200",
      street:"88 Coral Ridge Blvd", city:"Fort Lauderdale", state:"FL", zip:"33308",
      notes:"Dr. Lassiter uses a walker. Anne needs airport rides frequently. Good tippers.",
      seasonStart:"2026-06-01", seasonEnd:"2026-08-31", status:"active", isHome:false,
      monitoringFee:175,
      codes:{ garage:"3301*", alarm:"9982#", gate:"" },
      emergency:{ name:"Brett Lassiter", phone:"954-771-0045", email:"brett.l@gmail.com", relationship:"Son" }
    },
    { id:3, acct:"63017", firstName:"Frank", lastName:"Delgado", secondaryName:"", email:"fdelgado55@yahoo.com", phone:"786-554-6610",
      street:"22 Sawgrass Ln", city:"Coral Springs", state:"FL", zip:"33065",
      notes:"Winter resident only. Has a 24ft boat in side yard — check monthly.",
      seasonStart:"2026-11-01", seasonEnd:"2027-03-31", status:"inactive", isHome:false,
      monitoringFee:125,
      codes:{ garage:"6640*", alarm:"2255#", gate:"5501" },
      emergency:{ name:"Maria Delgado", phone:"786-554-6611", email:"maria.d@yahoo.com", relationship:"Spouse" }
    },
  ],
  jobs: [
    { id:1, clientId:1, type:"watching",  title:"Weekly Walkthrough",          date:"2026-03-10", time:"09:00", assignedTo:"Mike",   status:"pending",  notes:"Check sprinklers, pool level, collect mail.", transport:null },
    { id:2, clientId:2, type:"transport", title:"Airport Ride – MIA",           date:"2026-03-07", time:"06:30", assignedTo:"Owner",  status:"pending",  notes:"Departing AA1045. Bill $65.", transport:{ subtype:"flight", airport:"MIA", airline:"American", flightNum:"AA1045", direction:"departure", pickupLocation:"88 Coral Ridge Blvd", dropLocation:"Miami International Airport", pickupTime:"06:30" } },
    { id:3, clientId:1, type:"watching",  title:"AC Filter Replacement",        date:"2026-03-05", time:"11:00", assignedTo:"Carlos", status:"complete", notes:"All 4 filters replaced.", transport:null },
    { id:4, clientId:2, type:"transport", title:"Doctor Appt – Baptist Health", date:"2026-03-12", time:"14:00", assignedTo:"Owner",  status:"pending",  notes:"Both Anne and Dr. Lassiter.", transport:{ subtype:"medical", pickupLocation:"88 Coral Ridge Blvd", dropLocation:"Baptist Health Boca Raton", pickupTime:"14:00" } },
    { id:5, clientId:3, type:"watching",  title:"Boat Cover Check",             date:"2026-03-15", time:"10:00", assignedTo:"Carlos", status:"pending",  notes:"Check cover integrity.", transport:null },
  ],
  invoices: [
    { id:1, clientId:1, services:[{serviceId:1,name:"House Walkthrough",qty:4,fee:45,custom:""},{serviceId:6,name:"AC Filter Replacement",qty:1,fee:35,custom:""}], supplies:0, discount:0, date:"2026-03-01", due:"2026-03-15", status:"pending", notes:"March services" },
    { id:2, clientId:2, services:[{serviceId:3,name:"Airport Transportation",qty:2,fee:65,custom:""},{serviceId:1,name:"House Walkthrough",qty:1,fee:45,custom:""}], supplies:0, discount:0, date:"2026-02-01", due:"2026-02-15", status:"overdue", notes:"February services" },
    { id:3, clientId:3, services:[{serviceId:8,name:"Pool Check",qty:2,fee:25,custom:""},{serviceId:1,name:"House Walkthrough",qty:3,fee:45,custom:""}], supplies:0, discount:0, date:"2026-01-01", due:"2026-01-15", status:"overdue", notes:"Nov-Dec services" },
  ],
  payments: [],
  messages: [
    { id:1, clientId:1, from:"Margaret Whitfield", text:"Hi! Just checking — will someone be by Tuesday?", time:"Mar 5, 10:22am", fromClient:true },
    { id:2, clientId:1, from:"You", text:"Hi Margaret! Yes, Mike will do the full walkthrough Tuesday at 9am.", time:"Mar 5, 10:45am", fromClient:false },
    { id:3, clientId:2, from:"Anne Lassiter", text:"Just a reminder about Thursday morning — early flight, 6:30am pickup!", time:"Mar 5, 3:10pm", fromClient:true },
    { id:4, clientId:2, from:"You", text:"All set Anne! I'll be there at 6:15. Safe travels!", time:"Mar 5, 3:22pm", fromClient:false },
  ],
  notes: [
    { id:1, clientId:1, title:"Pool pump failure", text:"Found pool pump not running. Called ABC Pool Service. Repaired within 24 hrs.", date:"2025-03-18", priority:"medium" },
    { id:2, clientId:2, title:"Front door rekeyed", text:"Locksmith rekeyed front and side entry per client request.", date:"2025-11-02", priority:"low" },
    { id:3, clientId:3, title:"Boat cover storm damage", text:"Starboard side torn after tropical storm. Frank authorized replacement up to $150.", date:"2025-09-14", priority:"high" },
  ],
};

// ── Badge styles ──────────────────────────────────────────────────────────────
const BADGE = {
  active:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive:  "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  pending:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  complete:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  paid:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  overdue:   "bg-red-50 text-red-700 ring-1 ring-red-200",
  watching:  "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  transport: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  other:     "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  home:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  away:      "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};
const Badge = ({ type, label }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${BADGE[type]||BADGE.inactive}`}>
    {label||type}
  </span>
);

const PRIORITY_STYLES = {
  high:   { badge:"bg-red-50 text-red-700 ring-1 ring-red-200",    icon:<AlertTriangle size={12} className="text-red-500"/>,    label:"Critical" },
  medium: { badge:"bg-amber-50 text-amber-700 ring-1 ring-amber-200", icon:<AlertCircle size={12} className="text-amber-500"/>,   label:"Medium"   },
  low:    { badge:"bg-blue-50 text-blue-600 ring-1 ring-blue-200",  icon:<Info size={12} className="text-blue-400"/>,            label:"Low"      },
};

// ── Invoice total calc ────────────────────────────────────────────────────────
const calcInvTotal = inv => {
  const sub = (inv.services||[]).reduce((s,sv) => s + (sv.fee * (sv.qty||1)), 0);
  const supplies = Number(inv.supplies||0);
  const disc = sub * (Number(inv.discount||0)/100);
  return sub + supplies - disc;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,       setTab]       = useState("dashboard");
  const [clients,   setClients]   = useState(() => load(SK.clients,  SEED.clients));
  const [jobs,      setJobs]      = useState(() => load(SK.jobs,     SEED.jobs));
  const [invoices,  setInvoices]  = useState(() => load(SK.invoices, SEED.invoices));
  const [payments,  setPayments]  = useState(() => load(SK.payments, SEED.payments));
  const [messages,  setMessages]  = useState(() => load(SK.messages, SEED.messages));
  const [notes,     setNotes]     = useState(() => load(SK.notes,    SEED.notes));
  const [services,  setServices]  = useState(() => load(SK.services, DEFAULT_SERVICES));
  const [modal,     setModal]     = useState(null);
  const [selClient, setSelClient] = useState(null);
  const [draft,     setDraft]     = useState("");
  const [clientTab, setClientTab] = useState(null); // for client detail

  useEffect(() => save(SK.clients,  clients),  [clients]);
  useEffect(() => save(SK.jobs,     jobs),     [jobs]);
  useEffect(() => save(SK.invoices, invoices), [invoices]);
  useEffect(() => save(SK.payments, payments), [payments]);
  useEffect(() => save(SK.messages, messages), [messages]);
  useEffect(() => save(SK.notes,    notes),    [notes]);
  useEffect(() => save(SK.services, services), [services]);

  const gc = id => clients.find(c => c.id === id);
  const overdue = invoices.filter(i => i.status === "overdue");

  const saveClient  = d => { d.id ? setClients(p=>p.map(c=>c.id===d.id?d:c)) : setClients(p=>[...p,{...d,id:Date.now(),acct:genAcct()}]); setModal(null); };
  const saveJob     = d => { d.id ? setJobs(p=>p.map(j=>j.id===d.id?d:j))    : setJobs(p=>[...p,{...d,id:Date.now(),status:"pending"}]);  setModal(null); };
  const saveInv     = d => { d.id ? setInvoices(p=>p.map(i=>i.id===d.id?d:i)): setInvoices(p=>[...p,{...d,id:Date.now(),status:"pending"}]); setModal(null); };
  const saveNote    = d => { d.id ? setNotes(p=>p.map(n=>n.id===d.id?d:n))   : setNotes(p=>[...p,{...d,id:Date.now()}]);                  setModal(null); };
  const saveService = d => { d.id ? setServices(p=>p.map(s=>s.id===d.id?d:s)): setServices(p=>[...p,{...d,id:Date.now()}]);               setModal(null); };

  const sendMsg  = () => { if(!draft.trim()||!selClient) return; setMessages(p=>[...p,{id:Date.now(),clientId:selClient.id,from:"You",text:draft,time:"Just now",fromClient:false}]); setDraft(""); };
  const markPaid = (invId, method, checkNum) => {
    setInvoices(p=>p.map(i=>i.id===invId?{...i,status:"paid"}:i));
    setPayments(p=>[...p,{id:Date.now(),invoiceId:invId,method,checkNum,date:today(),amount:calcInvTotal(invoices.find(i=>i.id===invId))}]);
    setModal(null);
  };
  const doneJob  = id => setJobs(p=>p.map(j=>j.id===id?{...j,status:"complete"}:j));
  const goMsg    = c  => { setSelClient(c); setTab("messages"); };
  const toggleHome = id => setClients(p=>p.map(c=>c.id===id?{...c,isHome:!c.isHome}:c));

  const nav = [
    { id:"dashboard", label:"Dashboard",    Icon:Home },
    { id:"clients",   label:"Clients",      Icon:Users },
    { id:"schedule",  label:"Schedule",     Icon:Calendar },
    { id:"billing",   label:"Billing",      Icon:DollarSign },
    { id:"messages",  label:"Messages",     Icon:MessageSquare },
    { id:"notes",     label:"Notes",        Icon:FileText },
    { id:"access",    label:"Access Codes", Icon:Lock },
    { id:"services",  label:"Services",     Icon:Tag },
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif"}} className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Key size={15} className="text-white"/></div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none tracking-tight">KeyStone</div>
            <div className="text-[10px] text-blue-600 tracking-widest font-medium">HOUSE SERVICES</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <button onClick={()=>setTab("billing")} className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1 text-xs text-red-600 font-medium hover:bg-red-100 transition-colors">
              <Bell size={11}/>{overdue.length} overdue invoice{overdue.length>1?"s":""}
            </button>
          )}
          <span className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0 bg-white border-r border-gray-200 px-3 py-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden md:block">
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 px-2 mb-2">MENU</p>
          {nav.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all text-left
                ${tab===id?"bg-blue-600 text-white shadow-sm":"text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <Icon size={15}/>{label}
            </button>
          ))}
          <hr className="border-gray-100 my-4"/>
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 px-2 mb-3">OVERVIEW</p>
          {[
            {label:"Active Clients",val:clients.filter(c=>c.status==="active").length,color:"text-blue-600"},
            {label:"Open Jobs",     val:jobs.filter(j=>j.status==="pending").length,  color:"text-blue-600"},
            {label:"Overdue $",     val:`$${overdue.reduce((s,i)=>s+calcInvTotal(i),0).toFixed(0)}`, color:"text-red-500"},
          ].map((s,i)=>(
            <div key={i} className="px-2 mb-3">
              <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </nav>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0" key={tab}>
          {tab==="dashboard" && <Dashboard clients={clients} jobs={jobs} invoices={invoices} gc={gc} setTab={setTab} doneJob={doneJob} toggleHome={toggleHome}/>}
          {tab==="clients"   && <Clients   clients={clients} jobs={jobs} invoices={invoices} notes={notes} payments={payments} setModal={setModal} goMsg={goMsg} toggleHome={toggleHome} setTab={setTab} setSel={setSelClient} clientTab={clientTab} setClientTab={setClientTab}/>}
          {tab==="schedule"  && <Schedule  jobs={jobs} gc={gc} setModal={setModal} doneJob={doneJob}/>}
          {tab==="billing"   && <Billing   invoices={invoices} payments={payments} gc={gc} setModal={setModal} markPaid={markPaid} services={services}/>}
          {tab==="messages"  && <Messages  clients={clients} sel={selClient} setSel={setSelClient} allMsgs={messages} draft={draft} setDraft={setDraft} sendMsg={sendMsg}/>}
          {tab==="notes"     && <Notes     notes={notes} gc={gc} setModal={setModal} clients={clients}/>}
          {tab==="access"    && <Access    clients={clients}/>}
          {tab==="services"  && <Services  services={services} setModal={setModal}/>}
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {nav.slice(0,5).map(({id,label,Icon})=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${tab===id?"text-blue-600":"text-gray-400"}`}>
            <Icon size={19}/>{label}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {modal?.type==="client"  && <ClientModal  data={modal.data} onSave={saveClient}  onClose={()=>setModal(null)}/>}
      {modal?.type==="job"     && <JobModal     data={modal.data} clients={clients} onSave={saveJob} onClose={()=>setModal(null)}/>}
      {modal?.type==="invoice" && <InvModal     data={modal.data} clients={clients} services={services} onSave={saveInv} onClose={()=>setModal(null)}/>}
      {modal?.type==="note"    && <NoteModal    data={modal.data} clients={clients} onSave={saveNote}  onClose={()=>setModal(null)}/>}
      {modal?.type==="payment" && <PaymentModal data={modal.data} onSave={markPaid}  onClose={()=>setModal(null)}/>}
      {modal?.type==="service" && <ServiceModal data={modal.data} onSave={saveService} onClose={()=>setModal(null)}/>}
      {modal?.type==="invoice_view" && <InvoiceViewModal data={modal.data} gc={gc} payments={payments} onClose={()=>setModal(null)} setModal={setModal}/>}
      {modal?.type==="statement" && <StatementModal data={modal.data} gc={gc} invoices={invoices} payments={payments} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = ({children,className=""}) => <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>{children}</div>;
const Row  = ({children,className=""}) => <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-2 bg-white border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all ${className}`}>{children}</div>;
const Empty = ({msg="Nothing here yet"}) => <div className="text-center py-12 text-gray-400 text-sm">{msg}</div>;

const SectionHead = ({title,sub,onAdd,addLabel="Add",extra}) => (
  <div className="flex justify-between items-end mb-6">
    <div><h1 className="text-2xl font-bold text-gray-900">{title}</h1>{sub&&<p className="text-sm text-gray-500 mt-0.5">{sub}</p>}</div>
    <div className="flex gap-2 items-center">
      {extra}
      {onAdd&&<button onClick={onAdd} className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Plus size={14}/>{addLabel}</button>}
    </div>
  </div>
);

const StatCard = ({label,value,Icon,color,bg}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex justify-between items-start mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}><Icon size={14} className={color}/></div>
    </div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
  </div>
);

const SearchBar = ({value,onChange,placeholder="Search..."}) => (
  <div className="relative mb-4">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-gray-400"/>
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({clients,jobs,invoices,gc,setTab,doneJob,toggleHome}) {
  const td = today();
  const todayJobs = jobs.filter(j=>j.date===td&&j.status==="pending");
  const upcoming  = jobs.filter(j=>j.date>td&&j.status==="pending").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const overdue   = invoices.filter(i=>i.status==="overdue");
  const outstanding = invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+calcInvTotal(i),0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Good morning!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your properties today.</p>
      </div>
      {overdue.length>0&&(
        <div onClick={()=>setTab("billing")} className="cursor-pointer flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6 hover:bg-red-100 transition-colors">
          <span><strong>{overdue.length} overdue invoice{overdue.length>1?"s":""}</strong> totaling <strong>${overdue.reduce((s,i)=>s+calcInvTotal(i),0).toFixed(0)}</strong></span>
          <ChevronRight size={15}/>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Clients" value={clients.filter(c=>c.status==="active").length} Icon={Users}       color="text-blue-600"    bg="bg-blue-50"/>
        <StatCard label="Open Jobs"      value={jobs.filter(j=>j.status==="pending").length}   Icon={Calendar}    color="text-violet-600"  bg="bg-violet-50"/>
        <StatCard label="Outstanding"    value={`$${outstanding.toFixed(0)}`}                   Icon={DollarSign}  color="text-red-500"     bg="bg-red-50"/>
        <StatCard label="Jobs Completed" value={jobs.filter(j=>j.status==="complete").length}  Icon={Check}       color="text-emerald-600" bg="bg-emerald-50"/>
      </div>

      {/* Home/Away status */}
      <Card className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><HomeIcon size={14} className="text-blue-500"/> Property Status</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {clients.filter(c=>c.status==="active").map(c=>(
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <div className="text-xs font-semibold text-gray-800">{c.lastName}</div>
                <div className="text-[10px] text-gray-400">{c.street}</div>
              </div>
              <button onClick={()=>toggleHome(c.id)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${c.isHome?"bg-emerald-100 text-emerald-700 hover:bg-emerald-200":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {c.isHome?"HOME":"AWAY"}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center"><Calendar size={13} className="text-blue-600"/></div>
            Today's Schedule
          </div>
          {todayJobs.length===0?<Empty msg="Nothing scheduled today"/>:todayJobs.map(j=>(
            <div key={j.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800">{j.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{gc(j.clientId)?.lastName} · {j.time} · {j.assignedTo}</div>
              </div>
              <button onClick={()=>doneJob(j.id)} className="text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 flex-shrink-0 font-medium">Done</button>
            </div>
          ))}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-4">
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center"><Wrench size={13} className="text-violet-600"/></div>
            Coming Up
          </div>
          {upcoming.length===0?<Empty msg="Schedule is clear"/>:upcoming.map(j=>(
            <div key={j.id} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{j.title}</span>
                <Badge type={j.type}/>
              </div>
              <div className="text-xs text-gray-500 mt-1">{gc(j.clientId)?.lastName} · {j.date} · {j.assignedTo}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Client name helper ────────────────────────────────────────────────────────
const clientDisplayName = c => c ? `${c.firstName} ${c.lastName}${c.secondaryName?` & ${c.secondaryName}`:""}` : "";
const clientFullAddress = c => c ? `${c.street}, ${c.city}, ${c.state} ${c.zip}` : "";

// ── Clients ───────────────────────────────────────────────────────────────────
function Clients({clients,jobs,invoices,notes,payments,setModal,goMsg,toggleHome,setTab,setSel,clientTab,setClientTab}) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || clientDisplayName(c).toLowerCase().includes(q) ||
      c.phone?.includes(q) || c.email?.toLowerCase().includes(q) ||
      c.street?.toLowerCase().includes(q) || c.acct?.includes(q) ||
      c.zip?.includes(q);
  });

  const openClient = c => { setSelected(c); setClientTab("profile"); };

  if (selected) {
    const c = clients.find(x=>x.id===selected.id) || selected;
    const cJobs     = jobs.filter(j=>j.clientId===c.id&&j.status==="complete");
    const cInvoices = invoices.filter(i=>i.clientId===c.id);
    const cNotes    = notes.filter(n=>n.clientId===c.id);
    return (
      <div>
        <button onClick={()=>setSelected(null)} className="flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-4 hover:text-blue-700">
          <ChevronRight size={14} className="rotate-180"/> Back to Clients
        </button>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{clientDisplayName(c)}</h1>
              <Badge type={c.status}/>
              <Badge type={c.isHome?"home":"away"} label={c.isHome?"Home":"Away"}/>
            </div>
            <div className="text-sm text-gray-500 mt-1">Account #{c.acct} · {clientFullAddress(c)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>toggleHome(c.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${c.isHome?"border-emerald-300 bg-emerald-50 text-emerald-700":"border-slate-200 bg-slate-50 text-slate-600"}`}>
              Toggle {c.isHome?"Away":"Home"}
            </button>
            <button onClick={()=>{goMsg(c);}} className="border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">Message</button>
            <button onClick={()=>setModal({type:"client",data:c})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Edit Profile</button>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          {["profile","history","invoices","notes"].map(t=>(
            <button key={t} onClick={()=>setClientTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
                ${clientTab===t?"border-blue-600 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {clientTab==="profile"&&(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.phone}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.email}</span></div>
                <div><span className="text-gray-500">Address:</span> <span className="font-medium">{clientFullAddress(c)}</span></div>
                <div><span className="text-gray-500">Season Away:</span> <span className="font-medium">{fmtDate(c.seasonStart)} – {fmtDate(c.seasonEnd)}</span></div>
                <div><span className="text-gray-500">Monitoring Fee:</span> <span className="font-semibold text-blue-600">${c.monitoringFee}/mo</span></div>
              </div>
            </Card>
            <Card>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Emergency Contact</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{c.emergency?.name}</span></div>
                <div><span className="text-gray-500">Relationship:</span> <span className="font-medium">{c.emergency?.relationship}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.emergency?.phone}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.emergency?.email}</span></div>
              </div>
            </Card>
            {c.notes&&<Card className="md:col-span-2"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</div><p className="text-sm text-gray-700 leading-relaxed">{c.notes}</p></Card>}
          </div>
        )}

        {clientTab==="history"&&(
          <div>
            <p className="text-sm text-gray-500 mb-4">All completed jobs for this client.</p>
            {cJobs.length===0?<Empty msg="No completed jobs yet"/>:cJobs.sort((a,b)=>b.date.localeCompare(a.date)).map(j=>(
              <Row key={j.id}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{j.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{j.date} · {j.assignedTo}</div>
                  {j.notes&&<div className="text-xs text-gray-400 mt-0.5">{j.notes}</div>}
                </div>
                <Badge type={j.type}/>
              </Row>
            ))}
          </div>
        )}

        {clientTab==="invoices"&&(
          <div>
            {cInvoices.length===0?<Empty msg="No invoices yet"/>:cInvoices.sort((a,b)=>b.date.localeCompare(a.date)).map(inv=>(
              <Row key={inv.id} className="justify-between cursor-pointer" onClick={()=>setModal({type:"invoice_view",data:inv})}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-gray-800">Invoice #{inv.id}</span><Badge type={inv.status}/></div>
                  <div className="text-xs text-gray-500">{fmtDate(inv.date)} · Due {fmtDate(inv.due)}</div>
                </div>
                <div className={`text-xl font-bold ml-3 ${inv.status==="overdue"?"text-red-500":"text-gray-800"}`}>{fmt$(calcInvTotal(inv))}</div>
              </Row>
            ))}
          </div>
        )}

        {clientTab==="notes"&&(
          <div>
            {cNotes.length===0?<Empty msg="No notes yet"/>:cNotes.sort((a,b)=>b.date.localeCompare(a.date)).map(n=>(
              <Card key={n.id} className="mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{n.title}</span><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_STYLES[n.priority]?.badge}`}>{PRIORITY_STYLES[n.priority]?.icon}{PRIORITY_STYLES[n.priority]?.label}</span></div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(n.date)}</div>
                  </div>
                  <button onClick={()=>setModal({type:"note",data:n})} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{n.text}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="Clients" sub={`${clients.length} total · ${clients.filter(c=>c.status==="active").length} active`} onAdd={()=>setModal({type:"client",data:null})} addLabel="Add Client"/>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, address, account..."/>
      {filtered.map(c=>(
        <Row key={c.id} className="cursor-pointer" onClick={()=>openClient(c)}>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-sm">{c.lastName[0]}{c.firstName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-gray-900">{clientDisplayName(c)}</span>
              <Badge type={c.status}/>
              <Badge type={c.isHome?"home":"away"} label={c.isHome?"Home":"Away"}/>
            </div>
            <div className="text-xs text-gray-500">{c.street}, {c.city} · #{c.acct}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.phone} · Away: {fmtDate(c.seasonStart)}–{fmtDate(c.seasonEnd)}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={e=>{e.stopPropagation();goMsg(c);}} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><MessageSquare size={13}/></button>
            <button onClick={e=>{e.stopPropagation();setModal({type:"client",data:c});}} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={13}/></button>
          </div>
        </Row>
      ))}
      {filtered.length===0&&<Empty msg="No clients match your search"/>}
    </div>
  );
}

// ── Schedule ──────────────────────────────────────────────────────────────────
function Schedule({jobs,gc,setModal,doneJob}) {
  const [filter, setFilter] = useState("all");
  const filters = ["all","watching","transport","other"];
  const pending = jobs.filter(j=>j.status==="pending"&&(filter==="all"||j.type===filter)).sort((a,b)=>a.date.localeCompare(b.date));

  const typeIcon = t => t==="transport"?<Car size={13} className="text-violet-500"/>:t==="watching"?<HomeIcon size={13} className="text-sky-500"/>:<Wrench size={13} className="text-orange-500"/>;

  return (
    <div>
      <SectionHead title="Schedule" sub="Upcoming and open jobs" onAdd={()=>setModal({type:"job",data:null})} addLabel="New Job"/>
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter===f?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
            {f==="watching"?"House Sitting":f==="transport"?"Transportation":f==="other"?"Other":f}
          </button>
        ))}
      </div>
      {pending.map(j=>(
        <Row key={j.id}>
          <div className="text-center w-14 flex-shrink-0 bg-gray-50 rounded-lg py-2">
            <div className="text-xs font-bold text-blue-600">{j.date.slice(5).replace("-","/")}</div>
            <div className="text-xs text-gray-400">{j.time}</div>
          </div>
          <div className="w-6 flex-shrink-0 flex items-center justify-center">{typeIcon(j.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800">{j.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{clientDisplayName(gc(j.clientId))} · {j.assignedTo}</div>
            {j.transport&&j.type==="transport"&&(
              <div className="text-xs text-gray-400 mt-0.5">
                {j.transport.subtype==="flight"&&`✈ ${j.transport.airline} ${j.transport.flightNum} · ${j.transport.airport} · ${j.transport.direction}`}
                {j.transport.subtype==="medical"&&`🏥 ${j.transport.dropLocation}`}
                {j.transport.pickupLocation&&` · Pickup: ${j.transport.pickupLocation}`}
              </div>
            )}
            {j.notes&&<div className="text-xs text-gray-400 mt-0.5">{j.notes}</div>}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={()=>doneJob(j.id)} className="text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 font-medium">Done</button>
            <button onClick={()=>setModal({type:"job",data:j})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
      {pending.length===0&&<Empty msg="No open jobs"/>}
    </div>
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────
function Billing({invoices,payments,gc,setModal,markPaid,services}) {
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [stmtClient, setStmtClient] = useState("");

  const total = s => invoices.filter(i=>i.status===s).reduce((a,i)=>a+calcInvTotal(i),0);

  const filtered = invoices.filter(i=>{
    const q