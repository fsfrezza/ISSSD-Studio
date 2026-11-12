# Estado conferido nesta retomada — 12/11/2026

O remoto estava em `c6aff8a`; `edafafb` existia somente na cópia local. Esta entrega incorpora esse commit e recupera, em uma cópia isolada, as correções ainda sem commit de outra instalação local. As instalações de origem não foram alteradas.

| Pedido | Resultado desta retomada |
| --- | --- |
| Logo EDITOR + bola | Mantido no cartão da Visão geral, com PNG entregue pelo servidor. Não altera a ROM. |
| Tela de título | Rodapé usa sentinela nativo 127; glifos de PRESS START ficam protegidos. ROM do projeto personalizado executada no Snes9x. |
| Fonte do menu principal | Preset português aplica 95%; seletor mantém ajuste manual. Restaurar os textos originais restaura também a escala original. |
| Sobreposições | Writer altera OBJ/OAM/ponteiros, preservando os dois blocos de wallpaper compartilhado. Navegação real no emulador conferida. |
| Nomes superiores e grupos | Nomes superiores independentes e títulos de grupos gravados pela estrutura experimental. Grade do Editor em 3×2, sem rótulos Vaga e com aria-label. |
| Submenu | Seis campos nativos editáveis e incluídos nos presets; AMISTOSO, LIGA CURTA, TORNEIO CURTO e descrição conferidos no emulador. |
| Nomes sob as bandeiras | Pendente. O loader de pré-carga ainda usa os gráficos originais; editar o nome superior não modifica essa representação. |
| Atributos, controles e opções: rótulos gráficos | Pendentes. Campos textuais existentes não equivalem aos bitmaps dessas telas. |

## Persistência e pré-partida

Os testes executam abrir, editar, salvar, reabrir, exportar e restaurar pelos handlers da interface. O salvamento valida a geração antes de baixar o projeto. Campos de texto/catalogados são escritos diretamente em `changes`; não têm uma etapa universal separada chamada Implementar no projeto. A composição do título mantém seu próprio rascunho e implementação, e a exportação avisa quando há composição não implementada.

O nome de asset “Game Start Menu · Text” e o fluxo de implementação gráfica do Editor Plus não foram encontrados como recursos migrados na aplicação Deluxe. O preset FB96 existente no Deluxe é de áudio (74 amostras); não deve ser apresentado como preset gráfico de pré-partida. A migração gráfica correspondente permanece pendente.

## Evidência de validação

44 testes Deluxe aprovados, nenhum erro e nenhum ignorado, fornecendo as ROMs originais e os projetos locais necessários. Cobrem geração/restauração exata, checksum, reservas ocupadas, todos os presets suportados, 54 equipes/1080 jogadores, recuperação do backup, composição de título e handlers de persistência. O primeiro backup escolhido não continha Buffon; ao fornecer o backup correto de 07/11 às 05:13:07, os dois testes de migração passaram sem alterar seu código.

Snes9x/libretro: ROM gerada pelo código desta entrega a partir do projeto personalizado, fonte 95%, navegação somente com controles desde reset até submenu, controles, seleção dos dois times, vantagem, estádio e início da partida. Capturas confirmam nomes superiores BRASIL/INGLATERRA e a persistência dos rótulos gráficos ingleses ainda não migrados. Essa navegação não valida todas as 54 equipes, todas as formações ou uma partida completa.

## Mapeamento restante investigado

Nomes inferiores são streams 2bpp de 64 bytes. O script nativo em PC `0x10F21` pré-carrega 42 streams em WRAM `7F:0000–0A7F`; o script seguinte usa `7F:0A80` para bandeiras. Aumentar a pré-carga para 54 nomes sem remapear seus consumidores sobrescreveria os gráficos de bandeiras. É necessário individualizar essa pré-carga e seus consumidores antes de afirmar suporte completo.

Assets gráficos identificados na disassembly USA, ainda sem writer Deluxe validado:

| Asset | Endereço CPU do stream |
| --- | --- |
| Game Start Menu · Text | `9E:E31C` |
| Edit Player Skills · Misc Small Text | `9E:F27E` |
| Edit Player Skills · Skill Name Text | `9E:F369` |
| Handicap · Strong/Weak | `9E:F615` |
| Handicap · Misc Small Text | `9E:F691` |
| Change Controller · Text | `AC:FADE` |

Esses endereços são pontos de investigação, não autorização para sobrescrever streams comprimidos sem conferir tamanho, cobertura, consumidores e áreas compartilhadas.

---

# Revisão das pendências — 12/11/2026

Branch revisada: `feature/deluxe-modular-editor`, base `c6aff8a31b2292a287f41b66abf621c7cea52733`.

O logo transparente EDITOR + bola DE LUXO foi integrado ao cartão “Seu Deluxe, do seu jeito.” na Visão geral, substituindo IS DELUXE à direita do texto. Em telas estreitas aparece abaixo do texto. O servidor agora entrega PNG com o tipo correto. É uma imagem da interface, sem escrita na ROM.

## Pendências imediatas recuperadas da conversa

