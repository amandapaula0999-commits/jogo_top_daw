if(global.pause_aberto) exit;
// Não congela a IA abrindo uma conversa enquanto o guarda ainda está vivo.
if(room==Room_Biblioteca && !v53_arquivo_liberado()) exit;
if (global.cutscene_ativa || global.diario_aberto) exit;
#region/////////------SISTEMA DE DIÁLOGO E INTERAÇÃO 

// CARREGAMENTO DA FALA ATUAL
if (fala_atual_num == 1 && variable_instance_exists(id, "fala_1")) texto_completo = fala_1;
if (fala_atual_num == 2 && variable_instance_exists(id, "fala_2")) texto_completo = fala_2;
if (fala_atual_num == 3 && variable_instance_exists(id, "fala_3")) texto_completo = fala_3;
if (fala_atual_num == 4 && variable_instance_exists(id, "fala_4")) texto_completo = fala_4;


// VERIFICAÇÃO DE PROXIMIDADE DO JOGADOR

var _jogador = instance_nearest(x, y, Obj_jogador);


//  CONTROLE DE ABERTURA E NAVEGAÇÃO DO DIÁLOGO

if (!exibir_dialogo) {
    
 #region ----- ESTADO: DIÁLOGO FECHADO
    
    if (_jogador != noone) {
        var _dialogo_livre = !variable_global_exists("dialogo_ativo") || !global.dialogo_ativo;
        
        // Abre a conversa se pressionar Espaço, estiver perto e nenhum diálogo estiver ativo
        if (keyboard_check_pressed(ord("E")) && point_distance(x, y, _jogador.x, _jogador.y) < 78 && _dialogo_livre) {
            exibir_dialogo      = true;
            global.dialogo_ativo = true; // Trava outros NPCs
            fala_atual_num      = 1;
            char_index          = 0;
            texto_atual         = "";
        }
    }
    
    #endregion
    
} else {

 #region ------ ESTADO: DIÁLOGO ABERTO
    
    // Avança ou completa a fala ao pressionar Espaço
    if (keyboard_check_pressed(vk_space)) {
        
        // Se ainda está digitando, exibe a frase inteira imediatamente
        if (char_index < string_length(texto_completo)) {
            char_index  = string_length(texto_completo);
            texto_atual = texto_completo;
        } 
        // Se já completou a frase, avança para a próxima ou encerra
        else {
            if (fala_atual_num < total_falas) {
                fala_atual_num += 1;
                char_index      = 0;
                texto_atual     = "";
            } else {
                if(room==Room_Biblioteca && !global.v53_chave_cientista) {
                    global.v53_chave_cientista=true;
                    bunker_audio_tocar_efeito(Snd_item,10,false);
                }
                exibir_dialogo       = false;
                global.dialogo_ativo = false; // Destrava o sistema para outros NPCs
                fala_atual_num       = 1;
            }
        }
    }

 #endregion

 #region ------ EFEITO DE DIGITAÇÃO PROGRESSIVA
    
    if (char_index < string_length(texto_completo)) {
        char_index += velocidade_texto;
        texto_atual = string_copy(texto_completo, 1, floor(char_index));
    }
    
    #endregion
}

#endregion////////////////////////////////
