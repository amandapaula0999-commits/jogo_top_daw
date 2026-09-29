# Escape The Bunker v5.18 — Sala 10 / Pé de Cabra

Projeto completo integrado à base Escape_The_Bunker_v5_16_CORREDOR_FASE_2_COMPLETO(2).zip enviada nesta solicitação. O arquivo foi verificado por CRC e tem o mesmo conteúdo da base v5.16 recebida anteriormente. Esta entrega aplica a orientação mais recente: o pé de cabra está na parede desde a primeira visita; não é necessário coletar uma arma antes nem retornar para fazê-lo aparecer.

Extraia todo o ZIP e abra tcc.yyp no GameMaker.

## Fluxo para testar

1. Na Sala dos Funcionários, pressione E diante da caixinha de chaves.
2. Volte ao corredor da Fase 2 e use a porta no centro da parede superior. Ela exige a Chave da Sala de Ferramentas, inclusive com o debug que libera outras portas.
3. Ao entrar na Sala 10, o personagem comenta: “Ferramentas comuns, bancadas e prateleiras. À primeira vista, nada de especial.” Depois nota o pé de cabra pendurado.
4. Aproxime-se do painel na parede superior e pressione E para examinar: “Um pé de cabra. Pode ser útil para abrir a sala fria.” Pressione E novamente para coletar.
5. O objeto desaparece do suporte e permanece no inventário durante a partida. Reentrar ou reiniciar pelo checkpoint não duplica o item. Novo Jogo reinicia a coleta.
6. Saia com E pela porta central da parede inferior. Bancada e prateleiras também possuem descrições simples com E.

## Geometria e arte

- Room_Ferramentas_N2: 512 × 344.
- Porta do corredor: (624,95), centro da parede superior. Chegada: (256,274).
- Porta interna: (256,316), centro inferior. Volta ao corredor: (624,184).
- Onze colisores estáticos cobrem paredes contínuas e os móveis; somente a soleira central possui passagem.
- Os pontos de interação ficam em posições alcançáveis, diante dos objetos.
- Cenário, suporte, pé de cabra e mensagens são sprites estáticos. O pé de cabra está em (274,48), no painel da parede, e some após a coleta.
- A prévia usa os sprites reais do projeto e o jogador original na escala do jogo. É uma composição técnica, não uma captura do GameMaker.

## Sala fria

O ZIP-base não contém uma Room/porta de sala fria. Foi preparado o controle de acesso no sistema de portas existente: uma futura Obj_porta com chave_exigida="pe_cabra" exige global.inventario_pe_cabra e mostra a mensagem adequada enquanto o item estiver ausente. A coleta não consome a ferramenta. O interior, a posição e a ligação física da sala fria não foram criados nesta alteração.

## Código

Scr_fluxo_v5: sala10_entrar, sala10_sprites_atualizar, sala10_step e verificações de acesso em v53_porta_liberada.
Scr_bunker: inicialização de global.inventario_pe_cabra e câmera da nova Room.
Obj_mapa: portas e atualização das interações.
Obj_porta: mensagens de bloqueio.

O estado do inventário segue a base: persistência em memória entre rooms e respawns da mesma partida. Não foi acrescentado salvamento de inventário entre fechamentos do aplicativo. O sistema de armas e munição original permanece o da v5.16.

## Validação e limites

Veja VALIDACAO_V5_18.txt para os resultados dos testes de eventos GML com APIs simuladas e validação estrutural dos recursos. Os testes cobrem chave, primeira visita, coleta, reentrada, checkpoint, Novo Jogo, bloqueio durante interfaces, futura regra da sala fria e acesso físico às interações. Também verificam os acessos anteriores do corredor, descanso, manutenção e colisões gerais.

GameMaker/Igor não está disponível neste ambiente; não foi feita compilação VM/YYC nem execução gráfica nativa. É necessário conferir o teste final no editor.

O teste histórico geral test_regressions.cjs contém uma verificação de art_sources/menu_diegetico_v44.png, fonte de arte ausente no ZIP-base. Os conjuntos relevantes foram executados separadamente; o registro não afirma aprovação desse teste histórico completo.
