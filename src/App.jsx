import { useState, useEffect, useRef } from "react";
import {
  Home, Users, Calendar, DollarSign, MessageSquare, FileText,
  Lock, Key, Bell, Send, Edit2, Plus, Check, Phone, Eye, EyeOff,
  Wrench, X, ChevronRight, Search, AlertTriangle, AlertCircle, Info,
  Car, Plane, MapPin, Printer, Tag, RefreshCw, Mail, Thermometer,
  Shield, Wifi, RotateCcw, List, Home as HomeIcon
} from "lucide-react";

// ── Storage v3 ────────────────────────────────────────────────────────────────
const V = "v3";
const SK = {
  clients:  `ks_${V}_clients`,
  jobs:     `ks_${V}_jobs`,
  invoices: `ks_${V}_invoices`,
  payments: `ks_${V}_payments`,
  messages: `ks_${V}_messages`,
  notes:    `ks_${V}_notes`,
  services: `ks_${V}_services`,
  audit:    `ks_${V}_audit`,
};
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Helpers ───────────────────────────────────────────────────────────────────
const genAcct  = () => String(Math.floor(10000 + Math.random() * 90000));
const today    = () => new Date().toISOString().split("T")[0];
const fmt$     = n  => `$${Number(n||0).toFixed(2)}`;
const fmtDate  = d  => d ? new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";
const nowStr   = () => new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});

// Title case
const toTitle = s => (s||"").replace(/\w\S*/g, t => t.charAt(0).toUpperCase()+t.slice(1).toLowerCase());

// Phone format xxx-xxx-xxxx
const fmtPhone = raw => {
  const d = (raw||"").replace(/\D/g,"").slice(0,10);
  if(d.length<=3) return d;
  if(d.length<=6) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
};

// Zip lookup
const lookupZip = async zip => {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if(!r.ok) return null;
    const d = await r.json();
    return { city: toTitle(d.places[0]["place name"]), state: d.places[0]["state abbreviation"] };
  } catch { return null; }
};

// Recurrence expander - generate dates
const expandRecurring = (startDate, endDate, freq) => {
  const dates = [];
  let cur = new Date(startDate+"T00:00:00");
  const end = new Date(endDate+"T00:00:00");
  const step = { daily:1, weekly:7, biweekly:14 }[freq];
  while(cur <= end && dates.length < 365) {
    dates.push(cur.toISOString().split("T")[0]);
    if(freq==="monthly") { cur = new Date(cur); cur.setMonth(cur.getMonth()+1); }
    else { cur = new Date(cur.getTime() + step*86400000); }
  }
  return dates;
};

const calcInvTotal = inv => {
  const sub = (inv.services||[]).reduce((s,sv)=>s+(sv.fee*(sv.qty||1)),0);
  const sup = Number(inv.supplies||0);
  const disc = sub*(Number(inv.discount||0)/100);
  return sub + sup - disc;
};

const clientDisplayName = c => c ? `${c.firstName} ${c.lastName}${c.secFirstName?` & ${c.secFirstName} ${c.secLastName}`:""}` : "";
const clientFullAddress  = c => c ? `${c.street}, ${c.city}, ${c.state} ${c.zip}` : "";

// ── Airlines ──────────────────────────────────────────────────────────────────
const AIRLINES = [
  "American Airlines","Delta Air Lines","United Airlines","Southwest Airlines",
  "JetBlue Airways","Alaska Airlines","Spirit Airlines","Frontier Airlines",
  "Allegiant Air","Sun Country Airlines","Other"
];

// ── Default services ──────────────────────────────────────────────────────────
const DEFAULT_SERVICES = [
  { id:1,  name:"House Walkthrough",         fee:45,  category:"watching"  },
  { id:2,  name:"Extended House Watch",      fee:75,  category:"watching"  },
  { id:3,  name:"Airport Transportation",    fee:65,  category:"transport" },
  { id:4,  name:"Medical Transportation",    fee:55,  category:"transport" },
  { id:5,  name:"General Transportation",    fee:50,  category:"transport" },
  { id:6,  name:"AC Filter Replacement",     fee:35,  category:"project"   },
  { id:7,  name:"Mail Collection",           fee:15,  category:"project"   },
  { id:8,  name:"Pool Check",                fee:25,  category:"project"   },
  { id:9,  name:"Storm Preparation",         fee:85,  category:"project"   },
  { id:10, name:"Monthly House Service",     fee:150, category:"watching"  },
  { id:11, name:"Other / Custom",            fee:0,   category:"other"     },
];

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED = {
  clients: [
    { id:1, acct:"47382",
      firstName:"Margaret", lastName:"Whitfield",
      secFirstName:"Harold", secLastName:"Whitfield",
      email:"whitfields@email.com", email2:"",
      phone:"561-442-8801",
      street:"14 Pelican Cove Dr", city:"Boca Raton", state:"FL", zip:"33428",
      notes:"Prefers texts. Very detail-oriented. Check back porch screen door.",
      seasonStart:"2026-05-01", seasonEnd:"2026-09-30", status:"active", isHome:false,
      monitoringFee:150,
      codes:{ garageOpen:"4892*", garageClose:"4892#", alarmOn:"7714*", alarmOff:"7714#", gateOpen:"1028*", gateClose:"1028#" },
      awaySettings:{ thermostat:78, alarmEnabled:true, lights:false, otherNotes:"Pool pump timer on auto." },
      specialRequests:"Margaret would like a text after every visit.",
      emergency:{ name:"Karen Whitfield", phone:"561-330-9204", email:"karen.w@gmail.com", relationship:"Daughter" }
    },
    { id:2, acct:"82951",
      firstName:"Robert", lastName:"Lassiter",
      secFirstName:"Anne", secLastName:"Lassiter",
      email:"rlassiter@gmail.com", email2:"anne.lassiter@gmail.com",
      phone:"954-881-2200",
      street:"88 Coral Ridge Blvd", city:"Fort Lauderdale", state:"FL", zip:"33308",
      notes:"Dr. Lassiter uses a walker. Anne needs airport rides frequently. Good tippers.",
      seasonStart:"2026-06-01", seasonEnd:"2026-08-31", status:"active", isHome:false,
      monitoringFee:175,
      codes:{ garageOpen:"3301*", garageClose:"3301#", alarmOn:"9982*", alarmOff:"9982#", gateOpen:"", gateClose:"" },
      awaySettings:{ thermostat:76, alarmEnabled:true, lights:true, otherNotes:"Leave porch light on timer." },
      specialRequests:"",
      emergency:{ name:"Brett Lassiter", phone:"954-771-0045", email:"brett.l@gmail.com", relationship:"Son" }
    },
    { id:3, acct:"63017",
      firstName:"Frank", lastName:"Delgado",
      secFirstName:"", secLastName:"",
      email:"fdelgado55@yahoo.com", email2:"",
      phone:"786-554-6610",
      street:"22 Sawgrass Ln", city:"Coral Springs", state:"FL", zip:"33065",
      notes:"Winter resident only. Has a 24ft boat in side yard — check monthly.",
      seasonStart:"2026-11-01", seasonEnd:"2027-03-31", status:"inactive", isHome:false,
      monitoringFee:125,
      codes:{ garageOpen:"6640*", garageClose:"6640#", alarmOn:"2255*", alarmOff:"2255#", gateOpen:"5501*", gateClose:"5501#" },
      awaySettings:{ thermostat:80, alarmEnabled:true, lights:false, otherNotes:"Check boat cover monthly." },
      specialRequests:"Call Frank directly for anything over $200.",
      emergency:{ name:"Maria Delgado", phone:"786-554-6611", email:"maria.d@yahoo.com", relationship:"Spouse" }
    },
  ],
  jobs: [
    { id:1, clientId:1, type:"watching",  title:"Weekly Walkthrough", date:"2026-03-10", time:"09:00", assignedTo:"Mike",  status:"pending", notes:"Check sprinklers, pool level, collect mail.", transport:null, recurring:false },
    { id:2, clientId:2, type:"transport", title:"Airport Ride – MIA",  date:"2026-03-07", time:"06:30", assignedTo:"Owner", status:"pending", notes:"Departing AA1045. Bill $65.", transport:{ subtype:"airport", tripType:"oneway", airport:"MIA", airline:"American Airlines", flightNum:"AA1045", flightDep:"07:45", flightArr:"", direction:"departure", pickupAddr:"88 Coral Ridge Blvd", pickupCity:"Fort Lauderdale", pickupState:"FL", pickupZip:"33308", dropAddr:"Miami International Airport", dropCity:"Miami", dropState:"FL", dropZip:"33122", pickupTime:"06:00" }, recurring:false },
    { id:3, clientId:1, type:"watching",  title:"AC Filter Replacement", date:"2026-03-05", time:"11:00", assignedTo:"Carlos", status:"complete", notes:"All 4 filters replaced.", transport:null, recurring:false },
    { id:4, clientId:3, type:"watching",  title:"Boat Cover Check", date:"2026-03-15", time:"10:00", assignedTo:"Carlos", status:"pending", notes:"Check cover integrity.", transport:null, recurring:false },
  ],
  invoices: [
    { id:1, clientId:1, description:"Monthly House Service", services:[{serviceId:10,name:"Monthly House Service",qty:1,fee:150,custom:""},{serviceId:6,name:"AC Filter Replacement",qty:1,fee:35,custom:""}], supplies:0, discount:0, date:"2026-03-01", due:"2026-03-15", status:"pending", notes:"March services" },
    { id:2, clientId:2, description:"February Services",    services:[{serviceId:3,name:"Airport Transportation",qty:2,fee:65,custom:""},{serviceId:1,name:"House Walkthrough",qty:1,fee:45,custom:""}], supplies:0, discount:0, date:"2026-02-01", due:"2026-02-15", status:"overdue", notes:"February services" },
    { id:3, clientId:3, description:"Nov-Dec Services",     services:[{serviceId:8,name:"Pool Check",qty:2,fee:25,custom:""},{serviceId:1,name:"House Walkthrough",qty:3,fee:45,custom:""}], supplies:0, discount:0, date:"2026-01-01", due:"2026-01-15", status:"overdue", notes:"Nov-Dec services" },
  ],
  payments: [],
  messages: [
    { id:1, clientId:1, from:"Margaret Whitfield", text:"Hi! Just checking — will someone be by Tuesday?", time:"Mar 5, 10:22am", fromClient:true },
    { id:2, clientId:1, from:"You", text:"Hi Margaret! Yes, Mike will do the full walkthrough Tuesday at 9am.", time:"Mar 5, 10:45am", fromClient:false },
    { id:3, clientId:2, from:"Anne Lassiter", text:"Just a reminder about Thursday morning — early flight, 6:30am pickup!", time:"Mar 5, 3:10pm", fromClient:true },
    { id:4, clientId:2, from:"You", text:"All set Anne! I'll be there at 6:15. Safe travels!", time:"Mar 5, 3:22pm", fromClient:false },
  ],
  notes: [
    { id:1, clientId:1, title:"Pool Pump Failure", text:"Found pool pump not running. Called ABC Pool Service. Repaired within 24 hrs.", date:"2025-03-18", priority:"medium", auto:false },
    { id:2, clientId:2, title:"Front Door Rekeyed", text:"Locksmith rekeyed front and side entry per client request.", date:"2025-11-02", priority:"low", auto:false },
    { id:3, clientId:3, title:"Boat Cover Storm Damage", text:"Starboard side torn after tropical storm. Frank authorized replacement up to $150.", date:"2025-09-14", priority:"high", auto:false },
  ],
  audit: [],
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
const Badge = ({type,label}) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${BADGE[type]||BADGE.inactive}`}>{label||type}</span>
);

const PRIORITY_STYLES = {
  high:   { badge:"bg-red-50 text-red-700 ring-1 ring-red-200",       icon:<AlertTriangle size={11} className="text-red-500"/>,   label:"Critical" },
  medium: { badge:"bg-amber-50 text-amber-700 ring-1 ring-amber-200", icon:<AlertCircle  size={11} className="text-amber-500"/>,  label:"Medium"   },
  low:    { badge:"bg-blue-50 text-blue-600 ring-1 ring-blue-200",    icon:<Info         size={11} className="text-blue-400"/>,   label:"Low"      },
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card  = ({children,className=""}) => <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>{children}</div>;
const Row   = ({children,className="",onClick}) => <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-2 bg-white border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all ${onClick?"cursor-pointer":""} ${className}`}>{children}</div>;
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

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-all";
const selCls   = `${inputCls} appearance-none cursor-pointer`;
const FG = ({label,children}) => <div className="mb-3.5"><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>{children}</div>;
const G2 = ({children}) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const G3 = ({children}) => <div className="grid grid-cols-3 gap-3">{children}</div>;

