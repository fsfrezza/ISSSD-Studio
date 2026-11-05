# Melhorias opcionais, desenhos e aparência

A base permanece Plus. A aba registra sete recursos herdados como marcados e
bloqueados, com `specialRulesV1.baseProfile` e `includedPlus` no projeto. O recuo
continua desmarcado por padrão e configurável; importação restaura a escolha e
o writer da fase 12 aplica a v4. Replay do pênalti e migração para Deluxe são
lembretes desmarcados e bloqueados. Os itens herdados são um inventário da base,
não sete patches novos. Cabeçalhos explícitos `.sectionbar` impedem duplicação
pelo mecanismo legado de recolhimento.

## Uniformes

O disassembly em 84:E7EF..E811 usa oito sobreposições de camisa; a tabela de
desenhos aponta para 98:C5D4 e offsets de 256 bytes. O gravador existente valida
os leitores na Plus e escreve os 8 tiles 4bpp. A edição manual agora aceita
arraste com interpolação, captura do ponteiro e um undo por traço.

O gerador de listras produz oito quadros verticais/horizontais, com largura
selecionável e índice 15 (cor de detalhes). Os demais pixels são transparentes,
preservando a cor predominante do corpo. A cor fica independente por conjunto;
o desenho continua comum a titular/reserva. A geração precisa ser confirmada
com Aplicar desenho ao projeto, como a edição manual.

Limites mantidos e exibidos: equipes nativas podem compartilhar o mesmo modelo;
o painel lista as equipes afetadas. As seis equipes independentes possuem seus
próprios desenhos. São sobreposições nativas, não substituições completas das
camisas em todas as poses. Costas com número e poses sem overlay continuam nativas.

## Aparência

Jogadores de linha: os dois conjuntos reais aparecem identificados pelo tom de
pele e cor do cabelo, com amostras e prévias, em vez de somente Paleta 0/1. As
cores desses conjuntos continuam compartilhadas pela equipe. Não foi criado um
novo gravador de cores individuais de jogadores de linha.

Goleiros: dois seletores simples (cabelo e pele); o tom de pele gera quatro
sombras BGR555. Os cinco ajustes originais continuam disponíveis em uma seção
avançada. O backend individual por goleiro continua o mesmo e preserva o uniforme.

## Limite de cabelos — investigação, ainda não removido

Por instrução do usuário, a pesquisa começou no disassembly. 83:CAD7 inicializa
um contador de três e 83:CB2A usa os objetos listados em 81:AF01/AF07:
0AA0, 0AD0, 0BA0 / 0BD0, 0CA0, 0CD0. Os tiles associados estão em 81:AF0D.
Isso é capacidade de objetos/VRAM, não somente uma restrição da interface.

Careca, original e Cascão já usam corpos compostos e não gastam esses três
slots. Os tipos 1–13 ainda usam o sistema nativo. Uma experiência apenas em
memória com os 929 descritores de pose mediu 4.319.436 bytes de blocos únicos
para incorporar todos os 13 tipos aos corpos, antes das tabelas e da ROM-base.
Portanto, generalizar simplesmente a composição atual não cabe na reserva
atual de 4 MiB. Não se apagou a validação: ela continua evitando exportações que
excedam a capacidade real. Ainda é necessário projetar outro carregamento de
cabeças ou atlas. Não declarar esse requisito como implementado.

## Evidência

- 705 testes passaram; HTML construído e invariantes finais verificadas.
- Execução do runtime com DOM: sete opções bloqueadas, título de recuo único,
  geração de listras, desenho por arraste, confirmação e reabertura JSON.
- Exportação com a Plus real e projeto atual: oito quadros das listras e a cor
  vermelha do índice de detalhes conferidos na ROM gerada, inclusive na tabela
  de paletas redirecionada pela expansão das equipes.
- Não houve inspeção visual dessas novas camisas no emulador nesta etapa.
