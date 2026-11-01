import {colorDistanceField} from './color-field';
import gsap from 'gsap';
export async function typeWord(node:HTMLElement,from:string,to:string,reduced:boolean){if(reduced){node.textContent=to;return}const clock={n:from.length};await new Promise<void>(resolve=>{gsap.to(clock,{n:0,duration:.27,ease:'none',onUpdate:()=>{node.textContent=from.slice(0,Math.round(clock.n))},onComplete:resolve})});await new Promise<void>(resolve=>{const typing={n:0};gsap.to(typing,{n:to.length,duration:.52,delay:.09,ease:'none',onUpdate:()=>{node.textContent=to.slice(0,Math.round(typing.n))},onComplete:resolve})});}
/** A precomputed glyph-distance mask reaches every viewport pixel before the route handoff. */
export async function releaseColor(node:HTMLElement,color:string,seed:number,reverse=false,reduced=false,commit?:()=>void,ink='#171717'){
 if(reduced){commit?.();return}
 const box=node.getBoundingClientRect();if(!box.width){commit?.();return}
 // Match the mask to its actual fixed CSS viewport, including mobile browser-bar changes.
 const bounds=document.createElement('div');Object.assign(bounds.style,{position:'fixed',inset:'-64px',pointerEvents:'none',visibility:'hidden'});document.body.appendChild(bounds);
 const coverage=bounds.getBoundingClientRect();bounds.remove();
 const left=coverage.left,top=coverage.top,width=coverage.width,height=coverage.height,scale=Math.min(1,720/Math.max(width,height));
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx){commit?.();return}
 const style=getComputedStyle(node);ctx.scale(scale,scale);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';
 const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text:Node|null;
 while((text=walker.nextNode()))for(let j=0;j<(text.textContent||'').length;j++){const range=document.createRange();range.setStart(text,j);range.setEnd(text,j+1);const rect=range.getBoundingClientRect();ctx.fillText(text.textContent![j],rect.left-left,rect.top-top+rect.height*.81);}
 const field=colorDistanceField(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,seed);
 if(!field){commit?.();return}const image=ctx.createImageData(canvas.width,canvas.height);image.data.set(field.pixels);ctx.putImageData(image,0,0);
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');Object.assign(svg.style,{position:'fixed',left:left+'px',top:top+'px',width:width+'px',height:height+'px',zIndex:'60',pointerEvents:'none'});
 const defs=document.createElementNS(ns,'defs'),filter=document.createElementNS(ns,'filter');filter.id='glyph-distance-release';filter.setAttribute('filterUnits','userSpaceOnUse');filter.setAttribute('color-interpolation-filters','sRGB');for(const[k,v]of Object.entries({x:'0',y:'0',width:String(width),height:String(height)}))filter.setAttribute(k,v);
 const transfer=document.createElementNS(ns,'feComponentTransfer');transfer.setAttribute('result','reveal');const alpha=document.createElementNS(ns,'feFuncA');alpha.setAttribute('type','linear');alpha.setAttribute('slope','48');transfer.appendChild(alpha);filter.appendChild(transfer);
 const flood=document.createElementNS(ns,'feFlood');flood.setAttribute('flood-color',color);filter.appendChild(flood);const composite=document.createElementNS(ns,'feComposite');composite.setAttribute('in2','reveal');composite.setAttribute('operator','in');filter.appendChild(composite);defs.appendChild(filter);svg.appendChild(defs);
 const mask=document.createElementNS(ns,'image');mask.setAttribute('href',canvas.toDataURL());mask.setAttribute('width',String(width));mask.setAttribute('height',String(height));mask.setAttribute('preserveAspectRatio','none');mask.setAttribute('filter','url(#glyph-distance-release)');svg.appendChild(mask);
 const state={progress:reverse?1.025:-.02};const draw=()=>alpha.setAttribute('intercept',String((state.progress-1)*48+1));draw();document.body.appendChild(svg);
 const ghost=document.createElement('div');ghost.textContent=node.textContent;ghost.setAttribute('aria-hidden','true');Object.assign(ghost.style,{position:'fixed',zIndex:'61',left:box.left+'px',top:box.top+'px',width:box.width+'px',fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,letterSpacing:style.letterSpacing,lineHeight:style.lineHeight,textAlign:'left',textWrap:style.textWrap,color:reverse?ink:color,pointerEvents:'none'});document.body.appendChild(ghost);
 const previous=node.style.opacity;node.style.opacity='0';const oldPointer=document.documentElement.style.pointerEvents;document.documentElement.style.pointerEvents='none';
 const neighbors=Array.from(document.querySelectorAll<HTMLElement>('.idea-slide')).filter(slide=>!slide.contains(node));const oldOpacity=neighbors.map(slide=>slide.style.opacity);if(!reverse)gsap.to(neighbors,{opacity:0,duration:.22,overwrite:true});
 try{
  if(!reverse){const targetTop=(innerWidth<768?88:116)+innerHeight*(innerWidth<768?.13:.12);gsap.to(ghost,{top:targetTop,color:ink,delay:.22,duration:.88,ease:'power2.inOut'})}else gsap.to(ghost,{color,duration:.9,ease:'power2.inOut'});
  await new Promise<void>(resolve=>{gsap.to(state,{progress:reverse?-.02:1.025,duration:1.18,ease:'sine.inOut',onUpdate:draw,onComplete:resolve})});
  // The normalized furthest pixel is already opaque; keep that exact field through the paint.
  commit?.();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 }finally{svg.remove();ghost.remove();if(node.isConnected)node.style.opacity=previous;document.documentElement.style.pointerEvents=oldPointer;gsap.killTweensOf(ghost);gsap.killTweensOf(neighbors);neighbors.forEach((slide,i)=>{if(slide.isConnected)slide.style.opacity=oldOpacity[i]})}
}
/** Runs only after persistence succeeds; moves the reviewed wording into its gallery position. */
export async function travelTitle(origin:HTMLElement,commit:()=>void,target:()=>HTMLElement|null,color:string,reduced:boolean){
 if(reduced){commit();return}const box=origin.getBoundingClientRect(),style=getComputedStyle(origin),ghost=document.createElement('div');ghost.textContent=origin instanceof HTMLTextAreaElement?origin.value:origin.textContent;Object.assign(ghost.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontSize:style.fontSize,letterSpacing:style.letterSpacing,lineHeight:style.lineHeight,color,zIndex:'65',pointerEvents:'none',whiteSpace:'pre-wrap'});document.body.appendChild(ghost);commit();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));const destination=target();if(!destination){ghost.remove();return}const next=destination.getBoundingClientRect(),nextStyle=getComputedStyle(destination);destination.style.visibility='hidden';try{await new Promise<void>(resolve=>{gsap.to(ghost,{left:next.left,top:next.top,width:next.width,fontSize:nextStyle.fontSize,letterSpacing:nextStyle.letterSpacing,lineHeight:nextStyle.lineHeight,duration:.75,ease:'power3.inOut',onComplete:resolve})})}finally{ghost.remove();destination.style.visibility=''}
}
