/* Prévia composta com os próprios sprites e coordenadas das Rooms. Não é captura do GameMaker. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/,\s*([}\]])/g,'$1'));
const cache=new Map();
async function sprite(n,f=0){let s=cache.get(n);if(!s){const data=read(`sprites/${n}/${n}.yy`);s={data,images:await Promise.all(data.frames.map(v=>loadImage(path.join(root,'sprites',n,v.name+'.png'))))};cache.set(n,s);}return {data:s.data,img:s.images[f]};}
async function draw(d,n,x,y,sx=1,sy=sx,f=0){const s=await sprite(n,f);d.drawImage(s.img,x-s.data.sequence.xorigin*sx,y-s.data.sequence.yorigin*sy,s.img.width*sx,s.img.height*sy);}
async function scene(roomName,second=false){
 const r=read(`rooms/${roomName}/${roomName}.yy`),c=createCanvas(r.roomSettings.Width,r.roomSettings.Height),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 for(const l of [...r.layers].sort((a,b)=>b.depth-a.depth))for(const i of l.instances||[]){
 const name=i.objectId.name;if(['Obj_parede','Obj_mapa','Obj_jogador','Obj_sala10_feedback'].includes(name)||name==='Obj_sala10_pe_cabra'&&second)continue;
 const o=read(`objects/${name}/${name}.yy`);if(o.spriteId)await draw(d,o.spriteId.name,i.x,i.y,i.scaleX,i.scaleY,0);
 }
 const enemy=(await sprite('Spr_inimigo_parado_baixo')).data,player=(await sprite('Spr_jogador_parado_baixo')).data;
 const scale=(enemy.bbox_bottom+1-enemy.bbox_top)*.55*.8/(player.bbox_bottom+1-player.bbox_top);
 await draw(d,'Spr_jogador_idle_baixo',roomName==='Room_Corredor_N2'?624:256,roomName==='Room_Corredor_N2'?184:247,scale);
 return c;
}
(async()=>{
 const first=await scene('Room_Ferramentas_N2'),second=await scene('Room_Ferramentas_N2',true),corr=await scene('Room_Corredor_N2');
 const out=createCanvas(2112,1460),d=out.getContext('2d');d.imageSmoothingEnabled=false;d.fillStyle='#10191a';d.fillRect(0,0,2112,1460);
 d.font='bold 26px sans-serif';d.fillStyle='#d9d6ba';d.fillText('SALA 10 — FERRAMENTAS',24,38);d.font='18px sans-serif';d.fillStyle='#a5b5ac';d.fillText('Prévia técnica dos sprites e posições do projeto; não é captura do GameMaker.',24,68);
 d.fillText('PRIMEIRA VISITA — pé de cabra pendurado na parede',24,103);d.fillText('APÓS A COLETA — ferramenta guardada; suporte vazio',1064,103);
 d.drawImage(first,24,120,1024,688);d.drawImage(second,1064,120,1024,688);
 d.fillStyle='#d9d6ba';d.fillText('CORREDOR DA FASE 2 — acesso à Sala 10 no centro da parede superior',24,850);
 d.drawImage(corr,420,0,440,280,604,872,880,560);
 // Corte do corredor somente até a borda inferior do painel, sem interferir nos sprites da sala.
 fs.writeFileSync(path.join(root,'PREVIA_SALA10_V5_18.png'),out.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'art_source_sala10/primeira_visita.png'),first.toBuffer('image/png'));
 console.log('PREVIA_SALA10_V5_18.png');
})();
