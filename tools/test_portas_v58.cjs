/* Validação da build de testes v5.8: portas de progressão liberadas.
 * Usa o harness JS do projeto; não substitui o runtime GameMaker.
 */
process.env.BUNKER_SKIP_TESTS = '1';
const assert = require('node:assert/strict');
const {fixture, run, refs} = require('./test_regressions.cjs');

const c = fixture();
assert.equal(c.global.modo_teste_portas_livres, true, 'modo de teste não está ativo');

// Chaves e Boss permanecem falsos: a função central ainda deve liberar tudo.
const fakeDoor = {chave_exigida:'cientista'};
c.global.v53_chave_cientista = false;
c.global.v53_chave_escada = false;
c.global.boss_derrotado = false;
assert.equal(c.v53_porta_liberada(fakeDoor), true);
fakeDoor.chave_exigida = 'escadaria';
assert.equal(c.v53_porta_liberada(fakeDoor), true);

// Porta da recepção: requer orientação no mapa normal, mas a build de teste ignora isso.
c.room = refs.Room_Recepcao;
c.actors = []; c.walls = [];
run(c, 'objects/Obj_mapa/Create_0.gml');
const receptionDoor = c.actors.find(a => a.kind === refs.Obj_porta && a.requer_orientacao);
assert(receptionDoor, 'porta verde da recepção não encontrada');
Object.assign(c, receptionDoor);
run(c, 'objects/Obj_porta/Create_0.gml');
// restaura propriedades definidas pelo mapa após Create padrão do objeto
Object.assign(c, receptionDoor, {mensagem_tempo:0, pulso_luz:0, abrindo:false, visual_bunker:false, ativa:true});
c.player.x=c.x; c.player.y=c.y; c.keys.add(c.ord('E'));
c.global.secretaria_orientou=false;
run(c, 'objects/Obj_porta/Step_0.gml');
assert.equal(c.global.spawn_room, receptionDoor.destino, 'porta da recepção ainda bloqueou por orientação');

// Arena: iniciar o Boss não deve desativar a porta nesta build.
c.room = refs.Room1;
c.actors=[]; c.walls=[];
run(c, 'objects/Obj_mapa/Create_0.gml');
assert(c.global.v54_porta, 'porta da arena não foi criada');
c.global.v53_chave_escada=true;
c.global.boss_derrotado=false;
// Obj_mapa pode já ter iniciado a cena; força condição comparável.
c.global.v54_porta.ativa=true;
c.global.v54_boss=c.noone;
c.actors=c.actors.filter(a=>a.kind!==refs.Obj_boss);
c.global.v54_cena=0;
c.v54_boss_iniciar();
assert.equal(c.global.v54_porta.ativa, true, 'porta da arena foi desativada no modo de teste');

console.log('OK: v5.8 TESTE — portas de progressão liberadas sem remover chaves/objetivos.');
