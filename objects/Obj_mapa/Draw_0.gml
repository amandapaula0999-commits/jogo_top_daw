if (room == Room1) exit; // v5.39: arte estática da arena.
if (room == Room_Corredor_Pos) exit; // v5.38: sprite estático na Room.
if (room == Room_Biblioteca) exit; // Arte estatica dos Arquivos.
if (room == Room_Pesquisa) exit; // Sprite estatico na Room.
if (room == Room_Corredor) exit; // Cenario estatico na Room.
// Sala 1 redesenhada: o sprite da Room contém todo o cenário.
if (room == Room_Desmoronada) exit;
// Cenário estático na Room; queda na posição da sala compacta.
if (room == Room_Armadilha) {
    gpu_set_texfilter(false);
    if (armadilha_tempo >= 48) {
        var raio = clamp((armadilha_tempo - 48) * 1.25, 4, 104);
        draw_set_alpha(1);
        draw_set_color(make_color_rgb(18,16,15));
        // Blocos de 4 pixels mantêm o efeito compatível com a arte.
        for (var dy = -104; dy <= 104; dy += 4) {
            for (var dx = -104; dx <= 104; dx += 4) {
                if (dx*dx + dy*dy <= raio*raio) {
                    draw_rectangle(256+dx,250+dy,260+dx,254+dy,false);
                }
            }
        }
    }
    draw_set_color(c_white);
    draw_set_alpha(1);
    exit;
}
// SPRITE-FIRST / SALA DOS FUNCIONÁRIOS: todo o cenário já está no sprite estático da Room.
// Não cria piso, móveis, caixas ou decoração por Draw nesta sala.
if (room == Room_Funcionarios || room == Room_Manutencao_N2) exit;
if (room == Room_Corredor_N2) exit;
if (room == Room_Recepcao) exit;
if (room == Room_Ferramentas_N2 || room == Room_Laboratorio_N2) exit;

/// Fundo detalhado em cache; recuperado no mesmo frame após perda da surface.
gpu_set_blendmode(bm_normal);
gpu_set_texfilter(false);
draw_set_alpha(1);
draw_set_color(c_white);
var qualidade_atual = variable_global_exists("qualidade_visual") ? global.qualidade_visual : 0;
cache_tentativa = max(0, cache_tentativa - 1);
if (!surface_exists(superficie_cenario)) superficie_pronta = false;
var reconstruir = !superficie_pronta || qualidade_cache != qualidade_atual
    || (variable_global_exists("cenario_reconstruir") && global.cenario_reconstruir);
