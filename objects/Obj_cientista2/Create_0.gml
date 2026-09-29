fala_1 = "ARQUIVISTA: Os relatórios retidos mencionam este setor. A versão enviada para renovação omitiu a contenção subterrânea.";
fala_2 = "ARQUIVISTA: Os tambores fazem parte de um circuito automático. O impacto da criatura pode derrubá-los; mantenha distância da onda no chão.";
fala_3 = "ARQUIVISTA: Quando a contenção vaza, a carapaça perde a rigidez. É uma oportunidade de abrir caminho sem desperdiçar todos os pregos.";
fala_4 = "ARQUIVISTA: Você veio inspecionar uma empresa. Preserve o diário e procure a saída: sobreviver vem antes de concluir qualquer procedimento.";
#region/////////------INICIALIZAÇÃO DO DIÁLOGO 

// Texto das falas do NPC em variáveis individuais





// Controle de qual fala está ativa (1, 2, 3 ou 4)
fala_atual_num = 1;
total_falas = 4;

// Controle de exibição e trava
exibir_dialogo = false;

// Variáveis para o efeito de digitação (maquininha)
texto_atual = "";
texto_completo = "";
char_index = 0;
velocidade_texto = 0.5;

#endregion////////////////////////////////



#region/////////------TRAVA GLOBAL DE DIÁLOGO

global.dialogo_ativo = false;

#endregion////////////////////////////////
