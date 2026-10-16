# Instalação e operação

## Ambiente web/API

1. Use Node.js 24 ou mais recente (o banco usa `node:sqlite`) e npm.
2. Na raiz do repositório, execute `npm ci --cache /tmp/cuidali-npm-cache`.
3. Execute `npm run dev`: Vite em 5173 encaminha `/api` para Express em 3001.
4. A API confirma funcionamento com `GET /api/health`; o retorno esperado é `{"status":"ok","storage":"sqlite"}`.
5. Para distribuição, execute `npm run build`, depois `npm start`; interface e API compartilham a porta 3001. Reiniciar não apaga dados.

Não use `vite preview` como servidor da API. Banco inicial vazio é intencional; a demonstração cria os exemplos por uma ação explícita. A cada clique é criada uma família independente com contas fictícias. Contas comuns começam sem dados.

Variáveis do servidor: `PORT` (3001), `DB_PATH` (`.data/cuidali.sqlite`), `COOKIE_SECURE` (`false` para HTTP local, `true` obrigatório em HTTPS). Copie o exemplo apenas se necessário e carregue com `node --env-file=.env server/index.mjs`. Nenhum segredo é necessário para os fluxos internos. Nunca versione o banco nem arquivos `.env`.

Para backups consistentes, use a API de backup do SQLite ou pare o servidor antes de copiar o arquivo. Não copie apenas o arquivo principal durante gravações em WAL. Mantenha backups cifrados e com retenção definida.

## Acesso pelo Wi-Fi e erro de origem

Com computador e celular no mesmo Wi-Fi, execute `npm run dev` no computador e abra no celular o endereço exibido pelo Vite como **Network**, na porta 5173. Mantenha o terminal aberto.

Se uma cópia antiga mostrar “Esta solicitação precisa vir do próprio aplicativo”, atualize `vite.config.ts`. O proxy de `/api` deve usar objeto com `target: "http://127.0.0.1:3001"` e **`changeOrigin: false`**. O atalho em string do Vite troca o cabeçalho Host para o endereço interno da API e causa o bloqueio. Após atualizar, pare o comando com Ctrl+C, execute `npm run dev` novamente e recarregue a página no celular. A validação de origem na API continua ativa.

## Celular

O cliente web é responsivo e tem manifesto PWA e service worker no build. Em um endereço HTTPS, use a opção de instalação do navegador (quando disponível). O service worker guarda somente o shell e arquivos estáticos, nunca respostas da API nem sessões. A primeira abertura exige conexão. Reabrir offline não restaura dados de saúde; os dados da sessão em memória ficam acessíveis enquanto a página permanece aberta.

A pasta `mobile/` contém um aplicativo **React Native com Expo SDK 54 e WebView**:

```bash
npm ci --prefix mobile --cache /tmp/cuidali-npm-cache
# Crie mobile/.env a partir do exemplo e informe a URL do Cuidali:
# EXPO_PUBLIC_APP_URL=https://endereco-do-seu-servidor
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npm --prefix mobile start
```

As opções `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1` evitam telemetria e consultas de conta no ambiente restrito; não desligam a API do Cuidali. Fora dele, são opcionais.

Para verificar o empacotamento sem SDK nativo:

```bash
cd mobile
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npx expo export --platform android --output-dir /tmp/cuidali-mobile-export --max-workers 2
```

Abra no Expo Go compatível com SDK 54 em um dispositivo físico ou use Android SDK/emulador. O dispositivo precisa alcançar o servidor. Em rede local, HTTP exige `EXPO_PUBLIC_ALLOW_HTTP=true` e pode ainda depender da política do sistema; prefira HTTPS. Nunca use essa exceção com dados reais. As URLs são públicas, não segredos. Reinicie o Expo depois de alterar `.env`.

Para builds nativos: `npm --prefix mobile run android` requer JDK/Android SDK. `npm --prefix mobile run ios` requer macOS/Xcode. Não foram compilados binários nativos neste ambiente Linux sem esses SDKs. A verificação TypeScript e o empacotamento Metro não substituem testes em Android/iOS. O invólucro compartilha a interface web; implementações de voz, downloads .ics e instalação PWA variam na WebView e devem ser validadas em hardware. O invólucro abre `tel:` com Linking e restringe a navegação web à origem configurada.

## Relógio e sincronização

1. Abra **Meu relógio → Abrir experiência do relógio**, que leva a `/relogio`.
2. No mesmo navegador, o cookie de sessão é compartilhado. Em outro navegador/dispositivo, entre com a mesma conta; contas de demonstração não têm senha reutilizável.
3. Clique em **Ativar sincronização deste protótipo**. A identidade registrada é apenas um nome de protótipo, não uma identidade física autenticada.
4. Teste confirmar uma dose no relógio e consulte o aplicativo/painel do cuidador. A atualização por consulta da API ocorre a cada 10 segundos; o registro de dispositivo é renovado a cada 30 segundos enquanto ativado.
5. Para testar offline, mantenha uma sessão e a página abertas, interrompa a rede e confirme uma ação. Veja **ações pendentes**. Reative a rede para reenviar. A API usa UUID de ação e controle de versão para não duplicar nem sobrescrever uma confirmação concorrente.

A fila é local ao navegador e separada por conta. Recarregar completamente sem conexão não permite autenticar nem carregar registros. Autentique novamente após expirar a sessão para enviar ações da mesma conta. Conflitos ou erros de autorização ficam para revisão e descarte; não há repetição automática infinita. Sair exige sincronizar/descartar pendências e limpa a fila. Não há Bluetooth, pareamento real ou aplicação nativa de relógio.

## Testes de navegador

O ambiente preparado contém `/usr/bin/chromium`. Em outra máquina, defina `CHROMIUM_PATH=/caminho/para/chromium` ou execute `npx playwright install chromium` e omita `executablePath` na configuração. O teste usa banco próprio em `/tmp/cuidali-e2e.sqlite`, com contas aleatórias e isolamento por teste. Não aponta para o banco normal.

## Produção

Disponibilize HTTPS na mesma origem para interface/API, encaminhando o cabeçalho Host corretamente, e configure `COOKIE_SECURE=true`. A aplicação usa SQLite de nó único para facilitar execução local. Para múltiplas instâncias, migre o acesso a dados para PostgreSQL e utilize um agendador/fila compartilhados. Configure limites de acesso e tráfego no proxy, proteção de backups, monitoramento sem dados de saúde, retenção e documentos legais antes de utilizar informações reais. A base não é uma certificação de segurança, LGPD ou dispositivo médico.
