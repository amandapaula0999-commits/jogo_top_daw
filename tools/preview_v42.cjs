/* Prévia técnica dos comandos Draw via Canvas. Não é uma captura do GameMaker.
 * Opcional: npm install @napi-rs/canvas. Sem dependência para executar o jogo.
 */
process.env.BUNKER_SKIP_TESTS='1';
const {fixture,run,source,refs,root}=require('./test_regressions.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const canvasPath=require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)});
const {createCanvas,loadImage}=require(canvasPath);
const out=path.resolve(root,'../tmp/qa_v42');fs.mkdirSync(out,{recursive:true});
const yy=s=>JSON.parse(s.replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(m,s)=>s||''));
const gml=s=>s.replace(/\b(\w+)\s+div\s+(\d+)/g,'Math.floor($1 / $2)').replace(/\bmod\b/g,'%');
const sprites=new Map();
async function main(){
 for(const name of Object.keys(refs).filter(n=>n.startsWith('Spr_'))){
  const folder=path.join(root,'sprites',name),data=yy(fs.readFileSync(path.join(folder,name+'.yy'),'utf8'));
  const images=await Promise.all(data.frames.map(f=>loadImage(path.join(folder,f.name+'.png'))));
  sprites.set(refs[name],{data,images});
 }
 function renderer(){
  const c=fixture(),screen=createCanvas(1366,768),surfaces=new Map();let target=screen,dc=target.getContext('2d'),alpha=1,color=[255,255,255],halign='left',valign='top';
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
 const rooms=['Room_Externa','Room_Recepcao','Room_Armadilha','Room_Desmoronada','Room_Corredor','Room_Pesquisa','Room_Biblioteca','Room1'];
 for(const room of rooms){
  const r=renderer(),c=r.c;c.room=refs[room];run(c,'objects/Obj_mapa/Create_0.gml');
  r.drawMap();const normal=r.screen.toBuffer('image/png');r.drawMap();assert(normal.equals(r.screen.toBuffer('image/png')));
  r.surfaces.clear();r.drawMap();assert(normal.equals(r.screen.toBuffer('image/png')),'perda de surface alterou o cenário');
  r.surfaces.clear();c.failTarget=true;r.drawMap();assert(normal.equals(r.screen.toBuffer('image/png')),'falha do alvo alterou o fallback');c.failTarget=false;
  const objectSprites={Obj_caracol:'Spr_inimigo_andando_baixo',Obj_cientista1:'Spr_cientista1',Obj_recepcionista:'Spr_recepcionista',Obj_caixaPregos:'Spr_caixaPrego'};
  for(const obj of c.actors){const name=obj.kind.description;if(name==='Obj_porta'){const white=!(room==='Room1'||obj.destino===refs.Room1);c.draw_sprite_ext(refs[white?'Spr_porta_bunker_comum':'Spr_porta_bunker_restrita'],0,obj.x,obj.y,1.5,1.5,0,c.c_white,1);}else if(objectSprites[name])c.draw_sprite_ext(refs[objectSprites[name]],0,obj.x,obj.y,name==='Obj_caracol'?.55:1,name==='Obj_caracol'?.55:1,0,c.c_white,1);}
  if(room==='Room1')c.draw_sprite_ext(refs.Spr_parado_baixo,0,680,380,3,3,0,c.c_white,1);
  c.draw_sprite_ext(refs.Spr_jogador_parado_baixo,0,160,390,1,1,0,c.c_white,1);
  // A prévia aproxima a interpolação das sombras do runtime por triângulo.
  c.Obj_jogador={x:160,y:390};run(c,'objects/Obj_mapa/Draw_73.gml');c.Obj_jogador=refs.Obj_jogador;
  r.save(room+'.png');
 }
 const original=renderer(),composed=renderer();
 original.c.draw_sprite_ext(refs.Spr_parado_baixo,0,150+(original.c.sprite_get_xoffset(refs.Spr_parado_baixo)-16)*3,350+(original.c.sprite_get_yoffset(refs.Spr_parado_baixo)-20)*3,3,3,0,[255,255,255],1);
 composed.c.bunker_boss_ataque(150,350,3,0,[255,255,255]);
 assert(original.screen.toBuffer('image/png').equals(composed.screen.toBuffer('image/png')),'a pose inicial deve reproduzir o sprite original pixel por pixel');
 const boss=renderer();boss.c.draw_clear_alpha([35,43,37],1);
 const times=[0,22,45,58,70,96];times.forEach((t,i)=>{const x=140+i*215;boss.c.bunker_boss_ataque(x,350,5,t,[255,255,255]);boss.c.draw_set_color([220,215,185]);boss.c.draw_text(x-70,480,'PASSO '+t);});boss.save('boss_original_ataque.png');
 const journal=renderer();journal.c.room=refs.Room_Biblioteca;run(journal.c,'objects/Obj_mapa/Create_0.gml');journal.c.bunker_registrar(journal.c.indicio_registro[0]);journal.c.modo_diario=true;journal.c.pagina_diario=0;run(journal.c,'objects/Obj_pause/Draw_64.gml');journal.save('diario.png');
 console.log('Prévias técnicas: 8 mapas + ataque original + diário. Cache normal/perdido/fallback idênticos nas 8 salas.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
