/// Queda -> poça -> barril deitado -> reposição. Usa o último quadro real.
if (global.pause_aberto || global.config_aberta || global.cutscene_ativa
|| global.dialogo_ativo || global.diario_aberto || global.vitoria_ativa) {
    image_speed = 0;
    exit;
}
var passo = min(3, delta_time * 0.00006);
if (atingido && !acido_criado && sprite_index == Spr_barril_caindo) {
    var ultimo_quadro = max(0, sprite_get_number(Spr_barril_caindo) - 1);
    if (image_index >= ultimo_quadro) {
        bunker_barril_derramar(id);
    } else image_speed = 1;
}
if (sumindo) {
    alfa_caindo = max(0, alfa_caindo - 0.018 * passo);
    if (alfa_caindo <= 0) sumindo = false;
}
if (respawn_tempo >= 0) {
    respawn_tempo = max(0, respawn_tempo - passo);
    if (respawn_tempo <= 0) {
        if (instance_exists(acido_id)) instance_destroy(acido_id);
        atingido = false;
        mostrar_chao = false;
        sumindo = false;
        alfa_caindo = 1;
        acido_criado = false;
        acido_id = noone;
        respawn_tempo = -1;
        sprite_index = Spr_barril;
        image_index = 0;
        image_speed = 0;
        image_xscale = escala_barril;
        image_yscale = escala_barril;
    }
}
