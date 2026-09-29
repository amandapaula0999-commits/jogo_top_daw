/// Barra principal do chefe na interface
if (visible && !global.vitoria_ativa) {
    var gw = display_get_gui_width();
    var barra_w = 560;
    var barra_x = (gw - barra_w) * 0.5;
    var barra_y = 34;
    var proporcao = clamp(vida / vida_max, 0, 1);

    draw_set_alpha(0.9);
    draw_set_color(make_color_rgb(12, 10, 9));
    draw_rectangle(barra_x - 8, barra_y - 8, barra_x + barra_w + 8, barra_y + 44, false);
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(77, 20, 18));
    draw_rectangle(barra_x, barra_y + 19, barra_x + barra_w, barra_y + 34, false);
    draw_set_color(make_color_rgb(194, 49, 40));
    draw_rectangle(barra_x, barra_y + 19, barra_x + barra_w * proporcao, barra_y + 34, false);

    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(239, 211, 153));
    draw_text_transformed(gw * 0.5, barra_y + 5, fugindo ? "HOMEM-FORMIGA EM FUGA" : (morto ? "HOMEM-FORMIGA DERROTADO" : "HOMEM-FORMIGA"), 1.8, 1.8, 0);

    if (!morto && !fugindo) {
        draw_set_color(derrotado ? make_color_rgb(144, 235, 121) : make_color_rgb(218, 180, 94));
        var dica = "DERRUBE UM BARRIL E ATRAIA-O PARA O ÁCIDO";
        if (ataque_ativo && ataque_tempo < 66) dica = "SAIA DO CÍRCULO - GOLPE A CAMINHO";
        if (derrotado) dica = "VULNERÁVEL - ATAQUE AGORA (" + string(ceil(vulneravel_tempo/60)) + "s)";
        draw_text_transformed(gw * 0.5, barra_y + 53, dica, 1.25, 1.25, 0);
    }

    draw_set_halign(fa_left);
    draw_set_font(-1);
    draw_set_color(c_white);
}
