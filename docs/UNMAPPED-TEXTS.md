# Textos ainda sem mapeamento completo no editor

Auditoria do disassembly local `Routine_Macros_ISSD.asm`, das tabelas SmallMenuText/TallMenuText, de `AsarScripts/AssetPointersAndFiles.asm` e dos catálogos/gravadores atuais do Studio. Organização por tela, para orientar abas independentes. Os nomes das abas novas abaixo são propostos; não significam que seus campos já foram instalados na interface.

Foram extraídos **193 blocos nativos de interface** do banco $87, excluindo nomes de jogadores: **26** inteiramente cobertos pelos vínculos de escrita examinados, **138** com ocorrências sem vínculo completo e **29** técnicos, numéricos ou vazios. Os **138 blocos candidatos coincidem byte a byte com a ROM Plus original**. Um bloco técnico de duração de partida ($87DE2F) diverge entre a ROM Plus e o disassembly e não deve ser copiado diretamente.

Um bloco pode conter vários campos ou um parágrafo inteiro. Texto semelhante já existente em outra tela não comprova que esta ocorrência esteja ligada ao editor. O escopo não inclui todos os nomes de equipes/jogadores, fontes nem mensagens inteiramente desenhadas em tiles sem nome identificável. Portanto os números são do levantamento delimitado, não um total absoluto de todo texto do jogo.

## Separação por tela e aba

| Aba da tela | Blocos candidatos | Exemplos ainda sem vínculo completo |
|---|---:|---|
| Textos Seleção de Equipes | 1 | -SELECT  TH TEAM- |
| Textos Escalação | 1 | UP TO / Substitutes |
| Textos Vantagem | 3 | -HANDICAP-; 7P / 8P / 9P / 10P / 11P; Press the select button to change 1P and CPU controls. |
| Textos Estratégias | 2 | NO; ONE FOUR |
| Textos Número de Jogadores | 1 | NUMBER OF PLAYERS |
| Textos Estádio | 7 | -STADIUM SELECT-; -TODAY'S GAME-; -TONIGHT'S GAME-; CONDITION |
| Opções da Partida | 1 | GAME START |
| Textos Controles | 6 | -High ball- / Use for centring.The longer / you press,the higher the / ball flies.; -Pass- / Use for a short pass.To / make the player lift the / ball just press the button / without p; -Shoot- / Press this button while in / your opponent's half.The / longer you press the button / the ; -Dash- / While you hold this button / down the player will sprint. / Be careful not to use it too /  |
| Textos Resultados | 3 | DON'T GIVE UP! - GAME OVER -; PLAYER  WINS!; CONGRATULATIONS! |
| Textos Competições | 14 | ONE; TWO; THREE; FOUR |
| Textos Pênaltis | 3 | Please       select      the order.; Please       select      the kicker; O.K.?        A / YES/B / NO |
| Textos Finais | 11 | INTERNATIONAL  CUP; THE WORLD SERIES; THE WORLD SERIES / AND THE CHAMPIONSHIP; THE WORLD SERIES / AND SPECIAL GAME |
| Textos Regras | 6 | FOUL; YELLOW CARD; OFF SIDE; V-GOAL |
| Textos Opções Gerais | 6 | GAME LEVEL; GAME TIME; SOUND; STEREO |
| Textos Treinamento | 17 | TRAINING; CHALLENGE; This lets you practice / the basic movements / needed to be success- / ful in this game.; Try to set a new rec- / ord as you'll be com- / peting against the / clock. |
| Textos Desafio | 7 | BEST SCORE; Dribble to avoid your / opponents and capture / the flags as quickly as / possible.Shoot after / col; Pass the ball as fast as / possible to all 10 / players(no Goalkeeper). / Now shoot the ball / to re; Shoot the ball along a / set path to avoid the / opposition.Aim for the / corners of the net for / b |
| Textos Recordes | 12 | -YOUR RECORD-; TIME / :  :; TIME SCORE; BONUS TIME / :  : |
| Textos Senha | 2 | FROM THE BIGINING; PASS WORD |
| Textos Cenários | 34 | NO.; NO.1  ITALY 1-2 CROATIA / 1:14 ITALY'S C.K.; NO.2  GERMANY 2-3 BULGARIA / 1:02 GERMANY'S F.K.; NO.3  ENGLAND 1-3 BRAZIL / 1:54 ENGLAND'S C.K. |
| Textos Créditos | 1 | You are the greatest!                     KONAMI ALL RIGHTS RESERVED. |

