/// Jogador - controle, colisão e coleta
if (keyboard_check_pressed(vk_f11)) window_set_fullscreen(!window_get_fullscreen());

// Atalho de teste reservado: P percorre o fluxo principal em loop.
// Ele é processado antes de pause/diário/cutscenes para nunca ficar bloqueado
// durante uma sessão de QA. O pause continua disponível pelo ESC.
if (keyboard_check_pressed(ord("P"))) {
    v5_debug_avancar_room();
    exit;
}

// Pause e diário são controlados pelo próprio jogador. Ele é mantido ativo
// enquanto o resto da sala é desativado, portanto o overlay não pode sumir
// junto com o objeto que o desenha nem depender de uma instância extra.
var apertou_escape = keyboard_check_pressed(vk_escape);
var apertou_j = keyboard_check_pressed(ord("J"));

if (global.config_aberta) {
    var config_confirmar = keyboard_check_pressed(vk_enter) || keyboard_check_pressed(vk_space);
    if (keyboard_check_pressed(vk_up) || keyboard_check_pressed(ord("W"))) {
        global.config_selecionado = (global.config_selecionado + 2) mod 3;
    }
    if (keyboard_check_pressed(vk_down) || keyboard_check_pressed(ord("S"))) {
        global.config_selecionado = (global.config_selecionado + 1) mod 3;
    }
    if ((keyboard_check_pressed(vk_left) || keyboard_check_pressed(vk_right)
    || keyboard_check_pressed(ord("A")) || keyboard_check_pressed(ord("D")))
    && global.config_selecionado < 2) {
        bunker_configuracao_alternar(global.config_selecionado);
    }

    var config_mx = device_mouse_x_to_gui(0);
    var config_my = device_mouse_y_to_gui(0);
    var config_ys = [270, 382, 494];
    for (var config_i = 0; config_i < 3; config_i++) {
        if (point_in_rectangle(config_mx, config_my, 330, config_ys[config_i] - 40, 1036, config_ys[config_i] + 40)) {
            global.config_selecionado = config_i;
            if (mouse_check_button_pressed(mb_left)) config_confirmar = true;
        }
    }

    if (apertou_escape) {
        global.config_aberta = false;
        global.config_origem = "";
    } else if (config_confirmar) {
        if (global.config_selecionado < 2) bunker_configuracao_alternar(global.config_selecionado);
        else {
            global.config_aberta = false;
            global.config_origem = "";
        }
    }
    exit;
}

if (global.diario_aberto) {
    var total_anotacoes = array_length(global.evidencias);
    if (keyboard_check_pressed(vk_right) || keyboard_check_pressed(ord("D"))) global.diario_pagina++;
    if (keyboard_check_pressed(vk_left) || keyboard_check_pressed(ord("A"))) global.diario_pagina--;
    global.diario_pagina = clamp(global.diario_pagina, 0, max(0, total_anotacoes - 1));

    if (apertou_escape || apertou_j) {
        global.diario_aberto = false;
        instance_activate_all();
        audio_resume_all();
    }
    exit;
}

