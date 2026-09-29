/// Visual ampliado e aviso do respawn
if (alfa_caindo > 0) {
    draw_sprite_ext(sprite_index, image_index, x, y, escala_barril, escala_barril, image_angle, image_blend, alfa_caindo);
}
if (mostrar_chao) {
    draw_sprite_ext(Spr_barril_chao, 0, x, y, escala_barril, escala_barril, 0, c_white, 1);
}

if (respawn_tempo > 0 && respawn_tempo <= 120) {
    var pisca = 0.25 + 0.25 * sin(respawn_tempo * 0.25);
    draw_set_alpha(pisca);
    draw_set_color(make_color_rgb(215, 179, 73));
    draw_circle(x, y, 38, true);
    draw_set_alpha(1);
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(231, 208, 139));
    draw_text(x, y - 52, "BARRIL EM " + string(ceil(respawn_tempo / 60)) + "s");
    draw_set_halign(fa_left);
    draw_set_font(-1);
}
draw_set_alpha(1);
draw_set_color(c_white);
