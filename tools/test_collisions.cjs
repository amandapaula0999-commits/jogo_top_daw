/* Executa o GML de colisão com APIs de instância/sprite simuladas.
 * Usa metadados reais e eventos reais. Não substitui compilação VM/YYC.
 * node tools/test_collisions.cjs
 */
process.env.BUNKER_SKIP_TESTS = '1';
const {fixture, run, source, refs, root} = require('./test_regressions.cjs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const yy = file => JSON.parse(source(file).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g, (_, s) => s || ''));
const sprites = new Map(Object.entries(refs).filter(([n]) => n.startsWith('Spr_'))
  .map(([n, ref]) => [ref, yy(`sprites/${n}/${n}.yy`)]));
let count = 0;
function test(name, fn) { if(process.env.BUNKER_SKIP_COLLISION_TESTS) return; fn(); console.log('OK:', name); count++; }
function objectEvent(c, actor, file) {
  const local = vm.createContext({...c, ...actor, id: actor,
    instance_destroy: (target = actor) => c.instance_destroy(target)});
  run(local, file);
  for (const key of Object.keys(local)) {
    if (Object.hasOwn(actor, key) || !Object.hasOwn(c, key)) actor[key] = local[key];
  }
}
function world() {
  const c = fixture();
  c.mb_right = 2;
  for (const [fn, key] of [['width','width'],['height','height'],['bbox_left','bbox_left'],
    ['bbox_right','bbox_right'],['bbox_top','bbox_top'],['bbox_bottom','bbox_bottom']])
    c['sprite_get_' + fn] = spr => sprites.get(spr)[key];
  c.sprite_get_xoffset = spr => sprites.get(spr).sequence.xorigin;
  c.sprite_get_yoffset = spr => sprites.get(spr).sequence.yorigin;
  const exists = c.instance_exists;
  c.instance_exists = ref => ref === c.player || exists(ref);
  c.instance_destroy = actor => {
    actor.deleted = true;
    c.actors = c.actors.filter(a => a !== actor);
    c.walls = c.walls.filter(a => a !== actor);
  };
  c.variable_instance_exists = (actor, key) => Object.hasOwn(actor, key);
  c.instance_create_layer = (x, y, layer, kind) => {
    const name = kind.description;
    const meta = yy(`objects/${name}/${name}.yy`);
    const actor = {kind, object_index: kind, x, y, layer, alarm: [],
      sprite_index: refs[meta.spriteId.name], image_angle: 0, image_index: 0,
      image_xscale: 1, image_yscale: 1, depth: 0, direction: 0};
    c.actors.push(actor);
    objectEvent(c, actor, `objects/${name}/Create_0.gml`);
    return actor;
  };
  c.wall = (x,y,w,h) => {
    const p = c.instance_create_depth(x,y,200,refs.Obj_parede);
    c.bunker_parede_configurar(p,w,h);
    return p;
  };
  c.enemy = (x,y,sprite=refs.Spr_inimigo_parado_baixo) => {
    const p = c.instance_create_depth(x,y,0,refs.Obj_caracol);
    Object.assign(p,{sprite_index:sprite,image_xscale:0.55,image_yscale:0.55,
      alarm:[],vida:30,takedown_ativo:false});
    return p;
  };
  c.projectile = (kind,x,y,direction=0) => {
    const p=c.instance_create_layer(x,y,'Instances',kind);
    p.direction=direction; p.image_angle=direction;
    return p;
  };
  return c;
}
test('segmento: horizontais, verticais, diagonais, origem interna, tangência e distância zero', () => {
  const f=world().bunker_segmento_caixa;
  assert.equal(f(0,5,100,5,30,0,31,10),0.3);
  assert.equal(f(30.5,-100,30.5,100,30,0,31,10),0.5);
  assert.equal(f(0,0,100,100,30,30,31,31),0.3);
  assert.equal(f(30,5,30,5,30,0,31,10),0);
  assert.equal(f(0,0,0,0,30,0,31,10),2);
  assert.equal(f(0,10,100,10,30,0,31,10),0.3);
  assert.equal(f(0,11,100,11,30,0,31,10),2);
  assert.equal(f(0,5,-100,5,30,0,31,10),2);
});
test('parede de 1px detém bala e cano mesmo em deslocamento de 600px', () => {
  for (const kind of [refs.Obj_bala,refs.Obj_canoAremesado]) {
    const c=world(); c.wall(180,0,1,300);
    const p=c.projectile(kind,80,100);p.velocidade=600;
    c.bunker_projetil_passo(p);
    assert(p.x+p.raio_colisao<180);assert.equal(p.em_voo,false);
    assert.equal(!!p.deleted,kind===refs.Obj_bala);
  }
});
test('cano não atravessa paredes nas quatro direções nem durante giro', () => {
  for (const [dir,x,y,wx,wy,ww,wh] of [[0,100,200,160,150,1,100],
    [180,220,200,160,150,1,100],[90,200,220,150,160,100,1],[270,200,100,150,160,100,1]]) {
    const c=world();c.wall(wx,wy,ww,wh);
    const p=c.projectile(refs.Obj_canoAremesado,x,y,dir);
    for(let i=0;i<25;i++) c.bunker_projetil_passo(p);
    assert.equal(p.em_voo,false);
    assert(c.bunker_varrer_paredes(p.x,p.y,p.x,p.y,p.raio_colisao).t>1);
    const angle=p.image_angle; c.bunker_projetil_passo(p);assert.equal(p.image_angle,angle);
  }
});
test('varredura escolhe primeiro contato, não a ordem de criação; parede vence empate', () => {
  const c=world(); const distant=c.enemy(240,180); const near=c.enemy(160,180);
  assert.equal(c.bunker_varrer_impacto(80,160,300,160,0).alvo,near);
  const box=c.bunker_caixa_dano(near); const wall=c.wall(box.l,100,1,150);
  assert.equal(c.bunker_varrer_impacto(80,160,300,160,0).alvo,wall);
  const p=c.projectile(refs.Obj_bala,80,160);p.velocidade=400;c.bunker_projetil_passo(p);
  assert.equal(near.vida,30);assert.equal(distant.vida,30);
});
test('bala e cano acertam cabeça e torso nas oito sprites de direção, mantendo máscara dos pés', () => {
  const enemySprites=[...sprites.keys()].filter(s=>/^Spr_inimigo_(andando|parado)_/.test(s.description));
  assert.equal(enemySprites.length,8);
  for(const sprite of enemySprites) for(const kind of [refs.Obj_bala,refs.Obj_canoAremesado]) {
    const c=world(),enemy=c.enemy(220,200,sprite),box=c.bunker_caixa_dano(enemy);
    const p=c.projectile(kind,box.l-80,box.t+5);p.velocidade=200;
    c.bunker_projetil_passo(p);
    assert.equal(enemy.vida,kind===refs.Obj_bala?25:22);
    c.bunker_projetil_passo(p);assert.equal(enemy.vida,kind===refs.Obj_bala?25:22);
  }
  assert(source('objects/Obj_caracol/Create_0.gml').includes('mask_index = Spr_mascara_inimigo'));
});
test('tiro em espaço vazio acima do sprite não acerta; morto não bloqueia o próximo alvo', () => {
  const c=world(),dead=c.enemy(150,200),alive=c.enemy(240,200);
  dead.morrendo=true;dead.vida=0;
  const b=c.bunker_caixa_dano(alive);
  assert.equal(c.bunker_varrer_impacto(60,b.t-10,300,b.t-10,0).t,2);
  const p=c.projectile(refs.Obj_bala,60,b.t+10);p.velocidade=400;c.bunker_projetil_passo(p);
  assert.equal(dead.vida,0);assert.equal(alive.vida,25);
});
test('um golpe letal solta a trava de finalização e não empurra para a parede', () => {
  const c=world(),enemy=c.enemy(100,100);enemy.vida=4;enemy.takedown_ativo=true;
  c.bunker_aplicar_impacto(enemy,8);
  assert.equal(enemy.vida,0);assert.equal(enemy.takedown_ativo,false);
  assert.equal(enemy.x,100);assert.equal(enemy.y,100);
});
test('origem na boca da arma além da parede é bloqueada antes de aparecer do outro lado', () => {
  for(const kind of [refs.Obj_bala,refs.Obj_canoAremesado]) {
    const c=world();c.player.x=100;c.player.y=180;c.wall(115,80,2,170);
    const radius=kind===refs.Obj_bala?6:10;
    const p=c.bunker_lancar_projetil(kind,c.player,145,152,0,radius);
    assert.notEqual(p,c.noone); c.bunker_projetil_passo(p);
    assert(p.x+radius<115);assert.equal(p.em_voo,false);
  }
});
test('inimigo entre a mão e a boca da arma recebe dano no primeiro passo', () => {
  const c=world();c.player.x=100;c.player.y=190;const enemy=c.enemy(130,190);
  const p=c.bunker_lancar_projetil(refs.Obj_bala,c.player,170,165,0,6);
  c.bunker_projetil_passo(p);assert.equal(enemy.vida,25);
});
test('origem sem espaço mantém cano e munição; próximo de quina usa somente lado acessível', () => {
  const c=world();c.player.x=100;c.player.y=100;c.wall(75,75,50,50);
  assert.equal(c.bunker_lancar_projetil(refs.Obj_canoAremesado,c.player,150,100,0,10),c.noone);
  assert.equal(c.actors.filter(a=>a.kind===refs.Obj_canoAremesado).length,0);
  const d=world();d.player.x=100;d.player.y=100;d.wall(103,50,1,100);
  const p=d.bunker_lancar_projetil(refs.Obj_canoAremesado,d.player,130,100,0,10);
  assert.notEqual(p,d.noone);assert(p.x<93);
  d.bunker_projetil_passo(p);assert(p.x+p.raio_colisao<103);
});
test('cano parado pode ser recuperado; parede bloqueia coleta e segundo dano', () => {
  const c=world();c.player.x=100;c.player.y=100;c.global.inventario_cano=false;
  const p=c.projectile(refs.Obj_canoAremesado,130,100);p.em_voo=false;
  c.keys.add(c.ord('E'));const wall=c.wall(115,60,1,100);
  objectEvent(c,p,'objects/Obj_canoAremesado/Step_2.gml');assert.equal(c.global.inventario_cano,false);
  c.instance_destroy(wall);objectEvent(c,p,'objects/Obj_canoAremesado/Step_2.gml');
  assert.equal(c.global.inventario_cano,true);assert.equal(c.global.equipamento_ativo,'cano');
  assert.equal(p.deleted,true);
});
test('barril derruba uma vez por impacto; carapaça do Boss continua respeitando ácido', () => {
  const c=world();let falls=0;c.bunker_derrubar_barril=b=>{b.atingido=true;falls++;};
  const barrel=c.instance_create_depth(160,180,0,refs.Obj_barril);
  Object.assign(barrel,{sprite_index:refs.Spr_barril,image_xscale:2.8,image_yscale:2.8,atingido:false});
  const box=c.bunker_caixa_dano(barrel),p=c.projectile(refs.Obj_canoAremesado,box.l-50,(box.t+box.b)/2);
  p.velocidade=300;c.bunker_projetil_passo(p);c.bunker_projetil_passo(p);assert.equal(falls,1);
  const boss=c.instance_create_depth(300,300,0,refs.Obj_boss);
  Object.assign(boss,{morto:false,fugindo:false,vida:180,derrotado:false});
  c.bunker_aplicar_impacto(boss,8);assert.equal(boss.vida,180);assert(boss.feedback_texto.includes('BLOQUEOU'));
  boss.derrotado=true;c.bunker_aplicar_impacto(boss,8);assert.equal(boss.vida,172);
});
test('End Step é registrado; eventos antigos não voltam a dar dano discreto/duplicado', () => {
  for(const name of ['Obj_bala','Obj_canoAremesado','Obj_hitbox']) {
    const meta=yy(`objects/${name}/${name}.yy`);
    assert(meta.eventList.some(e=>e.eventType===3&&e.eventNum===2));
    assert(!meta.eventList.some(e=>e.eventType===4));
    assert(fs.existsSync(`${root}/objects/${name}/Step_2.gml`));
  }
});
test('sprite do cano inteiro cabe no raio de colisão em 360 ângulos', () => {
  const c=world(),p=c.projectile(refs.Obj_canoAremesado,200,200);
  const s=sprites.get(refs.Spr_cano),cx=(s.bbox_left+s.bbox_right+1)/2,cy=(s.bbox_top+s.bbox_bottom+1)/2;
  let drawn;
  c.c_white=0;c.draw_sprite_ext=(...args)=>drawn=args;
  for(let angle=0;angle<360;angle++) {
    p.image_angle=angle;c.bunker_projetil_desenhar(p);
    for(const x of [s.bbox_left,s.bbox_right+1])for(const y of [s.bbox_top,s.bbox_bottom+1]) {
      const dx=(x-s.sequence.xorigin)*p.image_xscale,dy=(y-s.sequence.yorigin)*p.image_yscale;
      const wx=drawn[2]+c.lengthdir_x(dx,angle)-c.lengthdir_y(dy,angle);
      const wy=drawn[3]+c.lengthdir_y(dx,angle)+c.lengthdir_x(dy,angle);
      assert(Math.hypot(wx-p.x,wy-p.y)<=p.raio_colisao+1e-8);
    }
  }
});
test('dez salas: props e máscaras usam as mesmas dimensões e todas as passagens são alcançáveis', () => {
  for(const room of ['Room_Externa','Room_Recepcao','Room_Armadilha','Room_Desmoronada',
    'Room_Corredor','Room_Corredor_Pos','Room_Corredor_N2','Room_Pesquisa','Room_Biblioteca','Room1']) {
    const c=world();c.room=refs[room];const data=yy('rooms/'+room+'/'+room+'.yy');const rs=data.roomSettings;c.room_width=rs.Width;c.room_height=rs.Height;
    for(const i of data.layers.flatMap(l=>l.instances||[])) {
      if(i.objectId.name==='Obj_parede')c.wall(i.x,i.y,i.scaleX*64,i.scaleY*64);
    }
    run(c,'objects/Obj_mapa/Create_0.gml');
    for(const w of c.walls){assert.equal(w.image_xscale*64,w.largura);assert.equal(w.image_yscale*64,w.altura);}
    for(const prop of c.props_cenario){
      assert(c.walls.some(w=>w.tipo===9&&w.x<=prop[1]&&w.y<=prop[2]
        &&w.x+w.largura>=prop[1]+prop[3]&&w.y+w.altura>=prop[2]+prop[4]));
    }
    const doors=c.actors.filter(a=>a.kind===refs.Obj_porta);
    // A integração é uma cutscene sem portas: termina na queda do piso.
    const anchors=room==='Room_Armadilha'?[{x:683,y:405,rotulo:'QUEDA'}]:doors;
    // BFS usa TODAS as paredes realmente criadas, inclusive os props novos.
    const step=8,cols=Math.ceil(c.room_width/step),rows=Math.ceil(c.room_height/step);
    const blocked=(x,y)=>c.walls.some(w=>x+11>=w.x&&x-11<=w.x+w.largura&&y+12>=w.y&&y-4<=w.y+w.altura);
    const points=[];
    for(const d of anchors)for(let y=40;y<c.room_height-40;y+=step)for(let x=40;x<c.room_width-40;x+=step)
      if(Math.hypot(x-d.x,y-d.y)<=40&&!blocked(x,y)){points.push([x,y]);break;}
    assert(points.length,room+' sem porta acessível');
    const visited=new Set(),queue=[points[0]];visited.add(points[0].join(','));
    for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8]]) {
      const x=queue[i][0]+dx,y=queue[i][1]+dy,key=x+','+y;
      if(x<40||y<40||x>=c.room_width-40||y>=c.room_height-40||visited.has(key)||blocked(x,y))continue;
      visited.add(key);queue.push([x,y]);
    }
    for(const door of anchors) assert(queue.some(([x,y])=>Math.hypot(x-door.x,y-door.y)<=40),room+' porta isolada '+door.rotulo);
    for(const [i,x] of c.indicio_x.entries()) assert(queue.some(([px,py])=>Math.hypot(px-x,py-c.indicio_y[i])<=54),room+' evidência isolada '+i);
  }
});
test('spawns dos inimigos são liberados também com os novos props sólidos', () => {
  for(const room of ['Room_Desmoronada','Room_Corredor','Room_Corredor_Pos','Room_Pesquisa','Room_Biblioteca']) {
    const c=world();c.room=refs[room];const rs=yy('rooms/'+room+'/'+room+'.yy').roomSettings;c.room_width=rs.Width;c.room_height=rs.Height;run(c,'objects/Obj_mapa/Create_0.gml');
    const mask=sprites.get(refs.Spr_mascara_inimigo);
    c.place_meeting=(x,y)=>c.walls.some(w=>x+(mask.width-mask.sequence.xorigin)*0.55>=w.x
      &&x-mask.sequence.xorigin*0.55<=w.x+w.largura
      &&y+(mask.height-mask.sequence.yorigin)*0.55>=w.y&&y-mask.sequence.yorigin*0.55<=w.y+w.altura);
    for(const enemy of c.actors.filter(a=>a.kind===refs.Obj_caracol)) {
      objectEvent(c,enemy,'objects/Obj_caracol/Create_0.gml');
      assert(!c.place_meeting(enemy.x,enemy.y),room+' spawn preso');
    }
  }
});
test('eventos reais das armas lançam uma vez, gastam recursos só quando há origem válida', () => {
  for(const blocked of [false,true]) {
    const c=world();Object.assign(c.player,{x:100,y:160,depth:0});
    Object.assign(c.global,{inventario_pistola:true,municao_pistola:4,equipamento_ativo:'pistola'});
    const gun=c.instance_create_layer(100,160,'Instances',refs.Obj_armaPregos);gun.dono=c.player;
    if(blocked)c.wall(75,135,50,50);
    c.mouse_down=true;c.mouse_x=300;c.mouse_y=130;
    objectEvent(c,gun,'objects/Obj_armaPregos/Step_0.gml');
    assert.equal(c.global.municao_pistola,blocked?4:3);
    assert.equal(c.actors.filter(a=>a.kind===refs.Obj_bala).length,blocked?0:1);
    c.mouse_down=false;c.global.inventario_cano=true;c.global.equipamento_ativo='cano';
    const pipe=c.instance_create_layer(100,160,'Instances',refs.Obj_cano);pipe.dono=c.player;
    c.keys.add(c.vk_space);objectEvent(c,pipe,'objects/Obj_cano/Step_0.gml');
    assert.equal(c.global.inventario_cano,blocked);
    assert.equal(c.actors.filter(a=>a.kind===refs.Obj_canoAremesado).length,blocked?0:1);
  }
});
test('pause/diário impedem movimento e coleta nos eventos End Step', () => {
  const c=world();const p=c.projectile(refs.Obj_canoAremesado,100,100);
  for(const flag of ['pause_aberto','diario_aberto','cutscene_ativa','dialogo_ativo']) {
    c.global[flag]=true;objectEvent(c,p,'objects/Obj_canoAremesado/Step_2.gml');
    assert.equal(p.x,100);assert.equal(p.y,100);c.global[flag]=false;
  }
});
test('cache reutiliza textura, recupera perda e limita tentativas quando o target falha', () => {
  const c=world(),draw=source('objects/Obj_mapa/Draw_0.gml');
  const header=draw.slice(0,draw.indexOf('if (reconstruir) {\n///'));
  const tail=draw.slice(draw.lastIndexOf('if (em_cache) {\n    surface_reset_target();'),draw.indexOf('if (room == Room_Armadilha) {',draw.lastIndexOf('if (em_cache) {\n    surface_reset_target();')));
  assert(header.length>100&&tail.length>100);
  const surfaces=new Set();let allocations=0,targets=0,copies=0,fail=false;
  Object.assign(c,{superficie_cenario:-1,superficie_pronta:false,cache_tentativa:0,qualidade_cache:-1,
    camera_cenario:1,matrix_view:0,matrix_projection:1,matrix_world:2,bm_normal:0,c_white:0,
    gpu_set_blendmode:()=>{},draw_set_alpha:()=>{},draw_set_color:()=>{},
    matrix_get:()=>0,matrix_set:()=>{},matrix_build_identity:()=>0,camera_apply:()=>{},draw_clear_alpha:()=>{},
    surface_exists:n=>surfaces.has(n),surface_create:()=>{surfaces.add(++allocations);return allocations;},
    surface_set_target:()=>{targets++;return !fail;},surface_reset_target:()=>{},
    surface_free:()=>{throw Error('realocação desnecessária');},draw_surface:()=>{copies++;}});
  const frame=()=>run(c,'cache_extraido_do_Draw',header+tail);
  frame();assert.equal(allocations,1);assert.equal(copies,1);
  c.global.qualidade_visual=1;frame();assert.equal(allocations,1);assert.equal(copies,2);
  surfaces.clear();frame();assert.equal(allocations,2);assert.equal(copies,3);
  fail=true;c.global.cenario_reconstruir=true;const before=targets;
  for(let i=0;i<120;i++)frame();
  assert.equal(targets-before,1);assert.equal(allocations,2);assert.equal(copies,3);
  fail=false;frame();assert.equal(targets-before,2);assert.equal(copies,4);
});
if(!process.env.BUNKER_SKIP_COLLISION_TESTS) console.log(`\n${count} testes de colisão passaram (GML simulado; sem runtime gráfico).`);
module.exports = {world,objectEvent,sprites};
