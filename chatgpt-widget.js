// https://github.com/hisune/chatgpt-widget
;(function (global) {
    "use strict";

    let chatgptWidget = function (opt) {
        this._initial(opt);
    };

    function extend(defaultOptions, newOptions) {
        const mergedOptions = {...defaultOptions, ...newOptions};

        for (const key in newOptions) {
            if (typeof newOptions[key] === 'object' && !Array.isArray(newOptions[key])) {
                // Recursively merge nested objects
                mergedOptions[key] = extend(defaultOptions[key], newOptions[key]);
            } else {
                // Update individual values
                mergedOptions[key] = newOptions[key];
            }
        }
        return mergedOptions;
    }

    chatgptWidget.prototype = {
        def: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            api_key: null,
            top_p: 1,
            temperature: 0.7,
            model: 'gpt-4',
            max_history_size: 8,
            language: {
                title: 'Chat with AI',
                welcome: 'Hello! How can I assist you today?',
                send: 'Send',
                clear: 'Clear',
                placeholder: 'New lines(Ctrl+Enter)',
                ago: {
                    day: 'day ago',
                    week: 'week ago',
                    month: 'month ago',
                    year: 'year ago',
                    hour: 'hour ago',
                    days: 'days ago',
                    weeks: 'weeks ago',
                    months: 'months ago',
                    years: 'years ago',
                    hours: 'hours ago',
                }
            },
            id: null,
            theme: {
                container: {
                    position: 'fixed',
                    bottom: '10px',
                    right: '20px',
                },
                bubble: {
                    text_color: '--tw-text-opacity: 1; color: rgba(255, 255, 255, var(--tw-text-opacity))',
                    background_color: 'rgba(31, 41, 55)',
                    bubble_size: '40px',
                    icon_size: '24px'
                },
                widget: {
                    background_color: 'rgba(255, 255, 255)',
                    width: '512px',
                    bottom: '48px',
                    top: 'auto'
                },
                title: {
                    text_color: 'rgba(255, 255, 255)',
                    background_color: 'rgba(31, 41, 55)'
                },
                user_message: {
                    text_color: 'rgba(255, 255, 255)',
                    background_color: 'rgba(31, 41, 55)'
                },
                bot_message: {
                    text_color: 'rgba(0, 0, 0)',
                    background_color: 'rgba(229,231,235)'
                },
                send_button: {
                    text_color: 'rgba(255, 255, 255)',
                    background_color: 'rgba(31, 41, 55)'
                },
                clear_button: {
                    text_color: 'rgba(0, 0, 0)',
                },
                time: {
                    text_color: 'rgba(0,0,0,.25)'
                }
            }
        },
        _initial: function (opt) {
            this.def = extend(this.def, opt);

            let that = this;
            setTimeout(function () {
                that.injectHtml();
                that.listenEvent();
                that.initHistory();
            }, 0);
        },
        loadingSvg: `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                   xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                   width="32px" height="14px" viewBox="0 0 32 14" style="enable-background:new 0 0 50 50;"
                   xml:space="preserve">
      <rect x="0" y="0" width="4" height="10" fill="#333">
        <animateTransform attributeType="xml"
                          attributeName="transform" type="translate"
                          values="0 0; 0 20; 0 0"
                          begin="0" dur="0.6s" repeatCount="indefinite"/>
      </rect>
                  <rect x="10" y="0" width="4" height="10" fill="#333">
        <animateTransform attributeType="xml"
                          attributeName="transform" type="translate"
                          values="0 0; 0 20; 0 0"
                          begin="0.2s" dur="0.6s" repeatCount="indefinite"/>
      </rect>
                  <rect x="20" y="0" width="4" height="10" fill="#333">
        <animateTransform attributeType="xml"
                          attributeName="transform" type="translate"
                          values="0 0; 0 20; 0 0"
                          begin="0.4s" dur="0.6s" repeatCount="indefinite"/>
      </rect>
    </svg>`,
        dom: {
            chatInput: null,
            chatSubmit: null,
            chatMessages: null,
            chatBubble: null,
            chatPopup: null,
            closePopup: null,
            clearChat: null,
        },
        injectHtml: function () {
            const style = document.createElement('style');
            style.innerHTML = `
        #chatgpt-widget-container, #chatgpt-widget-submit {
          --tw-border-opacity: 1;
          border-color: rgba(229, 231, 235, var(--tw-border-opacity));
          box-sizing: border-box; /* 1 */
          border-width: 0; /* 2 */
          border-style: solid; /* 2 */
          border-color: currentColor; /* 2 */
        }
        .chatgpt-widget-w-10 {
          width: ${this.def.theme.bubble.bubble_size};
        }
        .chatgpt-widget-h-10 {
          height: ${this.def.theme.bubble.bubble_size};
        }
        .chatgpt-widget-rounded-full {
          border-radius: 9999px;
        }
        .chatgpt-widget-flex {
          display: flex;
        }
        .chatgpt-widget-items-center {
          align-items: center;
        }
        .chatgpt-widget-justify-center {
          justify-content: center;
        }
        .chatgpt-widget-text-3xl {
          font-size: 30px;
          line-height: 36px;
        }
        .chatgpt-widget-w-6 {
          width: ${this.def.theme.bubble.icon_size};
        }
        .chatgpt-widget-h-6 {
          height: ${this.def.theme.bubble.icon_size};
        }
        .chatgpt-widget-absolute {
          position: absolute;
        }
        .chatgpt-widget-bottom-12 {
          bottom: ${this.def.theme.widget.bottom};
          top: ${this.def.theme.widget.top};
        }
        .chatgpt-widget-right-0 {
          right: 0px;
        }
        .chatgpt-widget-rounded-md {
          border-radius: 6px;
        }
        .chatgpt-widget-shadow-md {
          --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .chatgpt-widget-flex-col {
          flex-direction: column;
        }
        .chatgpt-widget-transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        .chatgpt-widget-text-sm {
          font-size: 14px;
          line-height: 20px;
        }
        .chatgpt-widget-justify-between {
          justify-content: space-between;
        }
        .chatgpt-widget-p-1 {
          padding: 5px;
        }
        .chatgpt-widget-rounded-t-md {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }
        .chatgpt-widget-m-0 {
          margin: 0px;
        }
        .chatgpt-widget-ml-2 {
          margin-left: 8px;
        }
        .chatgpt-widget-text-xss {
          font-size: 10px;
          line-height: 10px;
          padding-bottom: 3px;
        }
        .chatgpt-widget-text-xs {
          font-size: 12px;
          line-height: 16px;
        }
        .chatgpt-widget-cursor-pointer {
          cursor: pointer;
        }
        .chatgpt-widget-flex-1 {
          flex: 1 1 0%;
        }
        .chatgpt-widget-p-4 {
          padding: 16px;
        }
        .chatgpt-widget-overflow-y-auto {
          overflow-y: auto;
        }
        .chatgpt-widget-border-t {
          border-top-width: 1px;
        }
        .chatgpt-widget-border-gray-200 {
          --tw-border-opacity: 1;
          border-color: rgba(209, 213, 219, var(--tw-border-opacity));
        }
        .chatgpt-widget-space-x-4 > :not([hidden]) ~ :not([hidden]) {
          --tw-space-x-reverse: 0;
          margin-right: calc(16px * var(--tw-space-x-reverse));
          margin-left: calc(16px * calc(1 - var(--tw-space-x-reverse)));
        }
        .chatgpt-widget-border {
          border-width: 1px;
        }
        .chatgpt-widget-border-gray-300 {
          --tw-border-opacity: 1;
          border-color: rgba(209, 213, 219, var(--tw-border-opacity));
        }
        .chatgpt-widget-px-4 {
          padding-left: 16px;
          padding-right: 16px;
        }
        .chatgpt-widget-mx-1 {
          padding-left: 4px;
          padding-right: 4px;
        }
        .chatgpt-widget-py-2 {
          padding-top: 8px;
          padding-bottom: 8px;
        }
        .chatgpt-widget-outline-none {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        .chatgpt-widget-w-3\\/4 {
          width: 75%;
        }
        .chatgpt-widget-justify-end {
          justify-content: flex-end;
        }
        .chatgpt-widget-rounded-lg {
          border-radius: 8px;
        }
        .chatgpt-widget-mb-3 {
          margin-bottom: 12px;
        }
        .chatgpt-widget-hidden {
          display: none;
        }
        .chatgpt-widget-text-red-500 {
          --tw-text-opacity: 1;
          color: rgba(239, 68, 68, var(--tw-text-opacity));
        }
        .chatgpt-widget-time{
          display: flex;
          flex-direction: column;
          justify-content: flex-end; /* Align content to the bottom */
        }
        #chatgpt-widget-messages, #chatgpt-widget-input-container{
            border-color: rgba(229, 213, 219);
            border-style: dotted;
            border-width: 1px;
            border-top: none;
        }
        #chatgpt-widget-container {
          position: ${this.def.theme.container.position};
          bottom: ${this.def.theme.container.bottom};
          right: ${this.def.theme.container.right};
          flex-direction: column;
          z-index: 1999;
        }
        #chatgpt-widget-popup {
          z-index: 1999;
          height: 85vh;
          max-height: 85vh;
          transition: all 0.3s;
          overflow: hidden;
          width: ${this.def.theme.widget.width};
          font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji';
        }
        #chatgpt-widget-input{
          resize: none;
          overflow: hidden;
        }
        @media (max-width: 576px) {
          #chatgpt-widget-popup {
            z-index: 1999;
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }
        }
      `;

            document.head.appendChild(style);

            // Create chat widget container
            const chatWidgetContainer = document.createElement('div');
            chatWidgetContainer.id = 'chatgpt-widget-container';
            if(this.def.id){
                document.getElementById(this.def.id).appendChild(chatWidgetContainer);
            }else{
                document.body.appendChild(chatWidgetContainer);
            }

            // Inject the HTML
            chatWidgetContainer.innerHTML = `
        <div id="chatgpt-widget-bubble" class="chatgpt-widget-w-10 chatgpt-widget-h-10 chatgpt-widget-rounded-full chatgpt-widget-flex chatgpt-widget-items-center chatgpt-widget-justify-center chatgpt-widget-cursor-pointer chatgpt-widget-text-3xl" style="background-color: ${this.def.theme.bubble.background_color};">
          <svg id="chatgpt-widget-expand" class="chatgpt-widget-hidden chatgpt-widget-w-6 chatgpt-widget-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="${this.def.theme.bubble.text_color};">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.601 8.39897C18.269 8.06702 17.7309 8.06702 17.3989 8.39897L12 13.7979L6.60099 8.39897C6.26904 8.06702 5.73086 8.06702 5.39891 8.39897C5.06696 8.73091 5.06696 9.2691 5.39891 9.60105L11.3989 15.601C11.7309 15.933 12.269 15.933 12.601 15.601L18.601 9.60105C18.9329 9.2691 18.9329 8.73091 18.601 8.39897Z"></path>
          </svg>
          <svg id="chatgpt-widget-shrink" class="chatgpt-widget-w-6 chatgpt-widget-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="${this.def.theme.bubble.text_color};">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div id="chatgpt-widget-popup" class="chatgpt-widget-hidden chatgpt-widget-absolute chatgpt-widget-bottom-12 chatgpt-widget-right-0 chatgpt-widget-rounded-md chatgpt-widget-shadow-md chatgpt-widget-flex chatgpt-widget-flex-col chatgpt-widget-transition-all chatgpt-widget-text-sm" style="background-color: ${this.def.theme.widget.background_color};">
          <div id="chat-header" class="chatgpt-widget-flex chatgpt-widget-justify-between chatgpt-widget-items-center chatgpt-widget-p-1 chatgpt-widget-rounded-t-md" style="background-color: ${this.def.theme.title.background_color}; color: ${this.def.theme.title.text_color};">
            <h3 class="chatgpt-widget-ml-2 chatgpt-widget-m-0 chatgpt-widget-text-xs">${this.def.language.title}</h3>
              <svg id="chatgpt-widget-close-popup" xmlns="http://www.w3.org/2000/svg" class="chatgpt-widget-h-6 chatgpt-widget-w-6 chatgpt-widget-cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </div>
          <div id="chatgpt-widget-messages" class="chatgpt-widget-flex-1 chatgpt-widget-p-4 chatgpt-widget-overflow-y-auto"></div>
          <div id="chatgpt-widget-input-container" class="chatgpt-widget-p-4 chatgpt-widget-border-t chatgpt-widget-border-gray-200">
            <div class="chatgpt-widget-flex chatgpt-widget-space-x-4 chatgpt-widget-items-center">
              <textarea rows="1" id="chatgpt-widget-input" class="chatgpt-widget-flex-1 chatgpt-widget-border chatgpt-widget-border-gray-300 chatgpt-widget-rounded-md chatgpt-widget-px-4 chatgpt-widget-py-2 chatgpt-widget-outline-none chatgpt-widget-w-3/4" placeholder="${this.def.language.placeholder}"></textarea>
              <a id="chatgpt-widget-clear-chat" class="chatgpt-widget-cursor-pointer" style="color: ${this.def.theme.clear_button.text_color};">${this.def.language.clear}</a>
              <button id="chatgpt-widget-submit" class="chatgpt-widget-rounded-md chatgpt-widget-px-4 chatgpt-widget-py-2 chatgpt-widget-cursor-pointer" style="background-color: ${this.def.theme.send_button.background_color}; color: ${this.def.theme.send_button.text_color};">${this.def.language.send}</button>
            </div>
          </div>
        </div>
      `;
        },
        listenEvent: function () {
            let that = this;
            that.dom.chatInput = document.getElementById('chatgpt-widget-input');
            that.dom.chatSubmit = document.getElementById('chatgpt-widget-submit');
            that.dom.chatMessages = document.getElementById('chatgpt-widget-messages');
            that.dom.chatBubble = document.getElementById('chatgpt-widget-bubble');
            that.dom.chatPopup = document.getElementById('chatgpt-widget-popup');
            that.dom.closePopup = document.getElementById('chatgpt-widget-close-popup');
            that.dom.clearChat = document.getElementById('chatgpt-widget-clear-chat');

            that.dom.chatSubmit.addEventListener('click', function () {

                const message = that.dom.chatInput.value.trim();
                if (!message) return;

                that.dom.chatMessages.scrollTop = that.dom.chatMessages.scrollHeight;

                that.dom.chatInput.value = '';

                that.onUserRequest(message);

            });

            that.dom.chatInput.addEventListener('keyup', function (event) {
                if (event.key === 'Enter') {
                    if (!event.ctrlKey) {
                        that.dom.chatSubmit.click();
                        that.dom.chatInput.rows = 1;
                    } else {
                        that.dom.chatInput.value += "\n";
                        that.dom.chatInput.rows = 2;
                        that.dom.chatInput.scrollTo(0, that.dom.chatInput.scrollHeight);
                    }
                }
            });

            that.dom.chatBubble.addEventListener('click', function () {
                that.togglePopup();
            });

            that.dom.closePopup.addEventListener('click', function () {
                that.togglePopup();
            });

            that.dom.clearChat.addEventListener('click', function () {
                that.dom.chatMessages.innerHTML = '';
                localStorage.setItem('message', '');
                that.reply(that.def.language.welcome);
                that.dom.chatInput.focus();
            })
        },
        sendChatCompletion: async (that) => {
            let data = {
                model: that.def.model,
                stream: true,
                temperature: that.def.temperature,
                top_p: that.def.top_p,
                messages: that.getMessageStorage(true)
            };
            console.log(data);
            const id = that.reply('');
            const replyElement = document.getElementById(id);
            replyElement.innerHTML = that.loadingSvg;
            that.dom.chatInput.disabled = true;
            try {
                let response = await fetch(that.def.endpoint, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + that.def.api_key
                    },
                    body: JSON.stringify(data)
                });
                if (response.status !== 200) {
                    console.log('status ->  ' + response.status);
                    let jsonResponse = await response.json();
                    if (jsonResponse.hasOwnProperty('error')) {
                        that.innerErrorText(replyElement, 'Error: ' + jsonResponse.error.message);
                    } else {
                        that.innerErrorText(replyElement, 'Error: Unknown error.');
                    }
                    return;
                }
                // Read the response as a stream of data
                const reader = response.body?.getReader();
                console.log('continue ->');

                while (true) {
                    const {done, value} = await reader.read();
                    if (done) {
                        break;
                    }

                    const textDecoder = new TextDecoder("utf-8");
                    const chunk = textDecoder.decode(value);
                    for (const line of chunk.split("\n")) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || trimmedLine === "data: [DONE]") {
                            continue;
                        }

                        const json = trimmedLine.replace("data: ", "");
                        const obj = JSON.parse(json);

                        const deltaText = obj?.choices?.[0]?.delta?.content;
                        if (deltaText !== undefined) {
                            if (replyElement.innerHTML === that.loadingSvg) {
                                replyElement.innerHTML = '';
                            }
                            that.innerText(replyElement, replyElement.innerText + deltaText);
                        }
                    }
                    that.scrollToBottom();
                }
                console.log('AI response: ' + replyElement.innerText);
                that.setMessageStorage('assistant', replyElement.innerText);
            } catch (e) {
                console.log(e);
                that.innerErrorText(replyElement, 'Error: API fetch error.');
            }
            that.dom.chatInput.disabled = false;
            that.dom.chatInput.focus();
        },
        innerErrorText: function (element, text) {
            element.innerHTML = `<div class="chatgpt-widget-text-red-500">${text}</div>`;
            this.scrollToBottom();
        },
        innerText: function (element, text) {
            element.innerText = text;
        },
        getMessageStorage: function (withoutTime) {
            let messageHistory = localStorage.getItem('message');
            if (!messageHistory) {
                return [];
            }
            let messageHistoryJson = JSON.parse(messageHistory);
            if (withoutTime) {
                for (let i in messageHistoryJson) {
                    delete messageHistoryJson[i].time;
                }
            }
            return messageHistoryJson;
        },
        setMessageStorage: function (role, message) {
            let messageHistory = this.getMessageStorage();
            if (messageHistory.length >= this.def.max_history_size) {
                messageHistory.shift();
            }
            messageHistory.push({
                role: role,
                content: message,
                time: new Date().getTime()
            })
            localStorage.setItem('message', JSON.stringify(messageHistory));
        },
        togglePopup: function () {
            const chatPopup = document.getElementById('chatgpt-widget-popup');
            chatPopup.classList.toggle('chatgpt-widget-hidden');
            document.getElementById('chatgpt-widget-expand').classList.toggle('chatgpt-widget-hidden');
            document.getElementById('chatgpt-widget-shrink').classList.toggle('chatgpt-widget-hidden');
            if (!chatPopup.classList.contains('chatgpt-widget-hidden')) {
                this.dom.chatInput.focus();
                this.scrollToBottom();
            }
        },
        onUserRequest: function (message) {
            // Handle user request here
            console.log('User request:', message);
            this.setMessageStorage('user', message)

            // Display user message
            this.ask(message);

            // Reply to the user
            this.sendChatCompletion(this);
        },
        wrapTimeTitle: function (timestamp, text) {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            return `<span title="${formattedDate}">${text}</span>`;
        },
        formatTimestamp: function (timestamp) {
            if (!timestamp) timestamp = new Date().getTime();

            const inputDate = new Date(timestamp);
            const currentDate = new Date();
            const timeDifferenceInSeconds = Math.floor((currentDate.getTime() - inputDate.getTime()) / 1000);

            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600
            };

            for (const interval in intervals) {
                const numberOfUnits = Math.floor(timeDifferenceInSeconds / intervals[interval]);
                if (numberOfUnits >= 1) {
                    const ago = `${interval}${numberOfUnits > 1 ? 's' : ''}`;
                    const agoText = this.def.language.ago[ago];
                    return this.wrapTimeTitle(timestamp, `${numberOfUnits} ${agoText}`);
                }
            }

            const date = new Date(timestamp);
            return this.wrapTimeTitle(timestamp, `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
        },
        ask: function (message, timestamp) {
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');
            const messageElement = document.createElement('div');
            let time = this.formatTimestamp(timestamp);
            messageElement.className = 'chatgpt-widget-flex chatgpt-widget-justify-end chatgpt-widget-mb-3';
            messageElement.innerHTML = `
        <div class="chatgpt-widget-mx-1 chatgpt-widget-time chatgpt-widget-text-xss" style="color: ${this.def.theme.time.text_color};">${time}</div>
        <div class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="background-color: ${this.def.theme.user_message.background_color}; color: ${this.def.theme.user_message.text_color};">
          ${message}
        </div>
      `;
            this.dom.chatMessages.appendChild(messageElement);
            this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

            this.dom.chatInput.value = '';
        },
        reply: function (message, timestamp) {
            const chatMessages = document.getElementById('chatgpt-widget-messages');
            const replyElement = document.createElement('div');
            const id = 'reply' + (new Date()).getTime();
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');
            let time = this.formatTimestamp(timestamp);
            replyElement.className = 'chatgpt-widget-flex chatgpt-widget-mb-3';
            replyElement.innerHTML = `
        <div id="${id}" class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="background-color: ${this.def.theme.bot_message.background_color}; color: ${this.def.theme.bot_message.text_color};">
          ${message}
        </div>
        <div class="chatgpt-widget-mx-1 chatgpt-widget-time chatgpt-widget-text-xss" style="color: ${this.def.theme.time.text_color};">${time}</div>
      `;
            chatMessages.appendChild(replyElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return id;
        },
        scrollToBottom: function () {
            document.getElementById("chatgpt-widget-messages").scrollTo(0, document.getElementById("chatgpt-widget-messages").scrollHeight);
        },
        initHistory: function () {
            let chatMessagesHistory = this.getMessageStorage();
            let lastTimestamp = 0
            if (chatMessagesHistory.length > 0) {
                for (let key in chatMessagesHistory) {
                    if (chatMessagesHistory[key].role === 'user') {
                        this.ask(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
                    } else if (chatMessagesHistory[key].role === 'assistant') {
                        this.reply(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
                    }
                    lastTimestamp = chatMessagesHistory[key].time || new Date().getTime();
                }
            }
            if (new Date().getTime() - lastTimestamp > 86400000) {
                this.reply(this.def.language.welcome);
            }
        }
    };

    global.chatgptWidget = chatgptWidget;

})(this);
