/* Actual room data + GML events using simulated engine APIs; not a GM runtime. */
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture,run,refs}=require('./test_regressions.cjs');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const room=load('rooms/Room_Corredor_N2/Room_Corredor_N2.yy');
const instances=room.layers.flatMap(l=>l.instances||[]),walls=instances.filter(i=>i.objectId.name==='Obj_parede');
let total=0;
function test(label,fn){fn();total++;console.log('OK: '+label);}
function scene(){
 const c=fixture();c.room=refs.Room_Corredor_N2;c.room_width=1248;c.room_height=330;c.actors=[];c.walls=[];
 for(const w of walls){
  const a=c.instance_create_depth(w.x,w.y,200,refs.Obj_parede);
  c.image_xscale=w.scaleX;c.image_yscale=w.scaleY;run(c,'objects/Obj_parede/Create_0.gml');
  Object.assign(a,{largura:c.largura,altura:c.altura});
 }
 run(c,'objects/Obj_mapa/Create_0.gml');c.player.x=1030;c.player.y=186;c.player.takedown_ativo=false;
 return c;
}
function clear(c,x,y){
 if(x<40||x>1208||y<40||y>290)return false;
 return !c.walls.some(w=>x+10>=w.x&&x-11<w.x+w.largura&&y+11>=w.y&&y-4<w.y+w.altura);
}
function reachable(c){
 const queue=[[1030,186]],seen=new Set([186*1248+1030]);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=ny*1248+nx;
   if(!seen.has(k)&&clear(c,nx,ny)){seen.add(k);queue.push([nx,ny]);}
  }
 }
 return (x,y)=>seen.has(y*1248+x);
}
test('13 colisores da Room, um jogador e cenário sem desenho procedural',()=>{
 const c=scene();assert.equal(walls.length,13);assert.equal(c.walls.length,13);
 assert.equal(instances.filter(i=>i.objectId.name==='Obj_jogador').length,1);
 const bg=instances.find(i=>i.objectId.name==='Obj_corredor_n2_cenario');assert.deepEqual([bg.x,bg.y,bg.scaleX,bg.scaleY],[0,-109,.65,.65]);
 const order=room.instanceCreationOrder.map(i=>i.name);
 for(const w of walls)assert(order.indexOf(w.name)<order.indexOf('inst_PLAYER_ROOM_CORREDOR_N2'));
 assert(fs.readFileSync(path.join(root,'objects/Obj_mapa/Draw_0.gml'),'utf8').includes('if (room == Room_Corredor_N2) exit;'));
});
test('corredor inteiro e os acessos originais são alcançáveis; caixas e barril bloqueiam',()=>{
 const c=scene(),can=reachable(c);
 for(const pt of [[160,145],[624,145],[50,170],[120,170],[624,220],[850,145],[1030,145],[1190,170],[624,160],[850,190]])assert(can(...pt),pt+' inacessível');
 for(const pt of [[55,120],[1130,120],[1160,130],[1190,120],[50,230],[85,239],[1145,235],[1180,230],[624,270],[624,80]])assert(!can(...pt),pt+' sólido atravessável');
 assert.notEqual(c.bunker_varrer_paredes(1180,170,1180,250,2).alvo,c.noone);
 assert.notEqual(c.bunker_varrer_paredes(50,170,50,245,7).alvo,c.noone);
});
test('portas separadas não disputam E e retornos surgem em área livre fora do gatilho',()=>{
 const c=scene(),doors=c.actors.filter(a=>a.kind===refs.Obj_porta);
 assert.equal(doors.length,5);
 for(let i=0;i<doors.length;i++)for(let j=i+1;j<doors.length;j++)assert(Math.hypot(doors[i].x-doors[j].x,doors[i].y-doors[j].y)>164);
 for(const [roomName,pt] of [['Room_Funcionarios',[850,190]],['Room_Manutencao_N2',[624,160]],['Room_Corredor_Pos',[1030,186]]]){
  const s=fixture();s.room=refs[roomName];s.actors=[];s.walls=[];run(s,'objects/Obj_mapa/Create_0.gml');
  const back=s.actors.find(a=>a.destino===refs.Room_Corredor_N2);assert(back);
  assert.deepEqual([back.spawn_x,back.spawn_y],pt);assert(clear(c,...pt));
  const corresponding=doors.find(a=>a.destino===refs[roomName]);assert(Math.hypot(pt[0]-corresponding.x,pt[1]-corresponding.y)>82);
 }
});
test('descanso e manutenção só entram com E e preservam vida e inventário',()=>{
 for(const [dest,pt,spawn] of [['Room_Funcionarios',[850,145],[90,310]],['Room_Manutencao_N2',[624,220],[92,88]]]){
  const c=scene(),door=c.actors.find(a=>a.destino===refs[dest]);run(c,'objects/Obj_porta/Create_0.gml');Object.assign(c,door);
  [c.player.x,c.player.y]=pt;run(c,'objects/Obj_porta/Step_0.gml');assert(!c.eventos.some(e=>e[0]==='goto'));
  c.global.chave_deposito=true;c.keys.add(c.ord('E'));run(c,'objects/Obj_porta/Step_0.gml');
  assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs[dest]));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],spawn);
  assert.equal(c.global.vida_jogador,72);assert.equal(c.global.caixas_mecanicas,3);assert(c.global.chave_deposito);
 }
});
test('escadaria retorna com transição e sinaliza checkpoint sem saída automática',()=>{
 const c=scene(),door=c.actors.find(a=>a.tipo_passagem==='escada');run(c,'objects/Obj_porta/Create_0.gml');Object.assign(c,door);
 c.player.x=1030;c.player.y=145;run(c,'objects/Obj_porta/Step_0.gml');assert(!c.global.v5_checkpoint_transicao_pendente);
 c.keys.add(c.ord('E'));run(c,'objects/Obj_porta/Step_0.gml');assert(c.global.v5_checkpoint_transicao_pendente);
 c.keys.clear();for(let i=0;i<30;i++)run(c,'objects/Obj_porta/Step_0.gml');
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_Pos));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[550,190]);
});
test('câmera acompanha o corredor longo dentro dos limites',()=>{
 const c=scene();assert(c.global.tela_camera_w<1248);assert(c.global.tela_camera_h<=330);
 const points=[];c.camera_set_view_pos=(_id,x,y)=>points.push([x,y]);
 for(const x of [50,624,1190]){c.player.x=x;c.bunker_camera_atualizar();}
 assert(points[2][0]>points[0][0]);
 for(const [x,y] of points)assert(x>=0&&x<=1248-c.global.tela_camera_w&&y>=0&&y<=330-c.global.tela_camera_h);
});
console.log(total+' testes do corredor passaram (GML simulado; sem runtime GameMaker).');
