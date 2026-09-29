/// Materiais nativos: mesma paleta, luz no topo esquerdo e granulação de 1-3px.
function bunker_textura(_x, _y, _w, _h, _base, _semente) {
    draw_set_alpha(1);
    draw_set_color(_base);
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    var simples = variable_global_exists("qualidade_visual") && global.qualidade_visual == 1;
    if (simples) return;
    for (var gx = 2; gx < _w - 2; gx += 5) {
        for (var gy = 2; gy < _h - 2; gy += 5) {
            var n = (gx * 73 + gy * 31 + _semente * 17) mod 29;
            if (n < 9) {
                draw_set_color(merge_color(_base, n < 4 ? make_color_rgb(13, 19, 18) : make_color_rgb(166, 151, 115), 0.16));
                draw_rectangle(_x + gx, _y + gy, _x + gx + 1 + (n mod 2), _y + gy + 1, false);
            }
        }
    }
}

function bunker_piso(_cor, _semente, _terra) {
    var simples = variable_global_exists("qualidade_visual") && global.qualidade_visual == 1;
    for (var tx = 0; tx < room_width; tx += 64) {
        for (var ty = 0; ty < room_height; ty += 64) {
            var n = (tx * 13 + ty * 7 + _semente) mod 11;
            var base = merge_color(_cor, make_color_rgb(25, 32, 29), n * 0.012);
            bunker_textura(tx, ty, 64, 64, base, n);
            if (!_terra) {
                draw_set_color(merge_color(base, c_black, 0.27));
                draw_line(tx, ty + 63, tx + 63, ty + 63);
                draw_line(tx + 63, ty, tx + 63, ty + 63);
                draw_set_color(merge_color(base, make_color_rgb(156, 143, 117), 0.10));
                draw_line(tx + 1, ty + 1, tx + 61, ty + 1);
            }
            if (!simples && n < 2) {
                draw_set_color(merge_color(base, c_black, 0.35));
                draw_line(tx + 11, ty + 17, tx + 20, ty + 24);
                draw_line(tx + 20, ty + 24, tx + 18, ty + 32);
                draw_line(tx + 18, ty + 32, tx + 26, ty + 36);
            }
        }
    }
}

function bunker_obstaculo(_x, _y, _w, _h, _tipo) {
    if (_tipo == 9) return;
    var madeira = (_tipo == 2 || _tipo == 3 || _tipo == 7);
    var base = madeira ? make_color_rgb(76, 58, 41) : make_color_rgb(57, 68, 64);
    if (_tipo == 1) base = make_color_rgb(79, 74, 63);
    var direita = _x + _w - 1;
    var baixo = _y + _h - 1;
    draw_set_alpha(0.28);
    draw_set_color(make_color_rgb(8, 13, 11));
    draw_rectangle(_x + 5, _y + 9, direita + 12, baixo + 12, false);
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(19, 24, 22));
    draw_rectangle(_x, _y, direita, baixo, false);
    bunker_textura(_x, _y, _w, _h, base, floor(_x + _y));
    draw_set_color(merge_color(base, make_color_rgb(186, 159, 113), 0.26));
    draw_rectangle(_x + 2, _y + 2, direita - 2, _y + 4, false);
    draw_line(_x + 2, _y + 3, _x + 2, baixo - 3);
    draw_set_color(merge_color(base, c_black, 0.42));
    draw_rectangle(_x + 2, baixo - 10, direita - 2, baixo - 2, false);
    draw_rectangle(direita - 5, _y + 4, direita - 2, baixo - 2, false);
    if (_tipo == 0 || _tipo == 1) {
        for (var r = 20; r < _h - 12; r += 28) {
            draw_set_color(merge_color(base, c_black, 0.28));
            draw_line(_x + 3, _y + r, direita - 4, _y + r);
            for (var c = 22; c < _w - 4; c += 54) {
                var junta = _x + c + ((r div 28) mod 2) * 14;
                if (junta < direita - 4) draw_line(junta, _y + r, junta, min(baixo - 11, _y + r + 26));
            }
        }
    } else if (_tipo == 2) {
        // Estantes preenchidas em todas as prateleiras, não apenas no topo.
        for (var r = 13; r < _h - 31; r += 37) {
            for (var c = 10; c < _w - 18; c += 13) {
                var n = (c * 3 + r) mod 5;
                draw_set_color(merge_color(make_color_rgb(112, 91, 58), make_color_rgb(42, 70, 66), n * 0.17));
                draw_rectangle(_x + c, _y + r + n, _x + c + 9, _y + r + 24, false);
                draw_set_color(make_color_rgb(162, 143, 103));
                draw_line(_x + c + 2, _y + r + 9, _x + c + 6, _y + r + 9);
            }
            draw_set_color(make_color_rgb(33, 27, 22));
            draw_rectangle(_x + 6, _y + r + 25, direita - 6, _y + r + 29, false);
        }
    } else if (_tipo == 4) {
        // Bancada de metal, gavetas e um monitor compacto.
        draw_set_color(make_color_rgb(25, 34, 32));
        draw_rectangle(_x + 15, _y + 19, _x + min(104, _w - 15), _y + min(54, _h - 15), false);
        draw_set_color(make_color_rgb(57, 101, 79));
        draw_rectangle(_x + 20, _y + 24, _x + min(99, _w - 20), _y + min(48, _h - 20), false);
        draw_set_color(make_color_rgb(135, 153, 118));
        draw_line(_x + 28, _y + 33, _x + min(80, _w - 25), _y + 33);
        for (var c = 124; c < _w - 30; c += 67) {
            draw_set_color(make_color_rgb(34, 43, 41));
            draw_rectangle(_x + c, _y + 23, _x + c + 53, baixo - 18, true);
            draw_set_color(make_color_rgb(132, 130, 106));
            draw_line(_x + c + 20, _y + 31, _x + c + 33, _y + 31);
        }
    } else if (_tipo == 5 || _tipo == 6) {
        for (var c = 13; c < _w - 15; c += 42) {
            draw_set_color(make_color_rgb(26, 34, 32));
            draw_rectangle(_x + c, _y + 12, _x + c + 28, baixo - 16, true);
            for (var r = 21; r < _h - 24; r += 9) draw_line(_x + c + 5, _y + r, _x + c + 23, _y + r);
            draw_set_color(make_color_rgb(154, 125, 69));
            draw_rectangle(_x + c + 7, _y + 16, _x + c + 13, _y + 18, false);
        }
    } else if (madeira) {
        draw_set_color(make_color_rgb(43, 35, 28));
        for (var c = 18; c < _w - 8; c += 26) draw_line(_x + c, _y + 8, _x + c, baixo - 13);
        draw_set_color(make_color_rgb(126, 106, 72));
        for (var c = 20; c < _w - 12; c += 52) draw_line(_x + c, _y + 16, _x + min(c + 18, _w - 8), _y + 17);
    }
    // Rebites e desgaste local, com posições determinísticas. No modo
    // adaptativo simples ficam fora para reduzir chamadas de desenho no
    // primeiro carregamento de cada sala.
    if (!(variable_global_exists("qualidade_visual") && global.qualidade_visual == 1)) {
        for (var c = 9; c < _w - 8; c += 48) {
            draw_set_color(make_color_rgb(30, 31, 26));
            draw_rectangle(_x + c, _y + 7, _x + c + 2, _y + 9, false);
            draw_set_color(make_color_rgb(131, 123, 96));
            draw_point(_x + c, _y + 7);
        }
    }
    draw_set_alpha(1);
    draw_set_color(c_white);
}

