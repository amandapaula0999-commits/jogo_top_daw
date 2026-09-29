fala_1="CIENTISTA: Obrigado por afastar aquela criatura. Tudo virou um caos depois do desabamento. As equipes perderam contato entre os setores.";
fala_2="CIENTISTA: Ouvi pedidos de ajuda pelo rádio. Se encontrar um aparelho funcionando, tente falar com quem ainda está lá fora.";
fala_3="CIENTISTA: Leve esta chave. Ela abre a porta no alto à direita e dá acesso ao corredor depois dos escombros.";
fala_4="CIENTISTA: A porta da contenção fica na parede superior do corredor. A chave da escadaria está naquele setor. Cuidado ao entrar.";
#region/////////------INICIALIZAÇÃO DO DIÁLOGO 

// Texto das falas do NPC em variáveis individuais





// Controle de quantidade e progressão das falas
fala_atual_num = 1;
total_falas = 4; // Altere este número de acordo com a quantidade de falas do NPC

// Controle de exibição e trava
exibir_dialogo = false;

// Variáveis para o efeito de digitação (maquininha)
texto_atual = "";
texto_completo = "";
char_index = 0;
velocidade_texto = 0.5;

#endregion////////////////////////////////
