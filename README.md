# Cuidali

**Cuidado que conecta.** Aplicativo de cuidado para pessoas idosas, familiares e cuidadores, criado a partir das referências da Kannali Corp. Interface em português, com azul institucional, cartões simples, lembretes, mapa corporal e SOS sempre acessível.

## Executar

Requer **Node.js 24+** e npm. Não precisa de banco externo nem credenciais para os fluxos locais.

```bash
cd /workspace/Project
npm ci --cache /tmp/cuidali-npm-cache
npm run dev
```

O comando inicia a interface na porta **5173** e a API na **3001**. Acesse a interface pelo encaminhamento de portas da sua ferramenta de desenvolvimento. Clique em **Explorar demonstração** para criar uma família fictícia isolada. É possível alternar entre o idoso e seu cuidador na faixa de demonstração. Não há senhas públicas fixas.

Para executar a versão compilada:

```bash
npm run build
npm start
```

Nesse modo, interface e API são servidas na porta **3001**. `server/schema.sql` cria o banco automaticamente em `.data/cuidali.sqlite`. Os dados permanecem ao reiniciar; não apague `.data` se quiser mantê-los. O servidor usa o fuso **America/Sao_Paulo** para lembretes diários; instantes são salvos em UTC.

Configuração opcional: veja [.env.example](.env.example). Para ler um `.env`, use `node --env-file=.env server/index.mjs` ou exporte as variáveis antes do comando. O exemplo não contém credenciais.

## O que funciona

- Cadastro, login, logout, sessão HttpOnly, hash scrypt, consentimento, exportação e exclusão de conta.
- Perfis de idoso e cuidador; convite de uso único com prazo de 10 minutos; revogação e isolamento por família no servidor. Um cuidador pode acompanhar vários idosos.
- CRUD de medicamentos, consultas e contatos, com confirmação de exclusão e controle de versões.
- Dose diária: tomado, não tomei, adiado e sem confirmação; registro do autor e horário; histórico e visibilidade para cuidadores autorizados.
- Agenda e exportação `.ics`; avisos internos de medicamentos, consultas e falta de confirmação com regras configuráveis.
- SOS com confirmação, persistência, aviso interno, acompanhamento e recebimento explícito pelo cuidador; botão que abre o discador, sem afirmar que a chamada ocorreu.
- Assistente de rotina por regras, com respostas baseadas nos dados cadastrados. Texto, leitura em voz alta e entrada de voz quando o navegador permite. Não usa um modelo externo nem faz diagnóstico.
- Registro de dor em duas etapas, mapa corporal frente/costas, intensidade, duração, observações e histórico para a rede autorizada.
- Cliente responsivo e instalável como PWA; invólucro **React Native / Expo** em `mobile/` que usa o mesmo cliente e API.
- **Protótipo web de smartwatch** em `/relogio`, redesenhado para tela circular/retangular; medicamentos, SOS, assistente e desconforto rápido, compartilhando os dados da conta.
- Fila IndexedDB para ações confirmadas de medicamento, SOS e dor durante queda de conexão. Reenvio idempotente, isolamento por conta e conflitos apresentados para revisão.

## Validação

```bash
npm test                  # integração da API e persistência SQLite
npm run build             # TypeScript + build de produção
npm run test:e2e           # Chromium: jornadas, offline, layouts e acessibilidade axe
npm --prefix mobile run typecheck
```

Os testes do navegador usam uma API própria na porta 4173 e um banco de testes em `/tmp`. Por padrão utilizam `/usr/bin/chromium`; configure `CHROMIUM_PATH` ou instale Chromium pelo Playwright conforme [docs/instalacao.md](docs/instalacao.md). Capturas: [docs/screenshots](docs/screenshots). Resultados executados e limites: [docs/relatorio-testes.md](docs/relatorio-testes.md).

## Documentação

- [Instalação, celular e operação](docs/instalacao.md)
- [Manual do usuário](docs/manual-usuario.md)
- [Arquitetura, MER/DER e decisões](docs/arquitetura.md)
- [Dicionário de dados](docs/dicionario-dados.md)
- [API REST e exemplos](docs/api.md)
- [Integrações e limites reais](docs/integracoes.md)
- [Planejamento e rastreabilidade](docs/escopo.md)

**Limites importantes:** o relógio não é um binário Wear OS/watchOS. O cliente mobile nativo é um invólucro WebView, não uma reimplementação nativa das telas. Não há SMS, e-mail, push remoto, biometria, Bluetooth nem chamadas confirmadas. Os avisos internos ficam disponíveis no Cuidali; isso não comprova entrega externa. O servidor e o aplicativo precisam estar ativos para lembretes locais; notificações em segundo plano exigem integração adicional. Use dados fictícios até concluir a configuração e revisão de produção descritas na documentação.
