'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {stages,type Stage} from '../lib/model';
export default function StagePicker({value,onChange}:{value:Stage;onChange:(stage:Stage)=>Promise<void>}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),options=useRef<(HTMLButtonElement|null)[]>([]),id=useId();
 useEffect(()=>{if(!open)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open]);
 function reveal(index=stages.indexOf(value)){setOpen(true);requestAnimationFrame(()=>options.current[index]?.focus())}
 function close(){setOpen(false);trigger.current?.focus()}
 async function choose(stage:Stage){if(busy)return;if(stage===value){close();return}setBusy(true);setError('');try{await onChange(stage);close()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="stage-control" ref={root} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}}>
 <span id={id+'-label'} className="micro stage-label">DEVELOPMENT STAGE</span>
 <div className="stage-picker">
 <button ref={trigger} className="stage-trigger" aria-labelledby={id+'-label '+id+'-value'} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} disabled={busy} onClick={()=>open?close():reveal()} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();reveal()}}}>
 <span className="stage-orbit" aria-hidden="true"><span/></span><span id={id+'-value'}>{busy?'Saving…':value}</span><svg className={open?'is-open':''} width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m4 6.5 5 5 5-5"/></svg></button>
 {open&&<div id={id} className="stage-options" role="listbox" aria-labelledby={id+'-label'} aria-busy={busy} onKeyDown={e=>{const index=options.current.findIndex(el=>el===document.activeElement);let next=index;if(e.key==='ArrowDown')next=(index+1)%stages.length;else if(e.key==='ArrowUp')next=(index-1+stages.length)%stages.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=stages.length-1;else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}else return;e.preventDefault();options.current[next]?.focus()}}>
 <div className="stage-options-heading" aria-hidden="true">MOVE THIS IDEA</div>
 {stages.map((stage,index)=><button key={stage} ref={el=>{options.current[index]=el}} role="option" aria-selected={stage===value} aria-disabled={busy} tabIndex={stage===value?0:-1} className={'stage-option '+(stage===value?'is-selected':'')} onClick={()=>void choose(stage)}><span className="stage-number">0{index+1}</span><span>{stage}</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{stage===value?<path d="m4 10 4 4 8-8"/>:<path d="M4 10h12m-5-5 5 5-5 5"/>}</svg></button>)}
 </div>}
 </div><p className="stage-status" role={error?'alert':'status'}>{error|| (busy?'Saving stage…':'')}</p>
 </div>
}