var em_cache = false;
var matriz_vista = matrix_get(matrix_view);
var matriz_projecao = matrix_get(matrix_projection);
var matriz_mundo = matrix_get(matrix_world);
if (reconstruir && cache_tentativa <= 0) {
    // Reutiliza a textura em mudanças de qualidade; só aloca se foi perdida.
    if (!surface_exists(superficie_cenario)) superficie_cenario = surface_create(room_width, room_height);
    if (surface_exists(superficie_cenario)) {
        em_cache = surface_set_target(superficie_cenario);
        if (em_cache) {
            camera_apply(camera_cenario);
            matrix_set(matrix_world, matrix_build_identity());
            draw_clear_alpha(make_color_rgb(24, 29, 26), 1);
        }
    }
    if (!em_cache) {
        // Continua desenhando diretamente, sem tentar CreateTexture2D 60x/s.
        cache_tentativa = 120;
        global.qualidade_visual = 1;
    }
}
if (reconstruir) {
/// Cenários procedurais em pixel art, inspirados em instalações industriais
var prop_caixa = function(_x, _y, _w, _h) {
    draw_set_color(make_color_rgb(43, 31, 23));
    draw_rectangle(_x - 3, _y - 3, _x + _w + 3, _y + _h + 3, false);
    bunker_textura(_x, _y, _w, _h, make_color_rgb(90, 69, 43), floor(_x + _y));
    draw_set_color(make_color_rgb(151, 105, 55));
    draw_line_width(_x + 5, _y + 5, _x + _w - 5, _y + _h - 5, 4);
    draw_line_width(_x + _w - 5, _y + 5, _x + 5, _y + _h - 5, 4);
};
var prop_monitor = function(_x, _y, _w, _h, _ligado) {
    draw_set_color(make_color_rgb(16, 19, 19));
    draw_rectangle(_x - 5, _y - 5, _x + _w + 5, _y + _h + 5, false);
    draw_set_color(_ligado ? make_color_rgb(38, 139, 86) : make_color_rgb(27, 35, 34));
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    if (_ligado) {
        draw_set_color(make_color_rgb(115, 222, 139));
        draw_line(_x + 8, _y + _h * 0.55, _x + _w * 0.30, _y + _h * 0.55);
        draw_line(_x + _w * 0.30, _y + _h * 0.55, _x + _w * 0.39, _y + 8);
        draw_line(_x + _w * 0.39, _y + 8, _x + _w * 0.55, _y + _h - 7);
        draw_line(_x + _w * 0.55, _y + _h - 7, _x + _w - 8, _y + _h * 0.55);
    }
};
var prop_papel = function(_x, _y, _rot) {
    draw_set_color(make_color_rgb(185, 180, 151));
    draw_rectangle(_x, _y, _x + 17 + _rot, _y + 12, false);
    draw_set_color(make_color_rgb(83, 80, 67));
    draw_line(_x + 3, _y + 4, _x + 12, _y + 4);
    draw_line(_x + 3, _y + 8, _x + 14, _y + 8);
};
var prop_prancheta = function(_x, _y, _irregular) {
    draw_set_color(make_color_rgb(70, 47, 30));
    draw_rectangle(_x - 3, _y - 3, _x + 37, _y + 29, false);
    draw_set_color(make_color_rgb(207, 199, 164));
    draw_rectangle(_x + 2, _y + 2, _x + 32, _y + 24, false);
    draw_set_color(make_color_rgb(91, 88, 73));
    draw_line(_x + 7, _y + 8, _x + 27, _y + 8);
    draw_line(_x + 7, _y + 13, _x + 25, _y + 13);
    draw_line(_x + 7, _y + 18, _x + 29, _y + 18);
    draw_set_color(_irregular ? make_color_rgb(169, 56, 44) : make_color_rgb(54, 122, 76));
    draw_rectangle(_x + 23, _y + 16, _x + 30, _y + 22, false);
    draw_set_color(make_color_rgb(132, 106, 61));
    draw_rectangle(_x + 11, _y - 6, _x + 24, _y + 2, false);
};
var prop_grade = function(_x, _y, _w, _h) {
    draw_set_color(make_color_rgb(15, 18, 18));
    draw_rectangle(_x - 3, _y - 3, _x + _w + 3, _y + _h + 3, false);
    draw_set_color(make_color_rgb(55, 63, 61));
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    draw_set_color(make_color_rgb(25, 30, 29));
    for (var gx = 6; gx < _w; gx += 12) draw_rectangle(_x + gx, _y + 2, _x + gx + 4, _y + _h - 2, false);
    for (var gy = 7; gy < _h; gy += 12) draw_rectangle(_x + 2, _y + gy, _x + _w - 2, _y + gy + 3, false);
};
var prop_tubo = function(_x1, _y1, _x2, _y2, _cor) {
    draw_set_color(make_color_rgb(13, 16, 16));
    draw_line_width(_x1, _y1, _x2, _y2, 11);
    draw_set_color(_cor);
    draw_line_width(_x1, _y1, _x2, _y2, 6);
    draw_set_color(merge_color(_cor, make_color_rgb(175, 158, 117), 0.23));
    draw_line_width(_x1 - 1, _y1 - 2, _x2 - 1, _y2 - 2, 1);
    draw_set_color(make_color_rgb(119, 121, 107));
    draw_circle(_x1, _y1, 5, false);
    draw_circle(_x2, _y2, 5, false);
};
var prop_vazamento = function(_x, _y, _raio) {
    draw_set_alpha(0.20);
    draw_set_color(make_color_rgb(32, 91, 57));
    draw_ellipse(_x - _raio, _y - _raio * 0.35, _x + _raio, _y + _raio * 0.35, false);
    draw_set_alpha(0.36);
    draw_set_color(make_color_rgb(79, 137, 74));
    draw_ellipse(_x - _raio * 0.65, _y - _raio * 0.20, _x + _raio * 0.65, _y + _raio * 0.20, true);
    draw_set_alpha(1);
};
var prop_tambor_irregular = function(_x, _y) {
    draw_set_color(make_color_rgb(25, 30, 29));
    draw_rectangle(_x - 3, _y - 3, _x + 39, _y + 45, false);
    bunker_textura(_x, _y, 36, 42, make_color_rgb(71, 85, 70), floor(_x));
    draw_set_color(make_color_rgb(115, 126, 99));
    draw_line(_x + 3, _y + 1, _x + 3, _y + 40);
    draw_set_color(make_color_rgb(177, 132, 38));
    draw_rectangle(_x, _y + 8, _x + 36, _y + 14, false);
    draw_rectangle(_x, _y + 28, _x + 36, _y + 34, false);
    draw_set_color(make_color_rgb(35, 44, 39));
    draw_ellipse(_x + 4, _y - 4, _x + 32, _y + 5, false);
    draw_set_color(make_color_rgb(154, 57, 39));
    draw_rectangle(_x + 14, _y + 17, _x + 22, _y + 25, false);
};

bunker_piso(cor_chao_1, semente_visual, room == Room_Externa);

// Microdetalhes compartilhados: parafusos, manchas e pequenas quebras no piso.
if (room != Room_Externa && room != Room_Recepcao && qualidade_atual == 0) {
    // A semente é um inteiro definido no Create. A versão anterior passava o
    // asset `room` para uma multiplicação e podia gerar "Variable is malformed".
    draw_set_alpha(0.13);
    draw_set_color(make_color_rgb(13, 18, 15));
    var indice_mancha = 0;
    while (indice_mancha < 14) {
        var calculo_x_mancha = indice_mancha * 173 + semente_visual * 47;
        var calculo_y_mancha = indice_mancha * 97 + semente_visual * 31;
        var pos_x_mancha = 58 + (calculo_x_mancha mod 1230);
        var pos_y_mancha = 74 + (calculo_y_mancha mod 620);
        var largura_mancha = 18 + ((indice_mancha * 11) mod 46);
        var altura_mancha = 7 + ((indice_mancha * 7) mod 18);
        draw_ellipse(
            pos_x_mancha - largura_mancha,
            pos_y_mancha - altura_mancha,
            pos_x_mancha + largura_mancha,
            pos_y_mancha + altura_mancha,
            false
        );
        indice_mancha++;
    }
    draw_set_alpha(1);
    draw_set_alpha(0.20);
    draw_set_color(make_color_rgb(135, 132, 111));
    for (var rebite = 70; rebite < room_width - 50; rebite += 96) {
        draw_circle(rebite, 96 + ((rebite * 7) mod 560), 2, false);
    }
    draw_set_alpha(1);
}

if (room == Room_Externa) {
    // Rua de terra, sulcos, mato e poças discretas.
    draw_set_color(make_color_rgb(78, 63, 42));
    draw_rectangle(525, 320, 840, 768, false);
    draw_set_color(make_color_rgb(91, 72, 47));
    draw_rectangle(575, 320, 606, 768, false);
    draw_rectangle(756, 320, 786, 768, false);
    draw_set_alpha(0.42);
    draw_set_color(make_color_rgb(43, 61, 56));
    draw_ellipse(620, 610, 742, 650, false);
    draw_set_alpha(1);
    for (var erva = 0; erva < 14; erva++) {
        var ex = 70 + ((erva * 91) mod 1180);
        var ey = 360 + ((erva * 67) mod 330);
        if (ex < 500 || ex > 860) {
            draw_set_color(make_color_rgb(65, 88, 59));
            draw_line(ex, ey + 10, ex + 5, ey - 5);
            draw_line(ex + 4, ey + 10, ex - 4, ey - 2);
        }
    }

    // Fachada da empresa.
    draw_set_color(make_color_rgb(22, 28, 28));
    draw_rectangle(32, 52, 1334, 324, false);
    bunker_textura(48, 70, 1270, 235, make_color_rgb(46, 55, 54), 23);
    draw_set_color(make_color_rgb(26, 37, 33));
    for (var junta = 128; junta < 1300; junta += 128) draw_line(junta, 86, junta, 305);
    draw_set_color(make_color_rgb(72, 82, 78));
    draw_rectangle(48, 70, 1318, 86, false);
    for (var jan = 0; jan < 7; jan++) {
        var jx = 105 + jan * 176;
        if (abs(jx - 683) > 95) {
            draw_set_color(make_color_rgb(20, 37, 38));
            draw_rectangle(jx, 145, jx + 98, 230, false);
            draw_set_color(make_color_rgb(65, 105, 101));
            draw_rectangle(jx + 6, 151, jx + 92, 158, false);
        }
    }
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(184, 194, 173));
    draw_text_transformed(683, 105, "COMPLEXO NEREIDA", 2.1, 2.1, 0);
    draw_set_halign(fa_left);
    // A vistoria já encontra o primeiro problema antes de entrar: drenagem
    // improvisada, vazamento e protocolo deixado do lado de fora.
    prop_vazamento(930, 595, 58);
    prop_prancheta(865, 545, true);
    draw_set_color(make_color_rgb(50, 58, 55));
    draw_rectangle(900, 545, 958, 559, false);
    draw_set_color(make_color_rgb(23, 27, 26));
    for (var grade_dreno = 0; grade_dreno < 6; grade_dreno++) {
        draw_rectangle(904 + grade_dreno * 9, 547, 908 + grade_dreno * 9, 557, false);
    }
}
else if (room == Room_Armadilha) {
    // Sala limpa demais, piso que se parte durante o evento. A iluminação
    // verde global foi removida: ela era a origem dos flashes em alguns
    // drivers do Windows; os monitores continuam discretos e estáticos.
    draw_set_color(make_color_rgb(78, 87, 78));
    draw_rectangle(455, 50, 910, 59, false);
    for (var placa = 0; placa < 4; placa++) prop_papel(310 + placa * 220, 560 + (placa mod 2) * 35, placa);
    prop_prancheta(665, 545, true);
    prop_vazamento(1130, 315, 42);


}
else if (room == Room_Desmoronada) {
    draw_set_color(make_color_rgb(33,31,29));
    draw_ellipse(95,255,315,465,false);
    for(var pedra=0;pedra<32;pedra++) {
        var px=90+((pedra*83) mod 860); var py=190+((pedra*59) mod 420);
        draw_set_color(make_color_rgb(52,48,41));draw_rectangle(px,py,px+14,py+10,false);
        draw_set_color(make_color_rgb(91,80,62));draw_rectangle(px+1,py,px+11,py+5,false);
    }
    prop_tubo(300,70,345,240,make_color_rgb(72,88,77));
    prop_tubo(820,610,880,465,make_color_rgb(103,67,43));
    draw_set_color(make_color_rgb(24,29,28));draw_line_width(60,230,390,360,7);
    draw_line_width(390,360,580,610,6);
    draw_set_color(make_color_rgb(106,81,45));draw_line_width(60,232,390,362,2);
    for(var pap=0;pap<10;pap++) prop_papel(270+((pap*127) mod 550),200+((pap*83) mod 370),pap mod 5);
    prop_vazamento(750,340,45);prop_prancheta(730,320,true);
    // Aterrisagem sobre lascas transitáveis; não há colisor neste detalhe.
    draw_set_color(make_color_rgb(94,83,63));draw_rectangle(203,358,220,368,false);
}
else if (room == Room_Corredor || room == Room_Corredor_Pos || room == Room_Corredor_N2) {
    // Canaletas, tubulações, caixas e faixas de risco. O Nível 2 reaproveita
    // exatamente esta linguagem visual, mas sem colisores internos.
    draw_set_color(make_color_rgb(19, 26, 26));
    draw_rectangle(40, 82, 1325, 105, false);
    draw_set_color(make_color_rgb(93, 59, 36));
    draw_rectangle(40, 88, 1325, 94, false);
    for (var suporte = 70; suporte < 1310; suporte += 96) {
        draw_set_color(make_color_rgb(111, 119, 111));
        draw_rectangle(suporte, 76, suporte + 9, 112, false);
    }
    draw_set_color(make_color_rgb(184, 137, 43));
    for (var faixa = 80; faixa < 1280; faixa += 64) draw_rectangle(faixa, 706, faixa + 30, 718, false);
    prop_tubo(52, 235, 1310, 235, make_color_rgb(78, 91, 87));
    prop_tubo(52, 535, 1310, 535, make_color_rgb(91, 56, 38));
    prop_grade(485, 365, 54, 66);
    prop_grade(758, 300, 42, 92);
    prop_grade(1005, 455, 52, 64);
    draw_set_alpha(0.24);
    draw_set_color(make_color_rgb(93, 107, 99));
    for (var emenda = 125; emenda < 1270; emenda += 190) draw_line_width(emenda, 250, emenda + 70, 520, 2);
    draw_set_alpha(1);
    prop_papel(860, 610, 4);
    prop_vazamento(775, 485, 48);
    prop_prancheta(755, 455, true);
}
else if (room == Room_Pesquisa) {
    // Bancadas, telas verdes, vidraria e documentos abandonados.
    draw_set_color(make_color_rgb(166, 177, 165));
    for (var vidro = 0; vidro < 16; vidro++) {
        var vx = 170 + ((vidro * 97) mod 910);
        var vy = 210 + ((vidro * 61) mod 380);
        draw_rectangle(vx, vy, vx + 6, vy + 14, false);
        draw_set_color(make_color_rgb(81, 154, 112));
        draw_rectangle(vx, vy + 9, vx + 6, vy + 14, false);
        draw_set_color(make_color_rgb(166, 177, 165));
    }
    draw_set_alpha(0.35);
    draw_set_color(make_color_rgb(102, 140, 72));
    draw_ellipse(580, 550, 780, 630, false);
    draw_set_alpha(1);
    prop_grade(558, 242, 54, 40);
    prop_grade(1068, 260, 54, 40);
    prop_tubo(120, 245, 510, 280, make_color_rgb(76, 88, 84));
    prop_tubo(700, 445, 1120, 460, make_color_rgb(85, 103, 91));
    draw_set_color(make_color_rgb(54, 72, 65));
    draw_line_width(500, 216, 550, 310, 5);
    draw_line_width(550, 310, 610, 455, 5);
    draw_set_color(make_color_rgb(133, 89, 39));
    draw_line(500, 216, 550, 310);
    draw_line(550, 310, 610, 455);
    for (var folha = 0; folha < 12; folha++) prop_papel(120 + ((folha * 103) mod 950), 185 + ((folha * 79) mod 420), folha mod 6);
    prop_vazamento(620, 495, 36);
    prop_prancheta(610, 455, true);
}
else if (room == Room_Biblioteca) {
    // Arquivo opressivo: livros no chão, poeira e anotações apagadas.
    for (var livro = 0; livro < 24; livro++) {
        var lx = 100 + ((livro * 157) mod 1160);
        var ly = 420 + ((livro * 47) mod 250);
        draw_set_color(make_color_rgb(102 + (livro mod 3) * 20, 58, 36));
        draw_rectangle(lx, ly, lx + 18, ly + 7, false);
    }
    draw_set_alpha(0.18);
    draw_set_color(c_black);
    draw_rectangle(205, 58, 375, 468, false);
    draw_rectangle(455, 255, 625, 716, false);
    draw_rectangle(705, 58, 875, 468, false);
    draw_rectangle(955, 255, 1125, 716, false);
    draw_set_alpha(1);
    prop_grade(380, 135, 55, 92);
    prop_grade(875, 535, 58, 86);
    prop_tubo(45, 54, 1320, 54, make_color_rgb(78, 71, 60));
    draw_set_alpha(0.34);
    draw_set_color(make_color_rgb(193, 183, 143));
    draw_set_font(Font_de_fala);
    draw_text_transformed(610, 680, "NÃO ERA PARA TER UM ANDAR AQUI", 1.25, 1.25, -2);
    draw_set_alpha(1);
    prop_prancheta(895, 175, true);
    prop_papel(875, 205, 3);
}
else if (room == Room1) {
    // Arena inteira dedicada ao chefe, com contenção e pontos de reposição.
    draw_set_color(make_color_rgb(28, 31, 34));
    draw_rectangle(65, 65, 1300, 700, true);
    draw_set_color(make_color_rgb(178, 130, 38));
    for (var risco = 90; risco < 1280; risco += 70) {
        draw_rectangle(risco, 682, risco + 34, 695, false);
        draw_rectangle(risco, 72, risco + 34, 84, false);
    }
    prop_grade(328, 118, 70, 74);
    prop_grade(920, 560, 72, 76);
    prop_grade(640, 640, 86, 44);
    prop_tubo(90, 250, 320, 250, make_color_rgb(82, 95, 91));
    prop_tubo(1040, 365, 1270, 365, make_color_rgb(108, 67, 42));
    draw_set_color(make_color_rgb(46, 77, 62));
    draw_line_width(300, 60, 350, 250, 7);
    draw_line_width(1030, 60, 930, 260, 7);
    draw_set_alpha(0.15);
    draw_set_color(make_color_rgb(75, 211, 113));
    draw_circle(683, 380, 245, true);
    draw_set_alpha(1);

    // Marcas no piso indicam onde atrair o chefe, sem transformar a arena em
    // uma sala vazia ou em uma interface chamativa demais.
    draw_set_alpha(0.32);
    draw_set_color(make_color_rgb(183, 137, 43));
    draw_circle(430, 220, 48, true);
    draw_circle(880, 220, 48, true);
    draw_circle(500, 540, 48, true);
    draw_circle(980, 530, 48, true);
    draw_set_alpha(1);


}

