export const stages = ['Captured','Exploring','Validating','Building','Launched','Archived'] as const;
export type Stage = typeof stages[number];
export type Entry = {id:string;text:string;at:string};
export type Idea = {id:string;title:string;description:string;original:string;problem:string;solution:string;audience:string;category:string;stage:Stage;accent:string;ink:string;seed:number;version:number;created:string;updated:string;notes:Entry[];comments:Entry[];references:Entry[];history:Entry[];deleted?:boolean};
export type Event = {id:string;ideaId:string;text:string;at:string};
export type User = {username:string;role:'member'|'admin'};
const palette = [['#D47EA5','#421329'],['#82B7DB','#123451'],['#9BC28A','#203D1D'],['#E8AC71','#51280F'],['#ABA0D4','#322452'],['#75BEB0','#143B32'],['#D3B958','#3F330A'],['#DA8C7B','#481C13']];
export function identity(used:string[],seed = Math.floor(Math.random()*1000000)) {
 used=used.map(color=>color.toLowerCase());const available=palette.find(p=>!used.includes(p[0].toLowerCase()));if(available)return {accent:available[0],ink:available[1],seed};
 let n=seed;let accent='';do {const hue=(n++*137.508)%360,s=.34,l=.65;const a=s*Math.min(l,1-l);const f=(v:number)=>{const k=(v+hue/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')};accent='#'+f(0)+f(8)+f(4)}while(used.some(x=>x.toLowerCase()===accent));return {accent,ink:'#202020',seed};
}
export function makeIdea(title:string,used:string[],extra:Partial<Idea>={}):Idea {const now=new Date().toISOString();return {id:crypto.randomUUID(),title,description:'',original:title,problem:'',solution:'',audience:'',category:'Uncategorized',stage:'Captured',...identity(used),version:1,created:now,updated:now,notes:[],comments:[],references:[],history:[{id:crypto.randomUUID(),text:'Idea captured',at:now}],...extra};}
export function searchIdeas(ideas:Idea[],query:string){const q=query.trim().toLowerCase();return ideas.filter(i=>!i.deleted&&[i.title,i.description,i.problem,i.solution,i.audience,i.original,...i.notes.map(n=>n.text)].join(' ').toLowerCase().includes(q));}
export function safeLink(value:string){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:null}catch{return null}}
