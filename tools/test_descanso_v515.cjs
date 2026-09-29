/* Room geometry and actual GML events with simulated GameMaker APIs.
 * This does not compile GML or replace a runtime playtest.
 */
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {fixture,run,refs}=require('./test_regressions.cjs');
const root=path.resolve(__dirname,'..');
const room=JSON.parse(fs.readFileSync(path.join(root,'rooms/Room_Funcionarios/Room_Funcionarios.yy'),'utf8'));
const instances=room.layers.flatMap(l=>l.instances||[]);
const walls=instances.filter(i=>i.objectId.name==='Obj_parede');
let total=0;
function test(name,fn){fn();total++;console.log('OK: '+name);}
function scene(){
  const c=fixture();c.room=refs.Room_Funcionarios;c.room_width=640;c.room_height=405;
  c.actors=[];c.walls=[];
  for(const w of walls){
    const a=c.instance_create_depth(w.x,w.y,200,refs.Obj_parede);
    c.image_xscale=w.scaleX;c.image_yscale=w.scaleY;
    run(c,'objects/Obj_parede/Create_0.gml');
    Object.assign(a,{largura:c.largura,altura:c.altura});
  }
  c.feedback=c.instance_create_depth(170,327,-500,refs.Obj_feedback_funcionarios);
  run(c,'objects/Obj_mapa/Create_0.gml');
  c.player.x=90;c.player.y=310;c.player.vida_max=100;c.player.takedown_ativo=false;
  return c;
}
function clear(c,x,y){
  if(x<40||x>600||y<40||y>365)return false;
  return !c.walls.some(w=>x+10>=w.x&&x-11<w.x+w.largura&&y+11>=w.y&&y-4<w.y+w.altura);
}
function reachable(c){
  const seen=new Set([310*640+90]),q=[[90,310]];
  assert(clear(c,90,310));
  for(let i=0;i<q.length;i++){
    const [x,y]=q[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=ny*640+nx;
      if(!seen.has(k)&&clear(c,nx,ny)){seen.add(k);q.push([nx,ny]);}
    }
  }
  return (x,y)=>seen.has(y*640+x);
}
function exitDoor(c){
  const door=c.actors.find(a=>a.kind===refs.Obj_porta);
  run(c,'objects/Obj_porta/Create_0.gml');Object.assign(c,door);
}
function press(c,on){c.keys.clear();if(on)c.keys.add(c.ord('E'));}
function doorStep(c,on=false){press(c,on);run(c,'objects/Obj_porta/Step_0.gml');}
function interact(c,x,y,on=true){c.player.x=x;c.player.y=y;press(c,on);run(c,'objects/Obj_mapa/Step_0.gml');}

