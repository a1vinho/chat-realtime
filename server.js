const express = require("express");
const { createServer } = require("node:http");
const { WebSocketServer, WebSocket } = require("ws");
const path = require('path');
const { randomUUID } = require('crypto');
const fs = require('fs');

const app = express();
const server = createServer(app);
const websocketServer = new WebSocketServer({ server, path: "/ws" });
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");


const users = new Map();
const messagens = [];
const sockets = new Map();

const ext_imgs = [".jpeg",".png"];

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_request, response) => {

  return response.sendFile("index.html");
});

websocketServer.on("connection", (connection) => {

  connection.on("message", (message, isBinary) => {
    const json = JSON.parse(message);

    switch (json.event) {
      case "username": {
        let user = users.get(json.username);
        console.log({ username: user })
        if (user) {
          connection.send(JSON.stringify({
            event: 'message',
            message: "Esse usuário já está no sistema"
          }));
          return;
        }
        const id = randomUUID().substring(20);
        connection.id = id;
        users.set(json.username, {
          id,
          username: json.username,
          notifications: []
        });
        sockets.set(id, connection);
        connection.send(JSON.stringify({
          event: "sucess-login",
          ok: true,
          user: { id, username: json.username }
        }));

        users.forEach(user => {
          user.notifications.push({
            username: json.username,
            message: `Usuário ${json.username} entrou no chat`
          });

          console.log(user.notifications)

          for (const client of websocketServer.clients) {
            if (client.id && client.id === user.id) {
              client.send(JSON.stringify({
                event: "notification",
                notifications: user.notifications
              }))
            }
          }
        });
        break;
      };
      case "load": {

        console.log(json)
        if (!json.id || !json.username) {

          console.log(true)
          connection.send(JSON.stringify({
            event: "message",
            message: "Você não está logado no sistema"
          }))
          return;
        };
        const user = users.get(json.username);
        console.log(user)
        if (!user) {
          connection.send(JSON.stringify({
            event: "message",
            message: "Você não está logado no sistema"
          }))
          return;
        }

        connection.send(JSON.stringify({
          event: "sucess-login",
          ok: true,
          user,
          notifications: user.notifications
        }));
        break;
      }
      case "message": {
        for (const client of websocketServer.clients) {
          client.send(JSON.stringify({ message: "global" }));
          if (client.readyState === connection.OPEN) {

            const user = users.get(json.username);
            if (!user) {
              connection.send(JSON.stringify({
                message: "Erro ao enviar message,por segurança encerraremos a sua conexão"
              }));

              connection.terminate();

              users.delete(json.id);
              return;
            };

            const data = {
              user,
              message: json.message,
              date: Date.now()
            }
            // create system anti-flood messagens
            // for (const message of messagens) {
            //   if (message.user.id === json.id) {
            //     console.log({message,json});
            //     const segunds = new Date(data.date).getTime() / 1000;
            //     const sm = new Date(message.date).getTime() / 1000;

            //     const result = Math.floor((segunds - sm))
            //   };
            // };
            console.log(data.user.id === json.id);
            client.send(JSON.stringify({
              event: "message",
              data
            }));
            messagens.push(data);
          };
        };
      };
      case "upload-chunk": {
        // termina o sistema de upload 
        console.log(json)
        const ext = path.extname(json.name_file);
        
        if (ext_imgs.includes(ext)) {
          
          for (const client of websocketServer.clients) {
            client.send(JSON.stringify({
              event: "file",
              file: `<img src=${json.file.join('')}>`
            }))
          };
          return;
        };
        const write = fs.createWriteStream(`uploads/${json.id}-${Date.now()}`);
        for (const chunk of json.file) {
          write.write(chunk);
        }
        write.on('error',err => console.log(err));
        write.end();
        break;
      }
    };
  });

  connection.on("error", (error) => {
    console.error("Erro no WebSocket:", error);
  });
});

server.listen(port, () => {
  console.log(`Servidor HTTP e WebSocket ouvindo na porta ${port}`);
});
