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
