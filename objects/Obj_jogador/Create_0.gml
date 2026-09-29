/// Jogador - movimento, vida e inventário persistente entre rooms
// Ritmo mais pesado: o jogador continua responsivo, mas não atravessa as
// salas como em um jogo de ação. A máscara separada cobre somente os pés.
max_vel = 2.65;
// Escala visual separada da máscara dos pés, preservando corredores e portas.
escala_personagem = bunker_escala_protagonista();
furtivo = false;
ruido_passos = 0;
velh = 0;
velv = 0;
lado = 0;
mask_index = Spr_mascara_jogador;
idle_tempo = 0;
idle_bob = 0;
idle_breath = 0;
direcao_olhar = 90;
takedown_ativo = false;
takedown_alvo = noone;
takedown_alvo_pronto = noone;
takedown_pronto = false;
takedown_tempo = 0;
takedown_duracao = 44;
takedown_direcao = 90;

vida_max = 100;
if (!variable_global_exists("vida_jogador")) global.vida_jogador = vida_max;
vida = clamp(global.vida_jogador, 1, vida_max);
invulneravel = false;

if (!variable_global_exists("inventario_cano")) global.inventario_cano = false;
if (!variable_global_exists("inventario_pistola")) global.inventario_pistola = false;
if (!variable_global_exists("equipamento_ativo")) global.equipamento_ativo = "nenhum";
if (!variable_global_exists("municao_pistola")) global.municao_pistola = 4;
if (!variable_global_exists("caixas_mecanicas")) global.caixas_mecanicas = 0;
if (!variable_global_exists("municao_reserva")) global.municao_reserva = global.caixas_mecanicas * 13;
if (!variable_global_exists("cutscene_ativa")) global.cutscene_ativa = false;
if (!variable_global_exists("dialogo_ativo")) global.dialogo_ativo = false;
if (!variable_global_exists("diario_aberto")) global.diario_aberto = false;
if (!variable_global_exists("diario_pagina")) global.diario_pagina = 0;
if (!variable_global_exists("pause_aberto")) global.pause_aberto = false;
if (!variable_global_exists("pause_selecionado")) global.pause_selecionado = 0;
pause_animacao_cartao = [0, 0, 0, 0];
pause_input_mouse = false;
pause_mouse_anterior_x = device_mouse_x_to_gui(0);
pause_mouse_anterior_y = device_mouse_y_to_gui(0);
pause_pad_anterior = -1;
pause_pad_eixo_x = 0;
pause_pad_eixo_y = 0;
if (!variable_global_exists("camera_zoom")) global.camera_zoom = 1;
if (!variable_global_exists("vitoria_ativa")) global.vitoria_ativa = false;

caixas_mecanicas = ceil(global.municao_reserva / 13);
global.caixas_mecanicas = caixas_mecanicas;

if (!window_get_fullscreen()) window_set_fullscreen(true);
if (!instance_exists(Obj_mapa)) instance_create_depth(0, 0, 10000, Obj_mapa);

// Recebe a posição da porta ou do evento da sala anterior.
if (variable_global_exists("spawn_room") && global.spawn_room == room) {
    x = global.spawn_x;
    y = global.spawn_y;
    global.spawn_room = -1;
}

// v5.38: converte entradas/checkpoints do corredor antigo para locais seguros.
if (room == Room_Corredor_Pos && (x > room_width - 24 || y > room_height - 24 || x == 683)) {
    if (y >= 500) { x=352; y=286; }
    else if (y <= 230) { x=352; y=126; }
    else { x=550; y=190; }
}

// Recupera spawns que tenham ficado sobre uma parede após uma troca de sala
// ou depois de uma alteração de layout. O personagem é deslocado para o
// primeiro ponto livre próximo, evitando nascer/travar dentro do obstáculo.
if (place_meeting(x, y, Obj_parede)) {
    var spawn_liberado = false;
    for (var tentativa_spawn = 0; tentativa_spawn < 80 && !spawn_liberado; tentativa_spawn++) {
        var raio_spawn = 8 + floor(tentativa_spawn / 8) * 8;
        var angulo_spawn = (tentativa_spawn mod 8) * 45;
        var candidato_x = clamp(x + lengthdir_x(raio_spawn, angulo_spawn), 40, room_width - 40);
        var candidato_y = clamp(y + lengthdir_y(raio_spawn, angulo_spawn), 40, room_height - 40);
        if (!place_meeting(candidato_x, candidato_y, Obj_parede)) {
            x = candidato_x;
            y = candidato_y;
            spawn_liberado = true;
        }
    }
}

checkpoint_x = x;
checkpoint_y = y;
if(room==Room_Corredor_Pos) {
    // Ponto seguro ao pé da porta dos Arquivos, também ao voltar da arena.
    v5_checkpoint_gravar(room,352,286);
    checkpoint_x=352;checkpoint_y=286;
}
// A escada salva o checkpoint somente depois de o spawn ter sido aplicado e
// corrigido contra paredes. Assim morrer em qualquer lado retorna ao patamar
// seguro da última transição, sem apagar o estado global da progressão.
if(variable_global_exists("v5_checkpoint_transicao_pendente") && global.v5_checkpoint_transicao_pendente) {
    v5_checkpoint_gravar(room,x,y);
    checkpoint_x=x;checkpoint_y=y;
    global.v5_checkpoint_transicao_pendente=false;
}
if(variable_global_exists("v5_respawn_pendente") && global.v5_respawn_pendente) {
    invulneravel=true;alarm[0]=120;global.v5_respawn_pendente=false;
}
if (room==Room_Desmoronada && variable_global_exists("v5_queda_pendente") && global.v5_queda_pendente) {
    v5_checkpoint_gravar(room,x,y);
    global.v5_queda_pendente=false;
}

// Recria na mão os itens que já pertencem ao inventário. As cópias de chão
// continuam disponíveis para quem ainda não as coletou.
if (global.inventario_cano) {
    var cano_salvo = instance_create_layer(x, y, "Instances", Obj_cano);
    cano_salvo.dono = id;
}
if (global.inventario_pistola) {
    var arma_salva = instance_create_layer(x, y, "Instances", Obj_armaPregos);
    arma_salva.dono = id;
    arma_salva.municao_atual = global.municao_pistola;
}
