process.env.BUNKER_SKIP_TESTS='1';process.env.BUNKER_SKIP_COLLISION_TESTS='1';
const {world}=require('./test_collisions.cjs');const {run,refs}=require('./test_regressions.cjs');const assert=require('node:assert/strict');
const c=world();c.room=refs.Room1;c.room_width=1366;c.room_height=768;c.actors=[];c.walls=[];run(c,'objects/Obj_mapa/Create_0.gml');
c.player.x=130;c.player.y=230;c.v54_boss_iniciar();const b=c.global.v54_boss;
let pos=null;c.view_get_camera=()=>0;c.camera_set_view_size=()=>{};c.camera_set_view_pos=(id,x,y)=>pos=[x,y];
c.global.tela_camera_w=640;c.global.tela_camera_h=360;
for(let t=1;t<=264;t++){
 c.v54_atualizar();
 if(t===40){assert.equal(c.global.camera_foco_x,683);assert.equal(c.global.camera_foco_y,360);c.bunker_camera_cinematica();assert(pos);assert.equal(pos[0],483);}
 if(t===106){assert.equal(b.ataque_tempo,66);assert.equal(c.global.camera_foco_y,360);}
 if(t===145)assert.equal(c.global.camera_foco_y,360);
 if(t===182){assert.equal(c.global.camera_foco_y,640);assert(!c.instance_exists(c.global.parede_saida));}
 if(t===192){assert(c.instance_exists(c.global.parede_saida));assert(!c.global.v54_porta.ativa);assert(c.global.cutscene_ativa);}
 if(t===210){c.global.pause_aberto=true;c.v54_atualizar();assert.equal(c.global.v54_tempo,210);c.global.pause_aberto=false;}
}
assert(!c.global.cutscene_ativa);assert.equal(c.global.camera_zoom,1);assert.equal(c.global.camera_foco_x,c.player.x);assert.equal(c.global.camera_foco_y,c.player.y);assert(!b.ataque_ativo);
assert.equal(c.bunker_escala_inimigo(),0.45);
console.log('OK: foco real da camera sem vitoria, golpe completo, bloqueio, pausa, retorno e escala. APIs simuladas.');
