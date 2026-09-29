/* Prévia técnica dos comandos Draw via Canvas. Não é uma captura do GameMaker.
 * Opcional: npm install @napi-rs/canvas. Sem dependência para executar o jogo.
 */
process.env.BUNKER_SKIP_TESTS='1';
const {fixture,run,source,refs,root}=require('./test_regressions.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const canvasPath=require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)});
const {createCanvas,loadImage}=require(canvasPath);
const out=path.resolve(root);fs.mkdirSync(out,{recursive:true});
const yy=s=>JSON.parse(s.replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(m,s)=>s||''));
const gml=s=>s.replace(/\b(\w+)\s+div\s+(\d+)/g,'Math.floor($1 / $2)').replace(/\bmod\b/g,'%');
const sprites=new Map();
async function main(){
 for(const name of Object.keys(refs).filter(n=>n.startsWith('Spr_'))){
  const folder=path.join(root,'sprites',name),data=yy(fs.readFileSync(path.join(folder,name+'.yy'),'utf8'));
  const images=await Promise.all(data.frames.map(f=>loadImage(path.join(folder,f.name+'.png'))));
  sprites.set(refs[name],{data,images});
 }
 function renderer(width,height){
  const c=fixture(),screen=createCanvas(width,height),surfaces=new Map();let target=screen,dc=target.getContext('2d'),alpha=1,color=[255,255,255],halign='left',valign='top';
  let vertices=[];
  const sync=()=>{dc.imageSmoothingEnabled=false;dc.globalAlpha=alpha;dc.fillStyle=dc.strokeStyle=`rgb(${color.join(',')})`;dc.lineWidth=1;dc.font='14px sans-serif';dc.textAlign=halign;dc.textBaseline=valign;};
  const primitive=(fn)=>{sync();dc.beginPath();fn();};
  const lines=(txt,width)=>String(txt).split('\n').flatMap(line=>{let rows=[],row='';for(const word of line.split(' ')){const next=row?row+' '+word:word;if(row&&dc.measureText(next).width>width){rows.push(row);row=word;}else row=next;}rows.push(row);return rows;});
  const text=(x,y,txt,sep,width)=>{sync();lines(txt,width||1e8).forEach((line,i)=>dc.fillText(line,x,y+i*(sep||18)));};
  Object.assign(c,{
   c_white:[255,255,255],c_black:[0,0,0],c_red:[190,50,40],c_ltgray:[175,175,175],c_dkgray:[70,70,70],
   fa_left:'left',fa_center:'center',fa_right:'right',fa_top:'top',fa_middle:'middle',
   bm_normal:0,pr_trianglelist:0,matrix_view:1,matrix_projection:2,matrix_world:3,
   make_color_rgb:(r,g,b)=>[r,g,b],merge_color:(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t)),
   dcos:a=>Math.cos(a*Math.PI/180),dsin:a=>Math.sin(a*Math.PI/180),
   draw_set_alpha:a=>{assert(a>=0&&a<=1);alpha=a;},draw_set_color:col=>{assert(Array.isArray(col));color=col;},
   draw_set_font:()=>{},draw_set_halign:a=>halign=a,draw_set_valign:a=>valign=a,
   gpu_set_blendmode:()=>{},matrix_get:()=>0,matrix_set:()=>{},matrix_build_identity:()=>0,camera_apply:()=>{},
   surface_exists:s=>surfaces.has(s),surface_create:(w,h)=>{const id=surfaces.size+1;surfaces.set(id,createCanvas(w,h));return id;},
   surface_set_target:s=>{if(c.failTarget)return false;target=surfaces.get(s);dc=target.getContext('2d');return true;},
   surface_reset_target:()=>{target=screen;dc=target.getContext('2d');},surface_free:s=>surfaces.delete(s),
   draw_surface:(s,x,y)=>{sync();dc.drawImage(surfaces.get(s),x,y);},
   draw_clear_alpha:(col,a)=>{const prevAlpha=alpha,prevColor=color;alpha=a;color=col;sync();dc.fillRect(0,0,target.width,target.height);alpha=prevAlpha;color=prevColor;},
   draw_rectangle:(x1,y1,x2,y2,outline)=>{sync();dc[outline?'strokeRect':'fillRect'](Math.round(x1),Math.round(y1),x2-x1,y2-y1);},
   draw_line:(x1,y1,x2,y2)=>{primitive(()=>{dc.moveTo(x1,y1);dc.lineTo(x2,y2);});dc.stroke();},
   draw_line_width:(x1,y1,x2,y2,w)=>{primitive(()=>{dc.lineWidth=w;dc.moveTo(x1,y1);dc.lineTo(x2,y2);});dc.stroke();},
   draw_circle:(x,y,r,o)=>{primitive(()=>dc.arc(x,y,Math.max(0,r),0,Math.PI*2));dc[o?'stroke':'fill']();},
   draw_ellipse:(x1,y1,x2,y2,o)=>{primitive(()=>dc.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,Math.PI*2));dc[o?'stroke':'fill']();},
   draw_point:(x,y)=>{sync();dc.fillRect(x,y,1,1);},
   draw_triangle:(x1,y1,x2,y2,x3,y3,o)=>{primitive(()=>{dc.moveTo(x1,y1);dc.lineTo(x2,y2);dc.lineTo(x3,y3);dc.closePath();});dc[o?'stroke':'fill']();},
   draw_text:(x,y,t)=>text(x,y,t),draw_text_ext:(x,y,t,s,w)=>text(x,y,t,s,w),
   string_height_ext:(t,s,w)=>{sync();return lines(t,w).length*s;},
   draw_text_transformed:(x,y,t,sx,sy,ang)=>{sync();dc.save();dc.translate(x,y);dc.rotate(-ang*Math.PI/180);dc.scale(sx,sy);text(0,0,t);dc.restore();},
   display_get_gui_width:()=>1366,display_get_gui_height:()=>768,
   sprite_get_bbox_top:s=>sprites.get(s).data.bbox_top, sprite_get_bbox_bottom:s=>sprites.get(s).data.bbox_bottom,
   sprite_get_xoffset:s=>sprites.get(s).data.sequence.xorigin,sprite_get_yoffset:s=>sprites.get(s).data.sequence.yorigin,
   sprite_get_number:s=>sprites.get(s).images.length,
   draw_sprite_ext:(s,frame,x,y,sx,sy,angle,tint,a)=>{const spr=sprites.get(s),im=spr.images[Math.floor(frame)%spr.images.length];sync();dc.save();dc.globalAlpha=a;dc.translate(x,y);dc.rotate(-angle*Math.PI/180);dc.scale(sx,sy);dc.drawImage(im,-spr.data.sequence.xorigin,-spr.data.sequence.yorigin);dc.restore();},
   draw_sprite_part_ext:(s,f,l,t,w,h,x,y,sx,sy,col,a)=>c.draw_sprite_general(s,f,l,t,w,h,x,y,sx,sy,0,col,col,col,col,a),
   draw_sprite_general:(s,f,l,t,w,h,x,y,sx,sy,angle,c1,c2,c3,c4,a)=>{const spr=sprites.get(s);sync();dc.save();dc.globalAlpha=a;dc.translate(x,y);dc.rotate(-angle*Math.PI/180);dc.scale(sx,sy);dc.drawImage(spr.images[Math.floor(f)%spr.images.length],l,t,w,h,0,0,w,h);dc.restore();},
   draw_primitive_begin:()=>vertices=[],draw_vertex_colour:(x,y,col,a)=>vertices.push([x,y,col,a]),
   draw_primitive_end:()=>{for(let i=0;i<vertices.length;i+=3){const tri=vertices.slice(i,i+3);dc.globalAlpha=tri.reduce((s,v)=>s+v[3],0)/3;dc.fillStyle='#000';dc.beginPath();dc.moveTo(tri[0][0],tri[0][1]);dc.lineTo(tri[1][0],tri[1][1]);dc.lineTo(tri[2][0],tri[2][1]);dc.closePath();dc.fill();}},
  });
  c.draw_sprite=(s,f,x,y)=>c.draw_sprite_ext(s,f,x,y,1,1,0,c.c_white,1);
  new vm.Script(gml(source('scripts/Scr_visual_bunker/Scr_visual_bunker.gml'))).runInContext(c);
  const drawMap=()=>run(c,'objects/Obj_mapa/Draw_0.gml',gml(source('objects/Obj_mapa/Draw_0.gml')).replace('with (Obj_parede) bunker_obstaculo(x, y, largura, altura, tipo);','for (const wall of walls) bunker_obstaculo(wall.x, wall.y, wall.largura, wall.altura, wall.tipo);'));
  return {c,screen,surfaces,drawMap,save:name=>fs.writeFileSync(path.join(out,name),screen.toBuffer('image/png'))};
 }
 for(const [name,w,h,px,py,state] of [['Room_Biblioteca',1366,768,100,550,'ARQUIVOS'],['Room_Corredor_Pos',1366,768,260,390,'CORREDOR'],['Room1',1366,768,190,230,'ARENA_CHAVE'],['Room1',1366,768,683,540,'ARENA_COMBATE']]) {
  const r=renderer(w,h),c=r.c;c.room=refs[name];c.room_width=w;c.room_height=h;c.player.x=px;c.player.y=py;
  run(c,'objects/Obj_mapa/Create_0.gml');
  if(state==='CORREDOR') c.global.boss_derrotado=true;
  if(state==='ARENA_COMBATE'){c.global.v53_chave_escada=true;c.actors=c.actors.filter(a=>a.kind!==refs.Obj_chave_escadaria);c.v54_boss_iniciar();for(let i=0;i<130;i++)c.v54_atualizar();}
  r.drawMap();
  for(const p of c.actors.filter(a=>a.kind===refs.Obj_porta)) {
    if(p.tipo_passagem==='duto'||p.tipo_passagem==='elevador'){p.mensagem_tempo=0;c.v5_passagem_desenhar(p);}
    else c.draw_sprite_ext(refs.Spr_porta_bunker_comum,0,p.x,p.y,1.5,1.5,0,c.c_white,1);
  }
  for(const a of c.actors.filter(a=>a.kind===refs.Obj_caracol)) c.draw_sprite_ext(refs.Spr_inimigo_parado_baixo,0,a.x,a.y,.55,.55,0,c.c_white,1);
  for(const a of c.actors.filter(a=>a.kind===refs.Obj_cientista1)) {const meta=yy(source("objects/Obj_cientista1/Obj_cientista1.yy"));c.draw_sprite_ext(refs[meta.spriteId.name],0,a.x,a.y,1,1,0,c.c_white,1);}
  if(name==='Room1'){const meta=yy(source('rooms/Room1/Room1.yy'));const barrel=yy(source('objects/Obj_barril/Obj_barril.yy'));for(const l of meta.layers)for(const a of l.instances||[])if(a.objectId.name==='Obj_barril')c.draw_sprite_ext(refs[barrel.spriteId.name],0,a.x,a.y,2.8,2.8,0,c.c_white,1);}
  for(const a of c.actors.filter(a=>a.kind===refs.Obj_chave_escadaria)) {const meta=yy(source('objects/Obj_chave_escadaria/Obj_chave_escadaria.yy'));c.draw_sprite_ext(refs[meta.spriteId.name],0,a.x,a.y,1,1,0,c.c_white,1);}
  if(state==='ARENA_COMBATE') c.draw_sprite_ext(refs.Spr_parado_baixo,0,683,360,3,3,0,c.c_white,1);
  c.v54_bloqueio_desenhar();
  c.draw_sprite_ext(refs.Spr_jogador_idle_baixo,0,px,py,c.bunker_escala_protagonista(),c.bunker_escala_protagonista(),0,c.c_white,1);
  run(c,'objects/Obj_mapa/Draw_73.gml');r.save('PREVIA_'+state+'_V5_4.png');
 }
 const sheet=createCanvas(1366,840),sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#080e0c';sc.fillRect(0,0,1366,840);
 for(const [i,state,label] of [[0,'ARQUIVOS','ARQUIVOS — duto de volta, porta à esquerda'],[1,'CORREDOR','CORREDOR — escombros e Boss após a luta'],[2,'ARENA_CHAVE','ARENA — chave antes do aparecimento do Boss'],[3,'ARENA_COMBATE','ARENA — saída bloqueada durante a luta']]){
  const x=(i%2)*683,y=Math.floor(i/2)*420;sc.fillStyle='#d5c79f';sc.font='16px sans-serif';sc.fillText(label,x+12,y+23);
  sc.drawImage(await loadImage(path.join(out,'PREVIA_'+state+'_V5_4.png')),x,y+32,683,384);
 }
 fs.writeFileSync(path.join(out,'PREVIA_CONJUNTO_V5_4.png'),sheet.toBuffer('image/png'));
 console.log('Quatro prévias do código real, desenhadas com Canvas; não são capturas do GameMaker.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