## Prioridades para os próximos campos

1. **Textos Controles:** seis blocos de ajuda — High ball, Pass, Shoot, Dash, Goal Keeper e Controller Operations. Os nomes dos botões já existem; faltam as instruções completas, de $87D2EC a $87D6C3. Permanecem separados de Textos Cursor.
2. **Textos Treinamento / Textos Desafio / Textos Recordes:** instruções de exercícios, explicações dos modos, melhor pontuação, bônus, entrada do nome e seis avaliações de desempenho. Preservar a separação entre a tela de seleção, a explicação do exercício e os resultados.
3. **Textos Cenários:** 12 cabeçalhos de partidas, 12 descrições e mensagens de conclusão/tentativa; a descrição de cada cenário deve permanecer um campo de várias linhas.
4. **Textos Estádio / Textos Vantagem / Textos Número de Jogadores:** inscrições próprias dessas telas; não juntar tudo na aba de Opções da Partida. Há rótulos meteorológicos em SmallMenuText e TallMenuText, com ocorrências distintas.
5. **Textos Competições / Textos Resultados / Textos Finais:** tabelas, próxima partida, vitória/derrota e progressão de campeonatos. O bloco `GAME START` em $87CADA é uma ocorrência própria, mesmo já havendo um campo equivalente no menu pré-partida.
6. **Textos Opções Gerais / Textos Regras / Textos Senha / Textos Pênaltis:** dificuldade, tempo, som, Stereo/Mono, faltas/cartões/impedimento/prorrogação, ON/OFF, senha e confirmações de ordem/cobrador.

## Gráficos: blocos conhecidos versus campos editáveis

O cruzamento por endereço encontrou 39 assets nomeados Text/Letters/Copyright. Desses, 21 constam do inventário legado e precisam de revisão por inscrição, dois têm campos novos salvos no projeto sem gravador (atributos e tipo de formação), quatro têm gravadores nativos identificados nesta revisão (letras do Menu Principal, menu pré-partida, ações dos controles e Cursor) e 12 não aparecem nesse inventário legado. Estar no inventário não equivale a estar inteiramente sem suporte: cada inscrição precisa ser cruzada com os campos de sua tela. Esse agrupamento não classifica outros recursos como fontes nem prova que cada inscrição de um asset esteja editável.

Dentre os 12 ausentes do inventário, os mais claros são **HandicapScreen_StrongWeakText**, **HandicapScreen_MiscSmallText**, **PlayerOrderScreen_NumberText**, **ChallengeModeMenu_Text** e as letras da introdução. Os arquivos Unknown/UnusedJapanese exigem identificar a tela e confirmar se são usados antes de criar campos operacionais.

O inventário legado também precisa de revisão: `goalieNames` aponta $9EE218–$9EE242, enquanto o disassembly identifica `GFX_Layer3_OptionsScreen_GoalieNames` em $9EE242–$9EE31C. Não usar o limite legado automaticamente.

