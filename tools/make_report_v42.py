#!/usr/bin/env python3
"""Relatório formal da V4.2. Requer ReportLab; prévias técnicas são opcionais."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image

repo=Path(__file__).resolve().parents[1]
workspace=repo.parent
output=workspace/'output/pdf/Relatorio_V4_2_Escape_The_Bunker.pdf'
output.parent.mkdir(parents=True,exist_ok=True)
fontdir=Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('DV',str(fontdir/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DV-B',str(fontdir/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DV',normal='DV',bold='DV-B',italic='DV',boldItalic='DV-B')
green=colors.HexColor('#244E3E'); brown=colors.HexColor('#725139'); ink=colors.HexColor('#24302A'); muted=colors.HexColor('#607066')
body=ParagraphStyle('body',fontName='DV',fontSize=9.3,leading=13.6,textColor=ink,spaceAfter=8)
small=ParagraphStyle('small',parent=body,fontSize=7.8,leading=11,textColor=muted,spaceAfter=6)
head=ParagraphStyle('head',parent=body,fontName='DV-B',fontSize=20,leading=25,textColor=green,spaceAfter=14)
sub=ParagraphStyle('sub',parent=body,fontName='DV-B',fontSize=12,leading=16,textColor=brown,spaceBefore=8,spaceAfter=7)
center=ParagraphStyle('center',parent=body,alignment=TA_CENTER,fontSize=11,leading=17)
cover=ParagraphStyle('cover',parent=head,alignment=TA_CENTER,fontSize=26,leading=32)
cell=ParagraphStyle('cell',parent=body,fontSize=8.3,leading=11.5,spaceAfter=0)
cellhead=ParagraphStyle('cellhead',parent=cell,fontName='DV-B',textColor=colors.white)
story=[]
def p(txt,style=body):return Paragraph(txt,style)
def add(txt,style=body):story.append(p(txt,style))
def table(rows,widths):
    t=Table([[p(str(value),cellhead if i==0 else cell) for value in row] for i,row in enumerate(rows)],colWidths=widths,hAlign='LEFT',repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),green),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#EEF2EC'),colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),1,green)]))
    story.append(t);story.append(Spacer(1,10))
def page(title):story.append(PageBreak());add(title,head)
def figure(name,caption,width=504):
    f=workspace/'tmp/qa_v42'/name
    if f.exists():
        image=Image(str(f));iw,ih=image.imageWidth,image.imageHeight
        image.drawWidth=width;image.drawHeight=width*ih/iw
        story.append(image);story.append(Spacer(1,5));add(caption,small)
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(colors.HexColor('#CBD4CB'));canvas.line(48,43,564,43)
    canvas.setFont('DV',7);canvas.setFillColor(muted);canvas.drawString(48,29,'ESCAPE THE BUNKER  |  ATUALIZAÇÃO V4.2  |  05/09/2026');canvas.drawRightString(564,29,str(doc.page));canvas.restoreState()

add('COLÉGIO ESTADUAL JOÃO MANOEL MONDRONE<br/>ENSINO FUNDAMENTAL, MÉDIO, NORMAL E PROFISSIONAL',ParagraphStyle('school',parent=center,fontName='DV-B',fontSize=11.3))
story.append(Spacer(1,38))
add('Luiz Henrique de Matos Muller<br/>Isabely Carrer Magenis<br/>Luis Augusto Mendes de Oliveira<br/>Amanda Pereira de Paula',center)
story.append(Spacer(1,62))
add('ESCAPE THE BUNKER',cover)
add('Relatório de correções e atualização V4.2',ParagraphStyle('subtitle',parent=center,fontSize=15,leading=21,textColor=brown))
story.append(Spacer(1,24))
add('Iluminação, áudio, consistência visual,<br/>ataque do Boss, furtividade e inspeção ambiental.',center)
story.append(Spacer(1,30))
add('<b>Responsável pelos testes:</b><br/>Luiz Henrique Matos Muller',center)
story.append(Spacer(1,28))
add('Implementação e verificações automatizadas concluídas.<br/>Homologação no runtime GameMaker/Wine pendente.',ParagraphStyle('status',parent=center,fontSize=10,textColor=green))
story.append(Spacer(1,39))
add('Medianeira - PR<br/>2026',center)

page('1. Iluminação e áudio')
add('O relatório de testes indicou flashes rápidos, iluminação excessiva e trilhas em situações incorretas. A revisão encontrou um pulso de brilho aplicado à tela inteira e um clarão branco na sequência da queda. Esses efeitos foram corrigidos no código; isso não constitui diagnóstico confirmado de falha do driver ou da engine.')
add('Renderização estabilizada',sub)
add('A iluminação passa pelo Draw End, antes da interface, usando blend normal e limites explícitos de opacidade. O subsolo recebe uma sombra global estável de até 30%, sem malha de alpha por vértice. A camada verde da sala de integração foi removida e o efeito da queda fica restrito a uma tonalidade quente de baixa intensidade. Não há pulso periódico de brilho sobre a tela inteira.')
add('O cenário detalhado é armazenado em uma surface. Em caso de perda, ele é reconstruído antes de ser apresentado; se não for possível ativar o alvo, o desenho usa a tela diretamente. O estado de desenho é restaurado, e os recursos auxiliares são liberados ao sair da sala. A iluminação não depende dessa surface. [1, 2]')
add('Compatibilidade e desempenho',sub)
add('A gravação do monitor secundário foi analisada quadro a quadro: o jogo ocupava 1024x768 no canto superior esquerdo da captura 1920x1080, enquanto o restante era a área de trabalho. O problema é a diferença entre o canvas 16:9 original e a tela 4:3, não um segundo canvas preto dentro do jogo. A viewport passou a ler o tamanho real da janela e a reduzir a largura lógica quando necessário, preservando a proporção. O cenário estático continua em cache; abaixo de 28 FPS por 45 frames, granulação, rachaduras e rebites são omitidos e a surface é reconstruída uma vez. Após 300 frames acima de 48 FPS, os detalhes retornam. Isso estabelece uma meta prática de 30 FPS, que ainda precisa ser medida no runtime do GameMaker em cada máquina.')
add('Direção musical por contexto',sub)
table([['Sala ou evento','Trilha / comportamento'],['Menu, exterior e recepção','Ambiente diurno original.'],['Integração antes / depois da explosão','Ambiente diurno; silêncio após o disparo do evento.'],['Subsolo sem ameaça detectada','Exploração: ambiente do bunker.'],['Inimigo com suspeita ou investigando','Tensão: loop industrial discreto.'],['Perseguição / Boss vivo na contenção','Combate: pulso mais marcado.'],['Boss vencido','Retorno à exploração.']],[226,278])
add('Há uma única voz de música. A troca reduz o ganho, encerra o loop anterior e só então inicia o seguinte; não sobrepõe faixas. Pausa e diário preservam a reprodução para a retomada. Os sons de itens, portas e impactos continuam como efeitos independentes.',small)

page('2. Boss original e novo ataque')
add('A orientação corrigida foi respeitada: o Boss existente foi preservado. Os 51 arquivos de seus sprites, metadados e camadas foram comparados byte por byte com a V4.1 e permanecem idênticos. O redesign gerado durante a tentativa inicial não faz parte do projeto entregue.')
add('O movimento usa os próprios pixels do sprite original. O braço gira ao redor do ombro; o corpo acompanha a preparação e a recuperação. A pose inicial composta foi comparada pixel a pixel com a imagem original. A técnica usa recortes e rotação nativos, sem redesenhar o personagem. [3]')
figure('boss_strip.png','Prévia técnica das poses do ataque, desenhada a partir do código e dos sprites originais. Não é captura do GameMaker.')
table([['Fase','Comportamento'],['Preparação','65 passos de aviso, círculo no chão e braço levantado.'],['Impacto','Passo 66; raio de 160 pixels e 24 de dano, aplicado uma única vez.'],['Cenário','Derruba os barris alcançados pela onda. Obstáculos bloqueiam a propagação.'],['Recuperação','Encerra no passo 106; intervalo de 210 passos antes de outro golpe.'],['Interrupção','Contato com o ácido cancela a preparação e abre a vulnerabilidade anterior.']],[115,389])
add('A 60 FPS, o aviso dura aproximadamente 1,1 segundo. O dano de contato fica desativado durante o golpe e enquanto o Boss está caído. Os barris mantêm sua reposição em 10 segundos para que o confronto continue possível sem munição. [4]',small)

page('3. Recursos e furtividade')
add('O protagonista continua sendo um civil em uma vistoria. O estoque reduzido impede tratar a pistola de pregos como solução para todos os encontros. A circulação usa os móveis existentes como cobertura, com visão bloqueada pela geometria dos obstáculos.')
table([['Recurso','Quantidade'],['Pregos na ferramenta ao encontrá-la','4'],['Pacote da sala demolida','2'],['Pacote da sala de pesquisa','3'],['Total inicial da campanha','9']],[344,160])
add('As duas caixas antigas da arena foram removidas. Cada pacote tem um identificador único, persistente entre salas e reinícios de sala. Voltar ao local não repõe munição. Iniciar um novo jogo reinicia o inventário e as coletas.')
add('Percepção e perseguição',sub)
table([['Situação','Efeito'],['Caminhada normal','Velocidade 2,65; passos audíveis até 82 pixels.'],['Shift pressionado','Velocidade 1,15; passos audíveis até 18 pixels.'],['Visão','Cone de 116 graus; alcance de 270 pixels, reduzido a 145 em furtividade.'],['Paredes e móveis','Bloqueiam a linha de visão; proximidade não permite enxergar através deles.'],['Suspeita','Aumenta gradualmente. Ruídos iniciam investigação da origem do som.'],['Perda de contato','O inimigo busca a última posição vista, depois retorna à patrulha.']],[140,364])
add('Disparos e golpes emitem ruído. A navegação tenta contornar obstáculos; esse método deve ser observado no runtime, especialmente nas quinas. A verificação estática confirmou rotas acessíveis nos quatro mapas principais do subsolo. [4, 5]',small)

page('4. Inspeção e narrativa')
add('Os pontos de inspeção foram mantidos e transformados em registros consultáveis. Cada um distingue observação, avaliação, procedimento e vínculo com a vistoria. As descrições evitam tratar uma suspeita como conclusão comprovada.')
table([['Local','Registro'],['Exterior','Drenagem externa e divergência em relação ao tratamento informado.'],['Recepção','Versões dos laudos e anexos ausentes.'],['Sala demolida','Tubulação não indicada na planta.'],['Corredor','Lacunas na rastreabilidade da manutenção.'],['Pesquisa','Diferença entre volumes e classificação das amostras.'],['Arquivo','Protocolos retidos e respostas sem anexos.'],['Contenção','Circuito interno de resíduos omitido da documentação.']],[142,362])
add('E registra o indício; J abre o diário e pausa a ação. A/D ou setas mudam a página, e J/Esc fecha. ESC ou P abre a carteira de pausa, que oferece Continuar, Recomeçar e Sair para o menu. O HUD de equipamento e munição só aparece depois da coleta do cano ou da pistola. Ler novamente não duplica o registro nem repete o som de coleta. As anotações acompanham a partida entre salas e reinícios de sala; não há gravação em disco. Um novo jogo limpa o diário.')
figure('diario.png','Prévia técnica do diário. A fonte e a rasterização finais devem ser conferidas na engine.',420)

page('5. Revisão visual')
add('O inimigo comum recebeu transparência real e escala de 0,55. Seus 24 quadros de movimento, repouso e queda foram verificados: nenhum resíduo claro com alpha visível foi detectado pelo critério de controle. A máscara de colisão permanece separada e alinhada aos pés.')
add('Os mapas compartilham granulação, sombras, bordas, rebites e uma paleta de metal, madeira e concreto envelhecidos. O personagem civil e os NPCs substituem sprites provisórios. HUD, diálogos e diário recebem painéis comuns; a hitbox do cano fica invisível. O Boss mantém sua arte original como exigido.')
figure('Room_Pesquisa.png','Sala de pesquisa: prévia dos comandos de desenho, com sombra aproximada. Não representa medição de desempenho ou captura do runtime.',400)
figure('Room_Biblioteca.png','Arquivo subterrâneo: mobiliário, textura e sombras seguem os mesmos materiais do restante do projeto.',400)

page('6. Verificação e entrega')
table([['Verificação executada','Resultado'],['Estrutura do projeto','95 recursos registrados; 104 arquivos YY/YYP legíveis; caminhos de sprites, camadas e sons conferidos.'],['Lógica simulada','22 testes passaram: música, visão, suspeita, coletas, diário, Boss, portas, pausa, flash, HUD, viewport, qualidade adaptativa e artefatos de interface.'],['Preservação do Boss','51 arquivos idênticos à base; pose inicial do ataque reproduzida pixel a pixel.'],['Desenho do cenário','Nas oito salas, comparação idêntica entre cache normal, reconstrução e falha simulada do alvo.'],['Rotas','Quatro mapas subterrâneos com trajetos acessíveis na verificação estática.']],[164,340])
add('Limite da validação',sub)
add('Os testes usam lógica GML compatível com JavaScript e APIs simuladas. As prévias executam um subconjunto dos comandos Draw por Canvas, com aproximações de fonte e sombra. Não houve compilação nem execução no GameMaker, VM/YYC ou Wine neste ambiente. A homologação visual e sonora no runtime continua pendente.')
add('Abrir o pacote',sub)
add('Extraia o ZIP completo para uma pasta nova, abra <b>tcc.yyp</b> e limpe o cache de compilação. Use a instalação de GameMaker que já executa o projeto. O metadado da IDE permanece 2024.14.4.222. O pacote contém o código-fonte e os recursos; não inclui executável compilado.')
add('Teste de aceitação de Luiz Henrique Matos Muller',sub)
add('Percorrer todas as salas e alternar F11/foco da janela; conferir cada gatilho de música; comparar passos normais e Shift atrás dos móveis; revisitar os pacotes de munição; testar o impacto dentro/fora do raio e junto dos barris; registrar e reler os sete indícios. O roteiro completo está em <b>ATUALIZACAO_V4_2.md</b>.')
add('Referências técnicas - documentação oficial GameMaker',sub)
refs=[('1. Drawing e blend modes','https://manual.gamemaker.io/lts/en/Additional_Information/Guide_To_Using_Blendmodes.htm'),('2. surface_set_target','https://manual.gamemaker.io/lts/en/GameMaker_Language/GML_Reference/Drawing/Surfaces/surface_set_target.htm'),('3. draw_sprite_general','https://manual.gamemaker.io/lts/en/GameMaker_Language/GML_Reference/Drawing/Sprites_And_Tiles/draw_sprite_general.htm'),('4. collision_line','https://manual.gamemaker.io/lts/en/GameMaker_Language/GML_Reference/Movement_And_Collisions/Collisions/collision_line.htm'),('5. mp_potential_step_object','https://manual.gamemaker.io/lts/en/GameMaker_Language/GML_Reference/Movement_And_Collisions/Motion_Planning/mp_potential_step_object.htm')]
for label,url in refs:add(f'<link href="{url}" color="#244E3E">{label}</link>',small)

doc=SimpleDocTemplate(str(output),pagesize=LETTER,rightMargin=54,leftMargin=54,topMargin=48,bottomMargin=54,title='Escape The Bunker - Relatório V4.2',author='Projeto Escape The Bunker')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(output)
