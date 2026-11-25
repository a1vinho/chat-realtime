# Chat em tempo real

Aplicação de chat em desenvolvimento, criada com Node.js, Express, WebSocket (`ws`), HTML, CSS e JavaScript. O servidor entrega a interface web e mantém uma conexão WebSocket para login por nome, mensagens, notificações e um fluxo experimental de envio de arquivos.

O projeto é um protótipo: os dados de usuários e notificações ficam na memória do processo, e o envio de arquivos ainda não é um sistema completo de upload.

## Funcionalidades

### Implementadas

- Página web servida pelo Express.
- Conexão WebSocket no caminho `/ws`.
- Login com nome de usuário de pelo menos quatro caracteres, validado pelo navegador.
- Recusa de nomes que já existam na lista mantida pelo processo do servidor.
- Envio e retransmissão de mensagens de texto para os clientes conectados.
- Exibição das mensagens com nome do remetente e horário local; mensagens do usuário atual recebem alinhamento visual diferente.
- Avisos quando novos usuários entram, mantidos na memória do servidor.
- Apresentação dos avisos na interface, com um botão para exibi-los e controles para dispensá-los.
- Gravação de identificador, nome e dados de notificação no `localStorage` do navegador para uso na tentativa de restaurar a sessão.
- Interface adaptável a telas menores.

### Parcial ou experimental

- O campo de arquivo inicia um envio pelo WebSocket. Para arquivos `.jpeg` e `.png`, o servidor retransmite aos clientes uma representação de imagem para exibição no chat. Para outras extensões, tenta gravar os dados em `uploads/`.
- A interface prepara o conteúdo como Data URL, mas o código não implementa uma transferência em blocos completa nem a reconstrução/decodificação dos arquivos genéricos. O evento `start-upload` também não tem tratamento no servidor.
- Não há persistência de usuários, mensagens ou notificações em banco de dados.

## Tecnologias

- [Node.js](https://nodejs.org/) — ambiente de execução.
- [Express](https://expressjs.com/) — entrega os arquivos estáticos e a página principal.
- [ws](https://github.com/websockets/ws) — servidor e cliente WebSocket.
- HTML, CSS e JavaScript — interface, sem etapa de compilação.

## Requisitos

- Node.js 18 ou superior.
- npm.
- Navegador moderno com suporte a WebSocket e `localStorage`.

## Instalação e execução

Na raiz do projeto, instale as dependências:

```sh
npm install
```

Inicie o servidor:

```sh
npm start
```

O comando executa `node --watch server.js`, reiniciando o servidor quando o arquivo `server.js` muda. Acesse:

```text
http://localhost:3000
```

A porta padrão é `3000`. Para escolher outra porta no Linux ou macOS:

```sh
PORT=4000 npm start
```

O diretório `uploads/` precisa existir para que o servidor possa gravar os arquivos que não sejam tratados como imagens. O código atual não cria esse diretório automaticamente.

## Como usar

1. Abra a aplicação no navegador.
2. Informe um nome de usuário com pelo menos quatro caracteres e selecione **Continuar**.
3. Após o login, o chat é exibido.
4. Digite uma mensagem e selecione **Enviar** para retransmiti-la aos clientes conectados.
5. Use o botão de sino para exibir as notificações disponíveis. Cada notificação pode ser dispensada na interface.
6. O seletor de arquivo inicia o fluxo experimental descrito acima.

Para conversar entre navegadores ou dispositivos, todos devem acessar a mesma instância do servidor. Os nomes de usuário são verificados somente contra os dados presentes na memória desse processo.

## Endpoints

| Tipo | Caminho | Descrição |
| --- | --- | --- |
| HTTP | `GET /` | Entrega a página principal. |
| Estático | `/style.css`, `/script.js` | Arquivos da interface servidos a partir de `public/`. |
| WebSocket | `/ws` | Canal de login, mensagens, notificações e envio experimental de arquivos. |

Em desenvolvimento local, o endereço WebSocket é `ws://localhost:3000/ws`. O navegador deriva o host do endereço da página.

## Protocolo WebSocket

As mensagens de aplicação são JSON com um campo `event`. Os exemplos abaixo resumem os eventos utilizados pelo cliente e pelo servidor.

### Eventos enviados pelo cliente

**Login**

```json
{
  "event": "username",
  "username": "usuario"
}
```

**Tentativa de restaurar a sessão ao carregar a página**

```json
{
  "event": "load",
  "id": "identificador-local",
  "username": "usuario"
}
```

**Mensagem de chat**

```json
{
  "event": "message",
  "id": "identificador-local",
  "username": "usuario",
  "message": "Olá!"
}
```

**Envio experimental de arquivo**

O navegador envia primeiro um evento `start-upload` e depois um evento `upload-chunk`, cujo campo `file` contém os caracteres da Data URL. No momento, o servidor não trata `start-upload` e processa o conteúdo de `upload-chunk` em uma única mensagem; portanto, o nome “chunk” não representa uma transferência em blocos concluída.

### Eventos enviados pelo servidor

- `sucess-login`: resposta de sucesso do login ou da tentativa de restauração. O nome está grafado assim no protocolo atual. A resposta pode conter `user` e, no fluxo de restauração, `notifications`.
- `notification`: lista de avisos de entrada associada a um usuário.
- `message`: conteúdo de uma mensagem de chat, enviado com os dados do remetente, texto e data.
- `file`: conteúdo destinado à exibição de uma imagem enviada. Esse fluxo é experimental.

Exemplo de mensagem de chat:

```json
{
  "event": "message",
  "data": {
    "user": {
      "id": "identificador",
      "username": "usuario"
    },
    "message": "Olá!",
    "date": 1790000000000
  }
}
```

O campo `date` representa milissegundos desde a época Unix. O cliente formata esse valor usando o horário local do navegador.

## Estrutura do projeto

```text
.
├── public/
│   ├── index.html   # Estrutura da página de login e do chat
│   ├── script.js    # Eventos da interface e comunicação WebSocket
│   └── style.css    # Estilos e regras responsivas
├── uploads/         # Destino esperado para gravação de alguns arquivos
├── package.json     # Dependências e comando de inicialização
├── package-lock.json
└── server.js        # Servidor Express e eventos WebSocket
```

## Estado, limitações e segurança

- Usuários, notificações e mensagens existem somente na memória; reiniciar o servidor os remove. O histórico de mensagens não é enviado a quem entra posteriormente.
- A restauração depende tanto dos dados no `localStorage` quanto do estado ainda existente no servidor; não há contas, senhas ou autenticação persistente.
- A conexão do cliente usa `ws://`; para uso público, seria necessário servir a aplicação com HTTPS e usar uma conexão WebSocket segura (`wss://`).
- O servidor espera mensagens JSON válidas e ainda não possui tratamento abrangente de payloads inválidos, limites de tamanho ou validação de entrada para todos os eventos.
- O fluxo de upload é experimental: não há fragmentação real, validação completa de tipo/conteúdo, persistência organizada nem tratamento abrangente de erros. Não o utilize para arquivos sensíveis ou em um serviço público.
- A página não possui reconexão automática em caso de queda do WebSocket.
- O tratamento de respostas de erro no cliente ainda é limitado.
- O modo `--watch` é voltado ao desenvolvimento; não há configuração de implantação ou monitoramento para produção.

## Desenvolvimento

Os arquivos estáticos ficam em `public/`. O servidor usa o modo de observação nativo do Node.js para reiniciar quando `server.js` é alterado. As dependências e o comando de inicialização estão declarados em `package.json`.