| Asset | CPU inicial | Situação no cruzamento |
|---|---|---|
| GFX_Layer3_InGame_GOALTextLetters | `$99F5C3` | in-legacy-inventory |
| GFX_Layer3_InGame_FlashingTextLetters | `$99FA63` | in-legacy-inventory |
| GFX_Layer3_UnknownMenuText1 | `$9A8660` | in-legacy-inventory |
| GFX_Layer3_UnknownMenuText2 | `$9A8BE0` | in-legacy-inventory |
| GFX_Layer3_UnknownMenuText3 | `$A6F7C0` | in-legacy-inventory |
| GFX_Layer3_UnknownMenuText4 | `$AAF27A` | in-legacy-inventory |
| GFX_Layer3_InGame_UnusedJapaneseText2 | `$9BB0B5` | not-in-legacy-inventory |
| GFX_Layer3_MainMenus_VariousTextStrings | `$9DFA70` | in-legacy-inventory |
| GFX_Sprite_MainMenus_LargeMainMenuLetters | `$9E8000` | in-legacy-inventory |
| GFX_Layer3_GameStartMenu_Text | `$9EE31C` | native-writer |
| GFX_Layer3_TeamSelectionScreen_ContinentText | `$9EEC78` | in-legacy-inventory |
| GFX_Layer3_EditPlayerSkillsScreen_MiscSmallText | `$9EF27E` | in-legacy-inventory |
| GFX_Layer3_EditPlayerSkillsScreen_SkillNameText | `$9EF369` | editable-project-only |
| GFX_Layer3_FormationChangeScreen_TypeOfFormationText | `$9EF58E` | editable-project-only |
| GFX_Layer3_HandicapScreen_StrongWeakText | `$9EF615` | not-in-legacy-inventory |
| GFX_Layer3_HandicapScreen_MiscSmallText | `$9EF691` | not-in-legacy-inventory |
| GFX_Layer1_PlayerOrderScreen_NumberText | `$9EF819` | not-in-legacy-inventory |
| GFX_Layer3_UnknownJapaneseText1 | `$9FFD95` | not-in-legacy-inventory |
| GFX_Layer3_TeamSelectScreen_MiscText | `$A0A100` | in-legacy-inventory |
| GFX_Layer3_KeyConfigurationScreen_ButtonActionText | `$A18162` | native-writer |
| GFX_Layer3_UnknownJapaneseText2 | `$A1899D` | not-in-legacy-inventory |
| GFX_Layer3_InGame_UnusedJapaneseText1 | `$A2FD92` | not-in-legacy-inventory |
| GFX_Layer3_EditTeamColorsScreen_MiscText | `$A486CF` | in-legacy-inventory |
| GFX_Layer3_KonamiCopyrightText | `$A5A225` | in-legacy-inventory |
| GFX_Layer1_InternationalCupScreen_SlantedInternationalCupText | `$A6A491` | in-legacy-inventory |
| GFX_Layer1_WorldSeriesTodaysGameScreen_WorldSeriesText | `$A6A715` | in-legacy-inventory |
| GFX_Layer3_ShortLeagueStandingsScreen_UnknownText1 | `$A6AEEF` | in-legacy-inventory |
| GFX_Layer3_ShortLeagueStandingsScreen_UnknownText2 | `$A6B032` | in-legacy-inventory |
| GFX_Layer3_MainMenus_UnknownText | `$A6FA24` | in-legacy-inventory |
| GFX_Layer3_InternationalRound2Screen_Text1 | `$A7E073` | in-legacy-inventory |
| GFX_Layer3_InternationalRound2Screen_Text2 | `$A7E10F` | in-legacy-inventory |
| GFX_Sprite_TitleScreen_SmallText | `$A7E154` | in-legacy-inventory |
| GFX_Layer3_WorldSeriesEnding_CreditsLetters | `$A7F0E0` | in-legacy-inventory |
| GFX_Sprite_UnknownLetters1 | `$AA9A24` | not-in-legacy-inventory |
| GFX_Sprite_UnknownLetters2 | `$AA9C51` | not-in-legacy-inventory |
| GFX_Layer3_IntroCutscene_GiantLetters | `$AC844D` | not-in-legacy-inventory |
| GFX_Layer3_IntroCutscene_LargeLetters | `$AC9842` | not-in-legacy-inventory |
| GFX_Layer3_ChangeControllerScreen_Text | `$ACFADE` | native-writer |
| GFX_Layer3_ChallengeModeMenu_Text | `$AEBCA4` | not-in-legacy-inventory |

## Ocorrências nativas candidatas

Os endereços PC abaixo são da ROM sem header. As linhas apontam para o arquivo do disassembly. Textos já cobertos dentro de um bloco parcialmente mapeado foram omitidos dos exemplos.

