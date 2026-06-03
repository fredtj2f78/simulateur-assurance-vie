import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAuth } from '../lib/useAuth'

const VERSION = 'v29'
const APP_NAME = 'Calcul Audit Immobilier'

const T = {
 bg:'#080c12',s1:'#0e1520',s2:'#141d2e',s3:'#1a2540',
 border:'#1e2d45',borderBright:'#2a3f5f',
 gold:'#c9a84c',goldDim:'#7a6030',goldBright:'#e8c76a',
 blue:'#4a9eff',green:'#2ecc71',red:'#e74c3c',purple:'#9b59b6',orange:'#e67e22',
 text:'#dce8f5',textDim:'#7a93b0',textMuted:'#3a5070',
 sci:'#c9a84c',ln:'#4a9eff',lmnp:'#2ecc71',
}

const nf = (v,d=0) => (v==null||isNaN(v))?"—":new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v)
const eur = (v,d=0) => v==null||isNaN(v)?"—":`${nf(v,d)} €`
const pct = (v,d=1) => v==null||isNaN(v)?"—":`${nf(v*100,d)} %`

const DEF = {
 adresse:'',
 prixAchat:380000, notaire:30400, notaireManuel:false,
 chasseurTTC:0, agenceAcq:0, agenceIncluse:true,
 travaux:0, mobilier:0, terrain:0.20,
 apport:0, emprunt:0, empruntManuel:false,
 duree:20, taux:0.035, assurance:0.003,
 gli:783, fonciere:7458, teom:200,
 coproRec:3826, coproNonRec:5738,
 pno:432, gestion:0, entretien:0, cfe:300, comptable:800,
 loyerCC:3583, charges:319, vacance:0, revaloLoyer:0,
 tmi:0.41, tmiRetraite:0.30, anneeRetraite:99,
 ps:0.172, isReduit:0.15, isPlein:0.25, seuilIS:42500,
 dAmortBien:25, dAmortTravaux:10, dAmortMobilier:7,
 dAmortChasseur:5, dAmortNotaire:5,
 pfu:0.314, anCession:20,
 prixRevente:0, prixReventeManuel:false,
 fraisAgRevente:0, fraisAgReventeManuel:false,
 revaloValeur:0.015,
 ifiAutresActifs:0, ifiRP:0,
}

const BLOCKS = [
 {id:'acq',label:'A. Acquisition'},
 {id:'fin',label:'B. Financement'},
 {id:'charges',label:'C. Charges annuelles'},
 {id:'rev',label:'D. Revenus locatifs'},
 {id:'fisc',label:'E. Paramètres fiscaux'},
 {id:'revente',label:'F. Revente'},
 {id:'kpis',label:'KPIs & Rendements'},
 {id:'tab_comp',label:'Tableau Synthèse (EBE, CF, TRI)'},
 {id:'cf_chart',label:'Graphique CF avant/après impôt'},
 {id:'cumul_chart',label:'Graphique Trésorerie cumulée'},
 {id:'tri',label:'TRI & Performance'},
 {id:'horizons',label:'Sortie Multi-Horizons'},
 {id:'sensibilite',label:'Analyse de Sensibilité'},
 {id:'ifi',label:'Module IFI'},
 {id:'tab_sci',label:'Tableau SCI IS'},
 {id:'tab_ln',label:'Tableau Location Nue'},
 {id:'tab_lmnp',label:'Tableau LMNP Réel'},
 {id:'tab_revente',label:'Détail Revente'},
 {id:'tab_emprunt',label:"Tableau d'Amortissement"},
 {id:'verdict',label:'Dashboard / Verdict'},
]

// ── UI COMPONENTS ─────────────────────────────────────────────────────────
const Lbl = ({c}) => <span style={{color:T.textDim,fontSize:11,display:'block',marginBottom:3}}>{c}</span>

const Inp = ({label,value,onChange,suffix='€',step=1000,min=0,max,disabled}) => (
 <div style={{marginBottom:10}}>
 <Lbl c={label}/>
 <div style={{display:'flex',alignItems:'center',gap:6}}>
 <input type="number" value={value} step={step} min={min} max={max} disabled={disabled}
 onChange={e=>onChange(parseFloat(e.target.value)||0)}
 style={{background:disabled?T.s2:T.s3,border:`1px solid ${disabled?T.border:T.borderBright}`,borderRadius:5,color:disabled?T.textMuted:T.gold,padding:'6px 10px',fontSize:13,width:'100%',outline:'none',fontVariantNumeric:'tabular-nums'}}/>
 {suffix&&<span style={{color:T.textMuted,fontSize:11,whiteSpace:'nowrap'}}>{suffix}</span>}
 </div>
 </div>
)

const PInp = ({label,value,onChange}) => (
 <Inp label={label} value={+(value*100).toFixed(3)} onChange={v=>onChange(v/100)} suffix="%" step={0.1} min={0} max={100}/>
)

const TxtInp = ({label,value,onChange}) => (
 <div style={{marginBottom:10}}>
 <Lbl c={label}/>
 <input type="text" value={value} onChange={e=>onChange(e.target.value)}
 style={{background:T.s3,border:`1px solid ${T.borderBright}`,borderRadius:5,color:T.text,padding:'6px 10px',fontSize:13,width:'100%',outline:'none'}}/>
 </div>
)

