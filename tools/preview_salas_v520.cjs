/* Composição de QA usando os sprites e as coordenadas reais; não é captura VM/YYC. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
const cache=new Map();
async function draw(d,n,x,y,sx=1,sy=sx,frame=0,angle=0){
 const key=n+':'+frame;let s=cache.get(key);
 if(!s){const meta=read(`sprites/${n}/${n}.yy`);s={meta,img:await loadImage(path.join(root,'sprites',n,meta.frames[frame].name+'.png'))};cache.set(key,s);}
 d.save();d.translate(x,y);d.rotate(-angle*Math.PI/180);d.scale(sx,sy);
 d.drawImage(s.img,-s.meta.sequence.xorigin,-s.meta.sequence.yorigin);d.restore();
}
async function scene(name){
 const r=read(`rooms/${name}/${name}.yy`),c=createCanvas(r.roomSettings.Width,r.roomSettings.Height),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 for(const l of [...r.layers].sort((a,b)=>b.depth-a.depth))for(const i of l.instances||[]){
  const n=i.objectId.name;if(['Obj_parede','Obj_mapa','Obj_jogador','Obj_s8_porta_fria'].includes(n))continue;
  const o=read(`objects/${n}/${n}.yy`);if(o.spriteId)await draw(d,o.spriteId.name,i.x,i.y,i.scaleX,i.scaleY,n==='Obj_s8_porta_fria'?16:0,i.rotation);
 }
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);
 if(name==='Room_Laboratorio_N2'){
  await draw(d,'Spr_homem_lagarto',266,184);await draw(d,'Spr_inimigo_parado_baixo',379,123,.55);
  await draw(d,'Spr_homem_lagarto',549,224);await draw(d,'Spr_jogador_idle_baixo',320,344,scale);
 }else if(name==='Room_Deposito_N2')await draw(d,'Spr_jogador_idle_baixo',300,210,scale);
 else await draw(d,'Spr_jogador_idle_baixo',270,185,scale);
 return c;
}
(async()=>{
 for(const [room,file]of[['Room_Laboratorio_N2','PREVIA_LABORATORIO_V5_20.png'],['Room_Deposito_N2','PREVIA_DEPOSITO_V5_20.png'],['Room_Corredor_N2','PREVIA_CORREDOR_V5_20.png']]){
  const s=await scene(room),o=createCanvas(s.width*2,s.height*2),d=o.getContext('2d');d.imageSmoothingEnabled=false;d.drawImage(s,0,0,o.width,o.height);
  fs.writeFileSync(path.join(root,file),o.toBuffer('image/png'));console.log(file);
 }
})();
