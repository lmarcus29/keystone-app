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
    const q = search.toLowerCase();
    const c = gc(i.clientId);
    const matchesSearch = !q || clientDisplayName(c).toLowerCase().includes(q) || String(i.id).includes(q);
    const matchesFilter = filter==="all" || i.status===filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <SectionHead title="Billing" sub="Invoices, payments & statements"
        onAdd={()=>setModal({type:"invoice",data:null})} addLabel="New Invoice"/>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {label:"Overdue",   val:fmt$(total("overdue")),  color:"text-red-600",     bg:"bg-red-50",     border:"border-red-100"},
          {label:"Pending",   val:fmt$(total("pending")),  color:"text-blue-600",    bg:"bg-blue-50",    border:"border-blue-100"},
          {label:"Collected", val:fmt$(total("paid")),     color:"text-emerald-600", bg:"bg-emerald-50", border:"border-emerald-100"},
        ].map((s,i)=>(
          <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name or invoice #..."/>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["all","pending","overdue","paid"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter===f?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.map(inv=>(
        <Row key={inv.id} className="cursor-pointer" onClick={()=>setModal({type:"invoice_view",data:inv})}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{clientDisplayName(gc(inv.clientId))}</span>
              <Badge type={inv.status}/>
              <span className="text-xs text-gray-400">#{inv.id}</span>
            </div>
            <div className="text-xs text-gray-500">{(inv.services||[]).map(s=>s.name).join(", ")}</div>
            <div className="text-xs text-gray-400 mt-0.5">Issued {fmtDate(inv.date)} · Due {fmtDate(inv.due)}</div>
          </div>
          <div className={`text-xl font-bold flex-shrink-0 mx-3 ${inv.status==="overdue"?"text-red-500":"text-gray-800"}`}>{fmt$(calcInvTotal(inv))}</div>
          <div className="flex gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
            {inv.status!=="paid"&&<button onClick={()=>setModal({type:"payment",data:inv})} className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm">Record Payment</button>}
            <button onClick={()=>setModal({type:"invoice",data:inv})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
      {filtered.length===0&&<Empty msg="No invoices found"/>}
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
function Messages({clients,sel,setSel,allMsgs,draft,setDraft,sendMsg}) {
  const msgs = sel ? allMsgs.filter(m=>m.clientId===sel.id) : [];
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <div className="w-52 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base mb-3">Conversations</h2>
        {clients.map(c=>(
          <button key={c.id} onClick={()=>setSel(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl mb-1.5 transition-all border
              ${sel?.id===c.id?"bg-blue-600 text-white border-blue-600 shadow-sm":"bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}>
            <div className={`text-xs font-semibold ${sel?.id===c.id?"text-white":"text-gray-800"}`}>{clientDisplayName(c)}</div>
            <div className={`text-[10px] mt-0.5 ${sel?.id===c.id?"text-blue-100":"text-gray-400"}`}>{c.phone}</div>
          </button>
        ))}
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden min-w-0 !p-4">
        {sel?(
          <>
            <div className="pb-3 border-b border-gray-100 mb-3">
              <div className="font-bold text-gray-900">{clientDisplayName(sel)}</div>
              <div className="text-xs text-gray-500">{sel.phone} · {sel.email}</div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3">
              {msgs.length===0&&<Empty msg="No messages yet"/>}
              {msgs.map(m=>(
                <div key={m.id} className={`flex ${m.fromClient?"justify-start":"justify-end"}`}>
                  <div className={`max-w-[75%] px-3.5 py-2.5 text-sm rounded-2xl leading-relaxed
                    ${m.fromClient?"bg-gray-100 text-gray-800 rounded-tl-sm":"bg-blue-600 text-white rounded-tr-sm"}`}>
                    <div className={`text-[10px] mb-1 ${m.fromClient?"text-gray-400":"text-blue-200"}`}>{m.from} · {m.time}</div>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef}/>
            </div>
            <div className="flex gap-2">
              <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 placeholder-gray-400"/>
              <button onClick={sendMsg} className="bg-blue-600 text-white px-3.5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"><Send size={15}/></button>
            </div>
          </>
        ):<Empty msg="Select a client to view messages"/>}
      </Card>
    </div>
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function Notes({notes,gc,setModal,clients}) {
  const [filterClient, setFilterClient] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filtered = notes.filter(n=>{
    const matchC = filterClient==="all" || String(n.clientId)===filterClient;
    const matchP = filterPriority==="all" || n.priority===filterPriority;
    return matchC && matchP;
  }).sort((a,b)=>{
    const order = {high:0,medium:1,low:2};
    return (order[a.priority]||1)-(order[b.priority]||1);
  });

  const highCount = notes.filter(n=>n.priority==="high").length;

  return (
    <div>
      <SectionHead title="Property Notes" sub="Incidents, repairs, and observations" onAdd={()=>setModal({type:"note",data:null})} addLabel="Add Note"
        extra={highCount>0&&<span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg"><AlertTriangle size={12}/>{highCount} critical</span>}/>
      <div className="flex gap-2 mb-5 flex-wrap">
        <select value={filterClient} onChange={e=>setFilterClient(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 text-gray-600 outline-none focus:border-blue-400">
          <option value="all">All Clients</option>
          {clients.map(c=><option key={c.id} value={String(c.id)}>{clientDisplayName(c)}</option>)}
        </select>
        {["all","high","medium","low"].map(p=>(
          <button key={p} onClick={()=>setFilterPriority(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filterPriority===p?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
            {p==="high"?"Critical":p==="medium"?"Medium":p==="low"?"Low":"All"}
          </button>
        ))}
      </div>
      {filtered.map(n=>(
        <Card key={n.id} className={`mb-3 ${n.priority==="high"?"border-red-200 bg-red-50/30":""}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">{n.title}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_STYLES[n.priority]?.badge}`}>
                  {PRIORITY_STYLES[n.priority]?.icon}{PRIORITY_STYLES[n.priority]?.label}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{clientDisplayName(gc(n.clientId))} · {fmtDate(n.date)}</div>
            </div>
            <button onClick={()=>setModal({type:"note",data:n})} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{n.text}</p>
        </Card>
      ))}
      {filtered.length===0&&<Empty msg="No notes match this filter"/>}
    </div>
  );
}

// ── Access Codes ──────────────────────────────────────────────────────────────
function Access({clients}) {
  const [shown, setShown] = useState({});
  const toggle = (id,k) => setShown(p=>({...p,[`${id}-${k}`]:!p[`${id}-${k}`]}));
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Access Codes</h1>
      <p className="text-sm text-gray-500 mb-4">Reveal only when needed — stored locally on this device</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
        🔒 Codes are saved in your browser only. Never share this screen with unauthorized people.
      </div>
      {clients.map(c=>(
        <Card key={c.id} className="mb-4">
          <div className="font-bold text-gray-900 text-base">{clientDisplayName(c)}</div>
          <div className="text-xs text-gray-400 mb-4">{clientFullAddress(c)} · #{c.acct}</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{l:"Garage",k:"garage"},{l:"Alarm",k:"alarm"},{l:"Gate",k:"gate"}].map(({l,k})=>(
              <div key={k} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{l}</div>
                {c.codes?.[k]?(
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg tracking-widest text-gray-800">{shown[`${c.id}-${k}`]?c.codes[k]:"••••••"}</span>
                    <button onClick={()=>toggle(c.id,k)} className="border border-gray-200 text-gray-400 p-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      {shown[`${c.id}-${k}`]?<EyeOff size={11}/>:<Eye size={11}/>}
                    </button>
                  </div>
                ):<span className="text-xs text-gray-300">Not set</span>}
              </div>
            ))}
          </div>
          {c.emergency?.phone&&(
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Phone size={11} className="text-blue-500"/> Emergency: {c.emergency.name} · {c.emergency.phone}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
function Services({services,setModal}) {
  return (
    <div>
      <SectionHead title="Service Rates" sub="Standard fees for billing" onAdd={()=>setModal({type:"service",data:null})} addLabel="Add Service"/>
      {services.map(s=>(
        <Row key={s.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
            <div className="text-xs text-gray-400 capitalize mt-0.5">{s.category}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-600 text-lg">${s.fee}</span>
            <button onClick={()=>setModal({type:"service",data:s})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ── Modal base ────────────────────────────────────────────────────────────────
const Modal = ({title,onClose,onSave,saveLabel="Save",children,wide=false}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[92vh] overflow-y-auto border border-gray-100`} onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-gray-100"><X size={14}/></button>
      </div>
      {children}
      {onSave&&(
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={onSave} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 shadow-sm">{saveLabel}</button>
        </div>
      )}
    </div>
  </div>
);

const FG = ({label,children,half=false}) => (
  <div className={`mb-3.5 ${half?"":"w-full"}`}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);
const G2 = ({children}) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const G3 = ({children}) => <div className="grid grid-cols-3 gap-3">{children}</div>;

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-all";
const selCls   = `${inputCls} appearance-none cursor-pointer`;

// ── Client Modal ──────────────────────────────────────────────────────────────
function ClientModal({data,onSave,onClose}) {
  const blank = {firstName:"",lastName:"",secondaryName:"",email:"",phone:"",street:"",city:"",state:"FL",zip:"",season:"",seasonStart:"",seasonEnd:"",status:"active",notes:"",monitoringFee:0,isHome:false,codes:{garage:"",alarm:"",gate:""},emergency:{name:"",phone:"",email:"",relationship:"Spouse"}};
  const [f,setF] = useState(data||blank);
  const s  = (k,v) => setF(p=>({...p,[k]:v}));
  const sc = (k,v) => setF(p=>({...p,codes:{...p.codes,[k]:v}}));
  const se = (k,v) => setF(p=>({...p,emergency:{...p.emergency,[k]:v}}));
  const [zipLoading, setZipLoading] = useState(false);

  const lookupZip = async (zip) => {
    if(zip.length!==5) return;
    setZipLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if(res.ok){
        const data = await res.json();
        s("city", data.places[0]["place name"]);
        s("state", data.places[0]["state abbreviation"]);
      }
    } catch {}
    setZipLoading(false);
  };

  return (
    <Modal title={data?"Edit Client":"New Client"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Client" wide>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Name</div>
      <G2>
        <FG label="First Name"><input className={inputCls} value={f.firstName} onChange={e=>s("firstName",e.target.value)}/></FG>
        <FG label="Last Name"><input className={inputCls} value={f.lastName} onChange={e=>s("lastName",e.target.value)}/></FG>
      </G2>
      <G2>
        <FG label="Secondary Name (optional)"><input className={inputCls} value={f.secondaryName} onChange={e=>s("secondaryName",e.target.value)} placeholder="e.g. spouse name"/></FG>
        <FG label="Status"><select className={selCls} value={f.status} onChange={e=>s("status",e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></FG>
      </G2>
      <G2>
        <FG label="Email"><input className={inputCls} value={f.email} onChange={e=>s("email",e.target.value)}/></FG>
        <FG label="Phone"><input className={inputCls} value={f.phone} onChange={e=>s("phone",e.target.value)}/></FG>
      </G2>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-1">Property Address</div>
      <FG label="Street Address"><input className={inputCls} value={f.street} onChange={e=>s("street",e.target.value)}/></FG>
      <G3>
        <FG label={`Zip${zipLoading?" (loading...)":""}`}>
          <input className={inputCls} value={f.zip} onChange={e=>{s("zip",e.target.value); if(e.target.value.length===5) lookupZip(e.target.value);}} maxLength={5} placeholder="33428"/>
        </FG>
        <FG label="City"><input className={inputCls} value={f.city} onChange={e=>s("city",e.target.value)}/></FG>
        <FG label="State"><input className={inputCls} value={f.state} onChange={e=>s("state",e.target.value)} maxLength={2}/></FG>
      </G3>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-1">Season Away</div>
      <G2>
        <FG label="Season Start"><input className={inputCls} type="date" value={f.seasonStart} onChange={e=>s("seasonStart",e.target.value)}/></FG>
        <FG label="Season End"><input className={inputCls} type="date" value={f.seasonEnd} onChange={e=>s("seasonEnd",e.target.value)}/></FG>
      </G2>
      <G2>
        <FG label="Monthly Monitoring Fee ($)"><input className={inputCls} type="number" value={f.monitoringFee} onChange={e=>s("monitoringFee",Number(e.target.value))}/></FG>
        <FG label="Currently">
          <select className={selCls} value={f.isHome?"home":"away"} onChange={e=>s("isHome",e.target.value==="home")}>
            <option value="away">Away</option>
            <option value="home">Home</option>
          </select>
        </FG>
      </G2>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-1">Emergency Contact</div>
      <G2>
        <FG label="Name"><input className={inputCls} value={f.emergency.name} onChange={e=>se("name",e.target.value)}/></FG>
        <FG label="Relationship">
          <select className={selCls} value={f.emergency.relationship} onChange={e=>se("relationship",e.target.value)}>
            {["Spouse","Child","Parent","Sibling","Friend","Attorney","Other"].map(r=><option key={r}>{r}</option>)}
          </select>
        </FG>
      </G2>
      <G2>
        <FG label="Phone"><input className={inputCls} value={f.emergency.phone} onChange={e=>se("phone",e.target.value)}/></FG>
        <FG label="Email"><input className={inputCls} value={f.emergency.email} onChange={e=>se("email",e.target.value)}/></FG>
      </G2>

      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-1">Access Codes</div>
      <G3>
        {[{l:"Garage",k:"garage"},{l:"Alarm",k:"alarm"},{l:"Gate",k:"gate"}].map(({l,k})=>(
          <FG key={k} label={l}>
            <input className={inputCls} type="password" value={f.codes[k]} onChange={e=>sc(k,e.target.value)} placeholder="••••••"/>
          </FG>
        ))}
      </G3>
    </Modal>
  );
}

// ── Job Modal ─────────────────────────────────────────────────────────────────
function JobModal({data,clients,onSave,onClose}) {
  const blank = {clientId:clients[0]?.id,type:"watching",title:"",date:"",time:"",assignedTo:"Owner",notes:"",status:"pending",transport:null};
  const [f,setF] = useState(data||blank);
  const [tr,setTr] = useState(data?.transport||{subtype:"flight",airport:"",airline:"",flightNum:"",direction:"departure",pickupLocation:"",dropLocation:"",pickupTime:""});
  const s  = (k,v) => setF(p=>({...p,[k]:v}));
  const st = (k,v) => setTr(p=>({...p,[k]:v}));

  const handleSave = () => {
    onSave({...f, transport: f.type==="transport" ? tr : null});
  };

  return (
    <Modal title={data?"Edit Job":"New Job"} onClose={onClose} onSave={handleSave} saveLabel="Save Job" wide>
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}</select></FG>
      <G2>
        <FG label="Job Type">
          <select className={selCls} value={f.type} onChange={e=>s("type",e.target.value)}>
            <option value="watching">House Sitting</option>
            <option value="transport">Transportation</option>
            <option value="other">Other</option>
          </select>
        </FG>
        <FG label="Assigned To">
          <select className={selCls} value={f.assignedTo} onChange={e=>s("assignedTo",e.target.value)}>
            <option>Owner</option><option>Mike</option><option>Carlos</option>
          </select>
        </FG>
      </G2>
      <FG label="Job Title / Description"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Brief description"/></FG>
      <G2>
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Time"><input className={inputCls} type="time" value={f.time} onChange={e=>s("time",e.target.value)}/></FG>
      </G2>

      {f.type==="transport"&&(
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-3">
          <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3">Transportation Details</div>
          <FG label="Type">
            <select className={selCls} value={tr.subtype} onChange={e=>st("subtype",e.target.value)}>
              <option value="flight">Flight (Airport)</option>
              <option value="medical">Medical / Doctor</option>
              <option value="other">Other</option>
            </select>
          </FG>
          {tr.subtype==="flight"&&(
            <>
              <G2>
                <FG label="Airport Code"><input className={inputCls} value={tr.airport} onChange={e=>st("airport",e.target.value)} placeholder="e.g. MIA"/></FG>
                <FG label="Direction">
                  <select className={selCls} value={tr.direction} onChange={e=>st("direction",e.target.value)}>
                    <option value="departure">Departure</option>
                    <option value="arrival">Arrival</option>
                  </select>
                </FG>
              </G2>
              <G2>
                <FG label="Airline"><input className={inputCls} value={tr.airline} onChange={e=>st("airline",e.target.value)} placeholder="e.g. American"/></FG>
                <FG label="Flight #"><input className={inputCls} value={tr.flightNum} onChange={e=>st("flightNum",e.target.value)} placeholder="e.g. AA1045"/></FG>
              </G2>
            </>
          )}
          <G2>
            <FG label="Pickup Location"><input className={inputCls} value={tr.pickupLocation} onChange={e=>st("pickupLocation",e.target.value)}/></FG>
            <FG label="Drop-off Location"><input className={inputCls} value={tr.dropLocation} onChange={e=>st("dropLocation",e.target.value)}/></FG>
          </G2>
          {tr.direction==="departure"&&<FG label="Pickup Time"><input className={inputCls} type="time" value={tr.pickupTime} onChange={e=>st("pickupTime",e.target.value)}/></FG>}
        </div>
      )}

      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[60px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvModal({data,clients,services,onSave,onClose}) {
  const blank = {clientId:clients[0]?.id,services:[],supplies:0,discount:0,date:today(),due:"",status:"pending",notes:""};
  const [f,setF] = useState(data||blank);
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  const addService = (svcId) => {
    const svc = services.find(s=>s.id===Number(svcId));
    if(!svc) return;
    setF(p=>({...p,services:[...p.services,{serviceId:svc.id,name:svc.name,qty:1,fee:svc.fee,custom:""}]}));
  };
  const updateSvc = (idx,k,v) => setF(p=>({...p,services:p.services.map((sv,i)=>i===idx?{...sv,[k]:v}:sv)}));
  const removeSvc = idx => setF(p=>({...p,services:p.services.filter((_,i)=>i!==idx)}));

  const subtotal = (f.services||[]).reduce((s,sv)=>s+(sv.fee*(sv.qty||1)),0);
  const total    = subtotal + Number(f.supplies||0) - subtotal*(Number(f.discount||0)/100);

  return (
    <Modal title={data?"Edit Invoice":"New Invoice"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Invoice" wide>
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}</select></FG>
      <G2>
        <FG label="Invoice Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Due Date"><input className={inputCls} type="date" value={f.due} onChange={e=>s("due",e.target.value)}/></FG>
      </G2>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-1">Services</div>
      <select className={`${selCls} mb-3`} value="" onChange={e=>addService(e.target.value)}>
        <option value="">+ Add a service...</option>
        {services.map(s=><option key={s.id} value={s.id}>{s.name} (${s.fee})</option>)}
      </select>
      {(f.services||[]).map((sv,i)=>(
        <div key={i} className="flex gap-2 items-center mb-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div className="flex-1 text-sm font-medium text-gray-800">{sv.name}</div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Qty:</span>
            <input type="number" min="1" value={sv.qty} onChange={e=>updateSvc(i,"qty",Number(e.target.value))} className="w-14 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center bg-white outline-none focus:border-blue-400"/>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">$</span>
            <input type="number" value={sv.fee} onChange={e=>updateSvc(i,"fee",Number(e.target.value))} className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center bg-white outline-none focus:border-blue-400"/>
          </div>
          <div className="text-sm font-semibold text-gray-800 w-16 text-right">{fmt$(sv.fee*sv.qty)}</div>
          <button onClick={()=>removeSvc(i)} className="text-red-400 hover:text-red-600 p-1"><X size={13}/></button>
        </div>
      ))}

      <G2>
        <FG label="Supplies ($)"><input className={inputCls} type="number" value={f.supplies} onChange={e=>s("supplies",Number(e.target.value))}/></FG>
        <FG label="Discount (%)"><input className={inputCls} type="number" value={f.discount} min="0" max="100" onChange={e=>s("discount",Number(e.target.value))}/></FG>
      </G2>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Subtotal</span><span>{fmt$(subtotal)}</span></div>
        {f.supplies>0&&<div className="flex justify-between text-xs text-gray-600 mb-1"><span>Supplies</span><span>{fmt$(f.supplies)}</span></div>}
        {f.discount>0&&<div className="flex justify-between text-xs text-red-600 mb-1"><span>Discount ({f.discount}%)</span><span>-{fmt$(subtotal*(f.discount/100))}</span></div>}
        <div className="flex justify-between text-sm font-bold text-blue-700 pt-1 border-t border-blue-200"><span>Total</span><span>{fmt$(total)}</span></div>
      </div>

      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[60px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({data,clients,onSave,onClose}) {
  const [f,setF] = useState(data||{clientId:clients[0]?.id,title:"",text:"",date:today(),priority:"medium"});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Note":"New Property Note"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Note">
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}</select></FG>
      <G2>
        <FG label="Title"><input className={inputCls} value={f.title} onChange={e=>s("title",e.target.value)}/></FG>
        <FG label="Priority">
          <select className={selCls} value={f.priority} onChange={e=>s("priority",e.target.value)}>
            <option value="high">Critical</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </FG>
      </G2>
      <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
      <FG label="Note"><textarea className={`${inputCls} resize-y min-h-[100px]`} value={f.text} onChange={e=>s("text",e.target.value)} placeholder="What happened, what was done, who was contacted..."/></FG>
    </Modal>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({data,onSave,onClose}) {
  const [method, setMethod] = useState("zelle");
  const [checkNum, setCheckNum] = useState("");
  const total = fmt$(calcInvTotal(data));
  return (
    <Modal title="Record Payment" onClose={onClose} onSave={()=>onSave(data.id,method,method==="check"?checkNum:"")} saveLabel="Record Payment">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Invoice Total</div>
        <div className="text-2xl font-bold text-blue-700">{total}</div>
      </div>
      <FG label="Payment Method">
        <select className={selCls} value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="zelle">Zelle</option>
          <option value="venmo">Venmo</option>
          <option value="cash">Cash</option>
          <option value="check">Check</option>
          <option value="credit_card">Credit Card</option>
        </select>
      </FG>
      {method==="check"&&<FG label="Check Number"><input className={inputCls} value={checkNum} onChange={e=>setCheckNum(e.target.value)} placeholder="Check #"/></FG>}
    </Modal>
  );
}

// ── Service Modal ─────────────────────────────────────────────────────────────
function ServiceModal({data,onSave,onClose}) {
  const [f,setF] = useState(data||{name:"",fee:0,category:"other"});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Service":"New Service"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Service">
      <FG label="Service Name"><input className={inputCls} value={f.name} onChange={e=>s("name",e.target.value)}/></FG>
      <G2>
        <FG label="Standard Fee ($)"><input className={inputCls} type="number" value={f.fee} onChange={e=>s("fee",Number(e.target.value))}/></FG>
        <FG label="Category">
          <select className={selCls} value={f.category} onChange={e=>s("category",e.target.value)}>
            <option value="watching">House Sitting</option>
            <option value="transport">Transportation</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
        </FG>
      </G2>
    </Modal>
  );
}

// ── Invoice View Modal ────────────────────────────────────────────────────────
function InvoiceViewModal({data,gc,payments,onClose,setModal}) {
  const inv = data;
  const c   = gc(inv.clientId);
  const pmt = payments.filter(p=>p.invoiceId===inv.id);
  const total = calcInvTotal(inv);

  const printInvoice = () => {
    const win = window.open("","_blank");
    win.document.write(`
      <html><head><title>Invoice #${inv.id}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1f2937;max-width:700px;margin:0 auto;}
        .header{display:flex;justify-content:space-between;align-items:start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #2563eb;}
        .logo{font-size:24px;font-weight:900;color:#2563eb;letter-spacing:-1px;}
        .sub{font-size:11px;color:#6b7280;letter-spacing:3px;text-transform:uppercase;}
        .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:${inv.status==="paid"?"#d1fae5":"#fee2e2"};color:${inv.status==="paid"?"#065f46":"#991b1b"};}
        table{width:100%;border-collapse:collapse;margin:16px 0;}
        th{background:#f8fafc;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb;}
        td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;}
        .total-row{font-weight:700;font-size:15px;color:#2563eb;}
        .section{margin-bottom:24px;}
        .label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
        .value{font-size:13px;font-weight:500;}
        @media print{button{display:none!important;}}
      </style></head><body>
      <div class="header">
        <div><div class="logo">KeyStone</div><div class="sub">House Services</div></div>
        <div style="text-align:right"><div style="font-size:20px;font-weight:700">Invoice #${inv.id}</div><div style="margin-top:4px"><span class="badge">${inv.status.toUpperCase()}</span></div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
        <div class="section"><div class="label">Bill To</div><div class="value" style="font-weight:700;font-size:15px;">${clientDisplayName(c)}</div><div class="value">${clientFullAddress(c)}</div><div class="value">${c?.phone}</div><div class="label" style="margin-top:8px">Account #</div><div class="value">${c?.acct}</div></div>
        <div class="section"><div class="label">Invoice Date</div><div class="value">${fmtDate(inv.date)}</div><div class="label" style="margin-top:8px">Due Date</div><div class="value">${fmtDate(inv.due)}</div></div>
      </div>
      <table><thead><tr><th>Service</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
        ${(inv.services||[]).map(sv=>`<tr><td>${sv.name}</td><td>${sv.qty}</td><td>$${sv.fee.toFixed(2)}</td><td>$${(sv.fee*sv.qty).toFixed(2)}</td></tr>`).join("")}
        ${inv.supplies>0?`<tr><td>Supplies</td><td>1</td><td>$${Number(inv.supplies).toFixed(2)}</td><td>$${Number(inv.supplies).toFixed(2)}</td></tr>`:""}
        ${inv.discount>0?`<tr><td colspan="3" style="text-align:right;color:#dc2626;">Discount (${inv.discount}%)</td><td style="color:#dc2626;">-$${((inv.services||[]).reduce((s,sv)=>s+sv.fee*sv.qty,0)*inv.discount/100).toFixed(2)}</td></tr>`:""}
        <tr class="total-row"><td colspan="3" style="text-align:right;padding-top:16px;">TOTAL DUE</td><td style="padding-top:16px;">$${total.toFixed(2)}</td></tr>
      </tbody></table>
      ${pmt.length>0?`<div class="section" style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;"><div class="label" style="color:#166534;">Payment Received</div>${pmt.map(p=>`<div class="value" style="color:#166534;">${fmtDate(p.date)} · ${p.method}${p.checkNum?" #"+p.checkNum:""} · $${p.amount?.toFixed(2)}</div>`).join("")}</div>`:""}
      <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">Thank you for your business · KeyStone House Services</div>
      <button onclick="window.print()" style="margin-top:16px;padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Print / Save as PDF</button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Modal title={`Invoice #${inv.id}`} onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <div><div className="font-bold text-gray-900">{clientDisplayName(c)}</div><div className="text-xs text-gray-500">#{c?.acct} · Due {fmtDate(inv.due)}</div></div>
        <div className="flex items-center gap-2"><Badge type={inv.status}/><button onClick={printInvoice} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"><Printer size={12}/>Print / PDF</button></div>
      </div>
      <table className="w-full text-sm mb-4">
        <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Service</th><th className="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Qty</th><th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Rate</th><th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Amount</th></tr></thead>
        <tbody>
          {(inv.services||[]).map((sv,i)=><tr key={i} className="border-b border-gray-100"><td className="px-3 py-2">{sv.name}</td><td className="px-3 py-2 text-center">{sv.qty}</td><td className="px-3 py-2 text-right">{fmt$(sv.fee)}</td><td className="px-3 py-2 text-right font-medium">{fmt$(sv.fee*sv.qty)}</td></tr>)}
          {inv.supplies>0&&<tr className="border-b border-gray-100"><td className="px-3 py-2">Supplies</td><td className="px-3 py-2 text-center">1</td><td className="px-3 py-2 text-right">{fmt$(inv.supplies)}</td><td className="px-3 py-2 text-right font-medium">{fmt$(inv.supplies)}</td></tr>}
          {inv.discount>0&&<tr className="border-b border-gray-100 text-red-600"><td colSpan={3} className="px-3 py-2 text-right">Discount ({inv.discount}%)</td><td className="px-3 py-2 text-right">-{fmt$((inv.services||[]).reduce((s,sv)=>s+sv.fee*sv.qty,0)*inv.discount/100)}</td></tr>}
          <tr className="bg-blue-50"><td colSpan={3} className="px-3 py-2 text-right font-bold text-blue-700">Total</td><td className="px-3 py-2 text-right font-bold text-blue-700 text-lg">{fmt$(total)}</td></tr>
        </tbody>
      </table>
      {pmt.length>0&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">{pmt.map(p=><div key={p.id} className="text-xs text-emerald-700"><strong>Paid:</strong> {fmtDate(p.date)} · {p.method}{p.checkNum?` #${p.checkNum}`:""} · {fmt$(p.amount)}</div>)}</div>}
      {inv.status!=="paid"&&<button onClick={()=>{onClose();setModal({type:"payment",data:inv});}} className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors mt-2">Record Payment</button>}
    </Modal>
  );
}

// ── Statement Modal ───────────────────────────────────────────────────────────
function StatementModal({data,gc,invoices,payments,onClose}) {
  return <Modal title="Statement of Account" onClose={onClose} wide><Empty msg="Statement feature coming soon"/></Modal>;
}