const AutoInp = ({label,autoValue,manuelValue,isManuel,onToggle,onChange,suffix='€',step=1000,hint}) => (
 <div style={{marginBottom:10}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
 <Lbl c={label}/>
 <button onClick={onToggle} style={{background:isManuel?`${T.orange}22`:`${T.green}22`,border:`1px solid ${isManuel?T.orange:T.green}`,borderRadius:4,padding:'1px 8px',fontSize:10,cursor:'pointer',color:isManuel?T.orange:T.green,fontWeight:700}}>
 {isManuel?'✏️ Manuel':'⚡ Auto'}
 </button>
 </div>
 <div style={{display:'flex',alignItems:'center',gap:6}}>
 <input type="number" value={isManuel?manuelValue:autoValue} step={step} min={0} disabled={!isManuel}
 onChange={e=>onChange(parseFloat(e.target.value)||0)}
 style={{background:isManuel?T.s3:T.s2,border:`1px solid ${isManuel?T.orange:T.border}`,borderRadius:5,color:isManuel?T.orange:T.textMuted,padding:'6px 10px',fontSize:13,width:'100%',outline:'none',fontVariantNumeric:'tabular-nums'}}/>
 <span style={{color:T.textMuted,fontSize:11,whiteSpace:'nowrap'}}>{suffix}</span>
 </div>
 {hint&&<div style={{fontSize:10,color:isManuel?T.orange:T.textMuted,marginTop:3}}>{hint}</div>}
 </div>
)

const Toggle2 = ({labelA,labelB,value,onChange}) => (
 <div style={{display:'flex',gap:6,marginBottom:10}}>
 {[true,false].map((v,i)=>(
 <button key={i} onClick={()=>onChange(v)}
 style={{flex:1,padding:'7px 0',borderRadius:5,fontSize:12,fontWeight:600,cursor:'pointer',border:`1px solid ${value===v?T.gold:T.border}`,background:value===v?`${T.gold}22`:T.s2,color:value===v?T.gold:T.textDim}}>
 {v?labelA:labelB}
 </button>
 ))}
 </div>
 )

const InfoBox = ({children,color=T.gold}) => (
 <div style={{padding:'7px 12px',background:`${color}0e`,border:`1px solid ${color}33`,borderRadius:6,fontSize:11,color,marginTop:6,lineHeight:1.7}}>{children}</div>
)

const Card = ({label,value,color=T.text,sub}) => (
 <div style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:8,padding:'12px 14px',flex:1,minWidth:140}}>
 <div style={{color:T.textDim,fontSize:10,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>{label}</div>
 <div style={{color,fontSize:18,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{value}</div>
 {sub&&<div style={{color:T.textMuted,fontSize:10,marginTop:3}}>{sub}</div>}
 </div>
)

const Section = ({title,children,color=T.gold}) => (
 <div style={{background:T.s1,border:`1px solid ${T.border}`,borderRadius:10,padding:'18px 20px',marginBottom:14}}>
 <div style={{fontSize:10,fontWeight:800,color,letterSpacing:2.5,textTransform:'uppercase',marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>{title}</div>
 {children}
 </div>
)

const Tbl = ({headers,rows,color=T.gold,compact=false}) => (
 <div style={{overflowX:'auto'}}>
 <table style={{width:'100%',borderCollapse:'collapse',fontSize:compact?11:12}}>
 <thead><tr>{headers.map((h,i)=><th key={i} style={{padding:compact?'5px 8px':'7px 10px',textAlign:i===0?'left':'right',color,fontSize:10,fontWeight:700,letterSpacing:1,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
 <tbody>{rows.map((row,ri)=><tr key={ri} style={{background:ri%2===0?'transparent':`${T.s2}88`}}>{row.map((cell,ci)=><td key={ci} style={{padding:compact?'4px 8px':'6px 10px',textAlign:ci===0?'left':'right',color:ci===0?T.textDim:T.text,borderBottom:`1px solid ${T.borderBright}22`,fontVariantNumeric:'tabular-nums'}}>{cell}</td>)}</tr>)}</tbody>
 </table>
 </div>
)

const RegimeWinner = ({name,val,winner,color,restricted}) => (
 <div style={{flex:1,minWidth:200,background:winner?`${color}18`:T.s2,border:`1px solid ${winner?color:T.border}`,borderRadius:10,padding:'16px 18px',position:'relative'}}>
 {winner&&<div style={{position:'absolute',top:8,right:10,background:color,color:'#000',fontSize:8,fontWeight:800,padding:'2px 7px',borderRadius:3,letterSpacing:1}}>GAGNANT</div>}
 <div style={{color,fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:8}}>{name}</div>
 <div style={{color:winner?color:T.text,fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums'}}>
 {restricted?<span style={{color:T.textMuted,fontSize:14}}>🔒 Premium</span>:eur(val)}
 </div>
 </div>
)

const Watermark = ({children}) => (
 <div style={{position:'relative',overflow:'hidden',borderRadius:8}}>
 <div style={{opacity:0.1,pointerEvents:'none'}}>{children}</div>
 <div style={{position:'absolute',inset:0,background:'rgba(8,12,18,0.9)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:8}}>
 <div style={{fontSize:24,marginBottom:8}}>🔒</div>
 <div style={{color:T.gold,fontWeight:700,fontSize:14,marginBottom:6}}>Fonctionnalité Premium</div>
 <a href="/pricing" style={{background:T.gold,color:'#000',fontWeight:700,fontSize:13,padding:'8px 20px',borderRadius:6,textDecoration:'none',marginTop:8}}>Débloquer Premium 🚀</a>
 </div>
 </div>
)

const ChartTip = ({active,payload,label}) => {
 if(!active||!payload?.length) return null
 return <div style={{background:T.s2,border:`1px solid ${T.borderBright}`,borderRadius:8,padding:'10px 14px',fontSize:11}}>
 <div style={{color:T.textDim,marginBottom:6,fontWeight:600}}>{label}</div>
 {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name} : {eur(p.value)}</div>)}
 </div>
}

const Settings = ({open,blocks,toggle,close}) => (
 <>
 {open&&<div onClick={close} style={{position:'fixed',inset:0,zIndex:98}}/>}
 <div style={{position:'fixed',top:54,right:16,zIndex:99,width:300,background:T.s1,border:`1px solid ${T.borderBright}`,borderRadius:12,padding:18,boxShadow:'0 24px 64px #00000080',opacity:open?1:0,pointerEvents:open?'all':'none',transform:open?'translateY(0) scale(1)':'translateY(-8px) scale(0.96)',transition:'all 0.18s cubic-bezier(.4,0,.2,1)',transformOrigin:'top right'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
 <span style={{color:T.text,fontWeight:700,fontSize:13}}>Blocs affichés</span>
 <button onClick={close} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:20}}>×</button>
 </div>
 <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:'70vh',overflowY:'auto'}}>
 {BLOCKS.map(b=>(
 <div key={b.id} onClick={()=>toggle(b.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',borderRadius:6,cursor:'pointer',background:blocks[b.id]?`${T.gold}12`:'transparent'}}>
 <span style={{color:blocks[b.id]?T.text:T.textDim,fontSize:12}}>{b.label}</span>
 <div style={{width:34,height:18,borderRadius:9,background:blocks[b.id]?T.gold:T.border,position:'relative',flexShrink:0,transition:'background 0.18s'}}>
 <div style={{width:12,height:12,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:blocks[b.id]?19:3,transition:'left 0.18s'}}/>
 </div>
 </div>
 ))}
 </div>
 <div style={{display:'flex',gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
 {[['Tout afficher',true],['Tout masquer',false]].map(([lbl,v])=>(
 <button key={lbl} onClick={()=>BLOCKS.forEach(b=>toggle(b.id,v))} style={{flex:1,background:T.s2,border:`1px solid ${T.border}`,borderRadius:6,color:T.textDim,padding:'5px 0',fontSize:11,cursor:'pointer'}}>{lbl}</button>
 ))}
 </div>
 </div>
 </>
)

export default function Simulateur() {
 const router = useRouter()
 const {user,loading:authLoading,signOut,getToken} = useAuth()
 const [p,setP] = useState(DEF)
 const [result,setResult] = useState(null)
 const [calcLoading,setCalcLoading] = useState(false)

const [saveStatus,setSaveStatus] = useState('')
const [biens,setBiens] = useState([])         
const [bienActifId,setBienActifId] = useState(null)
const bienActifIdRef = useRef(null)
const biensRef = useRef([]) 
const [showBienMenu,setShowBienMenu] = useState(false)
const [editingNomId,setEditingNomId] = useState(null)
const [editingNomVal,setEditingNomVal] = useState('')
 const [plan,setPlan] = useState(null)
 const [settingsOpen,setSettingsOpen] = useState(false)
 const [blocks,setBlocks] = useState(Object.fromEntries(BLOCKS.map(b=>[b.id,true])))
 const [exportLoading,setExportLoading] = useState(false)

 const debounceCalc = useRef(null)
 const debounceS = useRef(null)
 const hasLoaded = useRef(false) // LE VERROU ANTI-BOUCLE

 const stateRef = useRef(p)
 useEffect(() => { stateRef.current = p }, [p])

// Maintient la réf des biens à jour
useEffect(() => {
  biensRef.current = biens;
}, [biens]);

useEffect(()=>{if(!authLoading&&!user)router.push('/login')},[user,authLoading,router])

// 🔒 Chargement initial robuste
useEffect(() => {
  if (!user || hasLoaded.current) return;
  hasLoaded.current = true;

  const load = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/simulation',{headers:{Authorization:`Bearer ${token}`}})
      const data = await res.json()
      const liste = data.simulations ?? []
      setBiens(liste)
      if(liste.length === 0) {
        const r2 = await fetch('/api/simulation',{
          method:'POST',
          headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
          body:JSON.stringify({params:DEF,nom:'Mon bien 1'})
        })
        const d2 = await r2.json()
        setBienActifId(d2.id); bienActifIdRef.current = d2.id
        setBiens([{id:d2.id,nom:'Mon bien 1',updated_at:new Date().toISOString()}])
      } else {
        const actif = liste[0]
        setBienActifId(actif.id); bienActifIdRef.current = actif.id
        const r2 = await fetch(`/api/simulation?id=${actif.id}`,{headers:{Authorization:`Bearer ${token}`}})
        const d2 = await r2.json()
        setP({ ...DEF, ...(d2.simulation?.params || {}) })
      }
    } catch (e) {
      console.error("Erreur de chargement initial:", e)
      hasLoaded.current = false;
    }
  }
  load()
}, [user, getToken])


const saveParams = useCallback(async(params, forceId = null, forceNom = null)=>{
  const id = forceId || bienActifIdRef.current;
  if(!id) return;

  let nom = forceNom;
  if (!nom) {
     const b = biensRef.current.find(x => x.id === id);
     nom = b ? b.nom : 'Mon bien';
  }

  const token = await getToken();
  setSaveStatus('saving');
  try {
     await fetch(`/api/simulation?id=${id}`,{
       method:'PUT',
       headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
       body:JSON.stringify({params, nom}) 
     });
     setSaveStatus('saved');
     setTimeout(()=>setSaveStatus(''),2000);
  } catch (err) {
     console.error("Erreur de sauvegarde", err);
     setSaveStatus('');
  }
},[getToken]);

const creerNouveauBien = useCallback(async()=>{
  if (bienActifIdRef.current) {
    await saveParams(stateRef.current, bienActifIdRef.current);
  }

  const token = await getToken();
  const nom = `Mon bien ${biens.length+1}`;
  const res = await fetch('/api/simulation',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
    body:JSON.stringify({params:DEF,nom})
  });
  
  const data = await res.json();
  const nouveau = {id:data.id,nom,updated_at:new Date().toISOString()};
  
  setBiens(prev=>[nouveau,...prev]);
  setBienActifId(data.id); 
  bienActifIdRef.current = data.id;
  setP(DEF);
  setShowBienMenu(false);
},[getToken, biens.length, saveParams]);


// 🚀 LA CORRECTION DU CHANGEMENT DE BIEN EST ICI
const chargerBien = useCallback(async(id)=>{
  // 1. On sauvegarde l'ancien bien avant de changer
  if (bienActifIdRef.current && bienActifIdRef.current !== id) {
    await saveParams(stateRef.current, bienActifIdRef.current);
  }

  // 2. On lance la récupération du nouveau
  const token = await getToken();
  const res = await fetch(`/api/simulation?id=${id}`,{headers:{Authorization:`Bearer ${token}`}});
  const data = await res.json();
  
  // 3. On FORCE la mise à jour de l'ID actif (même si le bien récupéré est vide !)
  setBienActifId(id); 
  bienActifIdRef.current = id;
  
  // 4. On charge les données, sinon on met les valeurs par défaut
  setP({ ...DEF, ...(data.simulation?.params || {}) });
  setShowBienMenu(false);
},[getToken, saveParams]);


const supprimerBien = useCallback(async(id)=>{
  if(!confirm('Supprimer ce bien ? Cette action est irréversible.')) return
  const token = await getToken()
  await fetch(`/api/simulation?id=${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
  const reste = biens.filter(b=>b.id!==id)
  setBiens(reste)
  if(bienActifId===id){
    if(reste.length>0){ chargerBien(reste[0].id) }
    else { setBienActifId(null); setP(DEF) }
  }
  setShowBienMenu(false)
},[getToken,biens,bienActifId,chargerBien])


const renommerBien = async(id, nouveauNom)=>{
  if (!nouveauNom || nouveauNom.trim() === '') {
    setEditingNomId(null);
    return;
  }
  const token = await getToken();
  
  setBiens(prev=>prev.map(b=>b.id===id?{...b,nom:nouveauNom}:b));
  setEditingNomId(null);

  if (id === bienActifIdRef.current) {
     await fetch(`/api/simulation?id=${id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({ params: stateRef.current, nom: nouveauNom })
     });
  } else {
     const res = await fetch(`/api/simulation?id=${id}`,{headers:{Authorization:`Bearer ${token}`}});
     const data = await res.json();
     const existingParams = data.simulation?.params || DEF;

     await fetch(`/api/simulation?id=${id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({ params: existingParams, nom: nouveauNom })
     });
  }
}

const runCalc = useCallback(async(params)=>{
 setCalcLoading(true)
 try{
 const token = await getToken()
 const res = await fetch('/api/calcul',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(params)})
 const data = await res.json()
 setResult(data); setPlan(data.plan)
 }catch(e){console.error(e)}
 finally{setCalcLoading(false)}
 },[getToken])

const runCalcRef = useRef(runCalc)
const saveParamsRef = useRef(saveParams)

useEffect(() => {
  runCalcRef.current = runCalc
  saveParamsRef.current = saveParams
}, [runCalc, saveParams])

useEffect(()=>{
 if(!user) return
 clearTimeout(debounceCalc.current)
 debounceCalc.current = setTimeout(() => {
   if (runCalcRef.current) runCalcRef.current(p)
 }, 600)

 clearTimeout(debounceS.current)
 if (bienActifIdRef.current) {
   debounceS.current = setTimeout(() => {
     if (saveParamsRef.current) saveParamsRef.current(p)
   }, 2000)
 }
 return()=>{clearTimeout(debounceCalc.current);clearTimeout(debounceS.current)}
},[p, user])


 const set = useCallback(k=>v=>setP(prev=>({...prev,[k]:v})),[])
 const toggle = useCallback((id,forceTo)=>setBlocks(prev=>({...prev,[id]:forceTo!==undefined?forceTo:!prev[id]})),[])
 const show = id=>blocks[id]

 const setPrixAchat = useCallback(v=>setP(prev=>({...prev,prixAchat:v,notaire:prev.notaireManuel?prev.notaire:Math.round(v*0.08)})),[])
 const chasseurHT = Math.round(p.chasseurTTC/1.2)
 const chasseurTVA = p.chasseurTTC - chasseurHT
 const prixReventeAuto = Math.round(p.prixAchat*Math.pow(1+p.revaloValeur,p.anCession))
 const fraisAgReventeAuto = Math.round((p.prixReventeManuel&&p.prixRevente>0?p.prixRevente:prixReventeAuto)*0.05)
 const empruntAuto = result?.empruntCalc ?? Math.max(0,(p.prixAchat+Math.round(p.prixAchat*0.08))-p.apport)
 
 const isPremium = result ? !result.restricted : false;
 const isRestricted = result?.restricted === true;

 const handleExport = async()=>{
 setExportLoading(true)
 try{
 const token = await getToken()
 const res = await fetch('/api/export-pdf',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({params:p})})
 if(res.ok){
 const html = await res.text()
 const blob = new Blob([html],{type:'text/html'})
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href=url; a.download=`SimuImmo_${p.adresse||'rapport'}_an${p.anCession}.html`
 a.click(); URL.revokeObjectURL(url)
 }
 }catch(e){console.error(e)}
 finally{setExportLoading(false)}
 }

 const skip = Math.max(1,Math.floor(p.anCession/6))

 const cfData = result?.years?.map(y=>({
 an:`An ${y.year}`,
 'SCI avant impôt': Math.round(y.cfBISCI/12),
 'SCI après impôt': Math.round(y.cfSCI/12),
 'LN avant impôt': Math.round(y.cfBILN/12),
 'LN après impôt': Math.round(y.cfLN/12),
 'LMNP avant impôt': Math.round(y.cfBILMNP/12),
 'LMNP après impôt': Math.round(y.cfLMNP/12),
 }))||[]

 const cumulData = result?.years?.map(y=>({
 an:`An ${y.year}`,
 'SCI IS': Math.round(y.sciCumul),
 'Location Nue': Math.round(y.lnCumul),
 'LMNP Réel': Math.round(y.lmnpCumul),
 }))||[]

 const baseLoyer = p.loyerCC
 const chargesBase = p.gli + (p.fonciere-p.teom) + p.coproNonRec + p.pno + p.gestion + p.entretien
 const loyerVariants = [-30,-15,-10,0,10,15,30].map(d=>{
 const lv=baseLoyer*(1+d/100)
 const loyerAnn=lv*12*(1-p.vacance)
 const chargesTreso=p.gli+p.fonciere+(p.coproRec+p.coproNonRec)+p.pno+p.gestion+p.entretien
 const cfAn1=loyerAnn-chargesTreso-(result?.mensualite??0)*12
 return{delta:d,loyer:Math.round(lv),cfAn1:Math.round(cfAn1/12),loyerAnn:Math.round(loyerAnn)}
 })
 const vacanceVariants=[0,0.03,0.05,0.08,0.10,0.15].map(v=>{
 const lp=baseLoyer*12*(1-v)
 const chargesTreso=p.gli+p.fonciere+(p.coproRec+p.coproNonRec)+p.pno+p.gestion+p.entretien
 return{taux:v,loyerPond:Math.round(lp),cfAn1:Math.round((lp-chargesTreso-(result?.mensualite??0)*12)/12)}
 })
 const revaloVariants=[0,0.005,0.01,0.015,0.02,0.025,0.03].map(rv=>({taux:rv,prixVente:Math.round(p.prixAchat*Math.pow(1+rv,p.anCession))}))

 const coutTotal = result?.coutTotal || 1;
 const ebeLN = (result?.loyerHCAnn || 0) - (result?.chargesCommunes || 0);
 const ebeLMNPSCI = ebeLN - p.cfe - p.comptable;

 const compData = result ? {
   sci: { ebe: ebeLMNPSCI, cashFlow: result?.years?.[0]?.cfSCI || 0, rendBrut: result?.rendBrut || 0, rendNet: ebeLMNPSCI / coutTotal, tri: result?.triSCI || 0 },
   lmnp: { ebe: ebeLMNPSCI, cashFlow: result?.years?.[0]?.cfLMNP || 0, rendBrut: result?.rendBrut || 0, rendNet: ebeLMNPSCI / coutTotal, tri: result?.triLMNP || 0 },
   nue: { ebe: ebeLN, cashFlow: result?.years?.[0]?.cfLN || 0, rendBrut: result?.rendBrut || 0, rendNet: ebeLN / coutTotal, tri: result?.triLN || 0 }
 } : null;

 if(authLoading) return <div style={{background:T.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:T.textDim}}>Chargement...</div>
 if(!user) return null

 return (
 <div style={{background:T.bg,minHeight:'100vh',fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",color:T.text}}>
 
<div style={{position:'sticky',top:0,zIndex:50,background:`${T.bg}f0`,backdropFilter:'blur(16px)',borderBottom:`1px solid ${T.border}`,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
  <div style={{display:'flex',alignItems:'center',gap:10}}>
    <div style={{width:26,height:26,background:`linear-gradient(135deg,${T.gold},${T.goldBright})`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⌂</div>
    <span style={{fontWeight:800,fontSize:15,letterSpacing:-0.5}}>{APP_NAME}</span>
    <span style={{color:T.textMuted,fontSize:11,background:T.s2,border:`1px solid ${T.border}`,padding:'1px 6px',borderRadius:4}}>{VERSION}</span>
    {calcLoading&&<span style={{color:T.textMuted,fontSize:11}}>calcul...</span>}
    {saveStatus==='saving'&&<span style={{color:T.textMuted,fontSize:11}}>💾 sauvegarde...</span>}
    {saveStatus==='saved'&&<span style={{color:T.green,fontSize:11}}>✓ sauvegardé</span>}
    <button onClick={()=>saveParams(p)}
      style={{background:`${T.gold}22`,border:`1px solid ${T.gold}`,borderRadius:6,color:T.gold,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:700}}>
      💾 Sauvegarder
    </button>

    {/* DROPDOWN BIENS */}
    <div style={{position:'relative'}}>
      <button onClick={()=>setShowBienMenu(!showBienMenu)}
        style={{display:'flex',alignItems:'center',gap:6,background:T.s2,border:`1px solid ${showBienMenu?T.gold:T.border}`,borderRadius:6,padding:'4px 10px',cursor:'pointer',color:T.text,fontSize:12,maxWidth:160}}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {biens.find(b=>b.id===bienActifId)?.nom||'Mon bien'}
        </span>
        <span style={{color:T.textMuted,fontSize:10}}>▾</span>
      </button>

      {showBienMenu&&(
        <>
          <div onClick={()=>setShowBienMenu(false)} style={{position:'fixed',inset:0,zIndex:98}}/>
          <div style={{position:'absolute',top:36,left:0,zIndex:99,width:240,background:T.s1,border:`1px solid ${T.borderBright}`,borderRadius:10,padding:8,boxShadow:'0 16px 48px #00000080'}}>
            {biens.map(b=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',borderRadius:6,background:b.id===bienActifId?`${T.gold}18`:'transparent',marginBottom:2}}>
                {editingNomId===b.id
                  ?<input autoFocus value={editingNomVal} onChange={e=>setEditingNomVal(e.target.value)}
                    onBlur={()=>renommerBien(b.id,editingNomVal||b.nom)}
                    onKeyDown={e=>{if(e.key==='Enter')renommerBien(b.id,editingNomVal||b.nom);if(e.key==='Escape')setEditingNomId(null)}}
                    style={{flex:1,background:T.s3,border:`1px solid ${T.gold}`,borderRadius:4,color:T.gold,fontSize:12,padding:'2px 6px',outline:'none'}}
                    onClick={e=>e.stopPropagation()}/>
                  :<>
                    <span onClick={()=>chargerBien(b.id)} onDoubleClick={()=>{setEditingNomId(b.id);setEditingNomVal(b.nom)}}
                      style={{flex:1,cursor:'pointer',color:b.id===bienActifId?T.gold:T.text,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',userSelect:'none'}}>
                      {b.nom}
                    </span>
                    <span onClick={(e)=>{e.stopPropagation(); setEditingNomId(b.id); setEditingNomVal(b.nom)}}
                      style={{cursor:'pointer',fontSize:12,padding:'0 4px',color:T.textDim}}
                      title="Renommer">
                      ✏️
                    </span>
                  </>
                }
                <span onClick={()=>supprimerBien(b.id)}
                  style={{color:T.red,cursor:'pointer',fontSize:14,padding:'0 4px',flexShrink:0}}
                  title="Supprimer">×</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${T.border}`,marginTop:6,paddingTop:6}}>
              <button onClick={creerNouveauBien}
                style={{width:'100%',background:`${T.green}18`,border:`1px solid ${T.green}44`,borderRadius:6,color:T.green,padding:'6px 0',fontSize:12,cursor:'pointer',fontWeight:700}}>
                ＋ Nouveau bien
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>

  <div style={{display:'flex',alignItems:'center',gap:8}}>
    {result&&!isRestricted&&<div style={{background:`${T.gold}18`,border:`1px solid ${T.goldDim}`,borderRadius:6,padding:'3px 10px',fontSize:11,color:T.gold,fontWeight:700}}>🏆 {result?.verdict}</div>}
    <div style={{background:isPremium?`${T.green}18`:`${T.orange}18`,border:`1px solid ${isPremium?T.green:T.orange}`,borderRadius:6,padding:'3px 10px',fontSize:11,color:isPremium?T.green:T.orange,fontWeight:700}}>
      {isPremium?'✓ Premium':'Gratuit'}
    </div>
    {isPremium&&(
      <button onClick={handleExport} disabled={exportLoading} style={{background:`${T.blue}22`,border:`1px solid ${T.blue}44`,borderRadius:6,color:T.blue,padding:'5px 10px',fontSize:12,cursor:'pointer',fontWeight:600}}>
        {exportLoading?'...':'📄 PDF'}
      </button>
    )}
    {!isPremium&&<a href="/pricing" style={{background:T.gold,color:'#000',fontWeight:700,fontSize:12,padding:'5px 12px',borderRadius:6,textDecoration:'none'}}>Débloquer Premium 🚀</a>}
    <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{background:settingsOpen?`${T.gold}18`:T.s2,border:`1px solid ${settingsOpen?T.gold:T.border}`,borderRadius:8,padding:'6px 12px',cursor:'pointer',color:T.text,display:'flex',alignItems:'center',gap:6,fontSize:12}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      Affichage
    </button>
    {user?.email === 'ft.bu@ik.me' && (
      <button onClick={()=>router.push('/admin')}
        style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:6,color:T.gold,padding:'5px 10px',fontSize:12,cursor:'pointer'}}>
        🔧 Admin
      </button>
    )}
    <button onClick={signOut} style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:6,color:T.textDim,padding:'5px 10px',fontSize:12,cursor:'pointer'}}>Déco</button>
  </div>
</div>

 <Settings open={settingsOpen} blocks={blocks} toggle={toggle} close={()=>setSettingsOpen(false)}/>

 <div style={{maxWidth:1320,margin:'0 auto',padding:'20px 16px'}}>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:14}}>

 {/* A. ACQUISITION */}
 {show('acq')&&(
 <Section title="A. Acquisition" color={T.sci}>
 <TxtInp label="Adresse du bien" value={p.adresse} onChange={set('adresse')}/>
 <Inp label="Prix d'achat net vendeur (€)" value={p.prixAchat} onChange={setPrixAchat} step={5000}/>
 <AutoInp label="Frais de notaire (€)"
 autoValue={Math.round(p.prixAchat*0.08)} manuelValue={p.notaire} isManuel={p.notaireManuel}
 onToggle={()=>setP(prev=>({...prev,notaireManuel:!prev.notaireManuel,notaire:!prev.notaireManuel?prev.notaire:Math.round(prev.prixAchat*0.08)}))}
 onChange={set('notaire')} step={500}
 hint={p.notaireManuel?'Valeur manuelle':`Auto 8% = ${eur(Math.round(p.prixAchat*0.08))}`}/>
 <div style={{marginBottom:10}}>
 <Lbl c="Frais d'agence acquéreur"/>
 <Toggle2 labelA="✓ Inclus dans le prix FAI" labelB="+ Non inclus (charge séparée)" value={p.agenceIncluse} onChange={v=>setP(prev=>({...prev,agenceIncluse:v}))}/>
 {!p.agenceIncluse&&<Inp label="Montant frais d'agence (€)" value={p.agenceAcq} onChange={set('agenceAcq')} step={500}/>}
 </div>
 <Inp label="Honoraires chasseur TTC (€)" value={p.chasseurTTC} onChange={set('chasseurTTC')} step={500}/>
 {p.chasseurTTC>0&&<InfoBox color={T.textDim}>HT : {eur(chasseurHT)} — TVA 20% : {eur(chasseurTVA)}<br/><span style={{fontSize:10}}>SCI IS : charge an 1 · LMNP : amorti · LN : fiscalement perdu</span></InfoBox>}
 <Inp label="Travaux de rénovation (€)" value={p.travaux} onChange={set('travaux')} step={1000}/>
 <Inp label="Mobilier & équipements LMNP (€)" value={p.mobilier} onChange={set('mobilier')} step={500}/>
 <PInp label="Quote-part terrain (%)" value={p.terrain} onChange={set('terrain')}/>
 {result&&<InfoBox>Coût total : <strong>{eur(result.coutTotal)}</strong></InfoBox>}
 </Section>
 )}

 {/* B. FINANCEMENT */}
 {show('fin')&&(
 <Section title="B. Financement" color={T.blue}>
 <Inp label="Apport personnel (€)" value={p.apport} onChange={set('apport')} step={5000}/>
 <AutoInp label="Montant emprunté (€)"
 autoValue={empruntAuto} manuelValue={p.emprunt} isManuel={p.empruntManuel}
 onToggle={()=>setP(prev=>({...prev,empruntManuel:!prev.empruntManuel,emprunt:!prev.empruntManuel?empruntAuto:prev.emprunt}))}
 onChange={set('emprunt')} step={5000}
 hint={p.empruntManuel?'Valeur manuelle':`Auto : coût total − apport`}/>
 <Inp label="Durée du prêt (années)" value={p.duree} onChange={set('duree')} suffix="ans" step={1} min={1} max={30}/>
 <PInp label="Taux d'intérêt annuel (%)" value={p.taux} onChange={set('taux')}/>
 <PInp label="Assurance emprunteur (%)" value={p.assurance} onChange={set('assurance')}/>
 
{result&&<InfoBox color={T.blue}>
 Mensualité : <strong>{eur(result.mensualite)}/mois</strong> — Annuel : {eur(result.mensualite*12)}
 </InfoBox>}
 </Section>
 )}

 {/* C. CHARGES */}
 {show('charges')&&(
 <Section title="C. Charges annuelles" color={T.purple}>
 <Inp label="GLI — Garantie Loyers Impayés (€/an)" value={p.gli} onChange={set('gli')} step={100}/>
 <Inp label="Taxe foncière TOTALE (€/an — inclus TEOM)" value={p.fonciere} onChange={set('fonciere')} step={100}/>
 <Inp label="Dont TEOM (€/an — récupérable locataire)" value={p.teom} onChange={set('teom')} step={50}/>
 {result&&<InfoBox color={T.textDim}>Taxe foncière déductible (hors TEOM) : <strong>{eur(result.fonciereDed)}</strong></InfoBox>}
 <div style={{height:8}}/>
 <Inp label="Charges copro non récupérables (€/an)" value={p.coproNonRec} onChange={set('coproNonRec')} step={100}/>
 {result&&<InfoBox color={T.purple}>
 Copro totale décaissée : <strong>{eur(result.coproTotale)}</strong>
 <br/>Dont déductible fiscalement : {eur(result.coproNonRec)}
 </InfoBox>}
 <div style={{height:8}}/>
 <Inp label="Assurance PNO (€/an)" value={p.pno} onChange={set('pno')} step={50}/>
 <Inp label="Frais de gestion locative (€/an)" value={p.gestion} onChange={set('gestion')} step={100}/>
 <Inp label="Frais d'entretien & réparations (€/an)" value={p.entretien} onChange={set('entretien')} step={100}/>
 <Inp label="CFE — SCI IS et LMNP uniquement (€/an)" value={p.cfe} onChange={set('cfe')} step={50}/>
 <InfoBox color={T.textDim} >⚠️ La CFE n'est pas due en Location Nue — elle est automatiquement exclue de ce régime.</InfoBox>
 <Inp label="Expert-comptable LMNP/SCI (€/an)" value={p.comptable} onChange={set('comptable')} step={100}/>
 </Section>
 )}

 {/* D. REVENUS */}
 {show('rev')&&(
 <Section title="D. Revenus locatifs" color={T.green}>
 <Inp label="Loyer mensuel charges comprises (€)" value={p.loyerCC} onChange={set('loyerCC')} step={50}/>
 <Inp label="Charges récupérables mensuelles (€)" value={p.charges} onChange={v => setP(prev => ({...prev, charges: v, coproRec: v * 12}))} step={10}/>
 <PInp label="Taux de vacance locative (%)" value={p.vacance} onChange={set('vacance')}/>
 <PInp label="Revalorisation annuelle du loyer (%)" value={p.revaloLoyer} onChange={set('revaloLoyer')}/>
 {result&&(
  <div style={{marginBottom:10}}>
    <Lbl c="Mensualité / Loyer net de charges récupérables"/>
    <div style={{
      background:T.s2,border:`1px solid ${T.border}`,borderRadius:5,
      padding:'6px 10px',fontSize:13,fontVariantNumeric:'tabular-nums',
      color: (() => {
        const ratio = p.loyerCC > 0
          ? result.mensualite / ((p.loyerCC - p.charges) * (1 - p.vacance))
          : null
        return ratio === null ? T.textMuted : ratio > 1 ? T.red : ratio > 0.8 ? T.orange : T.green
      })()
    }}>
      {p.loyerCC > 0
        ? pct(result.mensualite / ((p.loyerCC - p.charges) * (1 - p.vacance)), 1)
        : '—'}
    </div>
    <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>
      Mensualité / (Loyer CC − charges récupérables) × (1 − vacance) · Auto
    </div>
  </div>
)}
 {result&&<InfoBox color={T.green}>
 Loyer CC annuel encaissé : <strong>{eur(result.loyerCCAnn)}</strong>
 <br/>Loyer HC annuel : {eur(result.loyerHCAnn)}
 </InfoBox>}
 </Section>
 )}

 {/* E. FISCALITÉ */}
 {show('fisc')&&(
 <Section title="E. Paramètres fiscaux" color={T.red}>
 <PInp label="TMI (%)" value={p.tmi} onChange={set('tmi')}/>
 <PInp label="TMI retraite (%)" value={p.tmiRetraite} onChange={set('tmiRetraite')}/>
 <Inp label="Année bascule retraite (99=jamais)" value={p.anneeRetraite} onChange={set('anneeRetraite')} suffix="an" step={1} min={1}/>
 <PInp label="Prélèvements sociaux (%)" value={p.ps} onChange={set('ps')}/>
 <PInp label="IS réduit (%)" value={p.isReduit} onChange={set('isReduit')}/>
 <PInp label="IS plein (%)" value={p.isPlein} onChange={set('isPlein')}/>
 <Inp label="Seuil IS réduit (€)" value={p.seuilIS} onChange={set('seuilIS')} step={1000}/>
 <PInp label="Flat Tax / PFU distribution SCI IS (%)" value={p.pfu} onChange={set('pfu')}/>
 <InfoBox color={T.textDim}>La Flat Tax {pct(p.pfu)} s'applique uniquement à la revente sur le boni de liquidation SCI — pas sur les flux annuels.</InfoBox>
 <Inp label="Durée amort. bien (ans)" value={p.dAmortBien} onChange={set('dAmortBien')} suffix="ans" step={1} min={1}/>
 <Inp label="Durée amort. travaux (ans)" value={p.dAmortTravaux} onChange={set('dAmortTravaux')} suffix="ans" step={1} min={1}/>
 <Inp label="Durée amort. mobilier LMNP (ans)" value={p.dAmortMobilier} onChange={set('dAmortMobilier')} suffix="ans" step={1} min={1}/>
 <Inp label="Durée amort. chasseur LMNP (ans)" value={p.dAmortChasseur} onChange={set('dAmortChasseur')} suffix="ans" step={1} min={1}/>
 <Inp label="Durée amort. notaire LMNP (ans)" value={p.dAmortNotaire} onChange={set('dAmortNotaire')} suffix="ans" step={1} min={1}/>
 </Section>
 )}

 {/* F. REVENTE */}
 {show('revente')&&(
 <Section title="F. Revente" color={T.orange}>
 <Inp label="Année de cession" value={p.anCession} onChange={set('anCession')} suffix="an" step={1} min={1} max={30}/>
 <PInp label="Revalorisation annuelle du bien (%)" value={p.revaloValeur} onChange={set('revaloValeur')}/>
 <AutoInp label={`Prix de revente an ${p.anCession} (€)`}
 autoValue={prixReventeAuto} manuelValue={p.prixRevente} isManuel={p.prixReventeManuel}
 onToggle={()=>setP(prev=>({...prev,prixReventeManuel:!prev.prixReventeManuel,prixRevente:!prev.prixReventeManuel?prixReventeAuto:prev.prixRevente}))}
 onChange={set('prixRevente')} step={5000}
 hint={p.prixReventeManuel?'Prix saisi manuellement':`Auto : prix achat × (1+${pct(p.revaloValeur)})^${p.anCession}`}/>
 <AutoInp label="Frais d'agence revente (€)"
 autoValue={fraisAgReventeAuto} manuelValue={p.fraisAgRevente} isManuel={p.fraisAgReventeManuel}
 onToggle={()=>setP(prev=>({...prev,fraisAgReventeManuel:!prev.fraisAgReventeManuel,fraisAgRevente:!prev.fraisAgReventeManuel?fraisAgReventeAuto:prev.fraisAgRevente}))}
 onChange={set('fraisAgRevente')} step={500}
 hint="⚠️ Déduits du prix de revente — NON inclus dans le prix saisi"/>
 {result&&<InfoBox color={T.orange}>
 Prix revente : <strong>{eur(result.prixVente)}</strong><br/>
 Net disponible (avant PV) : <strong>{eur(result.prixDispo)}</strong><br/>
 CRD : {eur(result.crd)} — IRA : {eur(result.ira)}
 </InfoBox>}
 <InfoBox color={T.textDim}>ℹ️ L'an {p.anCession} = 12 mois complets d'exploitation. Le CRD est remboursé en fin d'année dans le bloc Revente séparé.</InfoBox>
 </Section>
 )}
 </div>

 {/* KPIs - TOUJOURS VISIBLE POUR TOUT LE MONDE */}
 {show('kpis')&&result&&(
 <Section title={`📈 KPIs Globaux & Rendements (Gagnant : ${result.verdict})`}>
 <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
 <Card label="Coût total" value={eur(result.coutTotal)} color={T.gold}/>
 <Card label="Rendement brut" value={pct(result.rendBrut)} color={T.green} sub="Loyer HC / Coût total"/>
 <Card label="Rendement net global" value={pct(result.rendNet)} color={T.green} sub="Après charges (moyenne)"/>
 <Card label="Mensualité" value={`${eur(result.mensualite)}/mois`} color={T.blue}/>
 </div>
 <Tbl headers={['Rendement net-net an 1','SCI IS','Location Nue','LMNP Réel']}
 rows={[['CF après impôt / Coût total',pct(result.rendNetNetSCI),pct(result.rendNetNetLN),pct(result.rendNetNetLMNP)]]}/>
 </Section>
 )}

 {/* TABLEAU COMPARATIF - MODIFIÉ AVEC CADENAS */}
 {show('tab_comp')&&result&&(
 isPremium?(
 <Section title="📊 Tableau Synthèse (EBE, Cash Flow, TRI)" color={T.gold}>
 <Tbl headers={['Indicateur','SCI IS','Location Nue','LMNP Réel']} rows={[
 ['EBE (Excédent Brut d\'Exploitation)',eur(compData.sci.ebe),eur(compData.nue.ebe),eur(compData.lmnp.ebe)],
 ['Cash Flow (Après Impôt) Annuel',eur(compData.sci.cashFlow),eur(compData.nue.cashFlow),eur(compData.lmnp.cashFlow)],
 ['Rendement Brut',pct(compData.sci.rendBrut,2),pct(compData.nue.rendBrut,2),pct(compData.lmnp.rendBrut,2)],
 ['Rendement Net (de charges)',pct(compData.sci.rendNet,2),pct(compData.nue.rendNet,2),pct(compData.lmnp.rendNet,2)],
 ['TRI (Taux de Rentabilité Interne)',pct(compData.sci.tri,2),pct(compData.nue.tri,2),pct(compData.lmnp.tri,2)],
 ]}/>
 </Section>
 ):(
 <Watermark><Section title="📊 Tableau Synthèse (EBE, Cash Flow, TRI)"><div style={{height:180}}/></Section></Watermark>
 )
 )}

 {/* GRAPHIQUE 1 */}
 {show('cf_chart')&&result&&(
 isPremium?(
 <Section title="📉 Trésorerie mensuelle — CF avant impôt (trait plein) & après impôt (pointillé)">
 <div style={{fontSize:11,color:T.textDim,marginBottom:10,padding:'6px 10px',background:T.s2,borderRadius:5}}>
 ℹ️ Trait plein = CF avant impôt · Pointillé = CF après impôt (net-net). L'écart entre les deux courbes représente la charge fiscale de chaque régime.
 </div>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart data={cfData} margin={{top:5,right:20,left:0,bottom:5}}>
 <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
 <XAxis dataKey="an" tick={{fill:T.textDim,fontSize:10}} interval={skip-1}/>
 <YAxis tick={{fill:T.textDim,fontSize:10}} tickFormatter={v=>`${nf(v)} €`}/>
 <Tooltip content={<ChartTip/>}/>
 <Legend wrapperStyle={{fontSize:10}}/>
 <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" strokeOpacity={0.5}/>
 <Line type="monotone" dataKey="SCI avant impôt" stroke={T.sci} strokeWidth={2} dot={false}/>
 <Line type="monotone" dataKey="SCI après impôt" stroke={T.sci} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
 <Line type="monotone" dataKey="LN avant impôt" stroke={T.ln} strokeWidth={2} dot={false}/>
 <Line type="monotone" dataKey="LN après impôt" stroke={T.ln} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
 <Line type="monotone" dataKey="LMNP avant impôt" stroke={T.lmnp} strokeWidth={2} dot={false}/>
 <Line type="monotone" dataKey="LMNP après impôt" stroke={T.lmnp} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
 </LineChart>
 </ResponsiveContainer>
 </Section>
 ):(
 <Watermark><Section title="📉 Trésorerie mensuelle"><div style={{height:300}}/></Section></Watermark>
 )
 )}

 {/* GRAPHIQUE 2 */}
 {show('cumul_chart')&&result&&(
 isPremium?(
 <Section title="💰 Trésorerie (Cash Flow) cumulée après impôt — €">
 <ResponsiveContainer width="100%" height={260}>
 <LineChart data={cumulData} margin={{top:5,right:20,left:0,bottom:5}}>
 <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
 <XAxis dataKey="an" tick={{fill:T.textDim,fontSize:10}} interval={skip-1}/>
 <YAxis tick={{fill:T.textDim,fontSize:10}} tickFormatter={v=>`${nf(v)} €`}/>
 <Tooltip content={<ChartTip/>}/>
 <Legend wrapperStyle={{fontSize:11}}/>
 <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" strokeOpacity={0.5}/>
 <Line type="monotone" dataKey="SCI IS" stroke={T.sci} strokeWidth={2} dot={false}/>
 <Line type="monotone" dataKey="Location Nue" stroke={T.ln} strokeWidth={2} dot={false}/>
 <Line type="monotone" dataKey="LMNP Réel" stroke={T.lmnp} strokeWidth={2} dot={false}/>
 </LineChart>
 </ResponsiveContainer>
 </Section>
 ):(
 <Watermark><Section title="💰 Trésorerie cumulée"><div style={{height:260}}/></Section></Watermark>
 )
 )}

 {/* TRI */}
 {show('tri')&&result&&(
 isPremium?(
 <Section title="⚡ TRI & Performance financière">
 <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
 <Card label="TRI SCI IS (net)" value={pct(result?.triSCI,2)} color={T.sci} sub="Après IS + Flat Tax revente"/>
 <Card label="TRI Location Nue" value={pct(result?.triLN,2)} color={T.ln} sub="Après IR+PS"/>
 <Card label="TRI LMNP Réel" value={pct(result?.triLMNP,2)} color={T.lmnp} sub="Après BIC IR+PS"/>
 </div>
 <Tbl headers={['Indicateur','SCI IS','Location Nue','LMNP Réel']} rows={[
 ['Tréso (CF) cumulée après impôt',eur(result?.tresoCumSCI),eur(result?.tresoCumLN),eur(result?.tresoCumLMNP)],
 ['Produit net de cession',eur(result?.prodNetSCI),eur(result?.prodNetLN),eur(result?.prodNetLMNP)],
 ['Boni SCI (tréso + produit net)',eur(result?.boniSCI),'—','—'],
 ['Flat Tax 31,4% sur boni SCI',eur(result?.flatTax),'—','—'],
 ['★ Richesse nette finale',eur(result?.richNetteSCI),eur(result?.richLN),eur(result?.richLMNP)],
 ]}/>
 </Section>
 ):(
 <Watermark><Section title="⚡ TRI & Performance"><div style={{height:120}}/></Section></Watermark>
 )
 )}

 {/* HORIZONS */}
 {show('horizons')&&result&&(
 isPremium?(
 <Section title="🔭 Sortie Multi-Horizons — An 10 / 15 / 20" color={T.blue}>
 <Tbl headers={['Montage','An 10','An 15',`An ${p.anCession}`]} rows={[
 ['Prix de revente estimé',eur(result.horizons?.an10?.prixVente),eur(result.horizons?.an15?.prixVente),eur(result.horizons?.an20?.prixVente)],
 ['SCI IS — Richesse nette',eur(result.horizons?.an10?.sciNette),eur(result.horizons?.an15?.sciNette),eur(result.horizons?.an20?.sciNette)],
 ['Location Nue — Richesse nette',eur(result.horizons?.an10?.lnNette),eur(result.horizons?.an15?.lnNette),eur(result.horizons?.an20?.lnNette)],
 ['LMNP Réel — Richesse nette',eur(result.horizons?.an10?.lmnpNette),eur(result.horizons?.an15?.lmnpNette),eur(result.horizons?.an20?.lmnpNette)],
 ]} color={T.blue}/>
 </Section>
 ):(
 <Watermark><Section title="🔭 Sortie Multi-Horizons"><div style={{height:120}}/></Section></Watermark>
 )
 )}

 {/* SENSIBILITÉ */}
 {show('sensibilite')&&result&&(
 isPremium?(
 <Section title="📐 Analyse de Sensibilité" color={T.purple}>
 <div style={{fontSize:11,color:T.textDim,marginBottom:8}}>1. Sensibilité au loyer CC mensuel</div>
 <Tbl compact headers={['Loyer CC (€/mois)','Δ (%)','Loyer annuel (€)','CF avant impôt an 1 (€/mois)']}
 rows={loyerVariants.map(v=>[eur(v.loyer),`${v.delta>0?'+':''}${v.delta}%`,eur(v.loyerAnn),v.delta===0?<span style={{color:T.gold}}>→ {eur(v.cfAn1)}</span>:eur(v.cfAn1)])} color={T.purple}/>
 <div style={{fontSize:11,color:T.textDim,margin:'14px 0 8px'}}>2. Sensibilité au taux de vacance</div>
 <Tbl compact headers={['Vacance (%)','Loyer pondéré (€/an)','CF avant impôt an 1 (€/mois)']}
 rows={vacanceVariants.map(v=>[pct(v.taux),eur(v.loyerPond),v.taux===p.vacance?<span style={{color:T.gold}}>→ {eur(v.cfAn1)}</span>:eur(v.cfAn1)])} color={T.purple}/>
 <div style={{fontSize:11,color:T.textDim,margin:'14px 0 8px'}}>3. Sensibilité à la revalorisation du bien</div>
 <Tbl compact headers={['Revalorisation/an',`Prix revente an ${p.anCession} (€)`]}
 rows={revaloVariants.map(v=>[pct(v.taux),v.taux===p.revaloValeur?<span style={{color:T.gold}}>→ {eur(v.prixVente)}</span>:eur(v.prixVente)])} color={T.purple}/>
 </Section>
 ):(
 <Watermark><Section title="📐 Analyse de Sensibilité"><div style={{height:150}}/></Section></Watermark>
 )
 )}

 {/* IFI */}
 {show('ifi')&&result&&(
 isPremium?(
 <Section title="🏛 Module IFI" color={T.orange}>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
 <div>
 <Inp label="Autres actifs immobiliers hors RP (€)" value={p.ifiAutresActifs} onChange={set('ifiAutresActifs')} step={10000}/>
 <Inp label="Résidence principale — valeur (€)" value={p.ifiRP} onChange={set('ifiRP')} step={10000}/>
 <div style={{fontSize:11,color:T.textDim,marginTop:4}}>Abattement 30% appliqué automatiquement sur la RP</div>
 </div>
 <div style={{padding:'12px 14px',background:T.s3,borderRadius:8,fontSize:12,lineHeight:1.9}}>
 <div style={{color:T.textDim}}>Patrimoine IFI net : <span style={{color:T.orange,fontWeight:700}}>{eur(result?.patrimoineIFI)}</span></div>
 <div style={{color:result?.ifi>0?T.red:T.green,fontWeight:700}}>IFI annuel : {eur(result?.ifi)}</div>
 {result?.patrimoineIFI<=1300000&&<div style={{color:T.green,fontSize:11}}>✓ Sous le seuil de 1 300 000 €</div>}
 </div>
 </div>
 </Section>
 ):(
 <Watermark><Section title="🏛 Module IFI"><div style={{height:120}}/></Section></Watermark>
 )
 )}

 {/* TABLEAUX ANNUELS */}
 {show('tab_sci')&&result&&(
 isPremium?(
 <Section title="📋 SCI IS — Simulation annuelle" color={T.sci}>
 <Tbl color={T.sci} compact headers={['Poste',...(result.years?.map(y=>`An ${y.year}`)||[])]} rows={[
 ['Loyer CC encaissé (€)',...(result.years?.map(y=>eur(y.loyer))||[])],
 ['CF avant impôt (€/mois)',...(result.years?.map(y=>eur(y.cfBISCI/12,0))||[])],
 ['IS dû (€)',...(result.years?.map(y=>eur(y.isSCI))||[])],
 ['CF après impôt (€/mois)',...(result.years?.map(y=>eur(y.cfSCI/12,0))||[])],
 ['Tréso cumulée après IS (€)',...(result.years?.map(y=>eur(y.sciCumul))||[])],
 ]}/>
 </Section>
 ):(
 <Watermark><Section title="📋 SCI IS — Simulation annuelle"><div style={{height:150}}/></Section></Watermark>
 )
 )}

 {show('tab_ln')&&result&&(
 isPremium?(
 <Section title="📋 Location Nue — Simulation annuelle" color={T.ln}>
 <Tbl color={T.ln} compact headers={['Poste',...(result.years?.map(y=>`An ${y.year}`)||[])]} rows={[
 ['Loyer CC encaissé (€)',...(result.years?.map(y=>eur(y.loyer))||[])],
 ['CF avant impôt (€/mois)',...(result.years?.map(y=>eur(y.cfBILN/12,0))||[])],
 ['Impôt IR + PS (€)',...(result.years?.map(y=>eur(y.impotLN))||[])],
 ['CF après impôt (€/mois)',...(result.years?.map(y=>eur(y.cfLN/12,0))||[])],
 ['Tréso cumulée après impôt (€)',...(result.years?.map(y=>eur(y.lnCumul))||[])],
 ]}/>
 </Section>
 ):(
 <Watermark><Section title="📋 Location Nue — Simulation annuelle"><div style={{height:150}}/></Section></Watermark>
 )
 )}

 {show('tab_lmnp')&&result&&(
 isPremium?(
 <Section title="📋 LMNP Réel — Simulation annuelle" color={T.lmnp}>
 <Tbl color={T.lmnp} compact headers={['Poste',...(result.years?.map(y=>`An ${y.year}`)||[])]} rows={[
 ['Loyer CC encaissé (€)',...(result.years?.map(y=>eur(y.loyer))||[])],
 ['CF avant impôt (€/mois)',...(result.years?.map(y=>eur(y.cfBILMNP/12,0))||[])],
 ['Impôt BIC IR + PS (€)',...(result.years?.map(y=>eur(y.impotLMNP))||[])],
 ['CF après impôt (€/mois)',...(result.years?.map(y=>eur(y.cfLMNP/12,0))||[])],
 ['Tréso cumulée après impôt (€)',...(result.years?.map(y=>eur(y.lmnpCumul))||[])],
 ]}/>
 </Section>
 ):(
 <Watermark><Section title="📋 LMNP Réel — Simulation annuelle"><div style={{height:150}}/></Section></Watermark>
 )
 )}

 {/* DÉTAIL REVENTE */}
 {show('tab_revente')&&result&&(
 isPremium?(
 <Section title={`🏷️ Détail Revente — Année ${p.anCession} (bloc isolé)`} color={T.orange}>
 <div style={{background:`${T.orange}0a`,border:`1px solid ${T.orange}33`,borderRadius:7,padding:'8px 14px',fontSize:11,color:T.orange,marginBottom:14}}>
 ℹ️ Le tableau ci-dessous est strictement isolé des flux d'exploitation annuels. L'an {p.anCession} dans les tableaux ci-dessus contient uniquement les CF d'exploitation (loyers - charges - mensualité - impôt).
 </div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:12}}>
 {[
 {label:'SCI IS',color:T.sci,rows:[
 ['Prix revente brut',eur(result?.prixVente)],
 ['Frais agence (déduits)',eur(result?.fraisAg)],
 ['CRD remboursé',eur(result?.crd)],
 ['IRA',eur(result?.ira)],
 ['Net disponible (avant PV)',eur(result?.prixDispo)],
 ['VNC bien',eur(result?.vncSCI)],
 ['PV comptable',eur(result?.pvSCI)],
 ['IS sur PV',eur(result?.isSurPV)],
 ['Produit net cession',eur(result?.prodNetSCI)],
 ['+ Tréso cumulée exploitation',eur(result?.tresoCumSCI)],
 ['= Boni SCI',eur(result?.boniSCI)],
 ['Flat Tax 31,4% sur boni',eur(result?.flatTax)],
 ['★ Richesse nette',eur(result?.richNetteSCI)],
 ]},
 {label:'Location Nue',color:T.ln,rows:[
 ['Prix revente brut',eur(result?.prixVente)],
 ['Frais agence',eur(result?.fraisAg)],
 ['CRD remboursé',eur(result?.crd)],
 ['IRA',eur(result?.ira)],
 ['Net disponible',eur(result?.prixDispo)],
 ['Prix de revient LN',eur(result?.prixRevientLN)],
 ['PV brute',eur(result?.pvLN)],
 ['Impôt PV (abattements)',eur(result?.impPVLN)],
 ['Produit net cession',eur(result?.prodNetLN)],
 ['+ Tréso cumulée',eur(result?.tresoCumLN)],
 ['★ Richesse nette',eur(result?.richLN)],
 ]},
 {label:'LMNP Réel',color:T.lmnp,rows:[
 ['Prix revente brut',eur(result?.prixVente)],
 ['Frais agence',eur(result?.fraisAg)],
 ['CRD remboursé',eur(result?.crd)],
 ['IRA',eur(result?.ira)],
 ['Net disponible',eur(result?.prixDispo)],
 ['Amorts réintégrés (LF2025 art.84)',eur(result?.amortRealisesLMNP)],
 ['PV brute LMNP',eur(result?.pvLMNP)],
 ['Impôt PV (abattements)',eur(result?.impPVLMNP)],
 ['Produit net cession',eur(result?.prodNetLMNP)],
 ['+ Tréso cumulée',eur(result?.tresoCumLMNP)],
 ['★ Richesse nette',eur(result?.richLMNP)],
 ]},
 ].map(({label,color,rows})=>(
 <div key={label} style={{background:T.s2,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
 <div style={{color,fontWeight:700,fontSize:11,letterSpacing:1,marginBottom:10}}>{label}</div>
 {rows.map(([k,v],i)=>(
 <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}22`}}>
 <span style={{color:T.textDim,fontSize:11}}>{k}</span>
 <span style={{color:k.startsWith('★')?color:T.text,fontWeight:k.startsWith('★')?800:400,fontSize:11,fontVariantNumeric:'tabular-nums'}}>{v}</span>
 </div>
 ))}
 </div>
 ))}
 </div>
 </Section>
 ):(
 <Watermark><Section title="🏷️ Détail Revente"><div style={{height:180}}/></Section></Watermark>
 )
 )}

 {/* EMPRUNT */}
 {show('tab_emprunt')&&result&&(
 isPremium?(
 <Section title="🏦 Tableau d'Amortissement" color={T.blue}>
 <Tbl color={T.blue} compact headers={['Année','Mensualité (€)','Capital (€)','Intérêts (€)','Assurance (€)','CRD (€)']}
 rows={result.loan?.map((l,i)=>[`An ${i+1}`,eur(l.total/12),eur(l.capital),eur(l.interest),eur(l.insurance),eur(l.balance)])||[]}/>
 </Section>
 ):(
 <Watermark><Section title="🏦 Tableau d'Amortissement"><div style={{height:150}}/></Section></Watermark>
 )
 )}

 {/* VERDICT */}
 {show('verdict')&&result&&(
 isPremium?(
 <Section title="📊 Synthèse comparative — Richesse nette finale" color={T.gold}>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
 <div style={{background:T.s3,border:`1px solid ${T.border}`,borderRadius:7,padding:'8px 14px',fontSize:12,color:T.textDim}}>
 Cession à <strong style={{color:T.text}}>an {p.anCession}</strong>
 </div>
 <div style={{background:T.s3,border:`1px solid ${T.border}`,borderRadius:7,padding:'8px 14px',fontSize:12,color:T.textDim}}>
 Prix revente : <strong style={{color:T.orange}}>{eur(result.prixVente)}</strong>
 <span style={{color:T.textMuted,fontSize:10}}> {p.prixReventeManuel?'(manuel)':'(auto)'}</span>
 </div>
 <div style={{background:T.s3,border:`1px solid ${T.border}`,borderRadius:7,padding:'8px 14px',fontSize:12,color:T.textDim}}>
 Frais agence revente : <span style={{fontWeight:700}}>{eur(result.fraisAg)}</span>
 <span style={{color:T.textMuted,fontSize:10}}> (non inclus dans le prix)</span>
 </div>
 </div>
 <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:14}}>
 <RegimeWinner name="SCI IS — net après Flat Tax 31,4%" val={result.richNetteSCI} winner={result.verdict==='SCI IS'} color={T.sci} restricted={false}/>
 <RegimeWinner name="Location Nue" val={result.richLN} winner={result.verdict==='Location Nue'} color={T.ln} restricted={false}/>
 <RegimeWinner name="LMNP Réel" val={result.richLMNP} winner={result.verdict==='LMNP Réel'} color={T.lmnp} restricted={false}/>
 </div>
 <div style={{background:`${T.gold}0e`,border:`1px solid ${T.goldDim}`,borderRadius:7,padding:'9px 14px',fontSize:12,color:T.gold}}>
 ⚠️ Outil pédagogique — Consultez un CGP, expert-comptable ou avocat fiscaliste avant toute décision.
 </div>
 </Section>
 ):(
 <Watermark><Section title="📊 Synthèse comparative — Richesse nette finale"><div style={{height:180}}/></Section></Watermark>
 )
 )}

 <div style={{textAlign:'center',color:T.textMuted,fontSize:10,padding:'16px 0',letterSpacing:1}}>
 {APP_NAME} {VERSION} — PFU {pct(p.pfu)} LFSS 2026 — LF 2025 art.84 LMNP — 💾 Sauvegarde automatique active
 </div>
 </div>
 </div>
 )
}

