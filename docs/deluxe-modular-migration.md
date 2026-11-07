# Deluxe modular: etapa inicial

Branch: `feature/deluxe-modular-editor`, baseada integralmente na `main`
`d1d13b6`. O Editor Plus e seus comandos existentes foram preservados.

## Objetivo e estado atual

Objetivo: conseguir gerar, a partir do Deluxe original, os mesmos recursos de uma
ROM criada no Editor Plus, com melhorias opcionais e infraestrutura sob demanda.
Esse objetivo ainda não foi atingido. Esta entrega estabelece uma entrada
independente e migra o primeiro recurso compartilhado: textos de estratégias.

A main remota não contém todos os trabalhos presentes nas branches mais recentes.
A branch `fix/goalkeeper-backpass-investigation` foi identificada em `bcd70db`.
Ela deve ser inventariada antes de integrar seus recursos; não foi mesclada nesta
etapa. O build legado exige um HTML externo ausente neste checkout. A entrada
Deluxe não exige esse arquivo nem modifica o build Plus.

## Executar

```sh
npm run serve:deluxe
```

Abrir http://127.0.0.1:4174 e selecionar Deluxe (USA), com ou sem cabeçalho de
copiador de 512 bytes. SHA-256 do payload aceito:
`d2fe66c1ce66c65ce14e478c94be2e616f9e2cad374b5783a6a64d3c1a99cfa9`.
A ROM permanece no navegador. O projeto contém identidade da base e mudanças;
para reabri-lo é necessário selecionar a ROM original novamente.
Projetos Plus não são importados por esse fluxo.

## Evidência do primeiro mapeamento

Comparação com o baseline Plus `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`:

| Região no payload | Tamanho | Bytes iguais | Decisão |
|---|---:|---:|---|
| Estratégias, 0x3C8CE | 160 | 160 | Reutilizar codec e descritores existentes |
| Banco de jogadores Plus, 0x150000 | 7840 | 54 | Não reutilizar endereço no Deluxe |
| Região de grupos Plus, 0xE7F2 | 64 | 4 | Exige novo mapeamento |
| Ponteiros táticos Plus, 0x5FDD0 | 114 | 0 | Exige novo mapeamento |

Bytes diferentes não comprovam formatos diferentes; bytes iguais tampouco provam
que duas rotinas acessam a mesma tabela. O reaproveitamento acima limita-se aos
registros de texto reconhecidos, sem autorização genérica de outras regiões.

Reproduzir o diagnóstico:

```sh
node scripts/audit-deluxe-plus.mjs caminho/Deluxe.smc caminho/Plus.sfc
```

## Contrato implementado

- Base verificada por hash, sem depender de título ou extensão.
- Nenhuma preparação Plus, cópia de patches antigos ou expansão automática.
- Exportação sem edições é idêntica ao arquivo original, incluindo cabeçalho.
- Textos usam o codec existente, somente nos oito registros coincidentes.
- Projeto salva apenas mudanças explícitas. Uma nova geração sempre parte da base.
- Checksum é recalculado somente se houver alterações, considerando a contribuição
  de 0x1FE do quarteto checksum/complemento para ROM de 2 MB.
- Campos desconhecidos e melhorias sem implementação são rejeitados, não ignorados.
- Catálogo de melhorias é exibido desabilitado, sem simular patches inexistentes.

## Próximas migrações necessárias

1. Mapear tabelas originais de grupos, equipes, jogadores e respectivos leitores.
2. Separar codecs compartilhados dos endereços e limites específicos de cada base.
3. Integrar cada edição nativa ao projeto Deluxe e provar alterações restritas.
4. Mapear expansão de equipes/grupos e sua participação nos modos de competição.
5. Individualizar táticas e administrar espaço conforme requisitos comprovados.
6. Portar patches de gameplay individualmente, verificando combinação e dependências.
7. Migrar uniformes, bandeiras, textos restantes, telas e assets do Editor atual.
8. Definir cenários de equivalência entre geração Deluxe e geração Plus.

## Validação desta etapa

17 testes passaram, incluindo a ROM Deluxe anexada: identidade de exportação,
preservação do cabeçalho, escrita restrita, checksum, projeto JSON, remoção de
edições e rejeição de melhorias pendentes. Os testes dos codecs Plus reutilizados
continuam passando. Não houve teste de gameplay em emulador nem validação visual
interativa da interface. Não há equivalência funcional completa com o Editor Plus.

Teste com ROM privada (não versionada):

```sh
# bash
ISSSD_DELUXE_ROM=/caminho/Deluxe.smc npm run test:deluxe
```

```powershell
$env:ISSSD_DELUXE_ROM = 'C:\caminho\Deluxe.smc'
npm run test:deluxe
```
