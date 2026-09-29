/// Interface comum de diálogo, com leitura em área protegida.
draw_set_alpha(1);
draw_set_font(Font_de_fala);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
if (global.pause_aberto || global.diario_aberto || global.config_aberta || global.vitoria_ativa) exit;
if (exibir_dialogo) {
    bunker_aviso_gui(texto_atual, "ESPAÇO: COMPLETAR / AVANÇAR", texto_completo);
} else if (!global.cutscene_ativa && !global.dialogo_ativo && instance_exists(Obj_jogador)) {
    var jogador = instance_nearest(x, y, Obj_jogador);
    if (point_distance(interacao_x, interacao_y, jogador.x, jogador.y) < raio_interacao) {
        bunker_aviso_gui("", "[E] FALAR COM A SECRETARIA");
    }
}
draw_set_alpha(1);
draw_set_color(c_white);
draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
