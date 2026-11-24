# Chat em tempo real

Aplicação de chat em tempo real feita com Node.js, Express e WebSocket (`ws`). O Express entrega a interface web e o servidor WebSocket permite que usuários conectados entrem com um nome, recebam avisos de entrada e troquem mensagens.

> O projeto está em desenvolvimento. Os dados ficam somente na memória do processo e alguns controles presentes na interface ainda não têm comportamento implementado.

## Funcionalidades atuais

- Interface web em português, servida pelo Express.
- Conexão WebSocket pelo endpoint `/ws`.
- Login com nome de usuário de pelo menos quatro caracteres.
- Recusa de nomes que já estejam registrados no processo atual.
- Envio de mensagens de texto e retransmissão aos clientes conectados.
- Exibição das mensagens com o nome do autor e horário local.
- Avisos de entrada de usuários mantidos em memória.
- Armazenamento local do identificador e do nome do usuário no navegador para tentar restaurar a sessão ao recarregar a página.
- Layout responsivo básico para telas menores.

## Tecnologias

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/) — entrega os arquivos estáticos da interface.
- [ws](https://github.com/websockets/ws) — servidor e conexão WebSocket.
- HTML, CSS e JavaScript no navegador, sem etapa de compilação.

## Requisitos

- Node.js e npm instalados.
- Um navegador moderno.

## Instalação e execução

Na pasta do projeto, instale as dependências:

```sh
npm install
```

Inicie o servidor:

```sh
npm start
```

O script de inicialização usa `node --watch server.js`, portanto o servidor reinicia quando o arquivo do servidor é alterado. Abra `http://localhost:3000` no navegador. A porta padrão é `3000`; ela pode ser alterada definindo a variável de ambiente `PORT`.

Por exemplo, no Linux ou macOS:

```sh
PORT=4000 npm start
```

## Como usar

1. Abra a aplicação no navegador.
2. Informe um nome de usuário com pelo menos quatro caracteres e selecione **Continuar**.
3. Após o login, a tela do chat é exibida.
4. Digite uma mensagem no campo de texto e selecione **Enviar**.
5. As mensagens recebidas aparecem na área do chat; as próprias mensagens são visualmente diferenciadas das mensagens de outros usuários.

Para conversar entre navegadores ou dispositivos, todos devem acessar o mesmo servidor. O nome de usuário deve ser único entre os usuários registrados naquele processo do servidor.

## Endpoints

| Tipo | Endereço | Descrição |
| --- | --- | --- |
| HTTP | `GET /` | Entrega a página principal. |
| WebSocket | `/ws` | Conexão em tempo real usada para login, notificações e mensagens. |

Em desenvolvimento local, o endereço WebSocket é `ws://localhost:3000/ws`. O cliente constrói o endereço usando o host da página.

## Protocolo WebSocket

As mensagens de aplicação são enviadas como JSON e incluem um campo `event`.

### Eventos enviados pelo navegador

**Login**

```json
{
  "event": "username",
  "username": "usuario"
}
```

O navegador valida que o nome tenha ao menos quatro caracteres antes do envio. O servidor verifica se o nome já está registrado.

**Tentativa de restaurar a sessão**

Ao carregar a página, o cliente envia os dados gravados no `localStorage`:

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

### Eventos enviados pelo servidor

- `sucess-login`: resposta de sucesso do login ou da tentativa de restauração. O nome do evento está escrito assim no protocolo atual.
- `notification`: contém a lista de avisos de entrada associados ao usuário.
- `message`: usado tanto para mensagens do chat (com os dados da mensagem) quanto para alguns avisos em texto, como nome já em uso.

Uma mensagem do chat contém o usuário associado, o texto e a data em milissegundos desde a época Unix:

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

## Estrutura do projeto

```text
.
├── public/
│   ├── index.html   # Estrutura da página de login e do chat
│   ├── script.js    # Conexão WebSocket e comportamento da interface
│   └── style.css    # Estilos da interface
├── package.json     # Dependências e comandos npm
├── package-lock.json
└── server.js        # Servidor Express e tratamento dos eventos WebSocket
```

## Estado e limitações conhecidas

- Usuários, notificações e mensagens são mantidos em estruturas na memória do servidor. Reiniciar o processo apaga esses dados.
- O registro de usuários não é persistido em banco de dados.
- A restauração depende dos dados locais do navegador e do estado em memória do servidor; não há autenticação baseada em credenciais.
- O cliente não implementa uma estratégia de reconexão automática caso a conexão WebSocket caia.
- O campo de seleção de imagem está presente na interface, mas o envio de arquivos ainda não está implementado.
- O botão de notificações está presente, mas a interface ainda não implementa sua abertura, fechamento ou gerenciamento.
- O projeto é um protótipo em desenvolvimento, não um serviço pronto para produção.

## Desenvolvimento

O servidor reinicia automaticamente ao detectar alterações em `server.js` devido ao modo `--watch`. Arquivos da interface ficam em `public/` e são servidos estaticamente pelo Express.
