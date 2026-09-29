/// Interface e transições com estado de desenho explícito
if (bunker_interface_fase2()) {
    bunker_fase2_gui(id);
    exit;
}
gpu_set_blendmode(bm_normal);
draw_set_alpha(1);
draw_set_color(c_white);
var gw = display_get_gui_width();
var gh = display_get_gui_height();

// Uma única mensagem no topo. Falas dos NPCs e menus têm prioridade.
var aviso_livre = !global.cutscene_ativa && !global.dialogo_ativo
    && !global.pause_aberto && !global.diario_aberto && !global.config_aberta
    && !global.vitoria_ativa;
var npc_perto = false;
if (aviso_livre && instance_exists(Obj_jogador)) {
    var aviso_j = instance_find(Obj_jogador, 0);
    var aviso_npcs = [Obj_recepcionista, Obj_cientista1, Obj_cientista2];
    for (var aviso_i = 0; aviso_i < array_length(aviso_npcs); aviso_i++) {
        var aviso_npc = instance_find(aviso_npcs[aviso_i], 0);
        if (aviso_npc == noone) continue;
        if (aviso_i == 0) {
            npc_perto = npc_perto || point_distance(aviso_npc.interacao_x,
                aviso_npc.interacao_y, aviso_j.x, aviso_j.y) < aviso_npc.raio_interacao;
        } else npc_perto = npc_perto || point_distance(aviso_npc.x,
            aviso_npc.y, aviso_j.x, aviso_j.y) < 78;
    }
}
if (aviso_livre && !npc_perto && !global.v54_entulho_perto && global.v54_entulho_tempo <= 0) {
    if (indicio_tempo > 0) bunker_aviso_gui("ANOTAÇÃO DE VISTORIA", indicio_mensagem);
    else if (tempo_apresentacao <= 0 && indicio_perto >= 0)
        bunker_aviso_gui("", "[E] INSPECIONAR IRREGULARIDADE");
    else if (tempo_apresentacao > 0 && room != Room_Armadilha)
        bunker_aviso_gui(nome_area, objetivo_area);
}

if (room == Room_Armadilha && armadilha_tempo >= 0) {
    var t = armadilha_tempo;

    if (t < 48) {
        draw_set_alpha(clamp(t / 24, 0, 1));
        draw_set_font(Font_de_fala);
        draw_set_halign(fa_center);
        draw_set_color(make_color_rgb(145, 218, 163));
        draw_text_transformed(gw * 0.5, gh * 0.18, "ACESSO CONFIRMADO", 2.0, 2.0, 0);
        draw_set_color(make_color_rgb(202, 214, 197));
        draw_text_transformed(gw * 0.5, gh * 0.24, "AGUARDE", 1.35, 1.35, 0);
    }

    if (t >= 48 && t < 82) {
        var flash = 0.16 * (1 - ((t - 48) / 34));
        draw_set_alpha(flash);
        draw_set_color(make_color_rgb(130, 85, 48));
        draw_rectangle(0, 0, gw, gh, false);
        draw_set_alpha(flash * 0.7);
        draw_set_color(make_color_rgb(255, 202, 95));
        for (var fa = 0; fa < 12; fa++) {
            var fx = (fa * 137 + t * 31) mod gw;
            draw_rectangle(fx, 0, fx + 8 + (fa mod 4) * 7, gh, false);
        }
    }

    if (t >= 70 && t < 150) {
        draw_set_alpha(0.22);
        draw_set_color(c_black);
        for (var tremor = 0; tremor < 7; tremor++) {
            var sy = (tremor * 113 + t * 17) mod gh;
            draw_rectangle(0, sy, gw, sy + 5 + (tremor mod 3) * 4, false);
        }
        draw_set_alpha(1);
        draw_set_font(Font_de_fala);
        draw_set_halign(fa_center);
        draw_set_color(make_color_rgb(231, 205, 166));
        draw_text_transformed(gw * 0.5, gh * 0.16, "FALHA ESTRUTURAL", 2.2, 2.2, (t mod 4) - 2);
    }

    if (t >= 135) {
        var escuro = clamp((t - 135) / 55, 0, 1);
        draw_set_alpha(escuro);
        draw_set_color(c_black);
        draw_rectangle(0, 0, gw, gh, false);
        if (t > 172) {
            draw_set_alpha(clamp((t - 172) / 20, 0, 1));
            draw_set_font(Font_de_fala);
            draw_set_halign(fa_center);
            draw_set_color(make_color_rgb(155, 165, 151));
            draw_text_transformed(gw * 0.5, gh * 0.52, "NÍVEL -1", 2.1, 2.1, 0);
        }
    }
}

