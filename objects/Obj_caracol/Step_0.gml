if (global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto) {
    image_speed = 0;
    exit;
}
// Segunda barreira contra spawns presos: cobre a ordem de criação da sala e
// só custa uma checagem curta no início da vida do inimigo.
if (spawn_verificacao > 0) {
    if (place_meeting(x, y, Obj_parede)) {
        var spawn_liberado_step = false;
        for (var tentativa_spawn_step = 0; tentativa_spawn_step < 80 && !spawn_liberado_step; tentativa_spawn_step++) {
            var raio_spawn_step = 12 + floor(tentativa_spawn_step / 8) * 8;
            var angulo_spawn_step = (tentativa_spawn_step mod 8) * 45;
            var candidato_spawn_x = clamp(x + lengthdir_x(raio_spawn_step, angulo_spawn_step), 72, room_width - 72);
            var candidato_spawn_y = clamp(y + lengthdir_y(raio_spawn_step, angulo_spawn_step), 88, room_height - 72);
            if (!place_meeting(candidato_spawn_x, candidato_spawn_y, Obj_parede)) {
                x = candidato_spawn_x;
                y = candidato_spawn_y;
                alvo_x = x;
                alvo_y = y;
                posicao_inicial_x = x;
                posicao_inicial_y = y;
                patrulha_alvo_x = x;
                patrulha_alvo_y = y;
                spawn_liberado_step = true;
            }
        }
    }
    spawn_verificacao--;
}
if (feedback_tempo > 0) feedback_tempo--;
if (takedown_ativo) {
    estado = "TAKEDOWN";
    alerta = 0;
    image_speed = 0;
    sprite_index = Spr_inimigo_parado_baixo;
    image_index = 0;
    exit;
}
if (vida <= 0 && variable_instance_exists(id,"guarda_arquivo") && guarda_arquivo) global.v53_arquivo_livre=true;
if (vida <= 0 && !morrendo) {
    vida = 0;
    morrendo = true;
    estado = "DERROTADO";
    sprite_index = Spr_inimigo_morte;
    image_index = 0;
    image_speed = 0;
    tomou_dano = false;
}
if (morrendo) {
    morte_frame = min(3, morte_frame + 0.105);
    image_index = floor(morte_frame);
    if (morte_frame >= 3) {
        morte_espera++;
        if (morte_espera > 24) image_alpha = max(0, image_alpha - 0.035);
        if (image_alpha <= 0) instance_destroy();
    }
    exit;
}
if (!instance_exists(Obj_jogador)) exit;
var jogador = instance_find(Obj_jogador, 0);
var dist = point_distance(x, y, jogador.x, jogador.y);
var vendo = bunker_visivel(x, y, direcao_atual, jogador.x, jogador.y, jogador.furtivo);
var ouvindo_passos = jogador.ruido_passos > 0 && dist <= jogador.ruido_passos
    && collision_line(x, y, jogador.x, jogador.y, Obj_parede, false, true) == noone;
