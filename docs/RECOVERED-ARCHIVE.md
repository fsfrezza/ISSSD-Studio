# Arquivo histórico recuperado da conversa

Em 2026-10-05 foi feita uma varredura dos anexos/artefatos desta conversa do projeto ISSSD Editor/Studio.

## Cobertura recuperada

Foram materializados snapshots do Studio desde **v6.25** até **v7.01**, além de HTMLs datados e projetos `.issdproj` associados.

### Linha de versões do Studio encontrada

- v6.25–v6.40.1
- v6.41, v6.43–v6.50 (HTML e/ou ZIP conforme disponível)
- v6.51–v6.57
- v6.58–v6.76
- v6.77–v6.83
- v6.84–v6.92
- v6.93–v6.99
- v7.00
- v7.01

Também foram recuperados HTMLs datados de 2026-09-29, 2026-09-30, 2026-10-01 e 2026-10-05.

## Projetos recuperados

Há snapshots desde 2026-09-29 até 2026-10-05, incluindo:
- Brasil atualizado
- Brasil + Argentina
- Alemanha/Argentina revisada
- PERFECTO XI
- Espanha/Uruguai e revisões
- PERFECTO XI 54 seleções
- projetos de 2026-10-01
- 000947, 005734, 005734-SKILLS-BRASIL e 010952
- 133255, SKILLS-ARGENTINA, 134128 e 143340
- 145645 e 151019
- BRASIL-APENAS

## Marcos com hashes confirmados

- v6.25: `7b0745e9a46c41accce5159b312a8b890d8bcbbeb8a0ed88145b860399b564ae`
- v6.81: snapshot recuperado e preservado no arquivo de trabalho
- v6.92: `cafe5879e60485edb1bed2c2df72908179d137b6984f234593cec7f59ae43d6e`
- v6.93: `dbe6e6cda778cf917277abc4923a3533f620186d4a7555cd337e059ad5367e76`
- projeto 005734-SKILLS-BRASIL: `7a04aed82d23d3ff902cb119f65d3095d07176c11e7bf3a1cf32fadcc85a4968`
- projeto 133255-SKILLS-ARGENTINA: `d4b3e621077ac98b27389ba35a56e98d5d0be6cfad6b0f5a7f536929edfa35d5`
- projeto BRASIL-APENAS: `50bee541317e391cb47787a4bc9c52d481a99dc87824ca067e26adfe3074edb0`

## Observação de preservação

Os arquivos comerciais de ROM não fazem parte deste arquivo Git. O repositório mantém documentação, testes e histórico seguro. Os snapshots grandes recuperados da conversa foram materializados para auditoria e devem ser incorporados ao armazenamento histórico sem a ROM-base.

Duplicatas byte-a-byte foram identificadas por SHA-256 e não precisam ser mantidas duas vezes apenas por terem nomes/timestamps diferentes.

## Próxima etapa

Transformar os snapshots em uma sequência de baselines/commits e executar testes de regressão entre versões, começando pela região v6.91 → v6.92 → v6.93 e depois ampliando o bisect para os demais marcos.
