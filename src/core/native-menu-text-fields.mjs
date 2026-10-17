import {USER_PORTUGUESE_PRESETS} from './user-portuguese-presets.mjs';
import {NATIVE_MENU_PORTUGUESE} from './native-menu-portuguese.mjs';
// Native UI strings audited against the original Plus ROM. Generated from unmapped-text-audit.json.
export const NATIVE_MENU_FONTS={"SmallMenuText":{" ":0,"0":1,"1":2,"2":3,"3":4,"4":5,"5":6,"6":7,"7":8,"8":9,"9":10,"A":11,"B":12,"C":13,"D":14,"E":15,"F":16,"G":17,"H":18,"I":19,"J":20,"K":21,"L":22,"M":23,"N":24,"O":25,"P":26,"Q":27,"R":28,"S":29,"T":30,"U":31,"V":32,"W":33,"X":34,"Y":35,"Z":36,":":37,"-":38,"!":39,"%":40,".":41,"a":42,"b":43,"c":44,"d":45,"e":46,"f":47,"g":48,"h":49,"i":50,"j":51,"k":52,"l":53,"m":54,"n":55,"o":56,"p":57,"q":58,"r":59,"s":60,"t":61,"u":62,"v":63,"w":64,"x":65,"y":66,"z":67,"(":68,")":69,"+":71,"=":72,"<":73,">":74,"$":75,"?":76,"*":77,"#":78,"~":79,"'":80,"/":81,",":82},"TallMenuText":{" ":0,"!":82,".":84,"+":86,"-":87,"%":88,"/":89,"'":90,"~":91,":":92,"?":93,"0":94,"1":95,"2":96,"3":97,"4":98,"5":99,"6":100,"7":101,"8":102,"9":103,"A":104,"B":105,"C":106,"D":107,"E":108,"F":109,"G":110,"H":111,"I":112,"J":113,"K":114,"L":115,"M":116,"N":117,"O":118,"P":119,"Q":120,"R":121,"S":122,"T":123,"U":124,"V":125,"W":126,"X":127,"Y":128,"Z":129,"a":130,"b":131,"c":132,"d":133,"e":134,"f":135,"g":136,"h":137,"i":138,"j":139,"k":140,"l":141,"m":142,"n":143,"o":144,"p":145,"q":146,"r":147,"s":148,"t":149,"u":150,"v":151,"w":152,"x":153,"y":154,"z":155}};
const AUDITED_NATIVE_MENU_TEXT_SECTIONS=[
  {
    "id": "team-selection-native",
    "page": "texts-team-selection",
    "title": "Textos Seleção de Equipes",
    "area": "selecao-equipes",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87c5cd",
        "-SELECT  TH TEAM-",
        null,
        {
          "label": "-SELECT  TH TEAM-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 247245,
                "original": "-SELECT  TH TEAM-"
              }
            ],
            "symbol": "DATA_87C5CD"
          }
        }
      ]
    ]
  },
  {
    "id": "squad-native",
    "page": "texts-squad",
    "title": "Textos Escalação",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87c60c",
        "UP TO\nSubstitutes",
        null,
        {
          "label": "UP TO",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 247308,
                "original": "UP TO "
              },
              {
                "pc": 247315,
                "original": "Substitutes"
              }
            ],
            "symbol": "DATA_87C60C"
          }
        }
      ]
    ]
  },
  {
    "id": "handicap-native",
    "page": "texts-handicap",
    "title": "Textos Vantagem",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87c811",
        "-HANDICAP-",
        null,
        {
          "label": "-HANDICAP-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 247825,
                "original": "-HANDICAP-"
              }
            ],
            "symbol": "DATA_87C811"
          }
        }
      ],
      [
        "data_87c875",
        " 7P\n 8P\n 9P\n10P\n11P",
        null,
        {
          "label": " 7P",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 247925,
                "original": " 7P"
              },
              {
                "pc": 247928,
                "original": " 8P"
              },
              {
                "pc": 247931,
                "original": " 9P"
              },
              {
                "pc": 247934,
                "original": "10P"
              },
              {
                "pc": 247937,
                "original": "11P"
              }
            ],
            "symbol": "DATA_87C875"
          }
        }
      ],
      [
        "data_87c884",
        "the select button to change 1P and CPU controls.",
        null,
        {
          "label": "the select button to change 1P and CPU controls.",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 247946,
                "original": "the select button to change 1P and CPU controls."
              }
            ],
            "symbol": "DATA_87C884"
          }
        }
      ]
    ]
  },
  {
    "id": "strategies-native",
    "page": "strategies",
    "title": "Textos Estratégias",
    "area": "textos-estrategias",
    "createPage": false,
    "nativePool": true,
    "fields": [
      [
        "data_87c8ba",
        "NO",
        null,
        {
          "label": "NO",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 247994,
                "original": "NO        "
              }
            ],
            "symbol": "DATA_87C8BA"
          }
        }
      ],
      [
        "data_87ca1d",
        "ONE FOUR",
        null,
        {
          "label": "ONE FOUR",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248349,
                "original": "ONE FOUR"
              }
            ],
            "symbol": "DATA_87CA1D"
          }
        }
      ]
    ]
  },
  {
    "id": "player-count-native",
    "page": "texts-player-count",
    "title": "Textos Número de Jogadores",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87ca25",
        "NUMBER OF PLAYERS",
        null,
        {
          "label": "NUMBER OF PLAYERS",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248357,
                "original": "NUMBER OF PLAYERS"
              }
            ],
            "symbol": "DATA_87CA25"
          }
        }
      ]
    ]
  },
  {
    "id": "stadium-native",
    "page": "texts-stadium",
    "title": "Textos Estádio",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87ca36",
        "-STADIUM SELECT-",
        null,
        {
          "label": "-STADIUM SELECT-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248374,
                "original": "-STADIUM SELECT-"
              }
            ],
            "symbol": "DATA_87CA36"
          }
        }
      ],
      [
        "data_87ca57",
        "  -TODAY'S GAME-",
        null,
        {
          "label": "  -TODAY'S GAME-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248407,
                "original": "  -TODAY'S GAME-"
              }
            ],
            "symbol": "DATA_87CA57"
          }
        }
      ],
      [
        "data_87ca67",
        "-TONIGHT'S GAME-",
        null,
        {
          "label": "-TONIGHT'S GAME-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248423,
                "original": "-TONIGHT'S GAME-"
              }
            ],
            "symbol": "DATA_87CA67"
          }
        }
      ],
      [
        "data_87ca77",
        "CONDITION",
        null,
        {
          "label": "CONDITION",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248439,
                "original": "CONDITION"
              }
            ],
            "symbol": "DATA_87CA77"
          }
        }
      ],
      [
        "data_87ca80",
        "SNOW\nFINE\nRAIN",
        null,
        {
          "label": "SNOW",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248448,
                "original": "SNOW"
              },
              {
                "pc": 248452,
                "original": "FINE"
              },
              {
                "pc": 248456,
                "original": "RAIN"
              }
            ],
            "symbol": "DATA_87CA80"
          }
        }
      ],
      [
        "data_87ca9b",
        "  JAPAN\n  U.S.A\n  SPAIN\n  ITALY\nENGLAND\nGERMANY\n BRAZIL\nNIGERIA",
        null,
        {
          "label": "  JAPAN",
          "multiline": true,
          "rows": 8,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248475,
                "original": "  JAPAN"
              },
              {
                "pc": 248482,
                "original": "  U.S.A"
              },
              {
                "pc": 248489,
                "original": "  SPAIN"
              },
              {
                "pc": 248496,
                "original": "  ITALY"
              },
              {
                "pc": 248503,
                "original": "ENGLAND"
              },
              {
                "pc": 248510,
                "original": "GERMANY"
              },
              {
                "pc": 248517,
                "original": " BRAZIL"
              },
              {
                "pc": 248524,
                "original": "NIGERIA"
              }
            ],
            "symbol": "DATA_87CA9B"
          }
        }
      ],
      [
        "data_87cad3",
        "STADIUM",
        null,
        {
          "label": "STADIUM",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248531,
                "original": "STADIUM"
              }
            ],
            "symbol": "DATA_87CAD3"
          }
        }
      ]
    ]
  },
  {
    "id": "match-options-native",
    "page": "match-options",
    "title": "Opções da Partida",
    "area": "pre-partida",
    "createPage": false,
    "nativePool": true,
    "fields": [
      [
        "data_87cada",
        "GAME START",
        null,
        {
          "label": "GAME START",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 248538,
                "original": "GAME START"
              }
            ],
            "symbol": "DATA_87CADA"
          }
        }
      ]
    ]
  },
  {
    "id": "controls-help-native",
    "page": "controls",
    "title": "Textos Controles",
    "area": "pre-partida",
    "createPage": false,
    "nativePool": true,
    "fields": [
      [
        "data_87d2ec",
        "-High ball-\nUse for centring.The longer\nyou press,the higher the\nball flies.",
        null,
        {
          "label": "-High ball-",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 250604,
                "original": "-High ball-                 "
              },
              {
                "pc": 250632,
                "original": "Use for centring.The longer "
              },
              {
                "pc": 250660,
                "original": "you press,the higher the    "
              },
              {
                "pc": 250688,
                "original": "ball flies.                 "
              }
            ],
            "symbol": "DATA_87D2EC"
          }
        }
      ],
      [
        "data_87d3cc",
        "-Pass-\nUse for a short pass.To\nmake the player lift the\nball just press the button\nwithout pressing in any\ndirection on the D-Pad.This\nwill enable you to head or\nattempt an overhead kick.",
        null,
        {
          "label": "-Pass-",
          "multiline": true,
          "rows": 8,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 250828,
                "original": "-Pass-                      "
              },
              {
                "pc": 250856,
                "original": "Use for a short pass.To     "
              },
              {
                "pc": 250884,
                "original": "make the player lift the    "
              },
              {
                "pc": 250912,
                "original": "ball just press the button  "
              },
              {
                "pc": 250940,
                "original": "without pressing in any     "
              },
              {
                "pc": 250968,
                "original": "direction on the D-Pad.This "
              },
              {
                "pc": 250996,
                "original": "will enable you to head or  "
              },
              {
                "pc": 251024,
                "original": "attempt an overhead kick.   "
              }
            ],
            "symbol": "DATA_87D3CC"
          }
        }
      ],
      [
        "data_87d4ac",
        "-Shoot-\nPress this button while in\nyour opponent's half.The\nlonger you press the button\nthe higher the shot.",
        null,
        {
          "label": "-Shoot-",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 251052,
                "original": "-Shoot-                     "
              },
              {
                "pc": 251080,
                "original": "Press this button while in  "
              },
              {
                "pc": 251108,
                "original": "your opponent's half.The    "
              },
              {
                "pc": 251136,
                "original": "longer you press the button "
              },
              {
                "pc": 251164,
                "original": "the higher the shot.        "
              }
            ],
            "symbol": "DATA_87D4AC"
          }
        }
      ],
      [
        "data_87d539",
        "-Dash-\nWhile you hold this button\ndown the player will sprint.\nBe careful not to use it too\nmuch or the player will run\nout of stamina.",
        null,
        {
          "label": "-Dash-",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 251193,
                "original": "-Dash-                      "
              },
              {
                "pc": 251221,
                "original": "While you hold this button  "
              },
              {
                "pc": 251249,
                "original": "down the player will sprint."
              },
              {
                "pc": 251277,
                "original": "Be careful not to use it too"
              },
              {
                "pc": 251305,
                "original": "much or the player will run "
              },
              {
                "pc": 251333,
                "original": "out of stamina.             "
              }
            ],
            "symbol": "DATA_87D539"
          }
        }
      ],
      [
        "data_87d5e2",
        "-Goal Keeper-\nWhen in Manual or Semi-Auto\nmode,press the A button to\njump high and the B button\nto dive low.The computer\nwill decide whether to punch\nor catch the ball when you\npress the X button.",
        null,
        {
          "label": "-Goal Keeper-",
          "multiline": true,
          "rows": 8,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 251362,
                "original": "-Goal Keeper-               "
              },
              {
                "pc": 251390,
                "original": "When in Manual or Semi-Auto "
              },
              {
                "pc": 251418,
                "original": "mode,press the A button to  "
              },
              {
                "pc": 251446,
                "original": "jump high and the B button  "
              },
              {
                "pc": 251474,
                "original": "to dive low.The computer    "
              },
              {
                "pc": 251502,
                "original": "will decide whether to punch"
              },
              {
                "pc": 251530,
                "original": "or catch the ball when you  "
              },
              {
                "pc": 251558,
                "original": "press the X button.         "
              }
            ],
            "symbol": "DATA_87D5E2"
          }
        }
      ],
      [
        "data_87d6c3",
        "-Controller Operations-\nTurn the pages by pressing\nthe L/R buttons.",
        null,
        {
          "label": "-Controller Operations-",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 251587,
                "original": "-Controller Operations-     "
              },
              {
                "pc": 251615,
                "original": "Turn the pages by pressing  "
              },
              {
                "pc": 251643,
                "original": "the L/R buttons.            "
              }
            ],
            "symbol": "DATA_87D6C3"
          }
        }
      ]
    ]
  },
  {
    "id": "results-native",
    "page": "texts-results",
    "title": "Textos Resultados",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87d73a",
        "DON'T GIVE UP! - GAME OVER -",
        null,
        {
          "label": "DON'T GIVE UP! - GAME OVER -",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251708,
                "original": "DON'T GIVE UP! - GAME OVER -  "
              }
            ],
            "symbol": "DATA_87D73A"
          }
        }
      ],
      [
        "data_87d75a",
        "PLAYER  WINS!",
        null,
        {
          "label": "PLAYER  WINS!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251740,
                "original": "PLAYER  WINS!"
              }
            ],
            "symbol": "DATA_87D75A"
          }
        }
      ],
      [
        "data_87d769",
        "CONGRATULATIONS!",
        null,
        {
          "label": "CONGRATULATIONS!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251755,
                "original": "CONGRATULATIONS!"
              }
            ],
            "symbol": "DATA_87D769"
          }
        }
      ]
    ]
  },
  {
    "id": "competitions-native",
    "page": "texts-competitions",
    "title": "Textos Competições",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87d7a7",
        "ONE",
        null,
        {
          "label": "ONE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251815,
                "original": "ONE"
              }
            ],
            "symbol": "DATA_87D7A7"
          }
        }
      ],
      [
        "data_87d7aa",
        "TWO",
        null,
        {
          "label": "TWO",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251818,
                "original": "TWO"
              }
            ],
            "symbol": "DATA_87D7AA"
          }
        }
      ],
      [
        "data_87d7ad",
        "THREE",
        null,
        {
          "label": "THREE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251821,
                "original": "THREE"
              }
            ],
            "symbol": "DATA_87D7AD"
          }
        }
      ],
      [
        "data_87d7b2",
        "FOUR",
        null,
        {
          "label": "FOUR",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251826,
                "original": "FOUR"
              }
            ],
            "symbol": "DATA_87D7B2"
          }
        }
      ],
      [
        "data_87d7b6",
        "FIVE",
        null,
        {
          "label": "FIVE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251830,
                "original": "FIVE"
              }
            ],
            "symbol": "DATA_87D7B6"
          }
        }
      ],
      [
        "data_87d7ba",
        "SIX",
        null,
        {
          "label": "SIX",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251834,
                "original": "SIX"
              }
            ],
            "symbol": "DATA_87D7BA"
          }
        }
      ],
      [
        "data_87d7bd",
        "SEVEN",
        null,
        {
          "label": "SEVEN",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251837,
                "original": "SEVEN"
              }
            ],
            "symbol": "DATA_87D7BD"
          }
        }
      ],
      [
        "data_87d7c2",
        "EIGHT",
        null,
        {
          "label": "EIGHT",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251842,
                "original": "EIGHT"
              }
            ],
            "symbol": "DATA_87D7C2"
          }
        }
      ],
      [
        "data_87d7c7",
        "NEXT GAME    VS",
        null,
        {
          "label": "NEXT GAME    VS",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 251847,
                "original": "NEXT GAME    VS"
              }
            ],
            "symbol": "DATA_87D7C7"
          }
        }
      ],
      [
        "data_87d892",
        "LEAGUE STANDINGS",
        null,
        {
          "label": "LEAGUE STANDINGS",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252050,
                "original": "LEAGUE STANDINGS"
              }
            ],
            "symbol": "DATA_87D892"
          }
        }
      ],
      [
        "data_87d8a2",
        "LEAGUE POINTS TABLE",
        null,
        {
          "label": "LEAGUE POINTS TABLE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252066,
                "original": "LEAGUE POINTS TABLE"
              }
            ],
            "symbol": "DATA_87D8A2"
          }
        }
      ],
      [
        "data_87d8c4",
        "TOURNAMENT TABLE",
        null,
        {
          "label": "TOURNAMENT TABLE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252100,
                "original": "TOURNAMENT TABLE"
              }
            ],
            "symbol": "DATA_87D8C4"
          }
        }
      ],
      [
        "data_87d91c",
        "-TODAY'S GAME-",
        null,
        {
          "label": "-TODAY'S GAME-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252188,
                "original": "-TODAY'S GAME-"
              }
            ],
            "symbol": "DATA_87D91C"
          }
        }
      ],
      [
        "data_87d92a",
        "-TODAY'S GAME  RESULT-",
        null,
        {
          "label": "-TODAY'S GAME  RESULT-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252202,
                "original": "-TODAY'S GAME  RESULT-"
              }
            ],
            "symbol": "DATA_87D92A"
          }
        }
      ]
    ]
  },
  {
    "id": "penalties-native",
    "page": "texts-penalties",
    "title": "Textos Pênaltis",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87daa2",
        "Please       select      the order.",
        null,
        {
          "label": "Please       select      the order.",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 252578,
                "original": "Please       select      the order.             "
              }
            ],
            "symbol": "DATA_87DAA2"
          }
        }
      ],
      [
        "data_87dad2",
        "Please       select      the kicker",
        null,
        {
          "label": "Please       select      the kicker",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 252626,
                "original": "Please       select      the kicker             "
              }
            ],
            "symbol": "DATA_87DAD2"
          }
        }
      ],
      [
        "data_87db02",
        "O.K.?        A\nYES/B\nNO",
        null,
        {
          "label": "O.K.?        A",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252674,
                "original": "O.K.?        A"
              },
              {
                "pc": 252689,
                "original": "YES/B"
              },
              {
                "pc": 252695,
                "original": "NO "
              }
            ],
            "symbol": "DATA_87DB02"
          }
        }
      ]
    ]
  },
  {
    "id": "endings-native",
    "page": "texts-endings",
    "title": "Textos Finais",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87db40",
        "INTERNATIONAL  CUP",
        null,
        {
          "label": "INTERNATIONAL  CUP",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252738,
                "original": "INTERNATIONAL  CUP"
              }
            ],
            "symbol": "DATA_87DB40"
          }
        }
      ],
      [
        "data_87db54",
        "THE WORLD SERIES",
        null,
        {
          "label": "THE WORLD SERIES",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252758,
                "original": "THE WORLD SERIES  "
              }
            ],
            "symbol": "DATA_87DB54"
          }
        }
      ],
      [
        "data_87db68",
        "  THE WORLD SERIES\nAND THE CHAMPIONSHIP",
        null,
        {
          "label": "  THE WORLD SERIES",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252778,
                "original": "  THE WORLD SERIES  "
              },
              {
                "pc": 252798,
                "original": "AND THE CHAMPIONSHIP"
              }
            ],
            "symbol": "DATA_87DB68"
          }
        }
      ],
      [
        "data_87db92",
        "THE WORLD SERIES\nAND SPECIAL GAME",
        null,
        {
          "label": "THE WORLD SERIES",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252820,
                "original": "THE WORLD SERIES  "
              },
              {
                "pc": 252838,
                "original": "AND SPECIAL GAME  "
              }
            ],
            "symbol": "DATA_87DB92"
          }
        }
      ],
      [
        "data_87dbb8",
        "Aim for the next\nlevel!",
        null,
        {
          "label": "Aim for the next",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252858,
                "original": "Aim for the next"
              },
              {
                "pc": 252874,
                "original": "level!          "
              }
            ],
            "symbol": "DATA_87DBB8"
          }
        }
      ],
      [
        "data_87dbda",
        "Now challenge the\nworld!",
        null,
        {
          "label": "Now challenge the",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252892,
                "original": "Now challenge the"
              },
              {
                "pc": 252909,
                "original": "world!           "
              }
            ],
            "symbol": "DATA_87DBDA"
          }
        }
      ],
      [
        "data_87dbfe",
        "Let's try the spe-\ncial game!",
        null,
        {
          "label": "Let's try the spe-",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252928,
                "original": "Let's try the spe-"
              },
              {
                "pc": 252946,
                "original": "cial game!        "
              }
            ],
            "symbol": "DATA_87DBFE"
          }
        }
      ],
      [
        "data_87dc24",
        "Now try to win the\nfirst season too!",
        null,
        {
          "label": "Now try to win the",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 252966,
                "original": "Now try to win the"
              },
              {
                "pc": 252984,
                "original": "first season too! "
              }
            ],
            "symbol": "DATA_87DC24"
          }
        }
      ],
      [
        "data_87dc4a",
        "Congratulations   for a perfect game!",
        null,
        {
          "label": "Congratulations   for a perfect game!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253004,
                "original": "Congratulations   for a perfect game!                 "
              }
            ],
            "symbol": "DATA_87DC4A"
          }
        }
      ],
      [
        "data_87dc82",
        "Congratulations\nfor a perfect win!\nYou're the best!",
        null,
        {
          "label": "Congratulations",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253060,
                "original": "Congratulations   "
              },
              {
                "pc": 253078,
                "original": "for a perfect win!"
              },
              {
                "pc": 253096,
                "original": "You're the best!  "
              }
            ],
            "symbol": "DATA_87DC82"
          }
        }
      ],
      [
        "data_87dcba",
        "Now try to win the\nsecond season too!",
        null,
        {
          "label": "Now try to win the",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253116,
                "original": "Now try to win the"
              },
              {
                "pc": 253134,
                "original": "second season too!"
              }
            ],
            "symbol": "DATA_87DCBA"
          }
        }
      ]
    ]
  },
  {
    "id": "rules-native",
    "page": "texts-rules",
    "title": "Textos Regras",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87dd89",
        "FOUL",
        null,
        {
          "label": "FOUL",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253321,
                "original": "FOUL"
              }
            ],
            "symbol": "DATA_87DD89"
          }
        }
      ],
      [
        "data_87dd8d",
        "YELLOW CARD",
        null,
        {
          "label": "YELLOW CARD",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253325,
                "original": "YELLOW CARD"
              }
            ],
            "symbol": "DATA_87DD8D"
          }
        }
      ],
      [
        "data_87dd98",
        "OFF SIDE",
        null,
        {
          "label": "OFF SIDE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253336,
                "original": "OFF SIDE"
              }
            ],
            "symbol": "DATA_87DD98"
          }
        }
      ],
      [
        "data_87dda0",
        "V-GOAL",
        null,
        {
          "label": "V-GOAL",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253344,
                "original": "V-GOAL"
              }
            ],
            "symbol": "DATA_87DDA0"
          }
        }
      ],
      [
        "data_87dda6",
        "OVER TIME",
        null,
        {
          "label": "OVER TIME",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253350,
                "original": "OVER TIME"
              }
            ],
            "symbol": "DATA_87DDA6"
          }
        }
      ],
      [
        "data_87ddaf",
        "ON  OFF",
        null,
        {
          "label": "ON  OFF",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253359,
                "original": "ON  OFF"
              }
            ],
            "symbol": "DATA_87DDAF"
          }
        }
      ]
    ]
  },
  {
    "id": "options-native",
    "page": "texts-options",
    "title": "Textos Opções Gerais",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87dde8",
        "GAME LEVEL",
        null,
        {
          "label": "GAME LEVEL",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253416,
                "original": "GAME LEVEL"
              }
            ],
            "symbol": "DATA_87DDE8"
          }
        }
      ],
      [
        "data_87ddf2",
        "GAME TIME",
        null,
        {
          "label": "GAME TIME",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253426,
                "original": "GAME TIME"
              }
            ],
            "symbol": "DATA_87DDF2"
          }
        }
      ],
      [
        "data_87de03",
        "SOUND",
        null,
        {
          "label": "SOUND",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253443,
                "original": "SOUND"
              }
            ],
            "symbol": "DATA_87DE03"
          }
        }
      ],
      [
        "data_87de08",
        "STEREO",
        null,
        {
          "label": "STEREO",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253448,
                "original": "STEREO"
              }
            ],
            "symbol": "DATA_87DE08"
          }
        }
      ],
      [
        "data_87de0e",
        "MONO",
        null,
        {
          "label": "MONO",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253454,
                "original": "MONO"
              }
            ],
            "symbol": "DATA_87DE0E"
          }
        }
      ],
      [
        "data_87de12",
        "RULES",
        null,
        {
          "label": "RULES",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253458,
                "original": "RULES"
              }
            ],
            "symbol": "DATA_87DE12"
          }
        }
      ]
    ]
  },
  {
    "id": "training-native",
    "page": "texts-training",
    "title": "Textos Treinamento",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87de77",
        "TRAINING",
        null,
        {
          "label": "TRAINING",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253559,
                "original": "TRAINING "
              }
            ],
            "symbol": "DATA_87DE77"
          }
        }
      ],
      [
        "data_87de80",
        "CHALLENGE",
        null,
        {
          "label": "CHALLENGE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253568,
                "original": "CHALLENGE"
              }
            ],
            "symbol": "DATA_87DE80"
          }
        }
      ],
      [
        "data_87de89",
        "This lets you practice\nthe basic movements\nneeded to be success-\nful in this game.",
        null,
        {
          "label": "This lets you practice",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 253577,
                "original": "This lets you practice"
              },
              {
                "pc": 253599,
                "original": "the basic movements   "
              },
              {
                "pc": 253621,
                "original": "needed to be success- "
              },
              {
                "pc": 253643,
                "original": "ful in this game.     "
              }
            ],
            "symbol": "DATA_87DE89"
          }
        }
      ],
      [
        "data_87dee1",
        "Try to set a new rec-\nord as you'll be com-\npeting against the\nclock.",
        null,
        {
          "label": "Try to set a new rec-",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 253665,
                "original": "Try to set a new rec- "
              },
              {
                "pc": 253687,
                "original": "ord as you'll be com- "
              },
              {
                "pc": 253709,
                "original": "peting against the    "
              },
              {
                "pc": 253731,
                "original": "clock.                "
              }
            ],
            "symbol": "DATA_87DEE1"
          }
        }
      ],
      [
        "data_87df39",
        "FREE",
        null,
        {
          "label": "FREE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253753,
                "original": "FREE"
              }
            ],
            "symbol": "DATA_87DF39"
          }
        }
      ],
      [
        "data_87df3d",
        "DEFENSE",
        null,
        {
          "label": "DEFENSE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253757,
                "original": "DEFENSE"
              }
            ],
            "symbol": "DATA_87DF3D"
          }
        }
      ],
      [
        "data_87df52",
        "FREE KICK",
        null,
        {
          "label": "FREE KICK",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253778,
                "original": "FREE KICK"
              }
            ],
            "symbol": "DATA_87DF52"
          }
        }
      ],
      [
        "data_87df5b",
        "KEEPER",
        null,
        {
          "label": "KEEPER",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253787,
                "original": "KEEPER"
              }
            ],
            "symbol": "DATA_87DF5B"
          }
        }
      ],
      [
        "data_87df61",
        "MODE",
        null,
        {
          "label": "MODE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253793,
                "original": "MODE"
              }
            ],
            "symbol": "DATA_87DF61"
          }
        }
      ],
      [
        "data_87df65",
        "DRIBBLE",
        null,
        {
          "label": "DRIBBLE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253797,
                "original": "DRIBBLE"
              }
            ],
            "symbol": "DATA_87DF65"
          }
        }
      ],
      [
        "data_87df6c",
        "PASS",
        null,
        {
          "label": "PASS",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253804,
                "original": "PASS   "
              }
            ],
            "symbol": "DATA_87DF6C"
          }
        }
      ],
      [
        "data_87df73",
        "SHOOT",
        null,
        {
          "label": "SHOOT",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253811,
                "original": "SHOOT  "
              }
            ],
            "symbol": "DATA_87DF73"
          }
        }
      ],
      [
        "data_87dfb7",
        "EXIT",
        null,
        {
          "label": "EXIT",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253879,
                "original": "EXIT   "
              }
            ],
            "symbol": "DATA_87DFB7"
          }
        }
      ],
      [
        "data_87e808",
        "Use the whole field to\npractice dribbling,\npassing and shooting.",
        null,
        {
          "label": "Use the whole field to",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256008,
                "original": "Use the whole field to  "
              },
              {
                "pc": 256032,
                "original": "practice dribbling,     "
              },
              {
                "pc": 256056,
                "original": "passing and shooting.   "
              }
            ],
            "symbol": "DATA_87E808"
          }
        }
      ],
      [
        "data_87e880",
        "Try to take the ball\naway from the 3\noffensive players who\nare aiming for a goal.",
        null,
        {
          "label": "Try to take the ball",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256128,
                "original": "Try to take the ball    "
              },
              {
                "pc": 256152,
                "original": "away from the 3         "
              },
              {
                "pc": 256176,
                "original": "offensive players who   "
              },
              {
                "pc": 256200,
                "original": "are aiming for a goal.  "
              }
            ],
            "symbol": "DATA_87E880"
          }
        }
      ],
      [
        "data_87e8f8",
        "Practice your free kick.",
        null,
        {
          "label": "Practice your free kick.",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256248,
                "original": "Practice your free kick."
              }
            ],
            "symbol": "DATA_87E8F8"
          }
        }
      ],
      [
        "data_87e970",
        "Defend your goal,\ncontrol the Keeper.\nTwo opposing players\nwill try to score.",
        null,
        {
          "label": "Defend your goal,",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256368,
                "original": "Defend your goal,       "
              },
              {
                "pc": 256392,
                "original": "control the Keeper.     "
              },
              {
                "pc": 256416,
                "original": "Two opposing players    "
              },
              {
                "pc": 256440,
                "original": "will try to score.      "
              }
            ],
            "symbol": "DATA_87E970"
          }
        }
      ]
    ]
  },
  {
    "id": "challenge-native",
    "page": "texts-challenge",
    "title": "Textos Desafio",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87dfbe",
        "BEST SCORE",
        null,
        {
          "label": "BEST SCORE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 253886,
                "original": "BEST SCORE"
              }
            ],
            "symbol": "DATA_87DFBE"
          }
        }
      ],
      [
        "data_87dfe8",
        "Dribble to avoid your\nopponents and capture\nthe flags as quickly as\npossible.Shoot after\ncollecting all the flags\nscore and you may get\na bonus!",
        null,
        {
          "label": "Dribble to avoid your",
          "multiline": true,
          "rows": 7,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 253928,
                "original": "Dribble to avoid your       "
              },
              {
                "pc": 253956,
                "original": "opponents and capture       "
              },
              {
                "pc": 253984,
                "original": "the flags as quickly as     "
              },
              {
                "pc": 254012,
                "original": "possible.Shoot after        "
              },
              {
                "pc": 254040,
                "original": "collecting all the flags    "
              },
              {
                "pc": 254068,
                "original": "score and you may get       "
              },
              {
                "pc": 254096,
                "original": "a bonus!                    "
              }
            ],
            "symbol": "DATA_87DFE8"
          }
        }
      ],
      [
        "data_87e0c8",
        "Pass the ball as fast as\npossible to all 10\nplayers(no Goalkeeper).\nNow shoot the ball\nto receive bonus points.",
        null,
        {
          "label": "Pass the ball as fast as",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 254152,
                "original": "Pass the ball as fast as    "
              },
              {
                "pc": 254180,
                "original": "possible to all 10          "
              },
              {
                "pc": 254208,
                "original": "players(no Goalkeeper).     "
              },
              {
                "pc": 254236,
                "original": "Now shoot the ball          "
              },
              {
                "pc": 254264,
                "original": "to receive bonus points.    "
              }
            ],
            "symbol": "DATA_87E0C8"
          }
        }
      ],
      [
        "data_87e1a8",
        "Shoot the ball along a\nset path to avoid the\nopposition.Aim for the\ncorners of the net for\nbonus points.",
        null,
        {
          "label": "Shoot the ball along a",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 254376,
                "original": "Shoot the ball along a      "
              },
              {
                "pc": 254404,
                "original": "set path to avoid the       "
              },
              {
                "pc": 254432,
                "original": "opposition.Aim for the      "
              },
              {
                "pc": 254460,
                "original": "corners of the net for      "
              },
              {
                "pc": 254488,
                "original": "bonus points.               "
              }
            ],
            "symbol": "DATA_87E1A8"
          }
        }
      ],
      [
        "data_87e288",
        "Take the ball away from\nthe attacking team as\nsoon as possible.After\nstealing the ball aim\nfor a goal to get bonus\npoints.",
        null,
        {
          "label": "Take the ball away from",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 254600,
                "original": "Take the ball away from     "
              },
              {
                "pc": 254628,
                "original": "the attacking team as       "
              },
              {
                "pc": 254656,
                "original": "soon as possible.After      "
              },
              {
                "pc": 254684,
                "original": "stealing the ball aim       "
              },
              {
                "pc": 254712,
                "original": "for a goal to get bonus     "
              },
              {
                "pc": 254740,
                "original": "points.                     "
              }
            ],
            "symbol": "DATA_87E288"
          }
        }
      ],
      [
        "data_87e368",
        "Either aim straight for\nthe goal along a set\npath or opt to center\nthe ball when taking the\ncorner kick.Aim for the\ncorners of the net to\nget bonus points.",
        null,
        {
          "label": "Either aim straight for",
          "multiline": true,
          "rows": 7,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 254824,
                "original": "Either aim straight for     "
              },
              {
                "pc": 254852,
                "original": "the goal along a set        "
              },
              {
                "pc": 254880,
                "original": "path or opt to center       "
              },
              {
                "pc": 254908,
                "original": "the ball when taking the    "
              },
              {
                "pc": 254936,
                "original": "corner kick.Aim for the     "
              },
              {
                "pc": 254964,
                "original": "corners of the net to       "
              },
              {
                "pc": 254992,
                "original": "get bonus points.           "
              }
            ],
            "symbol": "DATA_87E368"
          }
        }
      ],
      [
        "data_87e448",
        "Avoid the wall and aim\neither straight for goal\nor try a center.Aim for\nthe corners of the net\nto get bonus points.",
        null,
        {
          "label": "Avoid the wall and aim",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 255048,
                "original": "Avoid the wall and aim      "
              },
              {
                "pc": 255076,
                "original": "either straight for goal    "
              },
              {
                "pc": 255104,
                "original": "or try a center.Aim for     "
              },
              {
                "pc": 255132,
                "original": "the corners of the net      "
              },
              {
                "pc": 255160,
                "original": "to get bonus points.        "
              }
            ],
            "symbol": "DATA_87E448"
          }
        }
      ]
    ]
  },
  {
    "id": "records-native",
    "page": "texts-records",
    "title": "Textos Recordes",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87e9e8",
        "-YOUR RECORD-",
        null,
        {
          "label": "-YOUR RECORD-",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 256488,
                "original": "-YOUR RECORD-"
              }
            ],
            "symbol": "DATA_87E9E8"
          }
        }
      ],
      [
        "data_87e9f5",
        "TIME\n  :  :",
        null,
        {
          "label": "TIME",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 256501,
                "original": "TIME"
              },
              {
                "pc": 256515,
                "original": "  :  :"
              }
            ],
            "symbol": "DATA_87E9F5"
          }
        }
      ],
      [
        "data_87ea09",
        "TIME SCORE",
        null,
        {
          "label": "TIME SCORE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 256521,
                "original": "TIME SCORE"
              }
            ],
            "symbol": "DATA_87EA09"
          }
        }
      ],
      [
        "data_87ea1c",
        "BONUS TIME\n  :  :",
        null,
        {
          "label": "BONUS TIME",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 256540,
                "original": "BONUS TIME"
              },
              {
                "pc": 256554,
                "original": "  :  :"
              }
            ],
            "symbol": "DATA_87EA1C"
          }
        }
      ],
      [
        "data_87ea30",
        "BONUS SCORE",
        null,
        {
          "label": "BONUS SCORE",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 256560,
                "original": "BONUS SCORE"
              }
            ],
            "symbol": "DATA_87EA30"
          }
        }
      ],
      [
        "data_87ea8a",
        "Don't be too\nimpressed.lt's\nonly an average\nrecord.",
        null,
        {
          "label": "Don't be too",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256650,
                "original": "Don't be too        "
              },
              {
                "pc": 256670,
                "original": "impressed.lt's      "
              },
              {
                "pc": 256690,
                "original": "only an average     "
              },
              {
                "pc": 256710,
                "original": "record.             "
              }
            ],
            "symbol": "DATA_87EA8A"
          }
        }
      ],
      [
        "data_87eada",
        "Great\nIt's a new\nrecord!\nUnbelievable!",
        null,
        {
          "label": "Great",
          "multiline": true,
          "rows": 4,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256730,
                "original": "Great"
              },
              {
                "pc": 256736,
                "original": "It's a new    "
              },
              {
                "pc": 256750,
                "original": "record!             "
              },
              {
                "pc": 256770,
                "original": "Unbelievable!       "
              }
            ],
            "symbol": "DATA_87EADA"
          }
        }
      ],
      [
        "data_87eb2a",
        "Not good enough.\nPractice harder\nnext time!",
        null,
        {
          "label": "Not good enough.",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256810,
                "original": "Not good enough.    "
              },
              {
                "pc": 256830,
                "original": "Practice harder     "
              },
              {
                "pc": 256850,
                "original": "next time!          "
              }
            ],
            "symbol": "DATA_87EB2A"
          }
        }
      ],
      [
        "data_87eb7a",
        "Please try harder\nnext time.",
        null,
        {
          "label": "Please try harder",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256890,
                "original": "Please try harder   "
              },
              {
                "pc": 256910,
                "original": "next time.          "
              }
            ],
            "symbol": "DATA_87EB7A"
          }
        }
      ],
      [
        "data_87ebca",
        "You just missed a\nnew record.\nTry again.",
        null,
        {
          "label": "You just missed a",
          "multiline": true,
          "rows": 3,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 256970,
                "original": "You just missed a   "
              },
              {
                "pc": 256990,
                "original": "new record.         "
              },
              {
                "pc": 257010,
                "original": "Try again.          "
              }
            ],
            "symbol": "DATA_87EBCA"
          }
        }
      ],
      [
        "data_87ec1a",
        "Good but try harder\nfor the record.",
        null,
        {
          "label": "Good but try harder",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 257050,
                "original": "Good but try harder "
              },
              {
                "pc": 257070,
                "original": "for the record.     "
              }
            ],
            "symbol": "DATA_87EC1A"
          }
        }
      ],
      [
        "data_87ecaf",
        "INPUT NAME",
        null,
        {
          "label": "INPUT NAME",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257199,
                "original": "INPUT NAME  "
              }
            ],
            "symbol": "DATA_87ECAF"
          }
        }
      ]
    ]
  },
  {
    "id": "password-native",
    "page": "texts-password",
    "title": "Textos Senha",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87edbd",
        "FROM THE BIGINING",
        null,
        {
          "label": "FROM THE BIGINING",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257469,
                "original": "FROM THE BIGINING"
              }
            ],
            "symbol": "DATA_87EDBD"
          }
        }
      ],
      [
        "data_87edd6",
        "PASS WORD",
        null,
        {
          "label": "PASS WORD",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257494,
                "original": "PASS WORD"
              }
            ],
            "symbol": "DATA_87EDD6"
          }
        }
      ]
    ]
  },
  {
    "id": "scenario-native",
    "page": "texts-scenarios",
    "title": "Textos Cenários",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87ee15",
        "NO.",
        null,
        {
          "label": "NO.",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257557,
                "original": "NO."
              }
            ],
            "symbol": "DATA_87EE15"
          }
        }
      ],
      [
        "data_87ee3b",
        "NO.1  ITALY 1-2 CROATIA\n      1:14 ITALY'S C.K.",
        null,
        {
          "label": "NO.1  ITALY 1-2 CROATIA",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257595,
                "original": "NO.1  ITALY 1-2 CROATIA     "
              },
              {
                "pc": 257623,
                "original": "      1:14 ITALY'S C.K.     "
              }
            ],
            "symbol": "DATA_87EE3B"
          }
        }
      ],
      [
        "data_87ee73",
        "NO.2  GERMANY 2-3 BULGARIA\n      1:02 GERMANY'S F.K.",
        null,
        {
          "label": "NO.2  GERMANY 2-3 BULGARIA",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257651,
                "original": "NO.2  GERMANY 2-3 BULGARIA  "
              },
              {
                "pc": 257679,
                "original": "      1:02 GERMANY'S F.K.   "
              }
            ],
            "symbol": "DATA_87EE73"
          }
        }
      ],
      [
        "data_87eeab",
        "NO.3  ENGLAND 1-3 BRAZIL\n      1:54 ENGLAND'S C.K.",
        null,
        {
          "label": "NO.3  ENGLAND 1-3 BRAZIL",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257707,
                "original": "NO.3  ENGLAND 1-3 BRAZIL    "
              },
              {
                "pc": 257735,
                "original": "      1:54 ENGLAND'S C.K.   "
              }
            ],
            "symbol": "DATA_87EEAB"
          }
        }
      ],
      [
        "data_87eee3",
        "NO.4  GERMANY 0-0 ITALY\n      0:56 GERMANY'S F.K.",
        null,
        {
          "label": "NO.4  GERMANY 0-0 ITALY",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257763,
                "original": "NO.4  GERMANY 0-0 ITALY     "
              },
              {
                "pc": 257791,
                "original": "      0:56 GERMANY'S F.K.   "
              }
            ],
            "symbol": "DATA_87EEE3"
          }
        }
      ],
      [
        "data_87ef1b",
        "NO.5  TURKEY 1-1 SWEDEN\n      0:49 TURKEY'S THROW IN",
        null,
        {
          "label": "NO.5  TURKEY 1-1 SWEDEN",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257819,
                "original": "NO.5  TURKEY 1-1 SWEDEN     "
              },
              {
                "pc": 257847,
                "original": "      0:49 TURKEY'S THROW IN"
              }
            ],
            "symbol": "DATA_87EF1B"
          }
        }
      ],
      [
        "data_87ef53",
        "NO.6  BELGIUM 1-1 SPAIN\n      0:42 BELGIUM'S F.K.",
        null,
        {
          "label": "NO.6  BELGIUM 1-1 SPAIN",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257875,
                "original": "NO.6  BELGIUM 1-1 SPAIN     "
              },
              {
                "pc": 257903,
                "original": "      0:42 BELGIUM'S F.K.   "
              }
            ],
            "symbol": "DATA_87EF53"
          }
        }
      ],
      [
        "data_87ef8b",
        "NO.7  ROMANIA 0-1 POLAND\n      1:43 ROMANIA'S F.K.",
        null,
        {
          "label": "NO.7  ROMANIA 0-1 POLAND",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257931,
                "original": "NO.7  ROMANIA 0-1 POLAND    "
              },
              {
                "pc": 257959,
                "original": "      1:43 ROMANIA'S F.K.   "
              }
            ],
            "symbol": "DATA_87EF8B"
          }
        }
      ],
      [
        "data_87efc3",
        "NO.8  SCOTLAND 0-0 RUSSIA\n      1:24 SCOTLAND'S G.K.",
        null,
        {
          "label": "NO.8  SCOTLAND 0-0 RUSSIA",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 257987,
                "original": "NO.8  SCOTLAND 0-0 RUSSIA   "
              },
              {
                "pc": 258015,
                "original": "      1:24 SCOTLAND'S G.K.  "
              }
            ],
            "symbol": "DATA_87EFC3"
          }
        }
      ],
      [
        "data_87effb",
        "NO.9  PORTUGAL 0-1 IRELAND\n      0:38 PORTUGAL'S F.K.",
        null,
        {
          "label": "NO.9  PORTUGAL 0-1 IRELAND",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 258043,
                "original": "NO.9  PORTUGAL 0-1 IRELAND  "
              },
              {
                "pc": 258071,
                "original": "      0:38 PORTUGAL'S F.K.  "
              }
            ],
            "symbol": "DATA_87EFFB"
          }
        }
      ],
      [
        "data_87f033",
        "NO.10 ARGENTINA 2-2 BRAZIL\n      0:49 ARGENTINA'S C.K.",
        null,
        {
          "label": "NO.10 ARGENTINA 2-2 BRAZIL",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 258099,
                "original": "NO.10 ARGENTINA 2-2 BRAZIL  "
              },
              {
                "pc": 258127,
                "original": "      0:49 ARGENTINA'S C.K. "
              }
            ],
            "symbol": "DATA_87F033"
          }
        }
      ],
      [
        "data_87f06b",
        "NO.11 HOLLAND 1-3 CZECH.REP.\n      1:38 HOLLAND'S F.K.",
        null,
        {
          "label": "NO.11 HOLLAND 1-3 CZECH.REP.",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 258155,
                "original": "NO.11 HOLLAND 1-3 CZECH.REP."
              },
              {
                "pc": 258183,
                "original": "      1:38 HOLLAND'S F.K.   "
              }
            ],
            "symbol": "DATA_87F06B"
          }
        }
      ],
      [
        "data_87f0a3",
        "NO.12 ENGLAND 1-1 JAPAN\n      0:02 ENGLAND'S C.K.",
        null,
        {
          "label": "NO.12 ENGLAND 1-1 JAPAN",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 258211,
                "original": "NO.12 ENGLAND 1-1 JAPAN     "
              },
              {
                "pc": 258239,
                "original": "      0:02 ENGLAND'S C.K.   "
              }
            ],
            "symbol": "DATA_87F0A3"
          }
        }
      ],
      [
        "data_87f12d",
        "It seems like a defeat for\nITALY against the talented\nCROATIA.ITALY scored a go-\nal in the second half.Now\nthey are trying to turn\nthe tables around.",
        null,
        {
          "label": "It seems like a defeat for",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 258349,
                "original": "It seems like a defeat for"
              },
              {
                "pc": 258375,
                "original": "ITALY against the talented"
              },
              {
                "pc": 258401,
                "original": "CROATIA.ITALY scored a go-"
              },
              {
                "pc": 258427,
                "original": "al in the second half.Now "
              },
              {
                "pc": 258453,
                "original": "they are trying to turn   "
              },
              {
                "pc": 258479,
                "original": "the tables around.        "
              }
            ],
            "symbol": "DATA_87F12D"
          }
        }
      ],
      [
        "data_87f1c9",
        "Although GERMANY had a 2\ngoal lead,they gave BULG-\nARIA a penalty,and now th-\ney are behind by a goal.\nBULGARIA is a dangerous\nteam to handle.",
        null,
        {
          "label": "Although GERMANY had a 2",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 258505,
                "original": "Although GERMANY had a 2  "
              },
              {
                "pc": 258531,
                "original": "goal lead,they gave BULG- "
              },
              {
                "pc": 258557,
                "original": "ARIA a penalty,and now th-"
              },
              {
                "pc": 258583,
                "original": "ey are behind by a goal.  "
              },
              {
                "pc": 258609,
                "original": "BULGARIA is a dangerous   "
              },
              {
                "pc": 258635,
                "original": "team to handle.           "
              }
            ],
            "symbol": "DATA_87F1C9"
          }
        }
      ],
      [
        "data_87f265",
        "It is ENGLAND,\nthe home of\nfootball\nagainst\nthe cham-\npions\nBRAZIL.ENGLAND can\nnot end the game as it is,\nfor the sake of their\npride.",
        null,
        {
          "label": "It is ENGLAND,",
          "multiline": true,
          "rows": 8,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 258661,
                "original": "It is ENGLAND,"
              },
              {
                "pc": 258676,
                "original": "the home of"
              },
              {
                "pc": 258687,
                "original": "football"
              },
              {
                "pc": 258696,
                "original": "against"
              },
              {
                "pc": 258704,
                "original": "the cham-"
              },
              {
                "pc": 258713,
                "original": "pions"
              },
              {
                "pc": 258719,
                "original": "BRAZIL.ENGLAND can  "
              },
              {
                "pc": 258739,
                "original": "not end the game as it is,"
              },
              {
                "pc": 258765,
                "original": "for the sake of their     "
              },
              {
                "pc": 258791,
                "original": "pride.                    "
              }
            ],
            "symbol": "DATA_87F265"
          }
        }
      ],
      [
        "data_87f301",
        "GERMANY can not score a\ngoal against ITALY,even\nthough the ITALIANS are\nplaying poorly.GERMANY wa-\nnts to turn the tables\nwith this free kick.",
        null,
        {
          "label": "GERMANY can not score a",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 258817,
                "original": "GERMANY can not score a   "
              },
              {
                "pc": 258843,
                "original": "goal against ITALY,even   "
              },
              {
                "pc": 258869,
                "original": "though the ITALIANS are   "
              },
              {
                "pc": 258895,
                "original": "playing poorly.GERMANY wa-"
              },
              {
                "pc": 258921,
                "original": "nts to turn the tables    "
              },
              {
                "pc": 258947,
                "original": "with this free kick.      "
              }
            ],
            "symbol": "DATA_87F301"
          }
        }
      ],
      [
        "data_87f39d",
        "TURKEY is doing extremely\nwell against SWEDEN,who\nhave been playing with\ntheir best team.One more\ngoal for a historical win.",
        null,
        {
          "label": "TURKEY is doing extremely",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 258973,
                "original": "TURKEY is doing extremely "
              },
              {
                "pc": 258999,
                "original": "well against SWEDEN,who   "
              },
              {
                "pc": 259025,
                "original": "have been playing with    "
              },
              {
                "pc": 259051,
                "original": "their best team.One more  "
              },
              {
                "pc": 259077,
                "original": "goal for a historical win."
              }
            ],
            "symbol": "DATA_87F39D"
          }
        }
      ],
      [
        "data_87f439",
        "In the last game,when they\nfaced each other,BELGIUM\nwere soundly beaten.Alth-\nough many key players are\nout,this time they want to\nmake it even.",
        null,
        {
          "label": "In the last game,when they",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259129,
                "original": "In the last game,when they"
              },
              {
                "pc": 259155,
                "original": "faced each other,BELGIUM  "
              },
              {
                "pc": 259181,
                "original": "were soundly beaten.Alth- "
              },
              {
                "pc": 259207,
                "original": "ough many key players are "
              },
              {
                "pc": 259233,
                "original": "out,this time they want to"
              },
              {
                "pc": 259259,
                "original": "make it even.             "
              }
            ],
            "symbol": "DATA_87F439"
          }
        }
      ],
      [
        "data_87f4d5",
        "ROMANIA is in good condit-\nion.Even though they have\nlet POLAND take the lead,\nthere is plenty of time to\nturn it around.",
        null,
        {
          "label": "ROMANIA is in good condit-",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259285,
                "original": "ROMANIA is in good condit-"
              },
              {
                "pc": 259311,
                "original": "ion.Even though they have "
              },
              {
                "pc": 259337,
                "original": "let POLAND take the lead, "
              },
              {
                "pc": 259363,
                "original": "there is plenty of time to"
              },
              {
                "pc": 259389,
                "original": "turn it around.           "
              }
            ],
            "symbol": "DATA_87F4D5"
          }
        }
      ],
      [
        "data_87f571",
        "SCOTLAND is eager for a\nticket to ENGLAND for\nthe finals.The most impor-\ntant thing to do,is to\ndefeat RUSSIA right now.",
        null,
        {
          "label": "SCOTLAND is eager for a",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259441,
                "original": "SCOTLAND is eager for a   "
              },
              {
                "pc": 259467,
                "original": "ticket to ENGLAND for     "
              },
              {
                "pc": 259493,
                "original": "the finals.The most impor-"
              },
              {
                "pc": 259519,
                "original": "tant thing to do,is to    "
              },
              {
                "pc": 259545,
                "original": "defeat RUSSIA right now.  "
              }
            ],
            "symbol": "DATA_87F571"
          }
        }
      ],
      [
        "data_87f60d",
        "PORTUGAL have regained\ntheir old strong form.But\nthey have just conceded an\nown goal.Concentrate and\nyou may yet win.",
        null,
        {
          "label": "PORTUGAL have regained",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259597,
                "original": "PORTUGAL have regained    "
              },
              {
                "pc": 259623,
                "original": "their old strong form.But "
              },
              {
                "pc": 259649,
                "original": "they have just conceded an"
              },
              {
                "pc": 259675,
                "original": "own goal.Concentrate and  "
              },
              {
                "pc": 259701,
                "original": "you may yet win.          "
              }
            ],
            "symbol": "DATA_87F60D"
          }
        }
      ],
      [
        "data_87f6a9",
        "BRAZIL are strong.They se-\nem like they can score fr-\nom anywhere.But this is\nfor the south american ch-\nampionship,so ARGENTINA\nmust fight back.",
        null,
        {
          "label": "BRAZIL are strong.They se-",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259753,
                "original": "BRAZIL are strong.They se-"
              },
              {
                "pc": 259779,
                "original": "em like they can score fr-"
              },
              {
                "pc": 259805,
                "original": "om anywhere.But this is   "
              },
              {
                "pc": 259831,
                "original": "for the south american ch-"
              },
              {
                "pc": 259857,
                "original": "ampionship,so ARGENTINA   "
              },
              {
                "pc": 259883,
                "original": "must fight back.          "
              }
            ],
            "symbol": "DATA_87F6A9"
          }
        }
      ],
      [
        "data_87f745",
        "HOLLAND'S defense has\nbeen shattered in the sec-\nond half.Unless their off-\nence starts something,they\nhave no choice but to\nlose.",
        null,
        {
          "label": "HOLLAND'S defense has",
          "multiline": true,
          "rows": 6,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 259909,
                "original": "HOLLAND'S defense has     "
              },
              {
                "pc": 259935,
                "original": "been shattered in the sec-"
              },
              {
                "pc": 259961,
                "original": "ond half.Unless their off-"
              },
              {
                "pc": 259987,
                "original": "ence starts something,they"
              },
              {
                "pc": 260013,
                "original": "have no choice but to     "
              },
              {
                "pc": 260039,
                "original": "lose.                     "
              }
            ],
            "symbol": "DATA_87F745"
          }
        }
      ],
      [
        "data_87f7e1",
        "Unbelievably,ENGLAND conc-\neded a goal to a country\nfrom ASIA.It will be just\nas bad as losing if the\ngame ends in a tie.",
        null,
        {
          "label": "Unbelievably,ENGLAND conc-",
          "multiline": true,
          "rows": 5,
          "pool": {
            "font": "SmallMenuText",
            "segments": [
              {
                "pc": 260065,
                "original": "Unbelievably,ENGLAND conc-"
              },
              {
                "pc": 260091,
                "original": "eded a goal to a country  "
              },
              {
                "pc": 260117,
                "original": "from ASIA.It will be just "
              },
              {
                "pc": 260143,
                "original": "as bad as losing if the   "
              },
              {
                "pc": 260169,
                "original": "game ends in a tie.       "
              }
            ],
            "symbol": "DATA_87F7E1"
          }
        }
      ],
      [
        "data_87f8dc",
        "UNLUCKY THIS TIME.\n    TRY AGAIN.",
        null,
        {
          "label": "UNLUCKY THIS TIME.",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260316,
                "original": "UNLUCKY THIS TIME."
              },
              {
                "pc": 260334,
                "original": "    TRY AGAIN.    "
              }
            ],
            "symbol": "DATA_87F8DC"
          }
        }
      ],
      [
        "data_87f900",
        " CONGRATULATIONS!\n SCENARIO   CLEAR!",
        null,
        {
          "label": " CONGRATULATIONS!",
          "multiline": true,
          "rows": 2,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260354,
                "original": " CONGRATULATIONS! "
              },
              {
                "pc": 260374,
                "original": " SCENARIO   CLEAR!"
              }
            ],
            "symbol": "DATA_87F900"
          }
        }
      ],
      [
        "data_87f928",
        "SCENARIO",
        null,
        {
          "label": "SCENARIO",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260392,
                "original": "SCENARIO        "
              }
            ],
            "symbol": "DATA_87F928"
          }
        }
      ],
      [
        "data_87f938",
        "IN",
        null,
        {
          "label": "IN",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260408,
                "original": "IN"
              }
            ],
            "symbol": "DATA_87F938"
          }
        }
      ],
      [
        "data_87f93a",
        "TRY!",
        null,
        {
          "label": "TRY!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260410,
                "original": "TRY!"
              }
            ],
            "symbol": "DATA_87F93A"
          }
        }
      ],
      [
        "data_87f93e",
        "CLEARED",
        null,
        {
          "label": "CLEARED",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260414,
                "original": "CLEARED"
              }
            ],
            "symbol": "DATA_87F93E"
          }
        }
      ],
      [
        "data_87f945",
        "SCENARIO MODE CLEARED",
        null,
        {
          "label": "SCENARIO MODE CLEARED",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260421,
                "original": "SCENARIO MODE CLEARED"
              }
            ],
            "symbol": "DATA_87F945"
          }
        }
      ],
      [
        "data_87f95a",
        "IN   TH TRY!",
        null,
        {
          "label": "IN   TH TRY!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260442,
                "original": "IN   TH TRY!"
              }
            ],
            "symbol": "DATA_87F95A"
          }
        }
      ],
      [
        "data_87f966",
        "  CONGRATULATIONS!",
        null,
        {
          "label": "  CONGRATULATIONS!",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260454,
                "original": "  CONGRATULATIONS!                        "
              }
            ],
            "symbol": "DATA_87F966"
          }
        }
      ]
    ]
  },
  {
    "id": "credits-native",
    "page": "texts-credits",
    "title": "Textos Créditos",
    "area": "pre-partida",
    "createPage": true,
    "nativePool": true,
    "fields": [
      [
        "data_87f990",
        "You are the greatest!                     KONAMI ALL RIGHTS RESERVED.",
        null,
        {
          "label": "You are the greatest!                     KONAMI ALL RIGHTS RESERVED.",
          "multiline": false,
          "rows": 1,
          "pool": {
            "font": "TallMenuText",
            "segments": [
              {
                "pc": 260496,
                "original": "You are the greatest!                     KONAMI ALL RIGHTS RESERVED."
              }
            ],
            "symbol": "DATA_87F990"
          }
        }
      ]
    ]
  }
];

const handicapHelp=AUDITED_NATIVE_MENU_TEXT_SECTIONS.find(s=>s.id==='handicap-native').fields.find(f=>f[0]==='data_87c884');
handicapHelp[1]='Press the select button to change 1P and CPU controls.';
handicapHelp[3]={...handicapHelp[3],multiline:true,rows:2,pool:{...handicapHelp[3].pool,segments:[{pc:0x3C884,original:handicapHelp[1].slice(0,27)},{pc:0x3C89F,original:handicapHelp[1].slice(27)}]}};

export const NATIVE_MENU_TEXT_SECTIONS=AUDITED_NATIVE_MENU_TEXT_SECTIONS.map(section=>({...section,fields:section.fields.map(([id,en,,options])=>[id,en,USER_PORTUGUESE_PRESETS.additional[section.id]?.[id]??NATIVE_MENU_PORTUGUESE[id]??null,options])}));
