if(global.pause_aberto || global.diario_aberto || global.cutscene_ativa || global.dialogo_ativo) exit;
var jogador=instance_nearest(x,y,Obj_jogador);
if(jogador!=noone && point_distance(x,y,jogador.x,jogador.y)<=42 && keyboard_check_pressed(ord("E"))) {
    global.v53_chave_escada=true;
    bunker_audio_tocar_efeito(Snd_item,10,false);
    v54_boss_iniciar();
    instance_destroy();
}
