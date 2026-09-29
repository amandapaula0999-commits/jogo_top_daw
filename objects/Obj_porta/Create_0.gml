/// Porta de transição
destino = Room_Desmoronada;
spawn_x = 120;
spawn_y = 384;
rotulo = "PORTA";
largura = 48;
altura = 86;
ativa = true;
raio_interacao = 82;
// Opcional: exigir presença no vestíbulo, sem alcance através das paredes.
usar_area_interacao = false;
area_esquerda = 0;
area_topo = 0;
area_direita = 0;
area_fundo = 0;
escala_visual = 1.5;
porta_verde = false;
requer_orientacao = false;
mensagem_tempo = 0;
pulso_luz = random(100);

// As portas internas usam os quadros enviados pelo grupo. A porta comum é
// clara; o acesso à contenção usa a variante vermelha de área restrita.
visual_bunker = false;
visual_restrita = false;
visual_estatico = false; // quando true, a arte da porta está como sprite estático na Room
abrindo = false;
quadro_porta = 0;
velocidade_porta = 0.34;
espera_aberta = 5;

tipo_passagem="porta";
tempo_duto=0;

chave_exigida="";
saida_final=false;
mensagem_bloqueio="FALE COM A SECRETARIA PRIMEIRO";