if (global.pause_aberto) {
    var pause_dt = clamp(delta_time / 1000000, 0, 0.05);
    var pause_esquerda = keyboard_check_pressed(vk_left) || keyboard_check_pressed(ord("A"));
    var pause_direita = keyboard_check_pressed(vk_right) || keyboard_check_pressed(ord("D"));
    var pause_cima = keyboard_check_pressed(vk_up) || keyboard_check_pressed(ord("W"));
    var pause_baixo = keyboard_check_pressed(vk_down) || keyboard_check_pressed(ord("S"));
    var pause_confirmar = keyboard_check_pressed(vk_enter) || keyboard_check_pressed(vk_space);

    // O pause aceita D-pad, analógico e botão principal do controle.
    var pause_pad = -1;
    for (var pause_dispositivo = 0; pause_dispositivo < gamepad_get_device_count(); pause_dispositivo++) {
        if (gamepad_is_connected(pause_dispositivo)) { pause_pad = pause_dispositivo; break; }
    }
    if (pause_pad != pause_pad_anterior) {
        pause_pad_eixo_x = 0;
        pause_pad_eixo_y = 0;
        pause_pad_anterior = pause_pad;
    }
    if (pause_pad >= 0) {
        var pause_ax = gamepad_axis_value(pause_pad, gp_axislh);
        var pause_ay = gamepad_axis_value(pause_pad, gp_axislv);
        var pause_novo_x = abs(pause_ax) > 0.55 ? sign(pause_ax) : (abs(pause_ax) < 0.25 ? 0 : pause_pad_eixo_x);
        var pause_novo_y = abs(pause_ay) > 0.55 ? sign(pause_ay) : (abs(pause_ay) < 0.25 ? 0 : pause_pad_eixo_y);
        pause_esquerda = pause_esquerda || gamepad_button_check_pressed(pause_pad, gp_padl)
            || (pause_novo_x == -1 && pause_pad_eixo_x != -1);
        pause_direita = pause_direita || gamepad_button_check_pressed(pause_pad, gp_padr)
            || (pause_novo_x == 1 && pause_pad_eixo_x != 1);
        pause_cima = pause_cima || gamepad_button_check_pressed(pause_pad, gp_padu)
            || (pause_novo_y == -1 && pause_pad_eixo_y != -1);
        pause_baixo = pause_baixo || gamepad_button_check_pressed(pause_pad, gp_padd)
            || (pause_novo_y == 1 && pause_pad_eixo_y != 1);
        pause_confirmar = pause_confirmar || gamepad_button_check_pressed(pause_pad, gp_face1);
        pause_pad_eixo_x = pause_novo_x;
        pause_pad_eixo_y = pause_novo_y;
    }

    // Mesma geometria do Draw: três cartões à direita e SAIR à esquerda.
    var pause_cartoes = bunker_pause_cartoes();
    var pause_cartao_x = pause_cartoes[0];
    var pause_cartao_y = pause_cartoes[1];
    var pause_cartao_limite = pause_cartoes[2];
    var pause_cartao_largura = pause_cartoes[3];
    var pause_cartao_escala = pause_cartoes[5];
    var pause_hover_altura = pause_cartoes[6];
    var pause_mx = device_mouse_x_to_gui(0);
    var pause_my = device_mouse_y_to_gui(0);
    var pause_clique = mouse_check_button_pressed(mb_left);
    var pause_mouse_moveu = abs(pause_mx - pause_mouse_anterior_x) + abs(pause_my - pause_mouse_anterior_y) > 1;
    pause_mouse_anterior_x = pause_mx;
    pause_mouse_anterior_y = pause_my;
    var pause_layout = bunker_pause_layout(display_get_gui_width(), display_get_gui_height());
    pause_mx = (pause_mx - pause_layout[1]) / pause_layout[0];
    pause_my = (pause_my - pause_layout[2]) / pause_layout[0];
    if (pause_mouse_moveu || pause_clique) pause_input_mouse = true;
    if (pause_esquerda || pause_direita || pause_cima || pause_baixo || pause_confirmar) pause_input_mouse = false;

    if (pause_input_mouse) {
        global.pause_selecionado = -1;
        for (var pause_i = 0; pause_i < 4; pause_i++) {
            var pause_topo = pause_cartao_y[pause_i] - pause_hover_altura * pause_animacao_cartao[pause_i] - 5;
            if (point_in_rectangle(pause_mx, pause_my, pause_cartao_x[pause_i], pause_topo,
                pause_cartao_x[pause_i] + pause_cartao_largura[pause_i] * pause_cartao_escala[pause_i],
                pause_cartao_limite[pause_i])) {
                global.pause_selecionado = pause_i;
                if (pause_clique) pause_confirmar = true;
            }
        }
    } else {
        if (global.pause_selecionado < 0 && (pause_esquerda || pause_direita || pause_cima || pause_baixo || pause_confirmar)) global.pause_selecionado = 0;
        if (pause_esquerda && global.pause_selecionado < 3) global.pause_selecionado = 3;
        else if (pause_direita && global.pause_selecionado == 3) global.pause_selecionado = 0;
        else if (pause_cima && global.pause_selecionado < 3) global.pause_selecionado = (global.pause_selecionado + 2) mod 3;
        else if (pause_baixo && global.pause_selecionado < 3) global.pause_selecionado = (global.pause_selecionado + 1) mod 3;
    }

    // A mesma curva suave do menu principal puxa qualquer cartão selecionado.
    var pause_suavidade = 1 - power(0.000001, pause_dt);
    for (var pause_anim_i = 0; pause_anim_i < 4; pause_anim_i++) {
        pause_animacao_cartao[pause_anim_i] = lerp(pause_animacao_cartao[pause_anim_i],
            pause_anim_i == global.pause_selecionado ? 1 : 0, pause_suavidade);
    }

    if (apertou_escape) {
        global.pause_aberto = false;
        instance_activate_all();
        audio_resume_all();
        exit;
    }

    if (pause_confirmar) {
        switch (global.pause_selecionado) {
            case 0:
                global.pause_aberto = false;
                instance_activate_all();
                audio_resume_all();
                break;
            case 1:
                global.pause_aberto = false;
                global.diario_aberto = false;
                global.cutscene_ativa = false;
                global.dialogo_ativo = false;
                global.spawn_room = -1;
                instance_activate_all();
                audio_resume_all();
                v5_reiniciar_checkpoint();
                break;
            case 2:
                global.config_aberta = true;
                global.config_origem = "pause";
                global.config_selecionado = 0;
                break;
            case 3:
                global.pause_aberto = false;
                global.diario_aberto = false;
                global.cutscene_ativa = false;
                global.dialogo_ativo = false;
                global.spawn_room = -1;
                instance_activate_all();
                audio_resume_all();
                room_goto(Room_Menu);
                break;
        }
    }
    exit;
}

