#region/////////------SEGUE O JOGADOR E O MOUSE

if (dono != noone && instance_exists(dono)) {
    
    // Ponto de empunhadura: a arma fica na frente do torso e em uma camada
    // menor que a do jogador (depth menor = desenhada por cima no GameMaker).
    var _escala_dono = bunker_escala_protagonista();
    var _direcao_mouse = point_direction(dono.x, dono.y - 12 * _escala_dono, mouse_x, mouse_y);
    depth = dono.depth - 100;
    visible = false;
    bunker_pose_bracos(id, _direcao_mouse, false);
    if (global.cutscene_ativa || global.dialogo_ativo || global.diario_aberto || global.pause_aberto) exit;
    if (global.equipamento_ativo != "pistola") exit;
    
    image_speed = 0;
    
    #region/////////------DISPARAR O PREGO (BOTÃO DIREITO)
    
    if (mouse_check_button_pressed(mb_right)) {
        if (!recarregando && pode_atirar) {
            if (municao_atual > 0) {
                
                // Calcula a saída do disparo na ponta do cano
                var _bocas = [[16,22],[29,14],[16,22],[2,14]];
                var _boca = _bocas[image_index];
                var _dx_boca = (_boca[0] - 16) * escala_visual;
                var _dy_boca = (_boca[1] - 16) * escala_visual;
                var _ponta_x = x + lengthdir_x(_dx_boca, image_angle) - lengthdir_y(_dy_boca, image_angle);
                var _ponta_y = y + lengthdir_y(_dx_boca, image_angle) + lengthdir_x(_dy_boca, image_angle);
                
                var _raio_prego = bunker_raio_projetil(Spr_bala, 0.30);
                var _prego = bunker_lancar_projetil(Obj_bala, dono, _ponta_x, _ponta_y, _direcao_mouse, _raio_prego);
                if (!instance_exists(_prego)) exit;
                municao_atual -= 1;
                _prego.dano = 5; // Define o dano da bala
                global.municao_pistola = municao_atual;
                if (municao_atual <= 0) pode_atirar = false;
                bunker_audio_tocar_efeito(Snd_pistola_pregos, 20, false);
                bunker_emitir_ruido(x, y, 560, 110);
                
            } 
        } 
    }
    
    #endregion////////////////////////////////
    
    
    #region/////////------SISTEMA DE RECARGA (BOTÃO ESQUERDO)
    
    if (mouse_check_button_pressed(mb_left) && !recarregando) {
        if (global.municao_reserva > 0 && municao_atual < municao_maxima) {
            
            recarregando = true; // Trava o disparo durante a recarga
            pode_atirar = false;
            
            // Define o tempo da recarga (30 frames = 0.5s)
            alarm[0] = 30; 
            
        }
    }
    
    #endregion////////////////////////////////

    // Mantém a instância e o inventário global sincronizados depois de uma
    // coleta instantânea ou de uma troca de sala.
    if (!recarregando && municao_atual != global.municao_pistola) {
        municao_atual = global.municao_pistola;
        pode_atirar = (municao_atual > 0);
    }
    
} else {
    visible = true;
}

#endregion////////////////////////////////
