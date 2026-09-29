/// Marco de checkpoint desenhado sem o quadrado azul de protótipo
var pulso_cp = current_time * 0.004;

draw_set_alpha(0.14 + 0.04 * sin(pulso_cp));
draw_set_color(make_color_rgb(97, 226, 127));
draw_circle(x, y, 34, false);
draw_set_alpha(1);

draw_set_color(make_color_rgb(17, 22, 21));
draw_rectangle(x - 19, y - 13, x + 19, y + 14, false);
draw_set_color(make_color_rgb(58, 70, 65));
draw_rectangle(x - 15, y - 9, x + 15, y + 10, false);
draw_set_color(make_color_rgb(102, 201, 125));
draw_rectangle(x - 10, y - 5, x + 10, y + 3, false);
draw_set_color(make_color_rgb(180, 235, 181));
draw_rectangle(x - 7, y - 3, x + 7, y - 1, false);

var jogador_cp = instance_nearest(x, y, Obj_jogador);
if (jogador_cp != noone && point_distance(x, y, jogador_cp.x, jogador_cp.y) < 72) {
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(181, 226, 183));
    draw_text(x, y - 43, "CHECKPOINT");
    draw_set_halign(fa_left);
    draw_set_font(-1);
}

draw_set_alpha(1);
draw_set_color(c_white);