// Finalização furtiva: durante o golpe o jogador e o alvo ficam alinhados,
// sem aceitar movimento, troca de arma ou abertura de menus.
if (takedown_ativo) {
    takedown_tempo++;
    if (instance_exists(takedown_alvo)) {
        var alvo_takedown = takedown_alvo;
        var aproximacao = clamp(takedown_tempo / 10, 0, 1);
        // takedown_direcao aponta do inimigo para o jogador; o jogador fica
        // portanto no lado de trás, sem ser empurrado para dentro do alvo.
        var destino_takedown_x = alvo_takedown.x + lengthdir_x(24, takedown_direcao);
        var destino_takedown_y = alvo_takedown.y + lengthdir_y(24, takedown_direcao);
        var passo_takedown_x = clamp((destino_takedown_x - x) * aproximacao, -3, 3);
        var passo_takedown_y = clamp((destino_takedown_y - y) * aproximacao, -3, 3);
        if (!place_meeting(x + passo_takedown_x, y, Obj_parede)) x += passo_takedown_x;
        if (!place_meeting(x, y + passo_takedown_y, Obj_parede)) y += passo_takedown_y;
        direcao_olhar = takedown_direcao;
        var lado_takedown = floor((takedown_direcao + 45) / 90) mod 4;
        if (lado_takedown == 0) sprite_index = Spr_jogador_andando_direita;
        if (lado_takedown == 1) sprite_index = Spr_jogador_andando_cima;
        if (lado_takedown == 2) sprite_index = Spr_jogador_andando_esquerda;
        if (lado_takedown == 3) sprite_index = Spr_jogador_andando_baixo;
        image_speed = 0.55;
        image_index = min(image_number - 1, floor(takedown_tempo / 7));
        global.camera_zoom = 1 + 0.34 * clamp(takedown_tempo / 12, 0, 1);
        global.camera_foco_x = (x + alvo_takedown.x) * 0.5;
        global.camera_foco_y = (y + alvo_takedown.y) * 0.5;
    }
    if (takedown_tempo >= takedown_duracao) {
        if (instance_exists(takedown_alvo)) {
            takedown_alvo.vida = 0;
            takedown_alvo.morrendo = true;
            takedown_alvo.estado = "DERROTADO";
            takedown_alvo.takedown_ativo = false;
            takedown_alvo.feedback_tempo = 34;
            takedown_alvo.feedback_texto = "FINALIZAÇÃO FURTIVA";
        }
        takedown_ativo = false;
        takedown_alvo = noone;
        takedown_tempo = 0;
        global.camera_zoom = 1;
    } else if (!instance_exists(takedown_alvo)) {
        takedown_ativo = false;
        takedown_alvo = noone;
        takedown_tempo = 0;
        global.camera_zoom = 1;
    }
    exit;
}

if (apertou_j && !global.cutscene_ativa && !global.dialogo_ativo) {
    global.diario_aberto = true;
    global.diario_pagina = max(0, array_length(global.evidencias) - 1);
    instance_deactivate_all(true);
    audio_pause_all();
    exit;
}

