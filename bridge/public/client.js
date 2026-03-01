const socket = io();

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');

const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPickerContainer = document.getElementById('emojiPickerContainer');
const fileInput = document.getElementById('fileInput');

const displayUsername = document.getElementById('displayUsername');
const myAvatar = document.getElementById('myAvatar');

let username = '';

// Handle Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = usernameInput.value.trim();
    if (val) {
        username = val;

        // Update UI
        displayUsername.textContent = username;
        myAvatar.textContent = username.charAt(0).toUpperCase();

        // Hide overlay and enable chat
        loginOverlay.classList.add('hidden');
        messageInput.disabled = false;
        sendBtn.disabled = false;
        attachBtn.disabled = false;
        emojiBtn.disabled = false;
        messageInput.focus();

        // Optional: send a 'joined' message?
        // Actually, let's keep it strictly compatible with ChatClient.java.
        // ChatClient.java doesn't broadcast 'joined', it just starts sending messages.
        // We'll just announce it locally.
        addSystemMessage('You joined the chat.');
    }
});

// Handle Sending Messages
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message && username) {
        // Send to server in the exact format the Java client expects: "Name: message"
        const formattedMsg = `${username}: ${message}`;
        socket.emit('chat message', formattedMsg);
        messageInput.value = '';
    }
});

// Handle Receiving Messages
socket.on('chat message', (msg) => {
    // Check if it's a system message
    if (msg.startsWith('System:')) {
        addSystemMessage(msg.substring(7));
        return;
    }

    // Try to parse the standard format "Name: Message"
    const colonIndex = msg.indexOf(':');
    if (colonIndex !== -1) {
        const author = msg.substring(0, colonIndex).trim();
        const content = msg.substring(colonIndex + 1).trim();
        const isMine = author === username;

        addMessage(author, content, isMine);
    } else {
        // Fallback for unformatted messages
        addMessage('Unknown', msg, false);
    }
});

// Emoji Picker Handling
const picker = document.createElement('emoji-picker');
emojiPickerContainer.appendChild(picker);

emojiBtn.addEventListener('click', () => {
    emojiPickerContainer.classList.toggle('hidden');
});

picker.addEventListener('emoji-click', event => {
    messageInput.value += event.detail.unicode;
    messageInput.focus();
});

// Hide picker when clicking outside
document.addEventListener('click', (e) => {
    if (!emojiPickerContainer.contains(e.target) && !emojiBtn.contains(e.target)) {
        emojiPickerContainer.classList.add('hidden');
    }
});

// File Attachment Handling
attachBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    fileInput.value = '';

    const originalHtml = attachBtn.innerHTML;
    attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    attachBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.url) {
            // Success! Send as a specially formatted message
            const formattedMsg = `${username}: [FILE] ${data.filename}|${data.url}`;
            socket.emit('chat message', formattedMsg);
        } else {
            addSystemMessage('File upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        addSystemMessage('File upload error: ' + err.message);
    } finally {
        attachBtn.innerHTML = originalHtml;
        attachBtn.disabled = false;
    }
});

// UI Helper: Add a chat message
function addMessage(author, content, isMine) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-container ${isMine ? 'mine' : 'other'}`;

    const authorDiv = document.createElement('div');
    authorDiv.className = 'message-author';
    authorDiv.textContent = author;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // Check if it's a file payload
    if (content.startsWith('[FILE] ')) {
        const payload = content.substring(7); // Remove "[FILE] "
        const pipeIndex = payload.lastIndexOf('|'); // Last index in case filename has a pipe

        if (pipeIndex !== -1) {
            const filename = payload.substring(0, pipeIndex);
            const fileUrl = payload.substring(pipeIndex + 1);

            // Is it an image?
            const ext = filename.split('.').pop().toLowerCase();
            const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (imageExts.includes(ext)) {
                // Render image
                const img = document.createElement('img');
                img.src = fileUrl;
                img.className = 'message-image';
                img.alt = filename;
                img.onclick = () => window.open(fileUrl, '_blank');
                bubbleDiv.appendChild(img);
            } else {
                // Render file download box
                bubbleDiv.innerHTML = `
                    <div class="file-download-box">
                        <i class="fa-solid fa-file file-icon"></i>
                        <div class="file-info">
                            <span class="file-name" title="${filename}">${filename}</span>
                            <a href="${fileUrl}" target="_blank" download class="file-download-link"><i class="fa-solid fa-download"></i> Download</a>
                        </div>
                    </div>
                `;
            }
        } else {
            // Malformed [FILE] tag, just show text
            bubbleDiv.textContent = content;
        }
    } else {
        // Normal text message
        bubbleDiv.textContent = content; // Using textContent prevents XSS
    }

    wrapper.appendChild(authorDiv);
    wrapper.appendChild(bubbleDiv);

    messagesContainer.appendChild(wrapper);
    scrollToBottom();
}

// UI Helper: Add a system message
function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = text;
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle Info Modal
const infoBtn = document.getElementById('infoBtn');
const infoOverlay = document.getElementById('infoOverlay');
const closeInfoBtn = document.getElementById('closeInfoBtn');
const lanLinksContainer = document.getElementById('lanLinksContainer');

infoBtn.addEventListener('click', async () => {
    infoOverlay.classList.remove('hidden');
    lanLinksContainer.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch('/api/lan-urls');
        const data = await response.json();

        lanLinksContainer.innerHTML = ''; // Clear loading

        if (data.urls && data.urls.length > 0) {
            data.urls.forEach(url => {
                const item = document.createElement('div');
                item.className = 'lan-link-item';

                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.textContent = url;

                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(url);
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                    }, 2000);
                };

                item.appendChild(link);
                item.appendChild(copyBtn);
                lanLinksContainer.appendChild(item);
            });
        } else {
            lanLinksContainer.innerHTML = '<p>No LAN IP addresses found.</p>';
        }
    } catch (err) {
        lanLinksContainer.innerHTML = '<p style="color: #ef4444;">Error fetching URLs.</p>';
    }
});

closeInfoBtn.addEventListener('click', () => {
    infoOverlay.classList.add('hidden');
});

// Close modal when clicking outside
infoOverlay.addEventListener('click', (e) => {
    if (e.target === infoOverlay) {
        infoOverlay.classList.add('hidden');
    }
});