test('arte nova, jogador único e 20 paredes colocadas antes do jogador na Room',()=>{
  assert.equal(room.roomSettings.Width,640);assert.equal(room.roomSettings.Height,405);
  assert.equal(instances.filter(i=>i.objectId.name==='Obj_jogador').length,1);
  assert.equal(walls.length,20);assert.equal(scene().walls.length,20);
  const order=room.instanceCreationOrder.map(i=>i.name);
  for(const w of walls)assert(order.indexOf(w.name)<order.indexOf('inst_PLAYER_FUNC'));
});
test('spawn alcança sofá, chaves, café, dormitório e corredor de saída',()=>{
  const c=scene(),can=reachable(c);
  for(const pt of [[90,346],[404,119],[509,145],[489,286],[146,205],[220,215],[368,215]])assert(can(...pt),pt+' inacessível');
  for(const pt of [[146,162],[301,200],[490,240],[580,240],[90,377],[63,342],[117,342]])assert(!can(...pt),pt+' deveria bloquear');
  assert.notEqual(c.bunker_varrer_paredes(301,290,301,170,2).alvo,c.noone);
  assert.notEqual(c.bunker_varrer_paredes(90,345,90,400,7).alvo,c.noone);
});
test('andar pelo vestíbulo não sai; E do lado de fora não abre',()=>{
  const c=scene();exitDoor(c);
  for(const pt of [[90,310],[90,334],[134,346]]){
    c.player.x=pt[0];c.player.y=pt[1];doorStep(c,true);assert(!c.abrindo);
  }
  c.player.x=90;c.player.y=346;
  for(let i=0;i<60;i++)doorStep(c);
  assert(!c.abrindo);assert(!c.eventos.some(e=>e[0]==='goto'));
});
test('E abre com animação e só depois volta ao corredor, preservando inventário e vida',()=>{
  const c=scene();exitDoor(c);c.player.x=90;c.player.y=346;
  c.global.chave_deposito=true;c.global.inventario_pistola=true;
  doorStep(c,true);assert(c.abrindo);assert(c.global.cutscene_ativa);
  assert(!c.eventos.some(e=>e[0]==='goto'));
  const count=c.sprite_get_number(refs.Spr_porta_bunker_comum);
  for(let i=0;i<Math.ceil((count-1)/c.velocidade_porta)+5;i++){
    doorStep(c);
    if(c.eventos.some(e=>e[0]==='goto'))break;
  }
  assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));
  assert.equal(c.global.vida_jogador,72);assert.equal(c.global.caixas_mecanicas,3);
  assert(c.global.chave_deposito&&c.global.inventario_pistola);
  assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[850,190]);
  assert(Math.hypot(850-850,95-190)>82,'retorno na área de reentrada');
});
test('pause, diário, configuração, diálogo e cutscene bloqueiam a saída',()=>{
  for(const flag of ['pause_aberto','diario_aberto','config_aberta','dialogo_ativo','cutscene_ativa']){
    const c=scene();exitDoor(c);c.player.x=90;c.player.y=346;c.global[flag]=true;doorStep(c,true);
    assert(!c.abrindo,flag);assert(!c.eventos.some(e=>e[0]==='goto'));
  }
});
test('aviso E usa o mesmo limite do corredor no painel GUI e fica oculto no pause',()=>{
  const c=scene();exitDoor(c);c.visual_estatico=true;
  c.c_white=0;c.fa_center=0;c.fa_left=0;
  c.draw_set_font=c.draw_set_halign=c.draw_set_color=c.draw_set_alpha=()=>{};
  const text=[];c.draw_text_transformed=(x,y,label)=>text.push(label);
  c.player.x=90;c.player.y=334;run(c,'objects/Obj_porta/Draw_0.gml');assert.equal(text.length,0);
  c.player.y=346;run(c,'objects/Obj_porta/Draw_0.gml');assert.equal(text.length,0);
  // Os atores simulados não executam Create automaticamente.
  Object.assign(c.actors.find(a=>a.kind===refs.Obj_porta),{ativa:true,abrindo:false,mensagem_tempo:0});
  assert.equal(c.bunker_fase2_conteudo(c).comando,'[E] ABRIR PORTA / SAIR');
  text.length=0;c.global.pause_aberto=true;run(c,'objects/Obj_porta/Draw_0.gml');assert.equal(text.length,0);
});
test('café, chaves e dormitório interagem nas novas posições sem conflitar com saída',()=>{
  const c=scene();c.player.vida=45;
  interact(c,489,286);assert.equal(c.player.vida,80);assert.equal(c.func_feedback_frame,4);
  interact(c,404,119);assert(c.global.funcionarios_chaves_coletadas&&c.global.chave_deposito&&c.global.chave_sala_ferramentas);
  assert.equal(c.func_feedback_frame,6);
  interact(c,404,119);assert.equal(c.func_feedback_frame,7);
  interact(c,509,145);assert.equal(c.func_feedback_frame,8);
  interact(c,90,346);assert.equal(c.func_interacao_proxima,'');
  assert(!c.eventos.some(e=>e[0]==='goto'));
});
test('acesso normal e atalho P chegam no novo spawn, fora do gatilho de saída',()=>{
  const c=fixture();c.room=refs.Room_Corredor_N2;c.actors=[];c.walls=[];
  run(c,'objects/Obj_mapa/Create_0.gml');
  const access=c.actors.find(a=>a.destino===refs.Room_Funcionarios);
  assert.deepEqual([access.spawn_x,access.spawn_y],[90,310]);
  run(c,'objects/Obj_porta/Create_0.gml');Object.assign(c,access);
  c.player.x=850;c.player.y=145;doorStep(c,true);
  assert.equal(c.global.spawn_room,refs.Room_Funcionarios);
  const s=scene();assert(clear(s,c.global.spawn_x,c.global.spawn_y));
  exitDoor(s);assert(!s.bunker_porta_em_alcance(s,s.player));
  assert.equal(s.global.tela_camera_w,640);assert.equal(s.global.tela_camera_h,360);
});
console.log(total+' testes da sala de descanso passaram (GML simulado; sem runtime GameMaker).');
