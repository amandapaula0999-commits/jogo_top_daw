#region /////////------ COLETAR CHAVE (OBJ_CHAVE)

//  Verifica se o jogador existe no jogo
if (instance_exists(Obj_jogador)) {
    
    // Calcula a distância entre a chave e o jogador
    var _distancia = point_distance(x, y, Obj_jogador.x, Obj_jogador.y);
    
    //  Se estiver perto o suficiente E o jogador pressionar a tecla "E"
    if (_distancia <= 42 && keyboard_check_pressed(ord("E"))) {
        
        // Ativa a chave globalmente para o Boss começar a reagir
        global.chave_pega = true;
        bunker_audio_tocar_efeito(Snd_item, 10, false);
        
        // Destrói a chave do mapa
        instance_destroy();
    }
}

#endregion ////////////////////////////////
