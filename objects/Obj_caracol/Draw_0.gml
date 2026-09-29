gpu_set_texfilter(false);
gpu_set_blendmode(bm_normal);
draw_set_alpha(0.22 * image_alpha);
draw_set_color(make_color_rgb(7, 12, 11));
draw_ellipse(x - 17, y - 7, x + 17, y + 6, false);
draw_set_alpha(1);
// Tintura local; não altera o fog global da GPU.
draw_sprite_ext(sprite_index, image_index, x, y, image_xscale, image_yscale, 0,
    tomou_dano ? make_color_rgb(205, 128, 99) : c_white, image_alpha);
if (!morrendo && alerta > 5) {
    draw_set_color(make_color_rgb(20, 24, 22));
    draw_rectangle(x - 16, y - 66, x + 16, y - 62, false);
    draw_set_color(estado == "PERSEGUINDO" ? make_color_rgb(184, 83, 53) : make_color_rgb(193, 160, 85));
    draw_rectangle(x - 15, y - 65, x - 15 + 30 * alerta / 100, y - 63, false);
}
if (feedback_tempo > 0) {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(216, 185, 115));
    draw_text(x, y - 79, feedback_texto);
}
draw_set_halign(fa_left);
draw_set_font(-1);
draw_set_alpha(1);
draw_set_color(c_white);
