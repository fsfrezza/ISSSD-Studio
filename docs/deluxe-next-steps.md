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