if (apertou_escape && !global.cutscene_ativa && !global.dialogo_ativo) {
    global.pause_aberto = true;
    global.pause_selecionado = 0;
    pause_animacao_cartao = [0, 0, 0, 0];
    pause_input_mouse = false;
    pause_mouse_anterior_x = device_mouse_x_to_gui(0);
    pause_mouse_anterior_y = device_mouse_y_to_gui(0);
    instance_deactivate_all(true);
    audio_pause_all();
    exit;
}

var bloqueado = global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto || global.pause_aberto;
furtivo = !bloqueado && keyboard_check(vk_shift);
var velocidade_atual = furtivo ? 1.15 : max_vel;
var vetor_x = 0;
var vetor_y = 0;

// Recuperação contínua para teleporte/transição ou alteração de cenário que
// deixe a máscara parcialmente dentro de uma parede. Em condições normais
// esta busca não roda e custa apenas a checagem de colisão.
if (!bloqueado && place_meeting(x, y, Obj_parede)) {
    var recuperado_livre = false;
    for (var tentativa_recuperacao = 0; tentativa_recuperacao < 80 && !recuperado_livre; tentativa_recuperacao++) {
        var raio_recuperacao = 8 + floor(tentativa_recuperacao / 8) * 8;
        var angulo_recuperacao = (tentativa_recuperacao mod 8) * 45;
        var livre_x = clamp(x + lengthdir_x(raio_recuperacao, angulo_recuperacao), 40, room_width - 40);
        var livre_y = clamp(y + lengthdir_y(raio_recuperacao, angulo_recuperacao), 40, room_height - 40);
        if (!place_meeting(livre_x, livre_y, Obj_parede)) {
            x = livre_x;
            y = livre_y;
            recuperado_livre = true;
        }
    }
}

if (!bloqueado) {
    vetor_x = keyboard_check(ord("D")) - keyboard_check(ord("A"));
    vetor_y = keyboard_check(ord("S")) - keyboard_check(ord("W"));
}

var qud_hip = vetor_x * vetor_x + vetor_y * vetor_y;
if (qud_hip > 0) {
    var hip = sqrt(qud_hip);
    velh = (vetor_x / hip) * velocidade_atual;
    velv = (vetor_y / hip) * velocidade_atual;
} else {
    velh = 0;
    velv = 0;
}

// Resolve cada eixo em passos de no máximo 1px. Isso impede atravessar uma
// parede fina e, principalmente, deixa o personagem deslizar pela quina em
// vez de prender a máscara inteira no canto.
var restante_x = velh;
repeat (ceil(abs(restante_x))) {
    var passo_x = clamp(restante_x, -1, 1);
    if (abs(passo_x) < 0.001) break;
    if (!place_meeting(x + passo_x, y, Obj_parede) && !place_meeting(x + passo_x, y, Obj_homem_lagarto) && !place_meeting(x + passo_x, y, Obj_caracol_lab)) {
        x += passo_x;
        restante_x -= passo_x;
    } else {
        velh = 0;
        break;
    }
}

var restante_y = velv;
repeat (ceil(abs(restante_y))) {
    var passo_y = clamp(restante_y, -1, 1);
    if (abs(passo_y) < 0.001) break;
    if (!place_meeting(x, y + passo_y, Obj_parede) && !place_meeting(x, y + passo_y, Obj_homem_lagarto) && !place_meeting(x, y + passo_y, Obj_caracol_lab)) {
        y += passo_y;
        restante_y -= passo_y;
    } else {
        velv = 0;
        break;
    }
}
x = clamp(x, 40, room_width - 40);
y = clamp(y, 40, room_height - 40);
ruido_passos = (abs(velh) + abs(velv) > 0) ? (furtivo ? 18 : 82) : 0;
image_speed = (abs(velh) + abs(velv) > 0.01) ? (furtivo ? 0.48 : 1) : 0;

if (abs(velh) + abs(velv) <= 0.01) {
    // O ciclo precisa ser perceptível em tempo real: o frame anterior
    // avançava tão devagar que parecia um sprite congelado.
    idle_tempo += furtivo ? 0.07 : 0.105;
    // O sprite parado fica no chão; o movimento vem só de uma respiração
    // curta e legível, sem reaproveitar um quadro de caminhada.
    idle_bob = 0; // Origem permanece nos pés durante a respiração.
    idle_breath = sin(idle_tempo * 0.72) * 0.008;
    image_speed = 0;
    image_index = 0;
} else {
    idle_tempo = 0;
    idle_bob = 0;
    idle_breath = 0;
}