| Aba | Símbolo | PC | Linha ASM | Texto / início do bloco |
|---|---|---|---:|---|
| Textos Seleção de Equipes | `DATA_87C5CD` | `0x3C5CD` | 104486 | -SELECT  TH TEAM- |
| Textos Escalação | `DATA_87C60C` | `0x3C60C` | 104510 | UP TO / Substitutes |
| Textos Vantagem | `DATA_87C811` | `0x3C811` | 104680 | -HANDICAP- |
| Textos Vantagem | `DATA_87C875` | `0x3C875` | 104709 | 7P / 8P / 9P / 10P / 11P |
| Textos Vantagem | `DATA_87C884` | `0x3C884` | 104716 | Press the select button to change 1P and CPU controls. |
| Textos Estratégias | `DATA_87C8BA` | `0x3C8BA` | 104722 | NO |
| Textos Estratégias | `DATA_87CA1D` | `0x3CA1D` | 104787 | ONE FOUR |
| Textos Número de Jogadores | `DATA_87CA25` | `0x3CA25` | 104790 | NUMBER OF PLAYERS |
| Textos Estádio | `DATA_87CA36` | `0x3CA36` | 104793 | -STADIUM SELECT- |
| Textos Estádio | `DATA_87CA57` | `0x3CA57` | 104812 | -TODAY'S GAME- |
| Textos Estádio | `DATA_87CA67` | `0x3CA67` | 104815 | -TONIGHT'S GAME- |
| Textos Estádio | `DATA_87CA77` | `0x3CA77` | 104818 | CONDITION |
| Textos Estádio | `DATA_87CA80` | `0x3CA80` | 104821 | SNOW / FINE / RAIN |
| Textos Estádio | `DATA_87CA9B` | `0x3CA9B` | 104831 | JAPAN / U.S.A / SPAIN / ITALY / ENGLAND / GERMANY / BRAZIL / NIGERIA |
| Textos Estádio | `DATA_87CAD3` | `0x3CAD3` | 104841 | STADIUM |
| Opções da Partida | `DATA_87CADA` | `0x3CADA` | 104844 | GAME START |
| Textos Controles | `DATA_87D2EC` | `0x3D2EC` | 104989 | -High ball- / Use for centring.The longer / you press,the higher the / ball flies. |
| Textos Controles | `DATA_87D3CC` | `0x3D3CC` | 105000 | -Pass- / Use for a short pass.To / make the player lift the / ball just press the button / without pressing in any / direction on the D-Pad.This / will enable you to head or / attempt an overhead kick… |
| Textos Controles | `DATA_87D4AC` | `0x3D4AC` | 105010 | -Shoot- / Press this button while in / your opponent's half.The / longer you press the button / the higher the shot. |
| Textos Controles | `DATA_87D539` | `0x3D539` | 105018 | -Dash- / While you hold this button / down the player will sprint. / Be careful not to use it too / much or the player will run / out of stamina. |
| Textos Controles | `DATA_87D5E2` | `0x3D5E2` | 105027 | -Goal Keeper- / When in Manual or Semi-Auto / mode,press the A button to / jump high and the B button / to dive low.The computer / will decide whether to punch / or catch the ball when you / press the… |
| Textos Controles | `DATA_87D6C3` | `0x3D6C3` | 105038 | -Controller Operations- / Turn the pages by pressing / the L/R buttons. |
| Textos Resultados | `DATA_87D73A` | `0x3D73A` | 105052 | DON'T GIVE UP! - GAME OVER - |
| Textos Resultados | `DATA_87D75A` | `0x3D75A` | 105056 | PLAYER  WINS! |
| Textos Resultados | `DATA_87D769` | `0x3D769` | 105060 | CONGRATULATIONS! |
| Textos Competições | `DATA_87D7A7` | `0x3D7A7` | 105097 | ONE |
| Textos Competições | `DATA_87D7AA` | `0x3D7AA` | 105100 | TWO |
| Textos Competições | `DATA_87D7AD` | `0x3D7AD` | 105103 | THREE |
| Textos Competições | `DATA_87D7B2` | `0x3D7B2` | 105106 | FOUR |
| Textos Competições | `DATA_87D7B6` | `0x3D7B6` | 105109 | FIVE |
| Textos Competições | `DATA_87D7BA` | `0x3D7BA` | 105112 | SIX |
| Textos Competições | `DATA_87D7BD` | `0x3D7BD` | 105115 | SEVEN |
| Textos Competições | `DATA_87D7C2` | `0x3D7C2` | 105118 | EIGHT |
| Textos Competições | `DATA_87D7C7` | `0x3D7C7` | 105121 | NEXT GAME    VS |
| Textos Competições | `DATA_87D892` | `0x3D892` | 105170 | LEAGUE STANDINGS |
| Textos Competições | `DATA_87D8A2` | `0x3D8A2` | 105173 | LEAGUE POINTS TABLE |
| Textos Competições | `DATA_87D8C4` | `0x3D8C4` | 105177 | TOURNAMENT TABLE |
| Textos Competições | `DATA_87D91C` | `0x3D91C` | 105193 | -TODAY'S GAME- |
| Textos Competições | `DATA_87D92A` | `0x3D92A` | 105196 | -TODAY'S GAME  RESULT- |
| Textos Pênaltis | `DATA_87DAA2` | `0x3DAA2` | 105281 | Please       select      the order. |
| Textos Pênaltis | `DATA_87DAD2` | `0x3DAD2` | 105284 | Please       select      the kicker |
| Textos Pênaltis | `DATA_87DB02` | `0x3DB02` | 105290 | O.K.?        A / YES/B / NO |
| Textos Finais | `DATA_87DB40` | `0x3DB40` | 105310 | INTERNATIONAL  CUP |
| Textos Finais | `DATA_87DB54` | `0x3DB54` | 105314 | THE WORLD SERIES |
| Textos Finais | `DATA_87DB68` | `0x3DB68` | 105318 | THE WORLD SERIES / AND THE CHAMPIONSHIP |
| Textos Finais | `DATA_87DB92` | `0x3DB92` | 105323 | THE WORLD SERIES / AND SPECIAL GAME |
| Textos Finais | `DATA_87DBB8` | `0x3DBB8` | 105328 | Aim for the next / level! |
| Textos Finais | `DATA_87DBDA` | `0x3DBDA` | 105333 | Now challenge the / world! |
| Textos Finais | `DATA_87DBFE` | `0x3DBFE` | 105338 | Let's try the spe- / cial game! |
| Textos Finais | `DATA_87DC24` | `0x3DC24` | 105343 | Now try to win the / first season too! |
| Textos Finais | `DATA_87DC4A` | `0x3DC4A` | 105348 | Congratulations   for a perfect game! |
| Textos Finais | `DATA_87DC82` | `0x3DC82` | 105352 | Congratulations / for a perfect win! / You're the best! |
| Textos Finais | `DATA_87DCBA` | `0x3DCBA` | 105358 | Now try to win the / second season too! |
| Textos Regras | `DATA_87DD89` | `0x3DD89` | 105400 | FOUL |
| Textos Regras | `DATA_87DD8D` | `0x3DD8D` | 105403 | YELLOW CARD |
| Textos Regras | `DATA_87DD98` | `0x3DD98` | 105406 | OFF SIDE |
| Textos Regras | `DATA_87DDA0` | `0x3DDA0` | 105409 | V-GOAL |
| Textos Regras | `DATA_87DDA6` | `0x3DDA6` | 105412 | OVER TIME |
| Textos Regras | `DATA_87DDAF` | `0x3DDAF` | 105415 | ON  OFF |
| Textos Opções Gerais | `DATA_87DDE8` | `0x3DDE8` | 105424 | GAME LEVEL |
| Textos Opções Gerais | `DATA_87DDF2` | `0x3DDF2` | 105427 | GAME TIME |
| Textos Opções Gerais | `DATA_87DE03` | `0x3DE03` | 105431 | SOUND |
| Textos Opções Gerais | `DATA_87DE08` | `0x3DE08` | 105434 | STEREO |
| Textos Opções Gerais | `DATA_87DE0E` | `0x3DE0E` | 105437 | MONO |
| Textos Opções Gerais | `DATA_87DE12` | `0x3DE12` | 105440 | RULES |
| Textos Treinamento | `DATA_87DE77` | `0x3DE77` | 105457 | TRAINING |
| Textos Treinamento | `DATA_87DE80` | `0x3DE80` | 105460 | CHALLENGE |
| Textos Treinamento | `DATA_87DE89` | `0x3DE89` | 105466 | This lets you practice / the basic movements / needed to be success- / ful in this game. |
| Textos Treinamento | `DATA_87DEE1` | `0x3DEE1` | 105472 | Try to set a new rec- / ord as you'll be com- / peting against the / clock. |
| Textos Treinamento | `DATA_87DF39` | `0x3DF39` | 105481 | FREE |
| Textos Treinamento | `DATA_87DF3D` | `0x3DF3D` | 105484 | DEFENSE |
| Textos Treinamento | `DATA_87DF52` | `0x3DF52` | 105490 | FREE KICK |
| Textos Treinamento | `DATA_87DF5B` | `0x3DF5B` | 105493 | KEEPER |
| Textos Treinamento | `DATA_87DF61` | `0x3DF61` | 105496 | MODE |
| Textos Treinamento | `DATA_87DF65` | `0x3DF65` | 105499 | DRIBBLE |
| Textos Treinamento | `DATA_87DF6C` | `0x3DF6C` | 105502 | PASS |
| Textos Treinamento | `DATA_87DF73` | `0x3DF73` | 105505 | SHOOT |
| Textos Treinamento | `DATA_87DFB7` | `0x3DFB7` | 105529 | EXIT |
| Textos Desafio | `DATA_87DFBE` | `0x3DFBE` | 105532 | BEST SCORE |
| Textos Desafio | `DATA_87DFE8` | `0x3DFE8` | 105545 | Dribble to avoid your / opponents and capture / the flags as quickly as / possible.Shoot after / collecting all the flags / score and you may get / a bonus! |
| Textos Desafio | `DATA_87E0C8` | `0x3E0C8` | 105555 | Pass the ball as fast as / possible to all 10 / players(no Goalkeeper). / Now shoot the ball / to receive bonus points. |
| Textos Desafio | `DATA_87E1A8` | `0x3E1A8` | 105565 | Shoot the ball along a / set path to avoid the / opposition.Aim for the / corners of the net for / bonus points. |
| Textos Desafio | `DATA_87E288` | `0x3E288` | 105575 | Take the ball away from / the attacking team as / soon as possible.After / stealing the ball aim / for a goal to get bonus / points. |
| Textos Desafio | `DATA_87E368` | `0x3E368` | 105585 | Either aim straight for / the goal along a set / path or opt to center / the ball when taking the / corner kick.Aim for the / corners of the net to / get bonus points. |
| Textos Desafio | `DATA_87E448` | `0x3E448` | 105595 | Avoid the wall and aim / either straight for goal / or try a center.Aim for / the corners of the net / to get bonus points. |
| Textos Treinamento | `DATA_87E808` | `0x3E808` | 105650 | Use the whole field to / practice dribbling, / passing and shooting. |
| Textos Treinamento | `DATA_87E880` | `0x3E880` | 105657 | Try to take the ball / away from the 3 / offensive players who / are aiming for a goal. |
| Textos Treinamento | `DATA_87E8F8` | `0x3E8F8` | 105664 | Practice your free kick. |
| Textos Treinamento | `DATA_87E970` | `0x3E970` | 105671 | Defend your goal, / control the Keeper. / Two opposing players / will try to score. |
| Textos Recordes | `DATA_87E9E8` | `0x3E9E8` | 105681 | -YOUR RECORD- |
| Textos Recordes | `DATA_87E9F5` | `0x3E9F5` | 105684 | TIME / :  : |
| Textos Recordes | `DATA_87EA09` | `0x3EA09` | 105687 | TIME SCORE |
| Textos Recordes | `DATA_87EA1C` | `0x3EA1C` | 105690 | BONUS TIME / :  : |
| Textos Recordes | `DATA_87EA30` | `0x3EA30` | 105693 | BONUS SCORE |
| Textos Recordes | `DATA_87EA8A` | `0x3EA8A` | 105708 | Don't be too / impressed.lt's / only an average / record. |
| Textos Recordes | `DATA_87EADA` | `0x3EADA` | 105714 | Great / It's a new / record! / Unbelievable! |
| Textos Recordes | `DATA_87EB2A` | `0x3EB2A` | 105720 | Not good enough. / Practice harder / next time! |
| Textos Recordes | `DATA_87EB7A` | `0x3EB7A` | 105726 | Please try harder / next time. |
| Textos Recordes | `DATA_87EBCA` | `0x3EBCA` | 105732 | You just missed a / new record. / Try again. |
| Textos Recordes | `DATA_87EC1A` | `0x3EC1A` | 105738 | Good but try harder / for the record. |
| Textos Recordes | `DATA_87ECAF` | `0x3ECAF` | 105767 | INPUT NAME |
| Textos Senha | `DATA_87EDBD` | `0x3EDBD` | 105840 | FROM THE BIGINING |
| Textos Senha | `DATA_87EDD6` | `0x3EDD6` | 105846 | PASS WORD |
| Textos Cenários | `DATA_87EE15` | `0x3EE15` | 105862 | NO. |
| Textos Cenários | `DATA_87EE3B` | `0x3EE3B` | 105896 | NO.1  ITALY 1-2 CROATIA / 1:14 ITALY'S C.K. |
| Textos Cenários | `DATA_87EE73` | `0x3EE73` | 105900 | NO.2  GERMANY 2-3 BULGARIA / 1:02 GERMANY'S F.K. |
| Textos Cenários | `DATA_87EEAB` | `0x3EEAB` | 105904 | NO.3  ENGLAND 1-3 BRAZIL / 1:54 ENGLAND'S C.K. |
| Textos Cenários | `DATA_87EEE3` | `0x3EEE3` | 105908 | NO.4  GERMANY 0-0 ITALY / 0:56 GERMANY'S F.K. |
| Textos Cenários | `DATA_87EF1B` | `0x3EF1B` | 105912 | NO.5  TURKEY 1-1 SWEDEN / 0:49 TURKEY'S THROW IN |
| Textos Cenários | `DATA_87EF53` | `0x3EF53` | 105916 | NO.6  BELGIUM 1-1 SPAIN / 0:42 BELGIUM'S F.K. |
| Textos Cenários | `DATA_87EF8B` | `0x3EF8B` | 105920 | NO.7  ROMANIA 0-1 POLAND / 1:43 ROMANIA'S F.K. |
| Textos Cenários | `DATA_87EFC3` | `0x3EFC3` | 105924 | NO.8  SCOTLAND 0-0 RUSSIA / 1:24 SCOTLAND'S G.K. |
| Textos Cenários | `DATA_87EFFB` | `0x3EFFB` | 105928 | NO.9  PORTUGAL 0-1 IRELAND / 0:38 PORTUGAL'S F.K. |
| Textos Cenários | `DATA_87F033` | `0x3F033` | 105932 | NO.10 ARGENTINA 2-2 BRAZIL / 0:49 ARGENTINA'S C.K. |
| Textos Cenários | `DATA_87F06B` | `0x3F06B` | 105936 | NO.11 HOLLAND 1-3 CZECH.REP. / 1:38 HOLLAND'S F.K. |
| Textos Cenários | `DATA_87F0A3` | `0x3F0A3` | 105940 | NO.12 ENGLAND 1-1 JAPAN / 0:02 ENGLAND'S C.K. |
| Textos Cenários | `DATA_87F12D` | `0x3F12D` | 105955 | It seems like a defeat for / ITALY against the talented / CROATIA.ITALY scored a go- / al in the second half.Now / they are trying to turn / the tables around. |
| Textos Cenários | `DATA_87F1C9` | `0x3F1C9` | 105963 | Although GERMANY had a 2 / goal lead,they gave BULG- / ARIA a penalty,and now th- / ey are behind by a goal. / BULGARIA is a dangerous / team to handle. |
| Textos Cenários | `DATA_87F265` | `0x3F265` | 105971 | It is ENGLAND, / the home of / football / against / the cham- / pions / BRAZIL.ENGLAND can / not end the game as it is, / for the sake of their / pride. |
| Textos Cenários | `DATA_87F301` | `0x3F301` | 105979 | GERMANY can not score a / goal against ITALY,even / though the ITALIANS are / playing poorly.GERMANY wa- / nts to turn the tables / with this free kick. |
| Textos Cenários | `DATA_87F39D` | `0x3F39D` | 105987 | TURKEY is doing extremely / well against SWEDEN,who / have been playing with / their best team.One more / goal for a historical win. |
| Textos Cenários | `DATA_87F439` | `0x3F439` | 105995 | In the last game,when they / faced each other,BELGIUM / were soundly beaten.Alth- / ough many key players are / out,this time they want to / make it even. |
| Textos Cenários | `DATA_87F4D5` | `0x3F4D5` | 106003 | ROMANIA is in good condit- / ion.Even though they have / let POLAND take the lead, / there is plenty of time to / turn it around. |
| Textos Cenários | `DATA_87F571` | `0x3F571` | 106011 | SCOTLAND is eager for a / ticket to ENGLAND for / the finals.The most impor- / tant thing to do,is to / defeat RUSSIA right now. |
| Textos Cenários | `DATA_87F60D` | `0x3F60D` | 106019 | PORTUGAL have regained / their old strong form.But / they have just conceded an / own goal.Concentrate and / you may yet win. |
| Textos Cenários | `DATA_87F6A9` | `0x3F6A9` | 106027 | BRAZIL are strong.They se- / em like they can score fr- / om anywhere.But this is / for the south american ch- / ampionship,so ARGENTINA / must fight back. |
| Textos Cenários | `DATA_87F745` | `0x3F745` | 106035 | HOLLAND'S defense has / been shattered in the sec- / ond half.Unless their off- / ence starts something,they / have no choice but to / lose. |
| Textos Cenários | `DATA_87F7E1` | `0x3F7E1` | 106043 | Unbelievably,ENGLAND conc- / eded a goal to a country / from ASIA.It will be just / as bad as losing if the / game ends in a tie. |
| Textos Cenários | `DATA_87F8DC` | `0x3F8DC` | 106085 | UNLUCKY THIS TIME. / TRY AGAIN. |
| Textos Cenários | `DATA_87F900` | `0x3F900` | 106089 | CONGRATULATIONS! / SCENARIO   CLEAR! |
| Textos Cenários | `DATA_87F928` | `0x3F928` | 106095 | SCENARIO |
| Textos Cenários | `DATA_87F938` | `0x3F938` | 106098 | IN |
| Textos Cenários | `DATA_87F93A` | `0x3F93A` | 106101 | TRY! |
| Textos Cenários | `DATA_87F93E` | `0x3F93E` | 106104 | CLEARED |
| Textos Cenários | `DATA_87F945` | `0x3F945` | 106107 | SCENARIO MODE CLEARED |
| Textos Cenários | `DATA_87F95A` | `0x3F95A` | 106110 | IN   TH TRY! |
| Textos Cenários | `DATA_87F966` | `0x3F966` | 106113 | CONGRATULATIONS! |
| Textos Créditos | `DATA_87F990` | `0x3F990` | 106116 | You are the greatest!                     KONAMI ALL RIGHTS RESERVED. |

## Reproduzir a auditoria

```sh
node scripts/audit-unmapped-texts.mjs /caminho/disassembly /caminho/Plus-original.sfc project-data/unmapped-text-audit.json
```

O script exige SHA-256 `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a` e registra textos completos, fonte, referências de uso, confirmação na ROM e vínculos encontrados em `project-data/unmapped-text-audit.json`. A comparação de cobertura usa os ranges explícitos dos gravadores auditados; não deduz escrita apenas pela existência do texto em um catálogo.
