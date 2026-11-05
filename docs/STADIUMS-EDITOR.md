# Estádios · primeira etapa

A aba Estádios identifica oito IDs nativos: Japão, Estados Unidos, Espanha,
Itália, Inglaterra, Alemanha, Brasil e Nigéria. O catálogo valida a tabela
DATA_81EF81 e os oito scripts de paleta diretamente nos bytes da ROM Plus.

Referência do disassembly: Misc_Defines_ISSD.asm (StadiumIDs),
CODE_8B8CEC (seleção e carregamento por ID), DATA_81EF81 e scripts
DATA_8188BE..DATA_818919. Cada script carrega um bloco de 16 cores
com cabeçalho 001F no banco 89. Os PCs Plus foram conferidos na base
SHA256 ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a.

A edição habilitada limita-se a esses 16 valores BGR555 por estádio.
As posições são numeradas; não há associação validada entre cada cor e
um elemento do cenário, nem prévia gráfica. Clima e iluminação podem
substituir cores posteriormente. As demais paletas não são editadas.

As escolhas ficam em semantic.stadiumsV1, incluindo restauração ao abrir
projeto, salvamento seletivo e exportação na fase 10 (Partida). O writer
valida todos os registros e conflitos antes da primeira gravação. Nenhum
recurso compartilhado é clonado e nenhuma rotina do jogo é modificada.

Publicidade, gramado, arquibancadas, iluminação e dimensões aparecem como
opções indisponíveis até o respectivo mapeamento. O botão de textos abre
a área de inscrições existente; não renomeia os oito estádios.

Verificação: testes de cabeçalho, compatibilidade, serialização, exclusão de
fase e conflito atômico; catálogo e gravação conferidos com a Plus real pelo
Build Pipeline em 4 MiB; integração DOM de seleção, edição, reabertura e reset.
Ainda não foi feita conferência visual no emulador para as cores de cada estádio.
