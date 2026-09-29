/// O sprite e a escala originais do Boss são preservados.
gpu_set_blendmode(bm_normal);
draw_set_alpha(1);
if (ataque_ativo && !morto && !derrotado && ataque_tempo < 66) {
    draw_set_alpha(0.10);
    draw_set_color(make_color_rgb(173, 131, 67));
    draw_circle(impacto_x, impacto_y, impacto_raio, false);
    draw_set_alpha(0.70);
    draw_circle(impacto_x, impacto_y, impacto_raio, true);
    for (var a = 0; a < 360; a += 30) {
        draw_line(impacto_x + lengthdir_x(impacto_raio - 9, a), impacto_y + lengthdir_y(impacto_raio - 9, a),
            impacto_x + lengthdir_x(impacto_raio, a), impacto_y + lengthdir_y(impacto_raio, a));
    }
}
if (onda_tempo > 0) {
    draw_set_alpha(onda_tempo / 32);
    draw_set_color(make_color_rgb(173, 157, 120));
    var r = impacto_raio * (1 - onda_tempo / 22);
    draw_circle(impacto_x, impacto_y, r, true);
    draw_circle(impacto_x, impacto_y, max(1, r - 5), true);
}
draw_set_alpha(1);
if (fugindo) {
    draw_set_alpha(0.42);
    draw_set_color(make_color_rgb(118, 199, 104));
    draw_circle(x - 18, y - 10, 12, false);
    draw_circle(x + 21, y + 8, 9, false);
    draw_set_alpha(0.68);
    draw_set_color(make_color_rgb(174, 226, 117));
    draw_circle(x + sin(fuga_tempo * 0.17) * 18, y - 30, 5, false);
    draw_set_alpha(1);
}
var cor_sprite = tomou_dano ? make_color_rgb(206, 122, 98) : c_white;
if (fugindo) cor_sprite = make_color_rgb(143, 190, 114);
if (ataque_ativo && !derrotado && !morto) {
    bunker_boss_ataque(x, y, image_xscale, ataque_tempo, cor_sprite);
} else {
    // Compensa a origem 0,0 do sprite caído sem alterar o arquivo original.
    var ox = (sprite_get_xoffset(sprite_index) - 16) * image_xscale;
    var oy = (sprite_get_yoffset(sprite_index) - 20) * image_yscale;
    draw_sprite_ext(sprite_index, image_index, x + ox, y + oy, image_xscale, image_yscale, 0, cor_sprite, image_alpha);
}
if (feedback_tempo > 0) {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(220, 188, 112));
    draw_text(x, y - 76, feedback_texto);
}
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_font(-1);
draw_set_alpha(1);
draw_set_color(c_white);