function bunker_painel(_x, _y, _w, _h) {
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(8, 13, 12));
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    draw_set_color(make_color_rgb(79, 87, 72));
    draw_rectangle(_x, _y, _x + _w, _y + _h, true);
    draw_set_color(make_color_rgb(30, 40, 35));
    draw_rectangle(_x + 3, _y + 3, _x + _w - 3, _y + _h - 3, true);
    draw_set_color(make_color_rgb(178, 148, 86));
    draw_rectangle(_x + 9, _y + 8, _x + 12, _y + 11, false);
    draw_rectangle(_x + _w - 12, _y + 8, _x + _w - 9, _y + 11, false);
    draw_set_color(c_white);
}

function bunker_sombra_alpha(_x, _y, _px, _py, _base) {
    return clamp(_base - 0.14 * max(0, 1 - point_distance(_x, _y, _px, _py) / 190), max(0, _base - 0.14), _base);
}

function bunker_boss_ataque(_x, _y, _s, _tempo, _cor) {
    // Recortes do Spr_parado_baixo ORIGINAL de 32x40; nenhum novo desenho.
    // Cabeça, tronco e pernas preservados; o braço gira ao redor do ombro.
    var subida = clamp((_tempo - 12) / 28, 0, 1);
    var descida = clamp((_tempo - 54) / 12, 0, 1);
    var angulo = 155 * subida * (1 - descida);
    var agachar = (_tempo >= 66) ? 1 - clamp((_tempo - 82) / 24, 0, 1) : 0;
    var sy = _s * (1 - 0.13 * agachar);
    var oy = _y + 16 * (_s - sy);
    draw_sprite_part_ext(Spr_parado_baixo, 0, 0, 0, 32, 17, _x - 16 * _s, oy - 20 * sy, _s, sy, _cor, 1);
    draw_sprite_part_ext(Spr_parado_baixo, 0, 0, 17, 21, 23, _x - 16 * _s, oy - 3 * sy, _s, sy, _cor, 1);
    var ombro_x = _x + 6 * _s;
    var ombro_y = oy - 2 * sy;
    var dx = -1 * _s;
    var dy = -1 * sy;
    var rx = ombro_x + dx * dcos(angulo) + dy * dsin(angulo);
    var ry = ombro_y - dx * dsin(angulo) + dy * dcos(angulo);
    draw_sprite_general(Spr_parado_baixo, 0, 21, 17, 11, 23, rx, ry, _s, sy * (1 + 0.22 * agachar), angulo, _cor, _cor, _cor, _cor, 1);
}
