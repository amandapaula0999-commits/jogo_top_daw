if (global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto || global.pause_aberto) exit;
if (em_voo) {
    bunker_projetil_passo(id);
    exit;
}
// Coleta por distância e linha livre, sem depender da máscara que girava.
if (keyboard_check_pressed(ord("E")) && !global.inventario_cano && instance_exists(Obj_jogador)) {
    var jogador_coleta = instance_find(Obj_jogador, 0);
    if (point_distance(x, y, jogador_coleta.x, jogador_coleta.y) <= 42
    && bunker_varrer_paredes(jogador_coleta.x, jogador_coleta.y, x, y, 0).t > 1) {
        var cano_coletado = instance_create_layer(jogador_coleta.x, jogador_coleta.y, "Instances", Obj_cano);
        cano_coletado.dono = jogador_coleta;
        global.inventario_cano = true;
        global.equipamento_ativo = "cano";
        bunker_audio_tocar_efeito(Snd_item, 10, false);
        instance_destroy();
    }
}
