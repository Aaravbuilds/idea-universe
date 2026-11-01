/** Precompute one distance field; animation changes only a lightweight SVG threshold. */
export function colorDistanceField(alpha:Uint8ClampedArray,width:number,height:number,seed:number){
 const length=width*height,dist=new Float32Array(length);let hasGlyph=false;
 for(let i=0;i<length;i++){const inside=alpha[i*4+3]>32;dist[i]=inside?0:1e8;hasGlyph ||= inside;}
 if(!hasGlyph)return null;
 const diagonal=Math.SQRT2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;let d=dist[i];if(x)d=Math.min(d,dist[i-1]+1);if(y){d=Math.min(d,dist[i-width]+1);if(x)d=Math.min(d,dist[i-width-1]+diagonal);if(x+1<width)d=Math.min(d,dist[i-width+1]+diagonal)}dist[i]=d;}
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;let d=dist[i];if(x+1<width)d=Math.min(d,dist[i+1]+1);if(y+1<height){d=Math.min(d,dist[i+width]+1);if(x)d=Math.min(d,dist[i+width-1]+diagonal);if(x+1<width)d=Math.min(d,dist[i+width+1]+diagonal)}dist[i]=d;}
 const phase=(seed%997)/997*Math.PI*2;let maximum=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x,d=dist[i];const wave=Math.sin(x*.019+phase)*Math.cos(y*.024-phase)+.45*Math.sin((x+y)*.031+phase*2);const shaped=d*(1+.075*wave*(1-Math.exp(-d/24)));dist[i]=shaped;maximum=Math.max(maximum,shaped);}
 const pixels=new Uint8ClampedArray(length*4);
 for(let i=0;i<length;i++){pixels[i*4]=pixels[i*4+1]=pixels[i*4+2]=255;pixels[i*4+3]=Math.round(255*(1-dist[i]/Math.max(1,maximum)));}
 return {pixels,maximum};
}
export function revealAlpha(encodedAlpha:number,progress:number,softness=48){return Math.max(0,Math.min(1,encodedAlpha/255*softness+(progress-1)*softness+1));}