// Modal base
const Modal = ({title,onClose,onSave,saveLabel="Save",children,wide=false,xwide=false}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full ${xwide?"max-w-3xl":wide?"max-w-2xl":"max-w-lg"} max-h-[92vh] overflow-y-auto border border-gray-100`} onClick={e=>e.stopPropagation()}>
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

// Section divider
const Divider = ({label}) => <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 mt-5 pb-1 border-b border-blue-100">{label}</div>;

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,      setTab]      = useState("dashboard");
  const [clients,  setClients]  = useState(()=>load(SK.clients,  SEED.clients));
  const [jobs,     setJobs]     = useState(()=>load(SK.jobs,     SEED.jobs));
  const [invoices, setInvoices] = useState(()=>load(SK.invoices, SEED.invoices));
  const [payments, setPayments] = useState(()=>load(SK.payments, SEED.payments));
  const [messages, setMessages] = useState(()=>load(SK.messages, SEED.messages));
  const [notes,    setNotes]    = useState(()=>load(SK.notes,    SEED.notes));
  const [services, setServices] = useState(()=>load(SK.services, DEFAULT_SERVICES));
  const [audit,    setAudit]    = useState(()=>load(SK.audit,    SEED.audit));
  const [modal,    setModal]    = useState(null);
  const [selClient,setSelClient]= useState(null);
  const [draft,    setDraft]    = useState("");
  const [clientTab,setClientTab]= useState("profile");

  useEffect(()=>save(SK.clients,  clients),  [clients]);
  useEffect(()=>save(SK.jobs,     jobs),     [jobs]);
  useEffect(()=>save(SK.invoices, invoices), [invoices]);
  useEffect(()=>save(SK.payments, payments), [payments]);
  useEffect(()=>save(SK.messages, messages), [messages]);
  useEffect(()=>save(SK.notes,    notes),    [notes]);
  useEffect(()=>save(SK.services, services), [services]);
  useEffect(()=>save(SK.audit,    audit),    [audit]);

  const gc = id => clients.find(c=>c.id===id);
  const overdue = invoices.filter(i=>i.status==="overdue");

  const addAudit = (clientId, action, detail="") => {
    const entry = { id:Date.now(), clientId, action, detail, date:nowStr() };
    setAudit(p=>[entry,...p].slice(0,500));
    if(clientId) {
      setNotes(p=>[{id:Date.now()+1, clientId, title:action, text:detail||action, date:today(), priority:"low", auto:true},...p]);
    }
  };

  const saveClient = d => {
    const isNew = !d.id;
    if(isNew) { d = {...d, id:Date.now(), acct:genAcct()}; setClients(p=>[...p,d]); }
    else setClients(p=>p.map(c=>c.id===d.id?d:c));
    addAudit(d.id, isNew?"Client Created":"Client Profile Updated", `${clientDisplayName(d)} — profile ${isNew?"created":"updated"}`);
    setModal(null);
  };

  const saveJob = (d, recurDates) => {
    if(d.id) {
      setJobs(p=>p.map(j=>j.id===d.id?d:j));
      addAudit(d.clientId,"Job Updated",`${d.title} on ${d.date}`);
    } else if(recurDates && recurDates.length>1) {
      const newJobs = recurDates.map((dt,i)=>({...d,id:Date.now()+i,date:dt,status:"pending"}));
      setJobs(p=>[...p,...newJobs]);
      addAudit(d.clientId,"Recurring Jobs Scheduled",`${d.title} — ${recurDates.length} occurrences starting ${recurDates[0]}`);
    } else {
      setJobs(p=>[...p,{...d,id:Date.now(),status:"pending"}]);
      addAudit(d.clientId,"Job Scheduled",`${d.title} on ${d.date}`);
    }
    setModal(null);
  };

  const saveInv = d => {
    const isNew = !d.id;
    if(isNew) { setInvoices(p=>[...p,{...d,id:Date.now(),status:"pending"}]); }
    else setInvoices(p=>p.map(i=>i.id===d.id?d:i));
    addAudit(d.clientId, isNew?"Invoice Created":"Invoice Updated", `Invoice for ${clientDisplayName(gc(d.clientId))} — ${fmt$(calcInvTotal(d))}`);
    setModal(null);
  };

  const saveNote = d => {
    const isNew = !d.id;
    if(isNew) setNotes(p=>[...p,{...d,id:Date.now(),auto:false}]);
    else setNotes(p=>p.map(n=>n.id===d.id?d:n));
    if(!d.auto) addAudit(d.clientId, isNew?"Note Added":"Note Updated", d.title);
    setModal(null);
  };

  const saveService = d => {
    d.id ? setServices(p=>p.map(s=>s.id===d.id?d:s)) : setServices(p=>[...p,{...d,id:Date.now()}]);
    setModal(null);
  };

  const markPaid = (invId, method, checkNum) => {
    const inv = invoices.find(i=>i.id===invId);
    setInvoices(p=>p.map(i=>i.id===invId?{...i,status:"paid"}:i));
    const pmt = {id:Date.now(),invoiceId:invId,method,checkNum,date:today(),amount:calcInvTotal(inv)};
    setPayments(p=>[...p,pmt]);
    addAudit(inv.clientId,"Payment Recorded",`Invoice #${invId} — ${fmt$(calcInvTotal(inv))} via ${method}${checkNum?" #"+checkNum:""}`);
    setModal(null);
  };

  const doneJob = id => {
    const j = jobs.find(x=>x.id===id);
    setJobs(p=>p.map(x=>x.id===id?{...x,status:"complete"}:x));
    if(j) addAudit(j.clientId,"Job Completed",`${j.title} on ${j.date}`);
  };

  const sendMsg = () => {
    if(!draft.trim()||!selClient) return;
    setMessages(p=>[...p,{id:Date.now(),clientId:selClient.id,from:"You",text:draft,time:nowStr(),fromClient:false}]);
    setDraft("");
  };

  const toggleHome = id => {
    const c = clients.find(x=>x.id===id);
    const newVal = !c.isHome;
    setClients(p=>p.map(x=>x.id===id?{...x,isHome:newVal}:x));
    addAudit(id, newVal?"Client Marked Home":"Client Marked Away", `${clientDisplayName(c)} status override`);
  };

  const nav = [
    {id:"dashboard",label:"Dashboard",    Icon:Home},
    {id:"clients",  label:"Clients",      Icon:Users},
    {id:"schedule", label:"Schedule",     Icon:Calendar},
    {id:"billing",  label:"Billing",      Icon:DollarSign},
    {id:"messages", label:"Messages",     Icon:MessageSquare},
    {id:"notes",    label:"Notes",        Icon:FileText},
    {id:"access",   label:"Access Codes", Icon:Lock},
    {id:"services", label:"Services",     Icon:Tag},
    {id:"audit",    label:"Audit Trail",  Icon:List},
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
          {overdue.length>0&&(
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
            {label:"Overdue $",     val:fmt$(overdue.reduce((s,i)=>s+calcInvTotal(i),0)), color:"text-red-500"},
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
          {tab==="clients"   && <Clients   clients={clients} jobs={jobs} invoices={invoices} notes={notes} payments={payments} setModal={setModal} selClient={selClient} setSelClient={setSelClient} setTab={setTab} toggleHome={toggleHome} clientTab={clientTab} setClientTab={setClientTab}/>}
          {tab==="schedule"  && <Schedule  jobs={jobs} clients={clients} gc={gc} setModal={setModal} doneJob={doneJob}/>}
          {tab==="billing"   && <Billing   invoices={invoices} payments={payments} gc={gc} setModal={setModal} services={services}/>}
          {tab==="messages"  && <Messages  clients={clients} sel={selClient} setSel={setSelClient} allMsgs={messages} draft={draft} setDraft={setDraft} sendMsg={sendMsg}/>}
          {tab==="notes"     && <Notes     notes={notes} gc={gc} setModal={setModal} clients={clients}/>}
          {tab==="access"    && <Access    clients={clients}/>}
          {tab==="services"  && <Services  services={services} setModal={setModal}/>}
          {tab==="audit"     && <AuditTrail audit={audit} gc={gc} clients={clients}/>}
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
      {modal?.type==="client"       && <ClientModal  data={modal.data} onSave={saveClient}  onClose={()=>setModal(null)}/>}
      {modal?.type==="job"          && <JobModal     data={modal.data} clients={clients} onSave={saveJob} onClose={()=>setModal(null)}/>}
      {modal?.type==="invoice"      && <InvModal     data={modal.data} clients={clients} services={services} onSave={saveInv} onClose={()=>setModal(null)}/>}
      {modal?.type==="note"         && <NoteModal    data={modal.data} clients={clients} onSave={saveNote}  onClose={()=>setModal(null)}/>}
      {modal?.type==="payment"      && <PaymentModal data={modal.data} onSave={markPaid}  onClose={()=>setModal(null)}/>}
      {modal?.type==="service"      && <ServiceModal data={modal.data} onSave={saveService} onClose={()=>setModal(null)}/>}
      {modal?.type==="invoice_view" && <InvoiceViewModal data={modal.data} gc={gc} payments={payments} onClose={()=>setModal(null)} setModal={setModal}/>}
      {modal?.type==="statement"    && <StatementModal   data={modal.data} gc={gc} invoices={invoices} payments={payments} onClose={()=>setModal(null)}/>}
    </div>
  );
}

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
        <h1 className="text-2xl font-bold text-gray-900">Good Morning!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your properties today.</p>
      </div>
      {overdue.length>0&&(
        <div onClick={()=>setTab("billing")} className="cursor-pointer flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6 hover:bg-red-100 transition-colors">
          <span><strong>{overdue.length} Overdue Invoice{overdue.length>1?"s":""}</strong> — <strong>{fmt$(overdue.reduce((s,i)=>s+calcInvTotal(i),0))}</strong> outstanding</span>
          <ChevronRight size={15}/>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Clients" value={clients.filter(c=>c.status==="active").length} Icon={Users}      color="text-blue-600"    bg="bg-blue-50"/>
        <StatCard label="Open Jobs"      value={jobs.filter(j=>j.status==="pending").length}   Icon={Calendar}   color="text-violet-600"  bg="bg-violet-50"/>
        <StatCard label="Outstanding"    value={fmt$(outstanding)}                              Icon={DollarSign} color="text-red-500"     bg="bg-red-50"/>
        <StatCard label="Jobs Completed" value={jobs.filter(j=>j.status==="complete").length}  Icon={Check}      color="text-emerald-600" bg="bg-emerald-50"/>
      </div>
      <Card className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><HomeIcon size={14} className="text-blue-500"/> Property Status</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {clients.filter(c=>c.status==="active").map(c=>(
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <div className="text-xs font-semibold text-gray-800">{c.lastName}</div>
                <div className="text-[10px] text-gray-400">{c.street}</div>
              </div>
              <button onClick={()=>toggleHome(c.id)} className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${c.isHome?"bg-emerald-100 text-emerald-700 hover:bg-emerald-200":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
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
          {todayJobs.length===0?<Empty msg="Nothing Scheduled Today"/>:todayJobs.map(j=>(
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
          {upcoming.length===0?<Empty msg="Schedule Is Clear"/>:upcoming.map(j=>(
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

// ── Clients ───────────────────────────────────────────────────────────────────
function Clients({clients,jobs,invoices,notes,payments,setModal,selClient,setSelClient,setTab,toggleHome,clientTab,setClientTab}) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(c=>{
    const q = search.toLowerCase();
    return !q || clientDisplayName(c).toLowerCase().includes(q) ||
      c.phone?.replace(/\D/g,"").includes(q.replace(/\D/g,"")) ||
      c.email?.toLowerCase().includes(q) ||
      c.street?.toLowerCase().includes(q) ||
      c.acct?.includes(q) || c.zip?.includes(q) ||
      c.lastName?.toLowerCase().includes(q);
  });

  if(selClient) {
    const c = clients.find(x=>x.id===selClient.id)||selClient;
    const cJobs     = jobs.filter(j=>j.clientId===c.id&&j.status==="complete");
    const cInvoices = invoices.filter(i=>i.clientId===c.id);
    const cNotes    = notes.filter(n=>n.clientId===c.id);
    return (
      <div>
        <button onClick={()=>setSelClient(null)} className="flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-4 hover:text-blue-700">
          <ChevronRight size={14} className="rotate-180"/> Back To Clients
        </button>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{clientDisplayName(c)}</h1>
              <Badge type={c.status}/>
              <Badge type={c.isHome?"home":"away"} label={c.isHome?"Home":"Away"}/>
            </div>
            <div className="text-sm text-gray-500 mt-1">Account #{c.acct} · {clientFullAddress(c)}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>toggleHome(c.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${c.isHome?"border-emerald-300 bg-emerald-50 text-emerald-700":"border-slate-200 bg-slate-50 text-slate-600"}`}>
              Toggle {c.isHome?"Away":"Home"}
            </button>
            <button onClick={()=>{setSelClient(c);setTab("messages");}} className="border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">Message</button>
            <button onClick={()=>setModal({type:"client",data:c})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Edit Profile</button>
          </div>
        </div>
        <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
          {["profile","history","invoices","notes"].map(t=>(
            <button key={t} onClick={()=>setClientTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap
                ${clientTab===t?"border-blue-600 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
          ))}
        </div>
        {clientTab==="profile"&&(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Contact</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.phone}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.email}</span></div>
                {c.email2&&<div><span className="text-gray-500">Email 2:</span> <span className="font-medium">{c.email2}</span></div>}
                <div><span className="text-gray-500">Address:</span> <span className="font-medium">{clientFullAddress(c)}</span></div>
                <div><span className="text-gray-500">Season Away:</span> <span className="font-medium">{fmtDate(c.seasonStart)} – {fmtDate(c.seasonEnd)}</span></div>
                <div><span className="text-gray-500">Monitoring Fee:</span> <span className="font-semibold text-blue-600">{fmt$(c.monitoringFee)}/mo</span></div>
              </div>
            </Card>
            <Card>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Emergency Contact</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{c.emergency?.name}</span></div>
                <div><span className="text-gray-500">Relationship:</span> <span className="font-medium">{c.emergency?.relationship}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.emergency?.phone}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.emergency?.email}</span></div>
              </div>
            </Card>
            <Card>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Away Desired Settings</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Thermometer size={13} className="text-orange-400"/><span className="text-gray-500">Thermostat:</span> <span className="font-semibold">{c.awaySettings?.thermostat||"—"}°F</span></div>
                <div className="flex items-center gap-2"><Shield size={13} className="text-blue-400"/><span className="text-gray-500">Alarm:</span> <span className={`font-semibold ${c.awaySettings?.alarmEnabled?"text-emerald-600":"text-gray-400"}`}>{c.awaySettings?.alarmEnabled?"Enabled":"Disabled"}</span></div>
                <div className="flex items-center gap-2"><Wifi size={13} className="text-purple-400"/><span className="text-gray-500">Lights:</span> <span className="font-semibold">{c.awaySettings?.lights?"On Timer":"Off"}</span></div>
                {c.awaySettings?.otherNotes&&<div className="pt-1 border-t border-gray-100"><span className="text-gray-500 text-xs">Other:</span> <span className="text-xs">{c.awaySettings.otherNotes}</span></div>}
              </div>
            </Card>
            {c.specialRequests&&(
              <Card>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Special Requests</div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.specialRequests}</p>
              </Card>
            )}
            {c.notes&&<Card className="md:col-span-2"><div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Property Notes</div><p className="text-sm text-gray-700 leading-relaxed">{c.notes}</p></Card>}
          </div>
        )}
        {clientTab==="history"&&(
          <div>
            <p className="text-sm text-gray-500 mb-4">All completed jobs for this client.</p>
            {cJobs.length===0?<Empty msg="No Completed Jobs Yet"/>:cJobs.sort((a,b)=>b.date.localeCompare(a.date)).map(j=>(
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
            {cInvoices.length===0?<Empty msg="No Invoices Yet"/>:cInvoices.sort((a,b)=>b.date.localeCompare(a.date)).map(inv=>(
              <Row key={inv.id} onClick={()=>setModal({type:"invoice_view",data:inv})}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-gray-800">Invoice #{inv.id}</span><Badge type={inv.status}/></div>
                  <div className="text-xs text-gray-500">{inv.description||"Invoice"} · {fmtDate(inv.date)} · Due {fmtDate(inv.due)}</div>
                </div>
                <div className={`text-xl font-bold ml-3 ${inv.status==="overdue"?"text-red-500":"text-gray-800"}`}>{fmt$(calcInvTotal(inv))}</div>
              </Row>
            ))}
          </div>
        )}
        {clientTab==="notes"&&(
          <div>
            {cNotes.length===0?<Empty msg="No Notes Yet"/>:cNotes.sort((a,b)=>b.date.localeCompare(a.date)).map(n=>(
              <Card key={n.id} className={`mb-3 ${n.priority==="high"?"border-red-200 bg-red-50/30":""}`}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{n.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_STYLES[n.priority]?.badge}`}>{PRIORITY_STYLES[n.priority]?.icon}{PRIORITY_STYLES[n.priority]?.label}</span>
                      {n.auto&&<span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Auto</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(n.date)}</div>
                  </div>
                  {!n.auto&&<button onClick={()=>setModal({type:"note",data:n})} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>}
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
      <SectionHead title="Clients" sub={`${clients.length} Total · ${clients.filter(c=>c.status==="active").length} Active`} onAdd={()=>setModal({type:"client",data:null})} addLabel="Add Client"/>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, last name, phone, account, address..."/>
      {filtered.map(c=>(
        <Row key={c.id} onClick={()=>{setSelClient(c);setClientTab("profile");}}>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-sm">{c.lastName[0]}{c.firstName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-gray-900">{clientDisplayName(c)}</span>
              <Badge type={c.status}/>
              <Badge type={c.isHome?"home":"away"} label={c.isHome?"Home":"Away"}/>
            </div>
            <div className="text-xs text-gray-500">{c.street}, {c.city} · Acct #{c.acct}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.phone} · Away: {fmtDate(c.seasonStart)}–{fmtDate(c.seasonEnd)}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setModal({type:"client",data:c})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={13}/></button>
          </div>
        </Row>
      ))}
      {filtered.length===0&&<Empty msg="No Clients Match Your Search"/>}
    </div>
  );
}

// ── Schedule ──────────────────────────────────────────────────────────────────
function Schedule({jobs,clients,gc,setModal,doneJob}) {
  const [filter,   setFilter]   = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [search,   setSearch]   = useState("");
  const [calDate,  setCalDate]  = useState(()=>{ const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });

  const pending = jobs.filter(j=>j.status==="pending");

  const filtered = pending.filter(j=>{
    const q = search.toLowerCase();
    const c = gc(j.clientId);
    const matchF = filter==="all"||j.type===filter;
    const matchS = !q || j.title.toLowerCase().includes(q) ||
      c?.lastName?.toLowerCase().includes(q) ||
      c?.acct?.includes(q) ||
      c?.phone?.replace(/\D/g,"").includes(q.replace(/\D/g,""));
    return matchF && matchS;
  }).sort((a,b)=>a.date.localeCompare(b.date));

  // Calendar helpers
  const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
  const firstDay    = (y,m) => new Date(y,m,1).getDay();
  const calKey      = d => `${calDate.y}-${String(calDate.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const jobsOnDay   = d => pending.filter(j=>j.date===calKey(d));
  const monthNames  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div>
      <SectionHead title="Schedule" sub="Upcoming & Open Jobs" onAdd={()=>setModal({type:"job",data:null})} addLabel="New Job"/>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by client name, last name, account #, phone..."/>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {["all","watching","transport","other"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                ${filter===f?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
              {f==="watching"?"House Sitting":f==="transport"?"Transportation":f==="other"?"Other":"All"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["list","week","month"].map(v=>(
            <button key={v} onClick={()=>setViewMode(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors
                ${viewMode===v?"bg-blue-600 text-white":"text-gray-500 hover:text-gray-700"}`}>{v}</button>
          ))}
        </div>
      </div>

      {viewMode==="list"&&(
        <>
          {filtered.map(j=>(
            <Row key={j.id}>
              <div className="text-center w-14 flex-shrink-0 bg-gray-50 rounded-lg py-2">
                <div className="text-xs font-bold text-blue-600">{j.date.slice(5).replace("-","/")}</div>
                <div className="text-xs text-gray-400">{j.time}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{j.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{clientDisplayName(gc(j.clientId))} · {j.assignedTo}</div>
                {j.transport&&j.type==="transport"&&(
                  <div className="text-xs text-gray-400 mt-0.5">
                    {j.transport.subtype==="airport"&&`✈ ${j.transport.airline} ${j.transport.flightNum} · ${j.transport.airport} · ${j.transport.direction==="departure"?"Dep":"Arr"} ${j.transport.flightDep||j.transport.flightArr}`}
                    {j.transport.subtype==="other"&&`🚗 ${j.transport.pickupAddr} → ${j.transport.dropAddr}`}
                    {j.transport.pickupTime&&` · Pickup: ${j.transport.pickupTime}`}
                  </div>
                )}
                {j.notes&&<div className="text-xs text-gray-400 mt-0.5">{j.notes}</div>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Badge type={j.type}/>
                <button onClick={()=>doneJob(j.id)} className="text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 font-medium">Done</button>
                <button onClick={()=>setModal({type:"job",data:j})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
              </div>
            </Row>
          ))}
          {filtered.length===0&&<Empty msg="No Open Jobs"/>}
        </>
      )}

      {viewMode==="week"&&(
        <Card>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((_,i)=>{
            const d = new Date(); d.setDate(d.getDate()-d.getDay()+i);
            const dk = d.toISOString().split("T")[0];
            const dayJobs = pending.filter(j=>j.date===dk);
            return (
              <div key={i} className={`flex gap-3 py-3 border-b border-gray-100 last:border-0 ${dk===today()?"bg-blue-50/50 rounded-lg px-2":""}`}>
                <div className="w-14 flex-shrink-0 text-center">
                  <div className="text-xs font-bold text-gray-500">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}</div>
                  <div className={`text-lg font-bold ${dk===today()?"text-blue-600":"text-gray-800"}`}>{d.getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  {dayJobs.length===0?<span className="text-xs text-gray-300">No Jobs</span>:dayJobs.map(j=>(
                    <div key={j.id} className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 mb-1">
                      <span className="font-semibold text-gray-800">{j.title}</span> · <span className="text-gray-500">{gc(j.clientId)?.lastName} · {j.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {viewMode==="month"&&(
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button onClick={()=>setCalDate(p=>{ const d=new Date(p.y,p.m-1); return{y:d.getFullYear(),m:d.getMonth()};})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={14} className="rotate-180"/></button>
            <span className="font-bold text-gray-800">{monthNames[calDate.m]} {calDate.y}</span>
            <button onClick={()=>setCalDate(p=>{ const d=new Date(p.y,p.m+1); return{y:d.getFullYear(),m:d.getMonth()};})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={14}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay(calDate.y,calDate.m)).fill(null).map((_,i)=><div key={`e${i}`}/>)}
            {Array(daysInMonth(calDate.y,calDate.m)).fill(null).map((_,i)=>{
              const d=i+1; const dj=jobsOnDay(d); const isToday=calKey(d)===today();
              return (
                <div key={d} className={`min-h-[52px] rounded-lg p-1 border ${isToday?"border-blue-400 bg-blue-50":"border-gray-100"}`}>
                  <div className={`text-xs font-bold mb-0.5 ${isToday?"text-blue-600":"text-gray-600"}`}>{d}</div>
                  {dj.slice(0,2).map(j=><div key={j.id} className={`text-[9px] rounded px-1 py-0.5 mb-0.5 truncate font-medium ${j.type==="watching"?"bg-sky-100 text-sky-700":j.type==="transport"?"bg-violet-100 text-violet-700":"bg-orange-100 text-orange-700"}`}>{j.title}</div>)}
                  {dj.length>2&&<div className="text-[9px] text-gray-400">+{dj.length-2} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────
function Billing({invoices,payments,gc,setModal,services}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const total = s => invoices.filter(i=>i.status===s).reduce((a,i)=>a+calcInvTotal(i),0);
  const filtered = invoices.filter(i=>{
    const q = search.toLowerCase();
    const c = gc(i.clientId);
    return (filter==="all"||i.status===filter) &&
      (!q || clientDisplayName(c).toLowerCase().includes(q) || String(i.id).includes(q) || (i.description||"").toLowerCase().includes(q));
  });
  return (
    <div>
      <SectionHead title="Billing" sub="Invoices, Payments & Statements" onAdd={()=>setModal({type:"invoice",data:null})} addLabel="New Invoice"/>
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
              ${filter===f?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>{f}</button>
        ))}
      </div>
      {filtered.map(inv=>(
        <Row key={inv.id} onClick={()=>setModal({type:"invoice_view",data:inv})}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{clientDisplayName(gc(inv.clientId))}</span>
              <Badge type={inv.status}/>
              <span className="text-xs text-gray-400">#{inv.id}</span>
            </div>
            <div className="text-xs text-gray-500">{inv.description||"Invoice"}</div>
            <div className="text-xs text-gray-400 mt-0.5">Issued {fmtDate(inv.date)} · Due {fmtDate(inv.due)}</div>
          </div>
          <div className={`text-xl font-bold flex-shrink-0 mx-3 ${inv.status==="overdue"?"text-red-500":"text-gray-800"}`}>{fmt$(calcInvTotal(inv))}</div>
          <div className="flex gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
            {inv.status!=="paid"&&<button onClick={()=>setModal({type:"payment",data:inv})} className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm">Record Payment</button>}
            <button onClick={()=>setModal({type:"invoice",data:inv})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
      {filtered.length===0&&<Empty msg="No Invoices Found"/>}
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
function Messages({clients,sel,setSel,allMsgs,draft,setDraft,sendMsg}) {
  const msgs = sel ? allMsgs.filter(m=>m.clientId===sel.id) : [];
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs.length]);
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
            <div className="pb-3 border-b border-gray-100 mb-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900">{clientDisplayName(sel)}</div>
                <div className="text-xs text-gray-500">{sel.phone} · {sel.email}</div>
              </div>
              <button className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                <Mail size={11}/> Email Statement
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3">
              {msgs.length===0&&<Empty msg="No Messages Yet"/>}
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
        ):<Empty msg="Select A Client To View Messages"/>}
      </Card>
    </div>
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function Notes({notes,gc,setModal,clients}) {
  const [filterClient,   setFilterClient]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showAuto,       setShowAuto]       = useState(false);
  const filtered = notes.filter(n=>{
    const matchC  = filterClient==="all"||String(n.clientId)===filterClient;
    const matchP  = filterPriority==="all"||n.priority===filterPriority;
    const matchA  = showAuto || !n.auto;
    return matchC&&matchP&&matchA;
  }).sort((a,b)=>{ const o={high:0,medium:1,low:2}; return (o[a.priority]||1)-(o[b.priority]||1)||(b.date.localeCompare(a.date)); });
  const highCount = notes.filter(n=>n.priority==="high"&&!n.auto).length;
  return (
    <div>
      <SectionHead title="Property Notes" sub="Incidents, Repairs & Observations" onAdd={()=>setModal({type:"note",data:null})} addLabel="Add Note"
        extra={highCount>0&&<span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg"><AlertTriangle size={12}/>{highCount} Critical</span>}/>
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <select value={filterClient} onChange={e=>setFilterClient(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 text-gray-600 outline-none focus:border-blue-400">
          <option value="all">All Clients</option>
          {clients.map(c=><option key={c.id} value={String(c.id)}>{clientDisplayName(c)}</option>)}
        </select>
        {["all","high","medium","low"].map(p=>(
          <button key={p} onClick={()=>setFilterPriority(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filterPriority===p?"bg-blue-600 text-white shadow-sm":"bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
            {p==="high"?"Critical":p==="medium"?"Medium":p==="low"?"Low":"All"}
          </button>
        ))}
        <button onClick={()=>setShowAuto(p=>!p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showAuto?"bg-gray-600 text-white":"bg-white border border-gray-200 text-gray-500"}`}>
          {showAuto?"Hide Auto":"Show Auto"}
        </button>
      </div>
      {filtered.map(n=>(
        <Card key={n.id} className={`mb-3 ${n.priority==="high"&&!n.auto?"border-red-200 bg-red-50/30":""}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">{n.title}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_STYLES[n.priority]?.badge}`}>{PRIORITY_STYLES[n.priority]?.icon}{PRIORITY_STYLES[n.priority]?.label}</span>
                {n.auto&&<span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Auto-Log</span>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{clientDisplayName(gc(n.clientId))} · {fmtDate(n.date)}</div>
            </div>
            {!n.auto&&<button onClick={()=>setModal({type:"note",data:n})} className="border border-gray-200 text-gray-400 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{n.text}</p>
        </Card>
      ))}
      {filtered.length===0&&<Empty msg="No Notes Match This Filter"/>}
    </div>
  );
}

// ── Access Codes ──────────────────────────────────────────────────────────────
function Access({clients}) {
  const [shown, setShown] = useState({});
  const toggle = (id,k) => setShown(p=>({...p,[`${id}-${k}`]:!p[`${id}-${k}`]}));
  const codeFields = [
    {label:"Garage Open",     k:"garageOpen"},
    {label:"Garage Close",    k:"garageClose"},
    {label:"Alarm Activate",  k:"alarmOn"},
    {label:"Alarm Deactivate",k:"alarmOff"},
    {label:"Gate Open",       k:"gateOpen"},
    {label:"Gate Close",      k:"gateClose"},
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Access Codes</h1>
      <p className="text-sm text-gray-500 mb-4">Reveal only when needed — stored locally on this device.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
        🔒 Codes are saved in your browser only. Never share this screen with unauthorized individuals.
      </div>
      {clients.map(c=>(
        <Card key={c.id} className="mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-gray-900 text-base">{clientDisplayName(c)}</div>
              <div className="text-xs text-gray-400">{clientFullAddress(c)} · Acct #{c.acct}</div>
            </div>
            <Badge type={c.isHome?"home":"away"} label={c.isHome?"Home":"Away"}/>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {codeFields.map(({label,k})=>(
              <div key={k} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</div>
                {c.codes?.[k]?(
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base tracking-widest text-gray-800">{shown[`${c.id}-${k}`]?c.codes[k]:"•••••"}</span>
                    <button onClick={()=>toggle(c.id,k)} className="border border-gray-200 text-gray-400 p-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      {shown[`${c.id}-${k}`]?<EyeOff size={11}/>:<Eye size={11}/>}
                    </button>
                  </div>
                ):<span className="text-xs text-gray-300">Not Set</span>}
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2">Away Settings</div>
            <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
              <span><Thermometer size={11} className="inline text-orange-400 mr-1"/>{c.awaySettings?.thermostat||"—"}°F</span>
              <span><Shield size={11} className="inline text-blue-400 mr-1"/>Alarm: {c.awaySettings?.alarmEnabled?"On":"Off"}</span>
              <span><Wifi size={11} className="inline text-purple-400 mr-1"/>Lights: {c.awaySettings?.lights?"Timer":"Off"}</span>
            </div>
          </div>
          {c.emergency?.phone&&(
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
              <Phone size={11} className="text-blue-500"/> Emergency: {c.emergency.name} · {c.emergency.phone} · {c.emergency.relationship}
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
      <SectionHead title="Service Rates" sub="Standard Fees For Billing" onAdd={()=>setModal({type:"service",data:null})} addLabel="Add Service"/>
      {services.map(s=>(
        <Row key={s.id} className="justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
            <div className="text-xs text-gray-400 capitalize mt-0.5">{s.category}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-600 text-lg">{fmt$(s.fee)}</span>
            <button onClick={()=>setModal({type:"service",data:s})} className="border border-gray-200 text-gray-500 p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ── Audit Trail ───────────────────────────────────────────────────────────────
function AuditTrail({audit,gc,clients}) {
  const [filterClient, setFilterClient] = useState("all");
  const filtered = audit.filter(a=>filterClient==="all"||String(a.clientId)===filterClient);
  return (
    <div>
      <SectionHead title="Audit Trail" sub="Automatic Activity Log — Every Action Recorded"/>
      <div className="flex gap-2 mb-5">
        <select value={filterClient} onChange={e=>setFilterClient(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 text-gray-600 outline-none focus:border-blue-400">
          <option value="all">All Clients</option>
          {clients.map(c=><option key={c.id} value={String(c.id)}>{clientDisplayName(c)}</option>)}
        </select>
      </div>
      {filtered.length===0?<Empty msg="No Activity Recorded Yet"/>:filtered.map(a=>(
        <Row key={a.id}>
          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800">{a.action}</div>
            {a.detail&&<div className="text-xs text-gray-500 mt-0.5">{a.detail}</div>}
          </div>
          <div className="text-xs text-gray-400 flex-shrink-0 text-right">
            {a.clientId&&<div className="font-medium text-gray-500">{clientDisplayName(gc(a.clientId))}</div>}
            <div>{a.date}</div>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ── Client Modal ──────────────────────────────────────────────────────────────
function ClientModal({data,onSave,onClose}) {
  const blank = {
    firstName:"",lastName:"",secFirstName:"",secLastName:"",
    email:"",email2:"",phone:"",
    street:"",city:"",state:"FL",zip:"",
    seasonStart:"",seasonEnd:"",status:"active",isHome:false,
    monitoringFee:0,notes:"",specialRequests:"",
    codes:{garageOpen:"",garageClose:"",alarmOn:"",alarmOff:"",gateOpen:"",gateClose:""},
    awaySettings:{thermostat:78,alarmEnabled:true,lights:false,otherNotes:""},
    emergency:{name:"",phone:"",email:"",relationship:"Spouse"},
  };
  const [f,setF]       = useState(data||blank);
  const [zipLoad,setZL]= useState(false);
  const s  = (k,v) => setF(p=>({...p,[k]:v}));
  const sc = (k,v) => setF(p=>({...p,codes:{...p.codes,[k]:v}}));
  const se = (k,v) => setF(p=>({...p,emergency:{...p.emergency,[k]:v}}));
  const sa = (k,v) => setF(p=>({...p,awaySettings:{...p.awaySettings,[k]:v}}));

  const handleZip = async zip => {
    s("zip",zip);
    if(zip.length===5){ setZL(true); const r=await lookupZip(zip); if(r){s("city",r.city);s("state",r.state);} setZL(false); }
  };

  return (
    <Modal title={data?"Edit Client":"New Client"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Client" xwide>
      <Divider label="Primary Contact"/>
      <G2>
        <FG label="First Name"><input className={inputCls} value={f.firstName} onChange={e=>s("firstName",toTitle(e.target.value))}/></FG>
        <FG label="Last Name"><input className={inputCls} value={f.lastName} onChange={e=>s("lastName",toTitle(e.target.value))}/></FG>
      </G2>
      <Divider label="Secondary Contact (Optional)"/>
      <G2>
        <FG label="First Name"><input className={inputCls} value={f.secFirstName} onChange={e=>s("secFirstName",toTitle(e.target.value))} placeholder="Leave blank if none"/></FG>
        <FG label="Last Name"><input className={inputCls} value={f.secLastName} onChange={e=>s("secLastName",toTitle(e.target.value))}/></FG>
      </G2>
      <Divider label="Contact Information"/>
      <G2>
        <FG label="Phone"><input className={inputCls} value={f.phone} onChange={e=>s("phone",fmtPhone(e.target.value))} placeholder="561-442-8801" maxLength={12}/></FG>
        <FG label="Status"><select className={selCls} value={f.status} onChange={e=>s("status",e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></FG>
      </G2>
      <G2>
        <FG label="Primary Email"><input className={inputCls} value={f.email} onChange={e=>s("email",e.target.value.toLowerCase())}/></FG>
        <FG label="Secondary Email (Optional)"><input className={inputCls} value={f.email2} onChange={e=>s("email2",e.target.value.toLowerCase())} placeholder="Optional"/></FG>
      </G2>
      <Divider label="Property Address"/>
      <FG label="Street Address"><input className={inputCls} value={f.street} onChange={e=>s("street",toTitle(e.target.value))}/></FG>
      <G3>
        <FG label={zipLoad?"Zip (Looking Up...)":"Zip Code"}>
          <input className={inputCls} value={f.zip} onChange={e=>handleZip(e.target.value)} maxLength={5} placeholder="33428"/>
        </FG>
        <FG label="City"><input className={inputCls} value={f.city} onChange={e=>s("city",toTitle(e.target.value))}/></FG>
        <FG label="State"><input className={inputCls} value={f.state} onChange={e=>s("state",e.target.value.toUpperCase())} maxLength={2}/></FG>
      </G3>
      <Divider label="Season Away Dates"/>
      <G2>
        <FG label="Season Start"><input className={inputCls} type="date" value={f.seasonStart} onChange={e=>s("seasonStart",e.target.value)}/></FG>
        <FG label="Season End"><input className={inputCls} type="date" value={f.seasonEnd} onChange={e=>s("seasonEnd",e.target.value)}/></FG>
      </G2>
      <G2>
        <FG label="Monthly Monitoring Fee ($)"><input className={inputCls} type="number" value={f.monitoringFee} onChange={e=>s("monitoringFee",Number(e.target.value))}/></FG>
        <FG label="Currently (Home / Away Override)">
          <select className={selCls} value={f.isHome?"home":"away"} onChange={e=>s("isHome",e.target.value==="home")}>
            <option value="away">Away</option>
            <option value="home">Home</option>
          </select>
        </FG>
      </G2>
      <Divider label="Away Desired Settings"/>
      <G3>
        <FG label="Thermostat (°F)"><input className={inputCls} type="number" min={60} max={90} value={f.awaySettings.thermostat} onChange={e=>sa("thermostat",Number(e.target.value))}/></FG>
        <FG label="Alarm">
          <select className={selCls} value={f.awaySettings.alarmEnabled?"on":"off"} onChange={e=>sa("alarmEnabled",e.target.value==="on")}>
            <option value="on">Enabled / On</option>
            <option value="off">Disabled / Off</option>
          </select>
        </FG>
        <FG label="Interior Lights">
          <select className={selCls} value={f.awaySettings.lights?"timer":"off"} onChange={e=>sa("lights",e.target.value==="timer")}>
            <option value="off">Off</option>
            <option value="timer">On Timer</option>
          </select>
        </FG>
      </G3>
      <FG label="Other Away Instructions"><input className={inputCls} value={f.awaySettings.otherNotes} onChange={e=>sa("otherNotes",e.target.value)} placeholder="E.g. pool pump timer, irrigation schedule..."/></FG>
      <Divider label="Special Requests"/>
      <FG label="Special Requests / Instructions"><textarea className={`${inputCls} resize-y min-h-[60px]`} value={f.specialRequests} onChange={e=>s("specialRequests",e.target.value)} placeholder="Any standing instructions or preferences..."/></FG>
      <Divider label="Emergency Contact"/>
      <G2>
        <FG label="Name"><input className={inputCls} value={f.emergency.name} onChange={e=>se("name",toTitle(e.target.value))}/></FG>
        <FG label="Relationship">
          <select className={selCls} value={f.emergency.relationship} onChange={e=>se("relationship",e.target.value)}>
            {["Spouse","Child","Parent","Sibling","Friend","Attorney","Property Manager","Other"].map(r=><option key={r}>{r}</option>)}
          </select>
        </FG>
      </G2>
      <G2>
        <FG label="Phone"><input className={inputCls} value={f.emergency.phone} onChange={e=>se("phone",fmtPhone(e.target.value))} maxLength={12}/></FG>
        <FG label="Email"><input className={inputCls} value={f.emergency.email} onChange={e=>se("email",e.target.value.toLowerCase())}/></FG>
      </G2>
      <FG label="Property Notes"><textarea className={`${inputCls} resize-y min-h-[70px]`} value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="General property information, quirks, things to check..."/></FG>
      <Divider label="Access Codes"/>
      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-3">🔒 Codes are hidden as you type. Enter Activate/Open code and Deactivate/Close code separately.</div>
      <G2>
        <FG label="Garage — Open / Activate"><input className={inputCls} type="password" value={f.codes.garageOpen} onChange={e=>sc("garageOpen",e.target.value)}/></FG>
        <FG label="Garage — Close / Deactivate"><input className={inputCls} type="password" value={f.codes.garageClose} onChange={e=>sc("garageClose",e.target.value)}/></FG>
      </G2>
      <G2>
        <FG label="Alarm — Activate / Arm"><input className={inputCls} type="password" value={f.codes.alarmOn} onChange={e=>sc("alarmOn",e.target.value)}/></FG>
        <FG label="Alarm — Deactivate / Disarm"><input className={inputCls} type="password" value={f.codes.alarmOff} onChange={e=>sc("alarmOff",e.target.value)}/></FG>
      </G2>
      <G2>
        <FG label="Gate — Open"><input className={inputCls} type="password" value={f.codes.gateOpen} onChange={e=>sc("gateOpen",e.target.value)} placeholder="If applicable"/></FG>
        <FG label="Gate — Close"><input className={inputCls} type="password" value={f.codes.gateClose} onChange={e=>sc("gateClose",e.target.value)} placeholder="If applicable"/></FG>
      </G2>
    </Modal>
  );
}

// ── Job Modal ─────────────────────────────────────────────────────────────────
function JobModal({data,clients,onSave,onClose}) {
  const blank = {clientId:clients[0]?.id,type:"watching",title:"",date:"",time:"",assignedTo:"Owner",notes:"",status:"pending",transport:null,recurring:false};
  const blankTr = {subtype:"airport",tripType:"oneway",airport:"",airline:"",flightNum:"",flightDep:"",flightArr:"",direction:"departure",
    pickupAddr:"",pickupCity:"",pickupState:"FL",pickupZip:"",
    dropAddr:"",dropCity:"",dropState:"FL",dropZip:"",pickupTime:""};
  const [f,  setF]  = useState(data||blank);
  const [tr, setTr] = useState(data?.transport||blankTr);
  const [recurEnd,  setRecurEnd]  = useState("");
  const [recurFreq, setRecurFreq] = useState("weekly");
  const [zipLoadP,  setZLP]       = useState(false);
  const [zipLoadD,  setZLD]       = useState(false);
  const s  = (k,v) => setF(p=>({...p,[k]:v}));
  const st = (k,v) => setTr(p=>({...p,[k]:v}));

  const handlePickupZip = async z => {
    st("pickupZip",z);
    if(z.length===5){ setZLP(true); const r=await lookupZip(z); if(r){st("pickupCity",r.city);st("pickupState",r.state);} setZLP(false); }
  };
  const handleDropZip = async z => {
    st("dropZip",z);
    if(z.length===5){ setZLD(true); const r=await lookupZip(z); if(r){st("dropCity",r.city);st("dropState",r.state);} setZLD(false); }
  };

  const handleSave = () => {
    const job = {...f, transport: f.type==="transport"?tr:null};
    if(f.recurring && recurEnd && f.date) {
      const dates = expandRecurring(f.date, recurEnd, recurFreq);
      onSave(job, dates);
    } else {
      onSave(job, null);
    }
  };

  return (
    <Modal title={data?"Edit Job":"New Job"} onClose={onClose} onSave={handleSave} saveLabel="Save Job" xwide>
      <FG label="Client">
        <select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>
          {clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}
        </select>
      </FG>
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
      <FG label="Job Title"><input className={inputCls} value={f.title} onChange={e=>s("title",toTitle(e.target.value))} placeholder="Brief description"/></FG>
      <G2>
        <FG label="Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Time"><input className={inputCls} type="time" value={f.time} onChange={e=>s("time",e.target.value)}/></FG>
      </G2>

      {/* Recurring */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={f.recurring} onChange={e=>s("recurring",e.target.checked)} className="rounded"/>
          <span className="text-sm font-semibold text-gray-700">Recurring Service</span>
        </label>
        {f.recurring&&(
          <G2>
            <FG label="Frequency">
              <select className={selCls} value={recurFreq} onChange={e=>setRecurFreq(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </FG>
            <FG label="Repeat Until"><input className={inputCls} type="date" value={recurEnd} onChange={e=>setRecurEnd(e.target.value)}/></FG>
          </G2>
        )}
      </div>

      {/* Transport sub-form */}
      {f.type==="transport"&&(
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-3">
          <div className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Transportation Details</div>
          <G2>
            <FG label="Transport Type">
              <select className={selCls} value={tr.subtype} onChange={e=>st("subtype",e.target.value)}>
                <option value="airport">Transportation — Airport</option>
                <option value="other">Transportation — Other</option>
              </select>
            </FG>
            {tr.subtype==="airport"&&(
              <FG label="Trip Type">
                <select className={selCls} value={tr.tripType} onChange={e=>st("tripType",e.target.value)}>
                  <option value="oneway">One Way</option>
                  <option value="roundtrip">Round Trip</option>
                </select>
              </FG>
            )}
            {tr.subtype==="other"&&(
              <FG label="Service Type">
                <select className={selCls} value={tr.otherType||"dropoff"} onChange={e=>st("otherType",e.target.value)}>
                  <option value="dropoff">Drop Off At Location</option>
                  <option value="pickup">Pick Up From Location</option>
                </select>
              </FG>
            )}
          </G2>

          {tr.subtype==="airport"&&(
            <>
              <G2>
                <FG label="Direction">
                  <select className={selCls} value={tr.direction} onChange={e=>st("direction",e.target.value)}>
                    <option value="departure">Departure (Flying Out)</option>
                    <option value="arrival">Arrival (Flying In)</option>
                  </select>
                </FG>
                <FG label="Airport Name Or Code"><input className={inputCls} value={tr.airport} onChange={e=>st("airport",e.target.value.toUpperCase())} placeholder="e.g. MIA or Miami Intl"/></FG>
              </G2>
              <G2>
                <FG label="Airline">
                  <select className={selCls} value={tr.airline} onChange={e=>st("airline",e.target.value)}>
                    <option value="">Select Airline...</option>
                    {AIRLINES.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </FG>
                <FG label="Flight Number"><input className={inputCls} value={tr.flightNum} onChange={e=>st("flightNum",e.target.value.toUpperCase())} placeholder="e.g. AA1045"/></FG>
              </G2>
              <G2>
                <FG label="Flight Departure Time"><input className={inputCls} type="time" value={tr.flightDep} onChange={e=>st("flightDep",e.target.value)}/></FG>
                <FG label="Flight Arrival Time"><input className={inputCls} type="time" value={tr.flightArr} onChange={e=>st("flightArr",e.target.value)}/></FG>
              </G2>
              <FG label="Client Pickup Time (If Departing)"><input className={inputCls} type="time" value={tr.pickupTime} onChange={e=>st("pickupTime",e.target.value)}/></FG>
            </>
          )}

          <Divider label="Pickup Location"/>
          <FG label="Street Address"><input className={inputCls} value={tr.pickupAddr} onChange={e=>st("pickupAddr",toTitle(e.target.value))}/></FG>
          <G3>
            <FG label={zipLoadP?"Zip (Loading...)":"Zip"}><input className={inputCls} value={tr.pickupZip} onChange={e=>handlePickupZip(e.target.value)} maxLength={5}/></FG>
            <FG label="City"><input className={inputCls} value={tr.pickupCity} onChange={e=>st("pickupCity",toTitle(e.target.value))}/></FG>
            <FG label="State"><input className={inputCls} value={tr.pickupState} onChange={e=>st("pickupState",e.target.value.toUpperCase())} maxLength={2}/></FG>
          </G3>

          <Divider label="Drop-Off Location"/>
          <FG label="Street Address / Destination"><input className={inputCls} value={tr.dropAddr} onChange={e=>st("dropAddr",toTitle(e.target.value))}/></FG>
          <G3>
            <FG label={zipLoadD?"Zip (Loading...)":"Zip"}><input className={inputCls} value={tr.dropZip} onChange={e=>handleDropZip(e.target.value)} maxLength={5}/></FG>
            <FG label="City"><input className={inputCls} value={tr.dropCity} onChange={e=>st("dropCity",toTitle(e.target.value))}/></FG>
            <FG label="State"><input className={inputCls} value={tr.dropState} onChange={e=>st("dropState",e.target.value.toUpperCase())} maxLength={2}/></FG>
          </G3>
        </div>
      )}

      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[60px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvModal({data,clients,services,onSave,onClose}) {
  const blank = {clientId:clients[0]?.id,description:"Monthly House Service",services:[],supplies:0,discount:0,date:today(),due:"",status:"pending",notes:""};
  const [f,setF] = useState(data||blank);
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  const addSvc = svcId => {
    const svc = services.find(x=>x.id===Number(svcId));
    if(!svc) return;
    setF(p=>({...p,services:[...p.services,{serviceId:svc.id,name:svc.name,qty:1,fee:svc.fee,custom:""}]}));
  };
  const updSvc = (i,k,v) => setF(p=>({...p,services:p.services.map((sv,idx)=>idx===i?{...sv,[k]:v}:sv)}));
  const remSvc = i => setF(p=>({...p,services:p.services.filter((_,idx)=>idx!==i)}));
  const subtotal = (f.services||[]).reduce((s,sv)=>s+(sv.fee*(sv.qty||1)),0);
  const total = subtotal+Number(f.supplies||0)-subtotal*(Number(f.discount||0)/100);
  return (
    <Modal title={data?"Edit Invoice":"New Invoice"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Invoice" xwide>
      <G2>
        <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}</select></FG>
        <FG label="Invoice Description"><input className={inputCls} value={f.description} onChange={e=>s("description",toTitle(e.target.value))} placeholder="e.g. Monthly House Service"/></FG>
      </G2>
      <G2>
        <FG label="Invoice Date"><input className={inputCls} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
        <FG label="Due Date"><input className={inputCls} type="date" value={f.due} onChange={e=>s("due",e.target.value)}/></FG>
      </G2>
      <Divider label="Services"/>
      <select className={`${selCls} mb-3`} value="" onChange={e=>addSvc(e.target.value)}>
        <option value="">+ Add A Service...</option>
        {services.map(sv=><option key={sv.id} value={sv.id}>{sv.name} ({fmt$(sv.fee)})</option>)}
      </select>
      {(f.services||[]).map((sv,i)=>(
        <div key={i} className="flex gap-2 items-center mb-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <div className="flex-1 text-sm font-medium text-gray-800">{sv.name}</div>
          <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Qty</span>
            <input type="number" min="1" value={sv.qty} onChange={e=>updSvc(i,"qty",Number(e.target.value))} className="w-14 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center bg-white outline-none focus:border-blue-400"/>
          </div>
          <div className="flex items-center gap-1"><span className="text-xs text-gray-500">$</span>
            <input type="number" value={sv.fee} onChange={e=>updSvc(i,"fee",Number(e.target.value))} className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center bg-white outline-none focus:border-blue-400"/>
          </div>
          <div className="text-sm font-bold text-gray-800 w-16 text-right">{fmt$(sv.fee*sv.qty)}</div>
          <button onClick={()=>remSvc(i)} className="text-red-400 hover:text-red-600 p-1"><X size={13}/></button>
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
        <div className="flex justify-between text-sm font-bold text-blue-700 pt-1 border-t border-blue-200"><span>Total Due</span><span>{fmt$(total)}</span></div>
      </div>
      <FG label="Notes"><textarea className={`${inputCls} resize-y min-h-[60px]`} value={f.notes} onChange={e=>s("notes",e.target.value)}/></FG>
    </Modal>
  );
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({data,clients,onSave,onClose}) {
  const [f,setF] = useState(data||{clientId:clients[0]?.id,title:"",text:"",date:today(),priority:"medium",auto:false});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={data?"Edit Note":"New Property Note"} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Note">
      <FG label="Client"><select className={selCls} value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clients.map(c=><option key={c.id} value={c.id}>{clientDisplayName(c)}</option>)}</select></FG>
      <G2>
        <FG label="Title"><input className={inputCls} value={f.title} onChange={e=>s("title",toTitle(e.target.value))}/></FG>
        <FG label="Priority">
          <select className={selCls} value={f.priority} onChange={e=>s("priority",e.target.value)}>
            <option value="high">Critical</option><option value="medium">Medium</option><option value="low">Low</option>
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
  const [method,   setMethod]   = useState("zelle");
  const [checkNum, setCheckNum] = useState("");
  return (
    <Modal title="Record Payment" onClose={onClose} onSave={()=>onSave(data.id,method,method==="check"?checkNum:"")} saveLabel="Record Payment">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Invoice Total</div>
        <div className="text-2xl font-bold text-blue-700">{fmt$(calcInvTotal(data))}</div>
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
      <FG label="Service Name"><input className={inputCls} value={f.name} onChange={e=>s("name",toTitle(e.target.value))}/></FG>
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
  const inv  = data;
  const c    = gc(inv.clientId);
  const pmt  = payments.filter(p=>p.invoiceId===inv.id);
  const total = calcInvTotal(inv);

  const printInvoice = () => {
    const w = window.open("","_blank");
    const sub = (inv.services||[]).reduce((s,sv)=>s+(sv.fee*(sv.qty||1)),0);
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice #${inv.id} — KeyStone</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;color:#1f2937;background:#fff;padding:48px;max-width:720px;margin:0 auto;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #2563eb;margin-bottom:32px;}
      .logo-text{font-size:28px;font-weight:900;color:#2563eb;letter-spacing:-1px;}
      .logo-sub{font-size:10px;color:#6b7280;letter-spacing:4px;text-transform:uppercase;margin-top:2px;}
      .inv-num{font-size:22px;font-weight:700;color:#1f2937;}
      .badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
        background:${inv.status==="paid"?"#d1fae5":inv.status==="overdue"?"#fee2e2":"#dbeafe"};
        color:${inv.status==="paid"?"#065f46":inv.status==="overdue"?"#991b1b":"#1e40af"};}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;}
      .label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
      .value{font-size:13px;color:#1f2937;margin-bottom:3px;}
      .value.big{font-size:16px;font-weight:700;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      thead tr{background:#f8fafc;}
      th{text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;}
      td{padding:12px 14px;font-size:13px;border-bottom:1px solid #f3f4f6;}
      .total-area{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 14px;}
      .total-row{display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:6px;}
      .total-final{display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#1d4ed8;padding-top:10px;border-top:1px solid #bfdbfe;margin-top:6px;}
      .paid-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:16px;}
      .paid-label{font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
      .paid-row{font-size:13px;color:#166534;}
      .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;}
      .print-btn{margin-top:20px;padding:10px 28px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;}
      @media print{.print-btn{display:none!important;}}
    </style></head><body>
    <div class="header">
      <div><div class="logo-text">KeyStone</div><div class="logo-sub">House Services</div></div>
      <div style="text-align:right"><div class="inv-num">Invoice #${inv.id}</div><div style="margin-top:6px"><span class="badge">${inv.status.toUpperCase()}</span></div></div>
    </div>
    <div class="grid2">
      <div>
        <div class="label">Bill To</div>
        <div class="value big">${clientDisplayName(c)}</div>
        <div class="value">${c?.street}</div>
        <div class="value">${c?.city}, ${c?.state} ${c?.zip}</div>
        <div class="value">${c?.phone}</div>
        <div style="margin-top:10px"><span class="label">Account #</span> <span class="value">${c?.acct}</span></div>
      </div>
      <div>
        <div class="label">Description</div><div class="value" style="margin-bottom:12px">${inv.description||"Invoice"}</div>
        <div class="label">Invoice Date</div><div class="value" style="margin-bottom:12px">${fmtDate(inv.date)}</div>
        <div class="label">Due Date</div><div class="value">${fmtDate(inv.due)}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Service</th><th>Qty</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${(inv.services||[]).map(sv=>`<tr><td>${sv.name}</td><td>${sv.qty}</td><td>${fmt$(sv.fee)}</td><td style="text-align:right">${fmt$(sv.fee*sv.qty)}</td></tr>`).join("")}
        ${inv.supplies>0?`<tr><td>Supplies</td><td>1</td><td>${fmt$(inv.supplies)}</td><td style="text-align:right">${fmt$(inv.supplies)}</td></tr>`:""}
      </tbody>
    </table>
    <div class="total-area">
      <div class="total-row"><span>Subtotal</span><span>${fmt$(sub)}</span></div>
      ${inv.supplies>0?`<div class="total-row"><span>Supplies</span><span>${fmt$(inv.supplies)}</span></div>`:""}
      ${inv.discount>0?`<div class="total-row" style="color:#dc2626"><span>Discount (${inv.discount}%)</span><span>-${fmt$(sub*(inv.discount/100))}</span></div>`:""}
      <div class="total-final"><span>Total Due</span><span>${fmt$(total)}</span></div>
    </div>
    ${pmt.length>0?`<div class="paid-box"><div class="paid-label">Payment Received</div>${pmt.map(p=>`<div class="paid-row">${fmtDate(p.date)} · ${p.method.charAt(0).toUpperCase()+p.method.slice(1)}${p.checkNum?" #"+p.checkNum:""} · ${fmt$(p.amount)}</div>`).join("")}</div>`:""}
    ${inv.notes?`<div style="margin-top:20px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:12px;color:#6b7280"><strong>Notes:</strong> ${inv.notes}</div>`:""}
    <div class="footer">Thank you for your business · KeyStone House Services · keystone-house-services.netlify.app</div>
    <button class="print-btn" onclick="window.print()">Print / Save As PDF</button>
    </body></html>`);
    w.document.close();
  };

  return (
    <Modal title={`Invoice #${inv.id}`} onClose={onClose} wide>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="font-bold text-gray-900 text-base">{clientDisplayName(c)}</div>
          <div className="text-xs text-gray-500">Acct #{c?.acct} · {inv.description||"Invoice"}</div>
          <div className="text-xs text-gray-400 mt-0.5">Issued {fmtDate(inv.date)} · Due {fmtDate(inv.due)}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge type={inv.status}/>
          <button onClick={printInvoice} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"><Printer size={12}/>Print / PDF</button>
          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors opacity-60 cursor-not-allowed"><Mail size={12}/>Email (Soon)</button>
        </div>
      </div>
      <table className="w-full text-sm mb-4">
        <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
          <th className="text-left px-3 py-2">Service</th>
          <th className="text-center px-3 py-2">Qty</th>
          <th className="text-right px-3 py-2">Rate</th>
          <th className="text-right px-3 py-2">Amount</th>
        </tr></thead>
        <tbody>
          {(inv.services||[]).map((sv,i)=><tr key={i} className="border-b border-gray-100"><td className="px-3 py-2">{sv.name}</td><td className="px-3 py-2 text-center">{sv.qty}</td><td className="px-3 py-2 text-right">{fmt$(sv.fee)}</td><td className="px-3 py-2 text-right font-medium">{fmt$(sv.fee*sv.qty)}</td></tr>)}
          {inv.supplies>0&&<tr className="border-b border-gray-100"><td className="px-3 py-2">Supplies</td><td className="px-3 py-2 text-center">1</td><td className="px-3 py-2 text-right">{fmt$(inv.supplies)}</td><td className="px-3 py-2 text-right font-medium">{fmt$(inv.supplies)}</td></tr>}
          {inv.discount>0&&<tr className="border-b border-gray-100 text-red-600"><td colSpan={3} className="px-3 py-2 text-right">Discount ({inv.discount}%)</td><td className="px-3 py-2 text-right">-{fmt$((inv.services||[]).reduce((s,sv)=>s+sv.fee*sv.qty,0)*inv.discount/100)}</td></tr>}
          <tr className="bg-blue-50"><td colSpan={3} className="px-3 py-2 text-right font-bold text-blue-700">Total Due</td><td className="px-3 py-2 text-right font-bold text-blue-700 text-lg">{fmt$(total)}</td></tr>
        </tbody>
      </table>
      {pmt.length>0&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">{pmt.map(p=><div key={p.id} className="text-xs text-emerald-700 font-medium"><Check size={11} className="inline mr-1"/>Paid {fmtDate(p.date)} · {p.method}{p.checkNum?` #${p.checkNum}`:""} · {fmt$(p.amount)}</div>)}</div>}
      {inv.status!=="paid"&&<button onClick={()=>{onClose();setModal({type:"payment",data:inv});}} className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors mt-2">Record Payment</button>}
    </Modal>
  );
}

// ── Statement Modal ───────────────────────────────────────────────────────────
function StatementModal({data,gc,invoices,payments,onClose}) {
  const [clientId, setClientId] = useState(data?.clientId||"");
  const [from, setFrom] = useState("");
  const [to,   setTo]   = useState("");
  const clients = invoices.map(i=>i.clientId).filter((v,i,a)=>a.indexOf(v)===i);
  const c = gc(Number(clientId));
  const filtInv = invoices.filter(i=>(!clientId||i.clientId===Number(clientId))&&(!from||i.date>=from)&&(!to||i.date<=to));
  const filtPmt = payments.filter(p=>filtInv.find(i=>i.id===p.invoiceId));
  const totalCharged = filtInv.reduce((s,i)=>s+calcInvTotal(i),0);
  const totalPaid    = filtPmt.reduce((s,p)=>s+p.amount,0);
  return (
    <Modal title="Statement Of Account" onClose={onClose} wide>
      <G3>
        <FG label="Client">
          <select className={selCls} value={clientId} onChange={e=>setClientId(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(id=><option key={id} value={id}>{clientDisplayName(gc(id))}</option>)}
          </select>
        </FG>
        <FG label="From Date"><input className={inputCls} type="date" value={from} onChange={e=>setFrom(e.target.value)}/></FG>
        <FG label="To Date"><input className={inputCls} type="date" value={to} onChange={e=>setTo(e.target.value)}/></FG>
      </G3>
      {filtInv.length===0?<Empty msg="No Transactions For Selected Range"/>:(
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">Invoiced</div><div className="font-bold text-blue-700 text-xl">{fmt$(totalCharged)}</div></div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">Paid</div><div className="font-bold text-emerald-700 text-xl">{fmt$(totalPaid)}</div></div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">Balance</div><div className="font-bold text-red-600 text-xl">{fmt$(totalCharged-totalPaid)}</div></div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtInv.sort((a,b)=>a.date.localeCompare(b.date)).map(inv=>(
              <div key={inv.id} className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <div><div className="font-medium text-gray-800">{inv.description||`Invoice #${inv.id}`}</div><div className="text-xs text-gray-400">{fmtDate(inv.date)} · {clientDisplayName(gc(inv.clientId))}</div></div>
                <div className="text-right"><div className="font-bold text-gray-800">{fmt$(calcInvTotal(inv))}</div><Badge type={inv.status}/></div>
              </div>
            ))}
          </div>
          <button onClick={()=>{
            const w=window.open("","_blank");
            w.document.write(`<html><head><title>Statement</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:680px;margin:0 auto;}h1{color:#2563eb;}table{width:100%;border-collapse:collapse;}th{background:#f8fafc;padding:10px;text-align:left;font-size:12px;}td{padding:10px;border-bottom:1px solid #f3f4f6;font-size:13px;}.total{font-weight:bold;}.print-btn{margin-top:20px;padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;}@media print{.print-btn{display:none!important;}}</style></head><body>
            <h1>KeyStone House Services</h1><h2 style="color:#374151">${c?clientDisplayName(c):"All Clients"} — Statement Of Account</h2>
            <p style="color:#6b7280;font-size:13px">${from?`From ${fmtDate(from)}`:"All dates"}${to?` to ${fmtDate(to)}`:""}</p>
            <table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            ${filtInv.map(i=>`<tr><td>${fmtDate(i.date)}</td><td>${i.description||"Invoice #"+i.id}</td><td>${fmt$(calcInvTotal(i))}</td><td>${i.status}</td></tr>`).join("")}
            </tbody></table>
            <p style="margin-top:20px;"><strong>Total Invoiced:</strong> ${fmt$(totalCharged)} &nbsp;&nbsp; <strong>Total Paid:</strong> ${fmt$(totalPaid)} &nbsp;&nbsp; <strong>Balance:</strong> ${fmt$(totalCharged-totalPaid)}</p>
            <button class="print-btn" onclick="window.print()">Print / Save As PDF</button>
            </body></html>`);
            w.document.close();
          }} className="w-full mt-4 flex items-center justify-center gap-2 border border-blue-300 text-blue-700 bg-blue-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
            <Printer size={14}/> Print / Export Statement PDF
          </button>
        </>
      )}
    </Modal>
  );
}
