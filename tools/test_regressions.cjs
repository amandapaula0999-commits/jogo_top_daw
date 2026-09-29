/* Testes de lógica de trechos GML compatíveis com JavaScript.
 * Executa o código dos eventos, com APIs GameMaker simuladas. NÃO compila GML,
 * não renderiza o jogo e não substitui testes no runtime VM/YYC ou Wine.
 * Requer apenas Node.js: node tools/test_regressions.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const project = JSON.parse(source('tcc.yyp').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g, (_, s) => s || ''));
const assets = project.resources.map(r => r.id.name);
const refs = Object.fromEntries(assets.map(name => [name, Symbol(name)]));

function run(ctx, file, code = source(file)) {
  // Somente os eventos testados usam este subconjunto de sintaxe.
  code = code.replace(/^\s*#(?:end)?region.*$/gm, '')
    .replace(/\bexit\s*;/g, 'return;').replace(/\bmod\b/g, '%');
  new vm.Script(`(function () {\n${code}\n}).call(this)`, {filename: file})
    .runInContext(ctx, {timeout: 1000});
}

function fixture() {
  const events = [], voices = new Map();
  let voiceId = 0;
  const c = {
    ...refs, global: {}, room: refs.Room_Corredor, room_width: 1366, room_height: 768,
    noone: Symbol('noone'), x: 70, y: 384, pause: false, keys: new Set(),
    takedown_ativo: false, takedown_alvo: null, takedown_tempo: 0,
    pause_animacao_cartao: [0, 0, 0, 0], pause_input_mouse: false,
    pause_mouse_anterior_x: -100, pause_mouse_anterior_y: -100,
    pause_pad_anterior: -1, pause_pad_eixo_x: 0, pause_pad_eixo_y: 0,
    player: {x: 70, y: 384, vida: 72, caixas_mecanicas: 3, invulneravel: false, alarm: [], furtivo: false, ruido_passos: 0},
    actors: [], walls: [], alarm: [], modo_diario: false,
    eventos: events, voices, random: () => 0, make_color_rgb: () => 0,
    array_length: a => a.length, min: Math.min, max: Math.max, floor: Math.floor,
    clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)),
    sin: Math.sin, abs: Math.abs, round: Math.round, ceil: Math.ceil, sqrt: Math.sqrt,
    delta_time: 1000000 / 60, power: Math.pow, sign: Math.sign,
    gamepad_get_device_count: () => 0, gamepad_is_connected: () => false,
    ord: ch => ch.charCodeAt(0), string: String,
    mouse_x: -100, mouse_y: -100, mouse_down: false,
    gpu_set_texfilter: () => {}, camera_create_view: () => 1,
    room_get_name: ref => ref.description,
    game_get_speed: () => 60, gamespeed_fps: 0, fps_real: 60,
    point_direction: (x1,y1,x2,y2) => (Math.atan2(y1-y2,x2-x1)*180/Math.PI+360)%360,
    angle_difference: (a,b) => ((a-b+540)%360)-180,
    lengthdir_x: (r,a) => r*Math.cos(a*Math.PI/180),
    lengthdir_y: (r,a) => -r*Math.sin(a*Math.PI/180),
    vk_f11: 122, vk_up: 38, vk_down: 40, vk_left: 37, vk_right: 39, vk_enter: 13, vk_space: 32, vk_escape: 27,
    mb_left: 1, keyboard_check_pressed: key => c.keys.has(key),
    device_mouse_x_to_gui: () => c.mouse_x, device_mouse_y_to_gui: () => c.mouse_y,
    mouse_check_button_pressed: () => c.mouse_down,
    point_in_rectangle: (x, y, x1, y1, x2, y2) => x >= x1 && x <= x2 && y >= y1 && y <= y2,
    instance_exists: ref => ref === refs.Obj_pause ? c.pause : ref === refs.Obj_jogador ? !!c.player : (c.actors.includes(ref) || c.actors.some(a=>a.kind===ref)),
    instance_number: ref => ref === refs.Obj_jogador ? (c.player ? 1 : 0) : c.actors.filter(a => a.kind === ref).length,
    instance_find: (ref,i) => ref === refs.Obj_jogador ? c.player : c.actors.filter(a => a.kind === ref)[i],
    instance_nearest: () => c.player || c.noone,
    instance_create_depth: (x,y,depth,kind) => {
      const actor={x,y,depth,kind,object_index:kind,morrendo:false,vida:30,alerta:0,estado:'PATRULHA'};
      c.actors.push(actor); if(kind===refs.Obj_parede)c.walls.push(actor); return actor;
    },
    collision_line: () => c.noone, place_meeting: () => false,
    mp_potential_step_object: (x,y,s) => { const d=Math.hypot(x-c.x,y-c.y); if(d>s){c.x+=(x-c.x)*s/d;c.y+=(y-c.y)*s/d;} },
    point_distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    room_goto: room => events.push(['goto', room]),
    room_restart: () => events.push(['restart']), instance_destroy: () => {},
    instance_activate_all: () => { c.activated = true; },
    instance_deactivate_all: keep => { c.deactivated = keep; },
    window_set_fullscreen: () => {}, window_get_width: () => 1366, window_get_height: () => 768,
    display_get_width: () => 1366, display_get_height: () => 768,
    display_get_gui_width: () => 1366, display_get_gui_height: () => 768,
    view_wview: [960], view_hview: [540], view_wport: [1366], view_hport: [768],
    view_xport: [0], view_yport: [0], view_get_camera: () => 1,
    camera_set_view_size: () => {}, camera_set_view_pos: () => {},
    view_set_wport: () => {}, view_set_hport: () => {}, view_set_xport: () => {}, view_set_yport: () => {},
    display_set_gui_size: () => {},
    audio_stop_all: () => voices.clear(), audio_pause_all: () => { c.audio_paused = true; }, audio_resume_all: () => { c.audio_paused = false; },
    audio_stop_sound: ref => {
      for (const [id, asset] of voices) if (asset === ref || id === ref) voices.delete(id);
    },
    audio_play_sound: (ref, priority, loop) => {
      voices.set(++voiceId, ref); events.push(['play', ref, loop]); return voiceId;
    },
    audio_is_playing: ref => [...voices.values()].includes(ref) || voices.has(ref),
    audio_sound_gain: () => {}, lerp: (a, b, t) => a + (b - a) * t,
    sprite_get_number: ref => ref === refs.Spr_porta_bunker_restrita ? 22 : 17,
    sprite_get_width: () => 64, sprite_get_height: () => 64,
    sprite_get_bbox_top: () => 0, sprite_get_bbox_bottom: () => 63,
  };
  c.variable_global_exists = name => Object.hasOwn(c.global, name);
  c.variable_instance_exists = (actor,key) => Object.hasOwn(actor,key);
  const ctx = vm.createContext(c);
  c.id = c;
  new vm.Script(source('scripts/Scr_bunker/Scr_bunker.gml')).runInContext(ctx);
  new vm.Script(source('scripts/Scr_colisoes/Scr_colisoes.gml')).runInContext(ctx);
  new vm.Script(source('scripts/Scr_fluxo_v5/Scr_fluxo_v5.gml').replace(/\bmod\b/g,'%')).runInContext(ctx);
  new vm.Script(source('scripts/Scr_deposito/Scr_deposito.gml').replace(/\bmod\b/g,'%')).runInContext(ctx);
  new vm.Script(source('scripts/Scr_laboratorio/Scr_laboratorio.gml')).runInContext(ctx);
  c.ini_open=()=>{};c.ini_close=()=>{};c.ini_write_string=()=>{};c.ini_write_real=()=>{};
  run(ctx, 'objects/Obj_menu/Create_0.gml');
  events.length = 0;
  return ctx;
}

let total = 0;
function test(name, fn) { if (process.env.BUNKER_SKIP_TESTS) return; fn(); total++; process.stdout.write(`OK: ${name}\n`); }
const mapCreate = c => { c.actors=[]; c.walls=[]; run(c, 'objects/Obj_mapa/Create_0.gml'); };
const doorCreate = c => run(c, 'objects/Obj_porta/Create_0.gml');
const doorStep = c => run(c, 'objects/Obj_porta/Step_0.gml');

test('sementes numéricas e manchas finitas nas oito salas (assets opacos)', () => {
  const c = fixture();
  const draw = source('objects/Obj_mapa/Draw_0.gml');
  const start = draw.indexOf('    draw_set_alpha(0.13);');
  const end = draw.indexOf('    draw_set_alpha(0.20);', start);
  assert(start >= 0 && end > start);
  const block = draw.slice(start, end);
  let stains = 0;
  c.draw_set_alpha = c.draw_set_color = () => {};
  c.draw_ellipse = (x1, y1, x2, y2) => {
    assert([x1, y1, x2, y2].every(Number.isFinite)); assert(x2 > x1 && y2 > y1); stains++;
  };
  for (const name of ['Room_Externa', 'Room_Recepcao', 'Room_Armadilha', 'Room_Desmoronada',
    'Room_Corredor', 'Room_Pesquisa', 'Room_Biblioteca', 'Room1']) {
    c.room = refs[name]; mapCreate(c); assert(Number.isInteger(c.semente_visual));
    run(c, 'manchas_extraidas_do_Draw', block);
  }
  assert.equal(stains, 8 * 14);
});

test('menu, fachada e recepção reutilizam a mesma voz musical', () => {
  const c = fixture(), initial = c.global.musica_atual;
  for (const name of ['Room_Externa', 'Room_Recepcao', 'Room_Externa', 'Room_Recepcao']) {
    c.room = refs[name]; mapCreate(c);
    assert.equal(c.global.musica_atual, initial); assert.equal(c.voices.size, 1);
  }
});

test('troca de trilha limpa cópias antigas e mantém só uma no subsolo', () => {
  const c = fixture();
  c.audio_play_sound(refs.Snd_menu_empresa, 1, true);
  c.audio_play_sound(refs.Snd_ambiente_bunker, 1, true);
  mapCreate(c); for(let i=0;i<30;i++) c.bunker_audio_atualizar(c.bunker_audio_contexto());
  assert.equal(c.voices.size, 1);
  const voice = c.global.musica_atual;
  for (const name of ['Room_Desmoronada', 'Room_Pesquisa', 'Room_Biblioteca', 'Room_Corredor']) {
    c.room = refs[name]; mapCreate(c);
    for(let i=0;i<30;i++) c.bunker_audio_atualizar(c.bunker_audio_contexto());
    assert.equal(c.global.musica_atual, voice); assert.equal(c.voices.size, 1);
  }
});

test('áudio acompanha suspeita, perseguição, perda de contato e vitória sem sobrepor loops', () => {
  const c=fixture();mapCreate(c);
  const enemy=c.actors.find(a=>a.kind===refs.Obj_caracol);
  for(const [state,alert,want] of [['PATRULHA',0,'EXPLORACAO'],['INVESTIGANDO',55,'TENSAO'],['PERSEGUINDO',100,'COMBATE'],['VOLTANDO',0,'EXPLORACAO']]) {
    Object.assign(enemy,{estado:state,alerta:alert});
    assert.equal(c.bunker_audio_contexto(),want);
    for(let i=0;i<30;i++){c.bunker_audio_atualizar(want);assert(c.voices.size<=1);}
    assert.equal(c.global.trilha_recurso_atual,c.bunker_audio_recurso(want));
  }
  c.room=refs.Room1;assert.equal(c.bunker_audio_contexto(),'EXPLORACAO');
  c.instance_create_depth(683,360,0,refs.Obj_boss);assert.equal(c.bunker_audio_contexto(),'COMBATE');
  c.global.boss_derrotado=true;assert.equal(c.bunker_audio_contexto(),'EXPLORACAO');
  c.room=refs.Room_Recepcao;enemy.estado='PERSEGUINDO';assert.equal(c.bunker_audio_contexto(),'NORMAL');
});

test('visão respeita parede, cone e redução de alcance ao andar em silêncio', () => {
  const c=fixture();
  assert(c.bunker_visivel(0,0,0,230,0,false));
  assert(!c.bunker_visivel(0,0,0,230,0,true));
  assert(!c.bunker_visivel(0,0,0,-100,0,false));
  c.collision_line=()=>refs.Obj_parede;
  assert(!c.bunker_visivel(0,0,0,10,0,false));
});

test('perseguição começa por visão; inimigo busca última posição depois de perder contato', () => {
  const c=fixture(); c.x=400;c.y=300;run(c,'objects/Obj_caracol/Create_0.gml');
  c.player.x=350;c.player.y=300;c.player.ruido_passos=82;
  for(let i=0;i<40;i++)run(c,'objects/Obj_caracol/Step_0.gml');
  assert.equal(c.estado,'PERSEGUINDO');
  const last=[c.alvo_x,c.alvo_y];
  c.collision_line=()=>refs.Obj_parede;c.player.x=1000;c.player.y=100;
  for(let i=0;i<110;i++)run(c,'objects/Obj_caracol/Step_0.gml');
  assert.equal(c.estado,'INVESTIGANDO');assert.deepEqual([c.alvo_x,c.alvo_y],last);
});

test('munição total nove; nenhuma coleta duplica ao reentrar ou reiniciar', () => {
  const c=fixture();assert.equal(c.global.municao_pistola,4);
  assert(c.bunker_coletar_municao('pregos_demolida',2));
  assert(!c.bunker_coletar_municao('pregos_demolida',2));
  assert(c.bunker_coletar_municao('pregos_pesquisa',3));
  assert.equal(c.global.municao_reserva+c.global.municao_pistola,9);
  c.room=refs.Room_Desmoronada;mapCreate(c);
  assert.equal(c.actors.filter(a=>a.kind===refs.Obj_caixaPregos).length,0);
  c.room=refs.Room_Pesquisa;mapCreate(c);
  assert.equal(c.actors.filter(a=>a.kind===refs.Obj_caixaPregos).length,0);
});

test('sete evidências distintas, persistência entre salas e novo jogo limpa o diário', () => {
  const c=fixture();
  for(const name of ['Room_Externa','Room_Recepcao','Room_Desmoronada','Room_Corredor','Room_Pesquisa','Room_Biblioteca','Room1']) {
    c.room=refs[name];mapCreate(c);const reg=c.indicio_registro[0];
    assert(reg.avaliacao.length>60 && reg.vinculo.length>60);
    assert(c.bunker_registrar(reg));assert(!c.bunker_registrar(reg));
  }
  assert.equal(c.global.evidencias.length,7);
  run(c,'objects/Obj_menu/Create_0.gml');assert.equal(c.global.evidencias.length,0);
});

test('golpe do Boss: aviso de 65 passos; dano e barril uma única vez no raio', () => {
  const c=fixture(); c.room=refs.Room1;c.x=600;c.y=300;
  c.player.x=650;c.player.y=335;c.player.vida=100;
  const near={kind:refs.Obj_barril,x:700,y:335,atingido:false};
  const far={kind:refs.Obj_barril,x:790,y:335,atingido:false};c.actors=[near,far];
  run(c,'objects/Obj_boss/Create_0.gml');c.ataque_intervalo=0;
  for(let i=0;i<65;i++)run(c,'objects/Obj_boss/Step_0.gml');
  assert.equal(c.player.vida,100);assert(!near.atingido);
  run(c,'objects/Obj_boss/Step_0.gml');assert.equal(c.player.vida,76);assert(near.atingido);assert(!far.atingido);
  c.player.invulneravel=false;
  for(let i=0;i<40;i++)run(c,'objects/Obj_boss/Step_0.gml');
  assert.equal(c.player.vida,76);assert(!c.ataque_ativo);
  assert.equal(c.eventos.filter(e=>e[0]==='play'&&e[1]===refs.Snd_impacto_boss).length,1);
});

test('onda respeita cobertura e invulnerabilidade; ácido cancela a preparação do Boss', () => {
  const c=fixture();c.player.vida=100;c.collision_line=()=>refs.Obj_parede;
  const barrel={kind:refs.Obj_barril,x:50,y:384,atingido:false};c.actors=[barrel];
  c.bunker_impacto(70,384,160);assert.equal(c.player.vida,100);assert(!barrel.atingido);
  c.collision_line=()=>c.noone;c.player.invulneravel=true;c.bunker_impacto(70,384,160);assert.equal(c.player.vida,100);
  c.room=refs.Room1;run(c,'objects/Obj_boss/Create_0.gml');c.ataque_ativo=true;c.ataque_tempo=50;
  c.place_meeting=()=>true;run(c,'objects/Obj_boss/Step_0.gml');assert(c.derrotado);assert(!c.ataque_ativo);
});

test('explosão interrompe ambas as trilhas antes do efeito', () => {
  const c = fixture(); c.room = refs.Room_Armadilha; mapCreate(c);
  for (let i = 0; i < 48; i++) run(c, 'objects/Obj_mapa/Step_0.gml');
  assert.equal(c.global.trilha_recurso_atual, -1);
  assert(!c.audio_is_playing(refs.Snd_menu_empresa));
  assert(!c.audio_is_playing(refs.Snd_ambiente_bunker));
  assert(c.audio_is_playing(refs.Snd_explosao));
});

for (const restricted of [false, true]) {
  test(`porta ${restricted ? 'vermelha' : 'branca'}: som único, último quadro visível e inventário salvo`, () => {
    const c = fixture(); doorCreate(c);
    c.destino = restricted ? refs.Room1 : refs.Room_Pesquisa;
    c.global.inventario_pistola = true; c.global.municao_pistola = 7;
    c.keys.add(69); doorStep(c); assert(c.abrindo && c.global.cutscene_ativa);
    let finalDraws = 0;
    for (let i = 0; i < 120; i++) {
      doorStep(c);
      if (c.eventos.some(e => e[0] === 'goto')) break;
      if (c.quadro_porta === (restricted ? 21 : 16)) finalDraws++;
    }
    assert(finalDraws >= 5);
    assert.equal(c.eventos.filter(e => e[0] === 'goto').length, 1);
    assert.equal(c.eventos.filter(e => e[0] === 'play').length, 1);
    assert.equal(c.global.spawn_room, c.destino);
    assert.equal(c.global.vida_jogador, 72); assert.equal(c.global.municao_pistola, 7);
    c.room = c.destino; mapCreate(c); assert(!c.global.cutscene_ativa);
    assert(c.global.inventario_pistola);
  });
}

test('pause congela a abertura e diálogo impede ativação da porta', () => {
  const c = fixture(); doorCreate(c); c.keys.add(69);
  c.global.dialogo_ativo = true; doorStep(c); assert(!c.abrindo);
  c.global.dialogo_ativo = false; doorStep(c); assert(c.abrindo);
  c.global.pause_aberto = true;
  for (let i = 0; i < 120; i++) doorStep(c);
  assert.equal(c.quadro_porta, 0); assert(!c.eventos.some(e => e[0] === 'goto'));
});

test('Recomeçar no pause remove bloqueio e spawn pendentes da porta', () => {
  const c = fixture(); doorCreate(c); c.keys.add(69); doorStep(c);
  Object.assign(c, {bloqueio_input: 0, quadro_formiga: 0, selecionado: 1,
    quantidade_opcoes: 3, puxado: [0, 1, 0]});
  c.keys.clear(); c.keys.add(13);
  run(c, 'objects/Obj_pause/Step_0.gml');
  assert(c.eventos.some(e => e[0] === 'restart'));
  assert(!c.global.cutscene_ativa && !c.global.dialogo_ativo);
  assert.equal(c.global.spawn_room, -1);
});

test('dano de contato bloqueado durante a abertura', () => {
  const c = fixture(); c.global.cutscene_ativa = true; c.vida = 100;
  for (const enemy of ['boss', 'caracol']) {
    run(c, `objects/Obj_jogador/Collision_Obj_${enemy}.gml`);
    assert.equal(c.vida, 100);
  }
});

test('chefe e inimigo comum param durante a cutscene da porta', () => {
  const c = fixture(); c.global.cutscene_ativa = true; c.speed = 3; c.image_speed = 1;
  run(c, 'objects/Obj_boss/Step_0.gml'); assert.equal(c.speed, 0);
  const enemyFile = 'objects/Obj_caracol/Step_0.gml';
  const guard = source(enemyFile).split('if (feedback_tempo')[0];
  run(c, enemyFile, guard + '\nthrow new Error("bloqueio não interrompeu o evento");');
  assert.equal(c.image_speed, 0);
});

test('iluminação da sala demolida é estável no Windows e sem banho verde', () => {
  const luz = source('objects/Obj_mapa/Draw_73.gml');
  const mapa = source('objects/Obj_mapa/Draw_0.gml');
  assert(!luz.includes('draw_primitive_begin'));
  assert(luz.includes('draw_rectangle(0, 0, room_width, room_height, false)'));
  const inicio = mapa.indexOf('else if (room == Room_Armadilha)');
  const fim = mapa.indexOf('else if (room == Room_Desmoronada)', inicio);
  const armadilha = mapa.slice(inicio, fim);
  assert(!armadilha.includes('make_color_rgb(73, 224, 121)'));
  assert(!armadilha.includes('draw_set_alpha(0.07)'));
});

test('pause possui Draw GUI; ESC pausa e P fica reservado ao ciclo de debug', () => {
  const yy = source('objects/Obj_pause/Obj_pause.yy');
  assert(yy.includes('"eventNum":64,"eventType":8'));
  const jogador = source('objects/Obj_jogador/Step_0.gml');
  const pause = source('objects/Obj_pause/Step_0.gml');
  const desenho = source('objects/Obj_pause/Draw_64.gml');
  assert(jogador.includes('keyboard_check_pressed(ord("P"))'));
  assert(jogador.includes('v5_debug_avancar_room();'));
  assert(pause.includes('keyboard_check_pressed(vk_escape)'));
  assert(!pause.includes('keyboard_check_pressed(ord("P"))'));
  assert(desenho.includes('"PAUSADO"'));
  assert(desenho.includes('RECOMEÇAR'));
});

test('HUD de arma só aparece depois da coleta', () => {
  const hud = source('objects/Obj_jogador/Draw_64.gml');
  const bloco = hud.slice(hud.indexOf('if (tem_equipamento)'));
  assert(hud.includes('var tem_equipamento = global.inventario_pistola || global.inventario_cano;'));
  assert(hud.includes('tem_equipamento ? 143 : 72'));
  assert(bloco.includes('PENTE '));
  assert(bloco.includes('if (global.inventario_pistola)'));
  assert(!hud.slice(0, hud.indexOf('if (tem_equipamento)')).includes('PENTE '));
});

test('viewport 4:3 e qualidade adaptativa evitam estiramento e picos de desenho', () => {
  const config = source('scripts/Scr_bunker/Scr_bunker.gml');
  const mapa = source('objects/Obj_mapa/Draw_0.gml');
  const visual = source('scripts/Scr_visual_bunker/Scr_visual_bunker.gml');
  assert(config.includes('camera_set_view_size'));
  assert(config.includes('view_get_camera(0)'));
  assert(!config.includes('view_wview[0] = vista_w'));
  assert(!config.includes('view_hview[0] = vista_h'));
  assert(config.includes('global.qualidade_visual == 1'));
  assert(config.includes('fps_real'));
  assert(mapa.includes('qualidade_atual'));
  assert(visual.includes('qualidade_visual'));
});

test('zoom da finalização acompanha a dupla e configurações separam os volumes', () => {
  const script = source('scripts/Scr_bunker/Scr_bunker.gml');
  const mapa = source('objects/Obj_mapa/Step_0.gml');
  const jogador = source('objects/Obj_jogador/Step_0.gml');
  const gui = source('objects/Obj_jogador/Draw_64.gml');
  const menu = source('objects/Obj_menu/Step_0.gml');
  const menuDraw = source('objects/Obj_menu/Draw_64.gml');
  const cano = source('objects/Obj_cano/Step_0.gml');
  assert(script.includes('function bunker_camera_atualizar()'));
  assert(script.includes('jogador_camera.takedown_alvo.x') && script.includes('camera_set_view_pos'));
  assert(mapa.includes('bunker_camera_atualizar()'));
  assert(jogador.includes('global.config_aberta') && jogador.includes('mod 4'));
  assert(gui.includes('bunker_configuracoes_desenhar'));
  assert(menu.includes('quantidade_opcoes') && menu.includes('global.config_aberta'));
  assert(menuDraw.includes('bunker_configuracoes_desenhar'));
  assert(script.includes('audio_musica_mudo') && script.includes('audio_efeitos_mudo'));
  assert(script.includes('function bunker_audio_tocar_efeito'));
  assert(cano.includes('Snd_finalizacao'));
  assert(project.resources.some(r => r.id.name === 'Snd_finalizacao'));
});

test('menu usa camadas separadas e geometria comum para os quatro cartões', () => {
  const draw = source('objects/Obj_menu/Draw_64.gml');
  const create = source('objects/Obj_menu/Create_0.gml');
  assert(draw.includes('Spr_menu_fundo') && draw.includes('Spr_menu_bolsos'));
  assert(draw.includes('Spr_menu_cartoes') && draw.includes('Spr_menu_sair'));
  assert(create.includes('cartao_y = [311, 363, 428, 366]'));
  assert(draw.includes('cartao_limite[i]') && draw.includes('hover_altura * animacao_cartao[i]'));
  assert(draw.includes('saida_coberta_desenhada = p_saida >= 1'));
  assert(draw.includes('foco_x = lerp(1095, 430, e)'));
});

test('configurações abre; sair inicia transição sem fechar imediatamente', () => {
  const c = fixture(), menu = 'objects/Obj_menu/Step_0.gml';
  c.bloqueio_input=0;c.game_end=()=>c.eventos.push(['end']);
  for(let i=0;i<2;i++){c.keys.clear();c.keys.add(c.vk_down);run(c,menu);}
  assert.equal(c.selecionado,2);
  c.keys.clear();c.keys.add(c.vk_enter);run(c,menu);
  assert(c.global.config_aberta);assert.equal(c.global.config_origem,'menu');
  c.keys.clear();c.keys.add(c.vk_escape);run(c,menu);
  assert(!c.global.config_aberta);
  c.keys.clear();for(let i=0;i<6;i++)run(c,menu);
  c.keys.add(c.vk_left);run(c,menu);assert.equal(c.selecionado,3);
  c.keys.clear();c.keys.add(c.vk_right);run(c,menu);assert.equal(c.selecionado,0);
  c.keys.clear();c.keys.add(c.vk_up);run(c,menu);assert.equal(c.selecionado,2);
  c.keys.clear();c.mouse_x=1000;c.mouse_y=465;c.mouse_down=true;run(c,menu);
  assert(c.global.config_aberta);
  c.keys.add(c.vk_escape);c.mouse_down=false;run(c,menu);
  c.keys.clear();for(let i=0;i<6;i++)run(c,menu);
  c.mouse_x=720;c.mouse_y=400;c.mouse_down=true;run(c,menu);
  assert(c.saindo_jogo);assert(!c.eventos.some(e=>e[0]==='end'));
});

test('arte v44 preserva carteira; v423 usa uma pose idle fornecida por direção', () => {
  const build = source('tools/build_art_v44.py');
  assert(build.includes('menu_diegetico_v44.png'));
  assert(build.includes('protagonista_idle_v43_generated.png'));
  assert(build.includes('draw_slot_backings') && build.includes('draw_slot_lip'));
  assert(build.includes('restore_wallet_surface'));
  assert(!build.includes('leather_panel(base'));
  const menuYY = JSON.parse(source('sprites/Spr_menu_bg/Spr_menu_bg.yy'));
  assert.equal(menuYY.frames.length, 4);
  assert.equal(menuYY.sequence.length, 4);
  for (const direction of ['baixo', 'cima', 'direita', 'esquerda']) {
    const files = require('fs').readdirSync(root + `/sprites/Spr_jogador_idle_${direction}`)
      .filter(name => name.endsWith('.png'));
    assert.equal(files.length, 1);
  }
  for (const frame of menuYY.frames) {
    assert(require('fs').statSync(root + `/sprites/Spr_menu_bg/${frame.name}.png`).size > 100000);
  }
  // A versão LIMPO conserva os PNG registrados acima; fontes de arte históricas são opcionais.
  const archived = root + '/art_sources/menu_diegetico_v44.png';
  if (fs.existsSync(archived)) assert(fs.statSync(archived).size > 100000);
});

test('arma e interface não expõem artefatos de debug', () => {
  const gui = source('objects/Obj_mapa/Draw_64.gml');
  const hitbox = source('objects/Obj_hitbox/Obj_hitbox.yy');
  const hitboxDraw = source('objects/Obj_hitbox/Draw_0.gml');
  const gunYY=JSON.parse(source('sprites/Spr_arma_pregos/Spr_arma_pregos.yy'));
  const arma = require('fs').readFileSync(root + '/sprites/Spr_arma_pregos/'+gunYY.frames[0].name+'.png');
  assert(!gui.includes('draw_rectangle(0, 0, gw, 34, false)'));
  assert(!gui.includes('draw_rectangle(gw - 42, 0, gw, gh, false)'));
  assert.equal(JSON.parse(hitbox).visible, false);
  assert(hitboxDraw.includes('Máscara invisível'));
  assert(arma.length > 0);
});

test('armas ficam proporcionais e diário nasce como caderneta', () => {
  const cano = source('objects/Obj_cano/Create_0.gml');
  const pregos = source('objects/Obj_armaPregos/Create_0.gml');
  const pause = source('objects/Obj_pause/Create_0.gml');
  const diario = source('objects/Obj_pause/Draw_64.gml');
  assert(cano.includes('escala_visual = 0.55'));
  assert(pregos.includes('escala_visual = bunker_escala_protagonista()'));
  assert(pause.includes('global.diario_aberto'));
  assert(diario.includes('CADERNETA DE VISTORIA'));
  assert(diario.includes('A/D OU SETAS: FOLHAS'));
});

test('pause e diário novos pertencem ao jogador e não criam instância temporária', () => {
  const step = source('objects/Obj_jogador/Step_0.gml');
  const draw = source('objects/Obj_jogador/Draw_64.gml');
  assert(step.includes('if (global.diario_aberto)'));
  assert(step.includes('if (global.pause_aberto)'));
  assert(step.includes('instance_deactivate_all(true)'));
  assert(step.includes('audio_pause_all()'));
  assert(step.includes('instance_activate_all()'));
  assert(step.includes('v5_reiniciar_checkpoint()'));
  assert(step.includes('room_goto(Room_Menu)'));
  assert(!step.includes('instance_create_depth(0, 0, -100000, Obj_pause)'));
  assert(draw.includes('CADERNETA DE VISTORIA'));
  assert(draw.includes('Spr_pause_fundo'));
  assert(draw.includes('Spr_pause_cartoes'));
  assert(draw.includes('global.pause_selecionado'));
});

test('pause v4.21 reutiliza a carteira oficial, separa os lados e anima os quatro cartões', () => {
  const create = source('objects/Obj_jogador/Create_0.gml');
  const step = source('objects/Obj_jogador/Step_0.gml');
  const draw = source('objects/Obj_jogador/Draw_64.gml');
  assert(assets.includes('Spr_pause_cartoes'));
  assert(create.includes('pause_animacao_cartao = [0, 0, 0, 0]'));
  assert(step.includes('var pause_cartoes = bunker_pause_cartoes()'));
  assert(draw.includes('var pause_cartoes = bunker_pause_cartoes()'));
  assert(step.includes('pause_animacao_cartao[pause_anim_i] = lerp'));
  assert(step.includes('gp_axislh') && step.includes('gp_face1'));
  assert(draw.includes('Spr_pause_fundo') && draw.includes('pause_cartao_limite[pause_b]'));
  assert(draw.includes('Spr_pause_cartoes') && draw.includes('Spr_menu_sair'));
  assert(draw.indexOf('draw_sprite_ext(Spr_pause_fundo') < draw.indexOf('for (var pause_b'));
});

test('fluxo do jogador abre, fecha e confirma os dois menus', () => {
  const c = fixture();
  const jogador = 'objects/Obj_jogador/Step_0.gml';
  const controlador = source(jogador).slice(0, source(jogador).indexOf('var bloqueado'));
  c.keys.add(c.ord('J')); run(c, jogador, controlador);
  assert(c.global.diario_aberto && c.deactivated === true && c.audio_paused);
  c.keys.clear(); c.keys.add(c.ord('J')); run(c, jogador, controlador);
  assert(!c.global.diario_aberto && c.activated && !c.audio_paused);

  c.keys.clear(); c.keys.add(c.vk_escape); run(c, jogador, controlador);
  assert(c.global.pause_aberto && c.deactivated === true && c.audio_paused);
  c.keys.clear(); c.keys.add(c.vk_escape); run(c, jogador, controlador);
  assert(!c.global.pause_aberto && c.activated && !c.audio_paused);

  c.keys.clear(); c.keys.add(c.vk_escape); run(c, jogador, controlador);
  c.keys.clear(); c.keys.add(c.vk_down); run(c, jogador, controlador);
  c.keys.clear(); c.keys.add(c.vk_enter); run(c, jogador, controlador);
  assert(c.eventos.some(e => e[0] === 'restart'));
  assert(!c.global.pause_aberto);
});

test('arma acompanha a mão, idle respira e o inimigo aceita finalização furtiva', () => {
  const arma = source('objects/Obj_armaPregos/Step_0.gml');
  const cano = source('objects/Obj_cano/Step_0.gml');
  const jogador = source('objects/Obj_jogador/Step_0.gml');
  const create = source('objects/Obj_jogador/Create_0.gml');
  const draw = source('objects/Obj_jogador/Draw_0.gml');
  const inimigo = source('objects/Obj_caracol/Step_0.gml');
  assert(arma.includes('bunker_pose_bracos(id, _direcao_mouse, false)') && arma.includes('depth = dono.depth - 100'));
  assert(cano.includes('bunker_pose_bracos(id, _direcao_mouse, true)') && cano.includes('depth = dono.depth - 100'));
  assert(jogador.includes('idle_tempo +=') && jogador.includes('image_index = 0'));
  assert(jogador.includes('sprite_index = Spr_jogador_idle_baixo'));
  assert(create.includes('place_meeting(x, y, Obj_parede)') && create.includes('spawn_liberado'));
  assert(draw.includes('Spr_jogador_idle_baixo') && draw.includes('draw_sprite_ext(sprite_desenho') && draw.includes('arma_mao.sprite_index'));
  assert(draw.includes('sprite_get_number(sprite_desenho)'));
  assert(cano.includes('dono.furtivo') && cano.includes('TAKEDOWN') && cano.includes('takedown_pronto'));
  assert(jogador.includes('takedown_alvo.takedown_ativo = false') && jogador.includes('else if (!instance_exists(takedown_alvo))'));
  assert(inimigo.includes('takedown_ativo'));
});

test('patrulha usa destinos diagonais e salas subterrâneas têm coberturas e ameaças extras', () => {
  const inimigo = source('objects/Obj_caracol/Step_0.gml');
  const inimigo_create = source('objects/Obj_caracol/Create_0.gml');
  const mapa = source('objects/Obj_mapa/Create_0.gml');
  assert(inimigo.includes('patrulha_alvo_x') && inimigo.includes('patrulha_direcoes'));
  assert(inimigo.includes('mp_potential_step_object(patrulha_alvo_x'));
  assert(inimigo_create.includes('place_meeting(x, y, Obj_parede)') && inimigo_create.includes('inimigo_liberado'));
  assert(inimigo_create.includes('spawn_verificacao = 8') && inimigo.includes('spawn_verificacao > 0') && inimigo.includes('spawn_liberado_step'));
  assert((mapa.match(/instance_create_depth\([^\n]+Obj_caracol/g) || []).length >= 9);
  assert(mapa.includes('criar_parede(620,380,74,66,2)'));
});

test('derrota do Boss libera progressão; escadaria bidirecional conecta Nível 1 e Nível 2', () => {
  const boss = source('objects/Obj_boss/Step_0.gml');
  const create = source('objects/Obj_boss/Create_0.gml');
  const mapa = source('objects/Obj_mapa/Create_0.gml');
  const fluxo = source('scripts/Scr_fluxo_v5/Scr_fluxo_v5.gml');
  assert(create.includes('fugindo = false'));
  assert(!boss.includes('bunker_vitoria_iniciar('));
  assert(boss.includes('v54_boss_concluir()'));
  assert(boss.includes('instance_destroy(global.parede_saida)'));
  assert(fluxo.includes('global.parede_saida=instance_create_depth'));
  assert(mapa.includes('Room_Corredor_N2,1030,186,"ESCADARIA / DESCER AO NÍVEL 2"'));
  assert(mapa.includes('Room_Corredor_Pos,1120,384,"ESCADARIA / SUBIR AO NÍVEL 1"'));
  assert(fluxo.includes('global.v5_checkpoint_transicao_pendente=true'));
  assert(source('objects/Obj_jogador/Create_0.gml').includes('v5_checkpoint_transicao_pendente'));
});

if (!process.env.BUNKER_SKIP_TESTS) process.stdout.write(`\n${total} testes de lógica passaram. Runtime GameMaker/Wine ainda deve ser validado.\n`);
module.exports = {fixture, run, source, refs, root};