if (vendo) {
    alerta = min(100, alerta + (jogador.furtivo ? 1.8 : 3.3));
    alvo_x = jogador.x;
    alvo_y = jogador.y;
    memoria_visual = 105;
} else {
    alerta = max(0, alerta - 0.7);
    if (memoria_visual > 0) memoria_visual--;
}
if (ouvindo_passos && !vendo && estado != "PERSEGUINDO") {
    alerta = min(99, alerta + 1.4);
    alvo_x = jogador.x;
    alvo_y = jogador.y;
    estado = "INVESTIGANDO";
    busca_tempo = 150;
}
// Ruídos revelam a origem do som, sem revelar a posição futura do jogador.
if (global.ruido_tempo > 0 && ultimo_ruido != global.ruido_serial
&& point_distance(x, y, global.ruido_x, global.ruido_y) <= global.ruido_raio) {
    ultimo_ruido = global.ruido_serial;
    alvo_x = global.ruido_x;
    alvo_y = global.ruido_y;
    alerta = max(alerta, 55);
    if (estado != "PERSEGUINDO") estado = "INVESTIGANDO";
    busca_tempo = 180;
}
if (tomou_dano && estado != "PERSEGUINDO") {
    estado = "INVESTIGANDO";
    busca_tempo = 180;
    alerta = max(alerta, 65);
}
if (alerta >= 100) estado = "PERSEGUINDO";
if (estado == "PERSEGUINDO" && memoria_visual <= 0) {
    estado = "INVESTIGANDO";
    busca_tempo = 180;
}
var antes_x = x;
var antes_y = y;
switch (estado) {
    case "PATRULHA":
        // Patrulha por destinos diagonais alternados, em vez de um quadrado
        // previsível. O índice é determinístico por spawn, mas cada troca
        // muda o ângulo e a distância para criar rotas flanqueáveis.
        if (tempo_parado > 0) tempo_parado--;
        patrulha_tempo--;
        if (patrulha_tempo <= 0 || point_distance(x, y, patrulha_alvo_x, patrulha_alvo_y) < 14) {
            var patrulha_direcoes = [0, 35, 80, 125, 170, 215, 260, 305];
            var indice_rota = (patrulha_indice + floor(abs(x + y)) mod 8) mod 8;
            var distancia_rota = 90 + ((floor(abs(x * 7 + y * 11)) + patrulha_indice * 29) mod 150);
            direcao_atual = patrulha_direcoes[indice_rota];
            patrulha_alvo_x = clamp(x + lengthdir_x(distancia_rota, direcao_atual), 72, room_width - 72);
            patrulha_alvo_y = clamp(y + lengthdir_y(distancia_rota, direcao_atual), 88, room_height - 72);
            if(variable_instance_exists(id,"guarda_arquivo") && guarda_arquivo) {
                patrulha_alvo_x=clamp(patrulha_alvo_x,1150,1280);
                patrulha_alvo_y=clamp(patrulha_alvo_y,430,600);
            }
            patrulha_indice = (patrulha_indice + 3) mod 8;
            patrulha_tempo = 110 + (patrulha_indice * 17);
            tempo_parado = 12 + (patrulha_indice mod 24);
        }
        if (tempo_parado <= 0) mp_potential_step_object(patrulha_alvo_x, patrulha_alvo_y, velocidade, Obj_parede);
        break;
    case "PERSEGUINDO":
        mp_potential_step_object(alvo_x, alvo_y, velocidade_chase, Obj_parede);
        break;
    case "INVESTIGANDO":
        busca_tempo--;
        if (point_distance(x, y, alvo_x, alvo_y) > 12) {
            mp_potential_step_object(alvo_x, alvo_y, 1.1, Obj_parede);
        } else if (busca_tempo mod 40 == 0) direcao_atual = (direcao_atual + 90) mod 360;
        if (busca_tempo <= 0 && !vendo) estado = "VOLTANDO";
        break;
    case "VOLTANDO":
        mp_potential_step_object(posicao_inicial_x, posicao_inicial_y, velocidade, Obj_parede);
        if (point_distance(x, y, posicao_inicial_x, posicao_inicial_y) < 8) {
            estado = "PATRULHA";
            tempo_parado = 80;
        }
        break;
}
speed = 0;
var dx = x - antes_x;
var dy = y - antes_y;
var movendo = abs(dx) + abs(dy) > 0.01;
if (movendo) direcao_atual = point_direction(antes_x, antes_y, x, y);
lado_anim = floor((direcao_atual + 45) / 90) mod 4;
// v5.33: selecionar caminhada ou repouso sem reiniciar a cada frame.
var sprite_alvo = Spr_inimigo_parado_baixo;
switch (lado_anim) {
    case 0: sprite_alvo = movendo ? Spr_inimigo_andando_direita : Spr_inimigo_parado_direita; break;
    case 1: sprite_alvo = movendo ? Spr_inimigo_andando_cima : Spr_inimigo_parado_cima; break;
    case 2: sprite_alvo = movendo ? Spr_inimigo_andando_esqueda : Spr_inimigo_parado_esqueda; break;
    case 3: sprite_alvo = movendo ? Spr_inimigo_andando_baixo : Spr_inimigo_parado_baixo; break;
}
if (sprite_index != sprite_alvo) {
    sprite_index = sprite_alvo;
    image_index = 0;
}
image_speed = movendo ? 1 : 0;
if (!movendo) image_index = 0;