if (fade_entrada > 0) {
    draw_set_alpha(fade_entrada);
    draw_set_color(c_black);
    draw_rectangle(0, 0, gw, gh, false);
}

if (global.vitoria_ativa) {
    var vitoria_t = global.vitoria_tempo;
    if (vitoria_t >= 52 && vitoria_t < 122) {
        var branco = vitoria_t < 94 ? clamp((vitoria_t - 52) / 42, 0, 1) : 1;
        draw_set_alpha(branco);
        draw_set_color(c_white);
        draw_rectangle(0, 0, gw, gh, false);
        draw_set_alpha(1);
    }
    if (vitoria_t >= 104 && vitoria_t < 164) {
        draw_set_alpha(clamp((vitoria_t - 104) / 60, 0, 1));
        draw_set_color(c_black);
        draw_rectangle(0, 0, gw, gh, false);
        draw_set_alpha(1);
    }
    if (vitoria_t >= 150) {
        draw_set_color(make_color_rgb(8, 12, 11));
        draw_rectangle(0, 0, gw, gh, false);
        draw_set_font(Font_de_fala);
        draw_set_halign(fa_center);
        draw_set_valign(fa_middle);
        draw_set_color(make_color_rgb(232, 211, 164));
        draw_text_transformed(gw * 0.5, 166, global.demo_creditos ? "FIM DA FASE 1" : "ESCAPE CONFIRMADO", 2.4, 2.4, 0);
        draw_set_color(make_color_rgb(178, 211, 163));
        draw_text_transformed(gw * 0.5, 232, global.demo_creditos ? "Obrigado por jogar esta versão!" : "Parabéns, você conseguiu dar um Escape no Bunker!", 1.35, 1.35, 0);
        draw_set_color(make_color_rgb(214, 211, 190));
        draw_text_transformed(gw * 0.5, 286, global.demo_creditos ? "A história continua..." : "A saída foi aberta. A vistoria agora tem um registro completo.", 1.05, 1.05, 0);

        if (vitoria_t >= 250) {
            var creditos = ["CRÉDITOS", "", "ESCAPE THE BUNKER", "", "DESENVOLVIMENTO", "Luiz Henrique Matos Muller", "", "ARTE E DIREÇÃO", "Equipe do projeto", "", "ÁUDIO E TESTES", "Equipe do projeto", "", "Obrigado por jogar."];
            var credito_y = gh + 20 - global.creditos_scroll;
            for (var credito_i = 0; credito_i < array_length(creditos); credito_i++) {
                if (credito_y > 60 && credito_y < gh - 20) {
                    draw_set_color(credito_i == 0 ? make_color_rgb(235, 202, 135) : make_color_rgb(205, 210, 194));
                    draw_text_transformed(gw * 0.5, credito_y, creditos[credito_i], credito_i == 0 ? 1.65 : 1.1, credito_i == 0 ? 1.65 : 1.1, 0);
                }
                credito_y += 42;
            }
        }
        draw_set_color(make_color_rgb(148, 156, 143));
        draw_text_transformed(gw * 0.5, gh - 34, vitoria_t > 720 ? "ENTER/ESC: VOLTAR AO MENU" : "CRÉDITOS", 0.95, 0.95, 0);
        draw_set_font(-1);
        draw_set_halign(fa_left);
        draw_set_valign(fa_top);
    }
}


draw_set_alpha(1);
draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_color(c_white);

v54_entulho_gui();
