// Audited against the Plus ROM using scripts/audit-cursor-texts.mjs.
const AUDITED_CURSOR_HELP_FIELDS=Object.freeze([
  [
    "pageHelp",
    "Turn the page by pressing\nthe L/R buttons.",
    "Troque a página usando os botões L/R.",
    {
      "label": "Ajuda · trocar página",
      "multiline": true,
      "rows": 2,
      "maxChars": 56,
      "native": {
        "pc": 248619,
        "pointerPc": 248591,
        "pointerWord": 52011,
        "width": 28,
        "rowCount": 2,
        "terminator": 255
      }
    }
  ],
  [
    "typeIntro",
    "-Controller Type-\nHere's a list of the\ndifferent controller methods\navailable to you.",
    null,
    {
      "label": "Ajuda · tipos de cursor",
      "multiline": true,
      "rows": 4,
      "maxChars": 112,
      "native": {
        "pc": 248676,
        "pointerPc": 248593,
        "pointerWord": 52068,
        "width": 28,
        "rowCount": 4,
        "terminator": 255
      }
    }
  ],
  [
    "typeAHelp",
    "-A TYPE-\nMoves the control cursor to\nthe two players closest to\nthe ball.",
    null,
    {
      "label": "Ajuda · tipo A",
      "multiline": true,
      "rows": 4,
      "maxChars": 112,
      "native": {
        "pc": 248789,
        "pointerPc": 248595,
        "pointerWord": 52181,
        "width": 28,
        "rowCount": 4,
        "terminator": 255
      }
    }
  ],
  [
    "typeBHelp",
    "-B TYPE-\nMoves the cursor to the two\ndefense players closest to\nthe ball.If there are no\ndefense players near the\ncontrol cursor will be moved\nto the closest player\nto the ball.",
    null,
    {
      "label": "Ajuda · tipo B",
      "multiline": true,
      "rows": 8,
      "maxChars": 224,
      "native": {
        "pc": 248902,
        "pointerPc": 248597,
        "pointerWord": 52294,
        "width": 28,
        "rowCount": 8,
        "terminator": null
      }
    }
  ],
  [
    "typeCHelp",
    "-C TYPE-\nMoves the control cursor in\nthe direction you choose\nwith the D-Pad towards\nthe ball.",
    null,
    {
      "label": "Ajuda · tipo C",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 249126,
        "pointerPc": 248599,
        "pointerWord": 52518,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "typeDHelp",
    "-D TYPE-\nMoves the control cursor in\nthe direction you choose\nwith the D-Pad towards\nthe nearest player.",
    null,
    {
      "label": "Ajuda · tipo D",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 249267,
        "pointerPc": 248601,
        "pointerWord": 52659,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "areaIntro",
    "-AREA-\nController Type\nHere's a list of the\ndifferent controller methods\navailable to you.",
    null,
    {
      "label": "Ajuda · introdução às áreas",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 249408,
        "pointerPc": 248603,
        "pointerWord": 52800,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "areaHelp",
    "-AREA-\nArea\nMoving the control cursor\noff and on the screen.This\nenables you to change the\ncontrol cursor from a player\noff screen to any player\non screen.",
    null,
    {
      "label": "Ajuda · funcionamento da área",
      "multiline": true,
      "rows": 8,
      "maxChars": 224,
      "native": {
        "pc": 249549,
        "pointerPc": 248605,
        "pointerWord": 52941,
        "width": 28,
        "rowCount": 8,
        "terminator": 255
      }
    }
  ],
  [
    "areaAHelp",
    "-AREA A-\n Controller Type\n            ………On the screen\n\n Area ………………ON",
    null,
    {
      "label": "Ajuda · área A",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 249774,
        "pointerPc": 248607,
        "pointerWord": 53166,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "areaBHelp",
    "-AREA B-\n Controller Type\n            ………On the screen\n\n Area ………………OFF",
    null,
    {
      "label": "Ajuda · área B",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 249915,
        "pointerPc": 248609,
        "pointerWord": 53307,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "areaCHelp",
    "-AREA C-\n Controller Type\n          ………The whole field\n\n Area ……………… OFF",
    null,
    {
      "label": "Ajuda · área C",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 250056,
        "pointerPc": 248611,
        "pointerWord": 53448,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "cursorAutoHelp",
    "-Cursor movement type-\n…Auto\nMoves the control cursor\nautomatically to the player\nin the best position.",
    null,
    {
      "label": "Ajuda · cursor automático",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 250197,
        "pointerPc": 248613,
        "pointerWord": 53589,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ],
  [
    "cursorManualHelp",
    "-Cursor movement type-\n…Manual\nEnables you to move the\ncursor by yourself.",
    null,
    {
      "label": "Ajuda · cursor manual",
      "multiline": true,
      "rows": 4,
      "maxChars": 112,
      "native": {
        "pc": 250338,
        "pointerPc": 248615,
        "pointerWord": 53730,
        "width": 28,
        "rowCount": 4,
        "terminator": 255
      }
    }
  ],
  [
    "keeperHelp",
    "-Selecting the Goalkeeper-\nPress the R and L button\nsimultaneously to take\nimmediate manual control of\nthe Goalkeeper.",
    null,
    {
      "label": "Ajuda · selecionar goleiro",
      "multiline": true,
      "rows": 5,
      "maxChars": 140,
      "native": {
        "pc": 250451,
        "pointerPc": 248617,
        "pointerWord": 53843,
        "width": 28,
        "rowCount": 5,
        "terminator": 255
      }
    }
  ]
]);

// Portuguese presets approved for completing the Cursor screen.
export const CURSOR_PORTUGUESE=Object.freeze({
  "type": "TIPO",
  "typeA": "TIPO-A",
  "typeB": "TIPO-B",
  "typeC": "TIPO-C",
  "typeD": "TIPO-D",
  "area": "ÁREA",
  "areaA": "ÁREA-A",
  "areaB": "ÁREA-B",
  "areaC": "ÁREA-C",
  "cursorChange": "TROCA DE CURSOR",
  "cursorAuto": "AUTO",
  "cursorManual": "MANUAL",
  "pageHelp": "Troque a página usando os botões L/R.",
  "typeIntro": "-Tipo de cursor-\nVeja os diferentes modos\nde seleção do cursor\ndisponíveis.",
  "typeAHelp": "-TIPO A-\nMove o cursor para os dois\njogadores mais próximos\nda bola.",
  "typeBHelp": "-TIPO B-\nMove o cursor para os dois\ndefensores mais próximos\nda bola. Se não houver\ndefensores por perto,\no cursor irá para o jogador\nmais próximo da bola.",
  "typeCHelp": "-TIPO C-\nMove o cursor na direção\nescolhida no direcional,\nem direção à bola.",
  "typeDHelp": "-TIPO D-\nMove o cursor na direção\nescolhida no direcional,\nem direção ao jogador\nmais próximo.",
  "areaIntro": "-ÁREA-\nTipo de cursor\nVeja os diferentes modos\nde seleção do cursor\ndisponíveis.",
  "areaHelp": "-ÁREA-\nPermite mover o cursor\npara dentro e fora da tela.\nAssim, você pode trocar\no cursor de um jogador\nfora da tela para outro\ndentro da tela.",
  "areaAHelp": "-ÁREA A-\n Tipo de cursor\n            ………Na tela\n\n Área ………………LIGADA",
  "areaBHelp": "-ÁREA B-\n Tipo de cursor\n            ………Na tela\n\n Área ………………DESLIGADA",
  "areaCHelp": "-ÁREA C-\n Tipo de cursor\n          ………Campo inteiro\n\n Área ………………DESLIGADA",
  "cursorAutoHelp": "-Movimento do cursor-\n…Automático\nMove o cursor para o jogador\nmelhor posicionado,\nautomaticamente.",
  "cursorManualHelp": "-Movimento do cursor-\n…Manual\nPermite mover o cursor\npor conta própria.",
  "keeperHelp": "-Selecionar o goleiro-\nPressione L e R juntos\npara assumir imediatamente\no controle manual\ndo goleiro."
});
export const CURSOR_HELP_FIELDS=Object.freeze(AUDITED_CURSOR_HELP_FIELDS.map(([id,english,,options])=>[id,english,CURSOR_PORTUGUESE[id],options]));