if (velh > 0) lado = 2;
if (velh < 0) lado = 3;
if (velv > 0) lado = 0;
if (velv < 0) lado = 1;
if (abs(velh) + abs(velv) > 0.01) direcao_olhar = point_direction(0, 0, velh, velv);

if (velh != 0 || velv != 0) {
    if (lado == 0) sprite_index = Spr_jogador_andando_baixo;
    if (lado == 1) sprite_index = Spr_jogador_andando_cima;
    if (lado == 2) sprite_index = Spr_jogador_andando_direita;
    if (lado == 3) sprite_index = Spr_jogador_andando_esquerda;
} else {
    if (lado == 0) sprite_index = Spr_jogador_idle_baixo;
    if (lado == 1) sprite_index = Spr_jogador_idle_cima;
    if (lado == 2) sprite_index = Spr_jogador_idle_direita;
    if (lado == 3) sprite_index = Spr_jogador_idle_esquerda;
}

// Troca rápida: 1 = cano, 2 = pistola de pregos.
if (!bloqueado && keyboard_check_pressed(ord("1")) && global.inventario_cano) global.equipamento_ativo = "cano";
if (!bloqueado && keyboard_check_pressed(ord("2")) && global.inventario_pistola) global.equipamento_ativo = "pistola";

if (vida <= 0) {
    v5_reiniciar_checkpoint();
    exit;
}
image_alpha = invulneravel ? 0.25 : 1.0;

if (!bloqueado) {
    var arma_perto = instance_nearest(x, y, Obj_armaPregos);
    if (arma_perto != noone && arma_perto.dono == noone) {
        if (point_distance(x, y, arma_perto.x, arma_perto.y) <= 90 && keyboard_check_pressed(ord("E"))) {
            arma_perto.dono = id;
            global.inventario_pistola = true;
            global.equipamento_ativo = "pistola";
            global.municao_pistola = arma_perto.municao_atual;
            bunker_audio_tocar_efeito(Snd_item, 10, false);
        }
    }

    var caixa_perto = instance_nearest(x, y, Obj_caixaPregos);
    if (caixa_perto != noone && point_distance(x, y, caixa_perto.x, caixa_perto.y) <= 60) {
        if (keyboard_check_pressed(ord("E"))) {
            // Coleta única por identificador, inclusive após voltar ou reiniciar a sala.
            if (!bunker_coletar_municao(caixa_perto.coleta_id, caixa_perto.quantidade)) {
                instance_destroy(caixa_perto);
                exit;
            }

            // Se o pente estava vazio, a própria coleta faz uma recarga
            // instantânea. O estado da arma também é destravado neste frame.
            if (global.inventario_pistola && global.municao_pistola <= 0) {
                var recarga_coleta = min(13, global.municao_reserva);
                global.municao_pistola += recarga_coleta;
                global.municao_reserva -= recarga_coleta;

                with (Obj_armaPregos) {
                    if (dono == other.id) {
                        municao_atual = global.municao_pistola;
                        recarregando = false;
                        pode_atirar = (municao_atual > 0);
                        alarm[0] = -1;
                    }
                }
            }

            caixas_mecanicas = ceil(global.municao_reserva / 13);
            global.caixas_mecanicas = caixas_mecanicas;
            bunker_audio_tocar_efeito(Snd_item, 10, false);
            instance_destroy(caixa_perto);
        }
    }

    var cano_perto = instance_nearest(x, y, Obj_cano);
    if (cano_perto != noone && cano_perto.dono == noone) {
        if (point_distance(x, y, cano_perto.x, cano_perto.y) <= 90 && keyboard_check_pressed(ord("E"))) {
            cano_perto.dono = id;
            global.inventario_cano = true;
            global.equipamento_ativo = "cano";
            bunker_audio_tocar_efeito(Snd_item, 10, false);
        }
    }
}

global.vida_jogador = vida;
caixas_mecanicas = ceil(global.municao_reserva / 13);
global.caixas_mecanicas = caixas_mecanicas;
