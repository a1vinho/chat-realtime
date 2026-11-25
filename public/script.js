(function () {
    const login_container = document.querySelector('.login-container');
    const form_login = document.getElementById('form-login');
    const input_username = document.getElementById('username');
    const chat_container = document.querySelector('.chat-container');
    const form_message = document.querySelector('.form-send-message');
    const input_message = form_message.querySelector('input');
    const container_messagens = document.querySelector('.container-messagens');

    const container_notifications = document.querySelector('.container-notifications');
    const notification_button = document.getElementById('notification-button');

    function CreateNotification(json) {
        for (const notification of json.notifications) {
            const notification_container = document.createElement('div');
            notification_container.classList.add('notification');
            const notification_icon = document.createElement('div');
            const button_close = document.createElement('button');
            button_close.classList.add('notification-close');

            button_close.innerHTML = '&times;';
            notification_icon.classList.add('notification-icon');
            notification_icon.innerHTML = `  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <line x1="19" y1="8" x2="19" y2="14"></line>
                                <line x1="22" y1="11" x2="16" y2="11"></line>
                            </svg>`;
            const notification_text = document.createElement('p');
            notification_text.classList.add('notification-text')
            notification_text.innerHTML = `${notification.message}`

            notification_container.appendChild(notification_icon);
            notification_container.appendChild(notification_text);
            notification_container.appendChild(button_close);
            container_notifications.appendChild(notification_container);

            button_close.addEventListener('click', () => {
                notification_container.style.display = 'none';
            });
        }

    }

    function ViewNotifications() {
        const notifications = container_notifications.querySelectorAll('.notification');

        if (notifications.length > 0) {
            for (const notification of notifications) {
                notification.style.display = 'flex';
            }
        };
        if (notifications.length === 0 && localStorage.getItem('notifications')) {
            const notifications = JSON.parse(localStorage.getItem('notifications'));
            CreateNotification({ notifications });
        }
    }

    notification_button.addEventListener('click', ViewNotifications);

    form_message.addEventListener('submit', async event => {
        event.preventDefault();

        const message = input_message.value;

        socket.send(JSON.stringify({
            event: "message",
            id: localStorage.getItem('id'),
            username: localStorage.getItem('username'),
            message
        }));
        input_message.value = '';
    });

    const socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.addEventListener('open', () => {
        // login_container.style.display = 'none';
        // const chat_container = document.querySelector('.chat-container');
        // chat_container.style.display = 'block';

        console.log('Conexão WebSocket estabelecida');
    });

    form_login.addEventListener('submit', (event) => {
        event.preventDefault();

        if (input_username.value.trim() === '' || input_username.value.length < 4) {
            alert('O nome de usuário deve ter pelo menos 4 caracteres.');
            return;
        };


        socket.send(JSON.stringify({
            event: "username",
            username: input_username.value
        }));
    });

    function CreateMessage(json) {
        const message_container = document.createElement('div');

        localStorage.getItem('id') === json.data.user.id ? message_container.classList.add('message-left') : message_container.classList.add('message-right')

        const message = document.createElement('div');
        message.classList.add('message')
        const username = document.createElement('strong');
        const p_message = document.createElement('p');
        const date = document.createElement('span');

        username.textContent = json.data.user.username;
        p_message.textContent = json.data.message;

        const d = new Date(json.data.date).toLocaleString().split(',')[1];
        date.textContent = d

        message.appendChild(username);
        message.appendChild(p_message);
        message.appendChild(date);

        message_container.appendChild(message);

        container_messagens.appendChild(message_container);
    }
    socket.addEventListener('message', data => {
        const json = JSON.parse(data.data);
        switch (json.event) {
            case "sucess-login": {
                console.log(json)
                if (json.ok) {
                    login_container.style.display = 'none';
                    chat_container.style.display = 'flex';

                    localStorage.setItem('id', json.user.id);
                    localStorage.setItem('username', json.user.username);
                    localStorage.setItem('notifications', JSON.stringify(json.notifications));
                }
                break;
            }
            case "notification": {
                const last_notification = json.notifications[json.notifications.length - 1];

                console.log(last_notification);
                const notification_container = document.createElement('div');
                notification_container.classList.add('notification');
                const notification_icon = document.createElement('div');
                const button_close = document.createElement('button');
                button_close.classList.add('notification-close');

                button_close.innerHTML = '&times;';
                notification_icon.classList.add('notification-icon');
                notification_icon.innerHTML = `  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <line x1="19" y1="8" x2="19" y2="14"></line>
                                    <line x1="22" y1="11" x2="16" y2="11"></line>
                                </svg>`;
                const notification_text = document.createElement('p');
                notification_text.classList.add('notification-text')
                notification_text.innerHTML = `${last_notification.message}`

                notification_container.appendChild(notification_icon);
                notification_container.appendChild(notification_text);
                notification_container.appendChild(button_close);
                container_notifications.appendChild(notification_container);

                button_close.addEventListener('click', () => {
                    notification_container.style.display = 'none';
                });
                break;
            }
            case "file": {
                const img_container = document.createElement('div');

                img_container.innerHTML = json.file;

                container_messagens.appendChild(img_container);
                break;
            }
            case "message": {
                CreateMessage(json);
                break
            }
        }
    });

    window.addEventListener('load', () => {
        setTimeout(() => {
            socket.send(JSON.stringify({
                event: "load",
                message: true,
                id: localStorage.getItem('id') ? localStorage.getItem('id') : false,
                username: localStorage.getItem('username')
            }))
        }, 50);
    });
    const file_input = document.getElementById('file-input');
    function UploadFileWebSocket(event) {
        const size_chunk = 40 * 1024;
        const readFile = new FileReader();
        const file = event.target.files[0];
        const totalChunks = Math.ceil(file.size / size_chunk);

        console.log({totalChunks})

        socket.send(JSON.stringify({
            event: "start-upload",
            username: localStorage.username,
            file: file.name,
            size:file.size
        }));

        if (!file) return;
       readFile.addEventListener('load', (e) => {
        const content = e.target.result;
        const ArrayBuffer = Array.from(content);

        socket.send(JSON.stringify({
            event: "upload-chunk",
            file: ArrayBuffer,
            name_file:file.name,
            id: localStorage.id,
            username: localStorage.username
        }));
       });

       
       readFile.readAsDataURL(file);
    }
    file_input.addEventListener('change', UploadFileWebSocket);
})();