// Sujeira e linhas industriais compartilhadas.
draw_set_alpha(0.16);
draw_set_color(c_black);
for (var linha = 96; linha < room_height; linha += 160) draw_rectangle(32, linha, room_width - 32, linha + 4, false);
draw_set_alpha(1);

draw_set_font(Font_de_fala);
draw_set_halign(fa_left);
draw_set_color(make_color_rgb(215, 196, 151));
if (room != Room1) draw_text(room==Room_Corredor_Pos ? 208 : 48, 46, nome_area);
draw_set_font(-1);
draw_set_color(c_white);

    for (var prop_draw = 0; prop_draw < array_length(props_cenario); prop_draw++) {
        var prop_dado = props_cenario[prop_draw];
        if (prop_dado[0] == 0) prop_caixa(prop_dado[1], prop_dado[2], prop_dado[3], prop_dado[4]);
        if (prop_dado[0] == 1) prop_monitor(prop_dado[1], prop_dado[2], prop_dado[3], prop_dado[4], prop_dado[5]);
        if (prop_dado[0] == 2) prop_tambor_irregular(prop_dado[1], prop_dado[2]);
    }
    with (Obj_parede) bunker_obstaculo(x, y, largura, altura, tipo);
    if(room==Room_Corredor) v5_entulho_desenhar();
    // Pedras do corredor pós-escombros estão no sprite estático.
}
if (em_cache) {
    surface_reset_target();
    matrix_set(matrix_view, matriz_vista);
    matrix_set(matrix_projection, matriz_projecao);
    matrix_set(matrix_world, matriz_mundo);
}
if (reconstruir && em_cache) {
    superficie_pronta = true;
    qualidade_cache = qualidade_atual;
    if (variable_global_exists("cenario_reconstruir")) global.cenario_reconstruir = false;
}
draw_set_alpha(1);
draw_set_color(c_white);
if (surface_exists(superficie_cenario) && (!reconstruir || em_cache)) draw_surface(superficie_cenario, 0, 0);
// Falha no target: o cenário já foi desenhado diretamente acima. Não copia
// pixels indefinidos nem realoca a textura a cada frame.
if (room == Room_Armadilha) {
    if (armadilha_tempo >= 48) {
        var raio = clamp((armadilha_tempo - 48) * 3.4, 10, 275);
        draw_set_color(make_color_rgb(18, 16, 15));
        draw_circle(683, 405, raio, false);
        draw_set_color(make_color_rgb(81, 68, 55));
        for (var rach = 0; rach < 12; rach++) {
            var ang = rach * 30 + 7;
            draw_line_width(683 + lengthdir_x(raio * 0.65, ang), 405 + lengthdir_y(raio * 0.65, ang),
                683 + lengthdir_x(raio * 1.35, ang + (rach mod 2) * 9), 405 + lengthdir_y(raio * 1.35, ang + (rach mod 2) * 9), 3);
        }
    }
}
// Pequeno marcador de prancheta indica os pontos que podem ser inspecionados.
for (var marcador = 0; marcador < array_length(indicio_x); marcador++) {
    var coletado = bunker_evidencia_indice(indicio_registro[marcador].codigo) >= 0;
    var brilho_marcador = coletado ? 0.30 : 0.85;
    draw_set_alpha(brilho_marcador);
    draw_set_color(make_color_rgb(194, 155, 70));
    draw_rectangle(indicio_x[marcador] - 9, indicio_y[marcador] - 12, indicio_x[marcador] + 9, indicio_y[marcador] + 12, true);
    draw_line(indicio_x[marcador] - 5, indicio_y[marcador] - 5, indicio_x[marcador] + 5, indicio_y[marcador] - 5);
    draw_line(indicio_x[marcador] - 5, indicio_y[marcador], indicio_x[marcador] + 5, indicio_y[marcador]);
    draw_set_alpha(1);
}


draw_set_alpha(1);
draw_set_color(c_white);
draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
gpu_set_blendmode(bm_normal);

v54_dinamico_desenhar();