| Item | Estado verificado nesta revisão |
| --- | --- |
| Tela de título com texto estranho e fotos sem substituição na ROM | Há compositor, conversão protegida e atualização do painel no código. Ainda falta confirmar se resolvem o relato do usuário na execução do projeto real/emulador. |
| Fonte maior no menu principal | Pedido recuperado; atendimento ainda não confirmado no código atual. |
| Texto solto/sobreposição na seleção | Correção mencionada na conversa, mas não localizada como implementação específica na branch revisada; precisa ser recuperada ou refeita. |
| Nomes superiores de equipes e grupos e grade 3 × 2 sem “Vaga” | Entrega mencionada na conversa, mas não confirmada nesta branch. A interface ainda declara nomes gráficos reutilizados da equipe-base. |
| Submenu AMISTOSO / LIGA CURTA / TORNEIO CURTO | AMISTOSO existe no preset do menu principal. A tradução completa desse submenu não foi localizada; não considerar concluída. |
| Nomes sob as bandeiras | Continuam pendentes de edição gráfica/aplicação na ROM. |
| Rótulos gráficos de atributos, controles e opções da partida | Continuam pendentes; os presets dos campos textuais suportados não comprovam tradução desses gráficos. |

A conversa anterior relatou algumas correções como entregues, enquanto o histórico remoto revisado termina na correção de navegação da Tela de título. Esta revisão distingue essas afirmações da implementação efetivamente encontrada; não considera as correções de seleção/submenu validadas.

## Validação desta integração

`npm run test:deluxe`: 42 casos, 11 passaram e 31 foram ignorados por ausência das ROMs/projetos de teste. Nenhum falhou. O teste HTTP também verifica o caminho usado pelo HTML, Content-Type e assinatura PNG da imagem. A imagem tem alpha real (RGBA, 2172 × 724). A inspeção visual no navegador local foi bloqueada pelo ambiente ao iniciar Chromium (`socket() failed: Operation not permitted`); a execução no emulador não foi realizada.

As etapas gerais abaixo são o histórico do planejamento; a composição personalizada já tem implementação, mas permanece sujeita à validação visual acima.

---

# Próximas etapas Deluxe

Entregue: fonte dinâmica dos rodapés. Remove whitelist original; inclui A–Z, números, acentos e pontuação. Símbolos adicionais recebem bitmap pelo navegador, salvo no projeto. Até 31 caracteres distintos entre ambas as linhas; 29/18 sprites e largura máxima continuam valendo. Usa slots existentes sem alterar tamanho/DMA; quando a compressão não cabe no bloco original, realoca somente o stream para reserva FF em 0x1FE000 e muda o ponteiro de origem. Permanece em 2 MB. Sem alteração nos rodapés, a exportação permanece exata. Não permite caracteres de controle. As duas linhas são consideradas juntas para não sobrescrever um glifo ainda utilizado.

Próximos passos, em ordem:
1. Composição da abertura: resolver mapas/tiles compartilhados e implementar a composição personalizada do Plus na ROM, além da prévia já migrada.
2. Equipes/grupos ampliados: validar no emulador a navegação, seleção e partida com 54 equipes/nove grupos; deixar bandeiras, nomes gráficos e uniformes independentes.
3. Táticas/formações: editar posições e formações; individualização por equipe, com expansão para 4 MB somente quando necessária.
4. Aparência: transferir uniformes, bandeiras e aparência dos jogadores personalizados do Plus.
5. Melhorias de jogo: mapear e habilitar cada opção separadamente, com teste isolado e cumulativo; ainda aparecem em preparação no Deluxe.
6. Paridade final: completar demais telas/recursos, testar roundtrip de projetos e comparar ROMs produzidas pelos dois editores.

Fonte: desenhos adicionais 8×8 derivados de DejaVu Sans Mono Bold; licença em licenses/dejavu-font.txt. Os caracteres originais continuam usando seus desenhos originais quando presentes. Testes de geração e integridade não substituem validação visual no emulador.

## Bloco Tela de título — implementação

A aba foi renomeada para Tela de título. O conversor conjunto recompõe os tiles 4bpp de bola/faixa e seus mapas de origem (descritores 0x1197E/0x11983), eliminando conflitos entre tiles reutilizados. Mantém o tamanho de VRAM e o comprimento de DMA originais. Streams que excedam o tamanho original têm reservas delimitadas e verificadas como FF tanto na base quanto no resultado cumulativo. Reservas: 0x365C0–0x379A0 (4bpp), 0x57560–0x57F60 (mapa bola), 0xDEA80–0xE0000 (mapa faixa). A reserva alternativa de fotos 0x184300–0x188000 é recusada se conflitar com os nomes das equipes ampliadas.

As fotos mantêm o mapa montado pelo jogo. O modo seguro converte o conjunto para até 64 cores da paleta nativa, preserva pixels físicos também usados fora das máscaras e concilia no máximo dois tiles com amostras divergentes. Este comportamento é uma aproximação limitada, não uma individualização irrestrita do mapa das fotos. Conversão exata recusa diferenças de paleta/pixels. Título continua sujeito à cobertura OAM original. Composição fora das áreas suportadas é recusada.

Depois de implementar, a interface mostra a composição dos dados convertidos, em vez de continuar exibindo somente o bitmap livre. Descartar a implementação restaura também os mapas anteriores. O projeto personalizado de 54 equipes fornecido pelo usuário gera em 2 MB com título, bola, faixa e cinco fotos; testes verificam reabertura, leitura dos mapas da ROM, pixels do fundo compartilhado, regiões alteradas e restauração exata. Inspeção visual realizada sobre pixels decodificados; validação de execução no emulador ainda pendente.
