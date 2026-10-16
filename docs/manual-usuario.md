# Manual do usuário

## Primeiros passos

Abra o Cuidali e escolha **Começar meu cuidado**. Selecione **Sou o idoso** ou **Sou o cuidador(a)**. Informe nome, telefone, e-mail e senha; o idoso também informa nascimento. Leia o aviso de privacidade e confirme o consentimento. Para voltar, use **Já tenho uma conta**.

Se quiser apenas conhecer, use **Explorar demonstração**. Os dados de Gerson e Enzo são fictícios e não acionam chamadas ou mensagens. Cada demonstração tem sua própria família. A faixa superior permite ver o mesmo cuidado como idoso e como cuidador.

## Conectar um cuidador

O idoso abre **Perfil e ajustes → Convidar cuidador** e compartilha o código somente com alguém de confiança. O código dura 10 minutos e funciona uma única vez. O cuidador cria sua própria conta e informa o código. A autorização dá acesso aos medicamentos, consultas, contatos, registros e alertas daquele idoso. Para revogar, o idoso remove o cuidador na mesma tela. Um nome ou número de telefone cadastrado como contato, sozinho, não dá acesso.

## Meu dia e medicamentos

A página inicial mostra os lembretes de hoje e a próxima consulta. Toque em um medicamento para ver o nome, dose, horário e orientações. Confirme apenas a dose correspondente ao dia exibido:

- **Sim, já tomei**: registra que você informou ter tomado.
- **Ainda não tomei**: registra sua resposta como “Não tomei”.
- **Lembrar em 15 minutos**: adia o lembrete.
- **Sem confirmação**: ainda não existe uma resposta registrada; não é prova de que não tomou.

Na tela **Medicamentos**, você ou seu cuidador autorizado podem cadastrar, editar e excluir lembretes. Use um cadastro para cada horário. Siga sempre a receita médica; o Cuidali não muda doses nem recomenda tratamento. Excluir um medicamento remove seu histórico de confirmações, após uma pergunta de confirmação.

## Consultas

Use **Consultas → Agendar consulta** para registrar profissional, especialidade, data, hora e local. Você pode editar ou excluir depois. Em **Ver detalhes → Adicionar à agenda**, um arquivo `.ics` é baixado; abra no seu calendário e confira o horário. Excluir no Cuidali não remove automaticamente um evento já importado no calendário.

## Assistente

Abra **Assistente**, toque em uma sugestão ou escreva. Ele consulta somente os dados disponíveis e ajuda a abrir medicamentos, consultas, dores e SOS. O botão de microfone aparece habilitado quando o navegador oferece reconhecimento de voz; conceda permissão se desejar. O texto reconhecido preenche o campo: confira e envie. Use **Ouvir** para leitura em voz alta quando disponível. Não oferece diagnóstico, tratamento nem conversa clínica por IA.

## Registrar uma dor

Abra **Registro de dores**, escolha frente/costas e toque no mapa ou use a lista de regiões. Toque em **Continuar**, informe tipo de dor, intensidade, desde quando e observações opcionais. **Enviar para o cuidador** salva o relato para a rede autorizada consultar no Cuidali. Não envia SMS/push externo nesta versão. Procure atendimento para sintomas intensos, súbitos ou preocupantes; no Brasil, o SAMU atende pelo 192.

## Pedir ajuda

O **SOS** está na navegação principal do celular e no menu lateral. Toque no círculo, leia a confirmação e confirme se precisa de ajuda. O sistema informa se o pedido foi registrado ou se ficou pendente neste aparelho. O cuidador pode abrir seu painel e confirmar que visualizou.

Para falar imediatamente, use **Ligar para o contato**. Isso abre o discador: confira e faça a ligação no dispositivo. O Cuidali não confirma a realização da chamada. O aplicativo não substitui serviços de emergência; **SAMU 192** também abre o discador.

## Relógio

Abra **Meu relógio → Abrir experiência do relógio**. Você pode alternar formato circular/retangular, ver os medicamentos e confirmar uma dose, pedir ajuda, registrar desconforto ou fazer perguntas rápidas. É um protótipo web, não um app Wear OS/watchOS. As confirmações pedem uma ação adicional para reduzir toques acidentais. Em outro navegador, entre com sua conta real de teste.

## Sem conexão

Com a página e sessão abertas, dose, SOS e dor podem ficar em uma fila local. **Pendente** significa que o servidor ainda não confirmou a ação. Um SOS pendente não foi transmitido. Ao voltar a conexão, o sistema tenta reenviar sem duplicar. Se houver conflito, confira o estado atual e descarte/refaça a ação conscientemente. Você pode revisar pendências na faixa de conexão ou no rodapé do protótipo do relógio. Fechar/reabrir sem internet não carrega seus dados.

## Ajustes e privacidade

Use **AA Texto** para ampliar a leitura. Em **Perfil e ajustes**, administre contatos e cuidadores, escolha avisos e tempo de tolerância sem confirmação. O botão de permissão de avisos depende do navegador; lembretes de fundo não estão implementados. Você pode exportar os dados em JSON e excluir sua conta após confirmação explícita. Guarde exportações com segurança, pois incluem informações pessoais e de saúde.
