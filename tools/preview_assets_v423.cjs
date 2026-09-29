// Prévia técnica: sprites do pacote, Step das armas e Draw do jogador.
process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world,sprites}=require('./test_collisions.cjs');
const {run,refs,root}=require('./test_regressions.cjs');
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{
 paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
async function main(){
 const images=new Map();
 for(const [ref,s] of sprites) if(/Spr_jogador_|Spr_cano_|Spr_canoAtaque|Spr_arma_pregos|Spr_inimigo_parado_baixo|Spr_recepcionista/.test(s.name))
  images.set(ref,await Promise.all(s.frames.map(f=>loadImage(path.join(root,'sprites',s.name,f.name+'.png')))));
 const screen=createCanvas(1200,1100),dc=screen.getContext('2d');dc.imageSmoothingEnabled=false;
 function label(t,x,y,size=22,col='#c5b68e'){dc.fillStyle=col;dc.font=`${size}px sans-serif`;dc.fillText(t,x,y);}
 function draw(s,f,x,y,sx,sy,a,col,alpha){const m=sprites.get(s),imgs=images.get(s);dc.save();dc.globalAlpha=alpha;
  dc.translate(x,y);dc.rotate(-a*Math.PI/180);dc.scale(sx,sy);dc.drawImage(imgs[Math.floor(f)%imgs.length],-m.sequence.xorigin,-m.sequence.yorigin);dc.restore();}
 function player(kind,dir,phase,x,y){
  const c=world(),scale=c.bunker_escala_protagonista();
  const angle=[0,270,90,180][dir],names=['direita','baixo','cima','esquerda'];
  c.player.x=0;c.player.y=0;c.player.depth=0;
  c.mouse_x=c.lengthdir_x(200,angle);c.mouse_y=-12*scale+c.lengthdir_y(200,angle);
  c.global.equipamento_ativo=kind==='pistola'||kind==='cano'?kind:'nenhum';
  let arm;
  if(kind==='pistola'||kind==='cano'){
   run(c,`objects/${kind==='cano'?'Obj_cano':'Obj_armaPregos'}/Create_0.gml`);
   c.dono=c.player;c.id=c;c.global.municao_pistola=4;
   if(kind==='cano')c.mouse_down=true;
   run(c,`objects/${kind==='cano'?'Obj_cano':'Obj_armaPregos'}/Step_0.gml`);
   c.mouse_down=false;
   if(kind==='cano')for(let i=0;i<phase*5;i++)run(c,'objects/Obj_cano/Step_0.gml');
   arm={x:c.x,y:c.y,sprite_index:kind==='cano'?c.sprite_index:refs.Spr_arma_pregos,image_index:c.image_index,
    image_angle:c.image_angle,image_xscale:c.image_xscale,image_yscale:c.image_yscale,image_alpha:1,dono:c.player,
    atacando:c.atacando,ataque_direcao:c.ataque_direcao};
  }
  Object.assign(c,{id:c.player,x:0,y:0,escala_personagem:scale,sprite_index:refs['Spr_jogador_andando_'+names[dir]],
   image_index:phase%4,image_alpha:1,lado:[2,0,1,3][dir],velh:kind==='andar'?1:0,velv:0,
   idle_tempo:0,idle_breath:0,takedown_ativo:false,takedown_pronto:false,c_white:0,
   draw_sprite_ext:draw,
   draw_sprite_part_ext:(s,f,l,t,w,h,px,py,sx,sy,col,alpha)=>{dc.save();dc.globalAlpha=alpha;dc.drawImage(images.get(s)[Math.floor(f)%images.get(s).length],l,t,w,h,px,py,w*sx,h*sy);dc.restore();},
   instance_number:()=>arm?1:0,instance_find:()=>arm,instance_exists:o=>!!o&&o===arm});
  dc.save();dc.translate(x,y);dc.scale(3.2,3.2);run(c,'objects/Obj_jogador/Draw_0.gml');dc.restore();
 }
 const out=path.join(root,'tools','preview_assets_frames');fs.mkdirSync(out,{recursive:true});
 for(let phase=0;phase<10;phase++){
  dc.fillStyle='#111610';dc.fillRect(0,0,1200,1100);
  label('ESCAPE THE BUNKER  /  v4.25',35,42,28,'#e0c47d');
  label('Prévia técnica dos sprites e eventos integrados · ampliação para inspeção',35,74,18);
  ['DIREITA','BAIXO','CIMA','ESQUERDA'].forEach((d,i)=>label(d,250+i*245,114,18));
  ['idle','andar','pistola','cano'].forEach((kind,row)=>{
   const y=270+row*175;dc.fillStyle=row%2?'#192018':'#151c14';dc.fillRect(20,y-140,1160,160);
   label(['PARADO','ANDANDO','PISTOLA','CANO'][row],35,y-70,19);
   for(let dir=0;dir<4;dir++)player(kind,dir,phase,290+dir*245,y);
  });
  label('PROPORÇÃO DE REFERÊNCIA',35,870,19,'#e0c47d');
  const c=world(),s=c.bunker_escala_protagonista();
  dc.save();dc.translate(370,1030);dc.scale(3.2,3.2);draw(refs.Spr_jogador_parado_baixo,0,0,0,s,s,0,0,1);dc.restore();
  dc.save();dc.translate(640,1030);dc.scale(3.2,3.2);draw(refs.Spr_inimigo_parado_baixo,0,0,0,.55,.55,0,0,1);dc.restore();
  dc.save();dc.translate(950,1030);dc.scale(3.2,3.2);draw(refs.Spr_recepcionista,phase,0,0,1,1,0,0,1);dc.restore();
  label('Jogador · 80%',300,1070,20);label('Inimigo · 100%',565,1070,20);label('Recepcionista · escala 1',840,1070,20);
  fs.writeFileSync(path.join(out,String(phase).padStart(2,'0')+'.png'),screen.toBuffer('image/png'));
  if(phase===0)fs.writeFileSync(path.join(root,'PREVIA_PERSONAGENS_V4_25.png'),screen.toBuffer('image/png'));
 }
 console.log('10 quadros de prévia técnica gerados.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
