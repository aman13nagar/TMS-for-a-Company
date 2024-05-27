document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageContainer = document.getElementById('message-container');
    const messageForm = document.getElementById('message-form');
    const usernameInput = document.getElementById('username');
    const messageInput = document.getElementById('message');
  
    socket.on('newMessage', (data) => {
      const { username, text } = data;
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `<strong>${username}:</strong> ${text}`;
      messageContainer.appendChild(messageElement);
    });
  
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value;
      const text = messageInput.value;
      socket.emit('newMessage', { username, text });
      messageInput.value = '';
    });
  });
  