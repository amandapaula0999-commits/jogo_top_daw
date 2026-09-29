/// Criatura comum: menor que o chefe, percepção gradual e busca localizada.
vida_max = 30;
vida = vida_max;
tomou_dano = false;
morrendo = false;
feedback_tempo = 0;
feedback_texto = "";
morte_frame = 0;
morte_espera = 0;
mask_index = Spr_mascara_inimigo;
image_xscale = bunker_escala_inimigo();
image_yscale = image_xscale;
image_speed = 0;
estado = "PATRULHA";
alerta = 0;
memoria_visual = 0;
busca_tempo = 0;
ultimo_ruido = -1;
alvo_x = x;
alvo_y = y;
posicao_inicial_x = x;
posicao_inicial_y = y;
direcao_atual = 180;
passos_dados = 0;
tempo_parado = 60;
patrulha_alvo_x = x;
patrulha_alvo_y = y;
patrulha_tempo = 0;
patrulha_indice = floor(abs(x * 3 + y * 5)) mod 8;
// A checagem também continua por alguns frames: em salas com muitas
// instâncias, uma parede pode ser criada depois do Create deste inimigo.
spawn_verificacao = 8;

// Os spawns são criados depois das paredes pelo Obj_mapa, então é possível
// corrigir aqui qualquer coordenada que tenha caído dentro de uma cobertura.
if (place_meeting(x, y, Obj_parede)) {
    var inimigo_liberado = false;
    for (var tentativa_inimigo = 0; tentativa_inimigo < 80 && !inimigo_liberado; tentativa_inimigo++) {
        var raio_inimigo = 12 + floor(tentativa_inimigo / 8) * 8;
        var angulo_inimigo = (tentativa_inimigo mod 8) * 45;
        var livre_inimigo_x = clamp(x + lengthdir_x(raio_inimigo, angulo_inimigo), 72, room_width - 72);
        var livre_inimigo_y = clamp(y + lengthdir_y(raio_inimigo, angulo_inimigo), 88, room_height - 72);
        if (!place_meeting(livre_inimigo_x, livre_inimigo_y, Obj_parede)) {
            x = livre_inimigo_x;
            y = livre_inimigo_y;
            inimigo_liberado = true;
        }
    }
}

// A rota inicial deve acompanhar a posição corrigida, nunca o ponto preso.
alvo_x = x;
alvo_y = y;
posicao_inicial_x = x;
posicao_inicial_y = y;
patrulha_alvo_x = x;
patrulha_alvo_y = y;

velocidade = 0.9;
velocidade_chase = 1.9;
lado_anim = 2;
takedown_ativo = false;
