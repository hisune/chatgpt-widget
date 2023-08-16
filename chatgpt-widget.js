// https://github.com/hisune/chatgpt-widget
;(function(global) {
  "use strict";

  let chatgptWidget = function(opt) {
    this._initial(opt);
  };

  function extend(o,n,override) {
    for(var key in n){
      if(n.hasOwnProperty(key) && (!o.hasOwnProperty(key) || override)){
        o[key]=n[key];
      }
    }
    return o;
  }

  chatgptWidget.prototype = {
    def: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      temperature: 0.7,
      model: 'gpt-4',
      max_history_size: 8,
      title: 'Chat with AI',
      welcome: 'Hello! How can I assist you today?'
    },
    _initial: function(opt) {
      this.def = extend(this.def, opt, true);

      let that = this;
      setTimeout(function (){
        that.injectHtml();
        that.listenEvent();
        that.initHistory();
      }, 0);
    },
    loadingSvg: `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                   xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                   width="32px" height="20px" viewBox="0 0 32 20" style="enable-background:new 0 0 50 50;"
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
    injectHtml: function(){
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
          width: 2.5rem;
        }
        .chatgpt-widget-h-10 {
          height: 2.5rem;
        }
        .chatgpt-widget-bg-gray-800 {
          --tw-bg-opacity: 1;
          background-color: rgba(31, 41, 55, var(--tw-bg-opacity));
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
          font-size: 1.875rem;
          line-height: 2.25rem;
        }
        .chatgpt-widget-w-6 {
          width: 1.5rem;
        }
        .chatgpt-widget-h-6 {
          height: 1.5rem;
        }
        .chatgpt-widget-text-white {
          --tw-text-opacity: 1;
          color: rgba(255, 255, 255, var(--tw-text-opacity));
        }
        .chatgpt-widget-absolute {
          position: absolute;
        }
        .chatgpt-widget-bottom-12 {
          bottom: 3rem;
        }
        .chatgpt-widget-right-0 {
          right: 0px;
        }
        .chatgpt-widget-w-96 {
          width: 24rem;
        }
        .chatgpt-widget-bg-white {
          --tw-bg-opacity: 1;
          background-color: rgba(255, 255, 255, var(--tw-bg-opacity));
        }
        .chatgpt-widget-rounded-md {
          border-radius: 0.375rem;
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
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .chatgpt-widget-justify-between {
          justify-content: space-between;
        }
        .chatgpt-widget-p-1 {
          padding: 0.3rem;
        }
        .chatgpt-widget-rounded-t-md {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .chatgpt-widget-m-0 {
          margin: 0px;
        }
        .chatgpt-widget-ml-2 {
          margin-left: 0.5rem;
        }
        .chatgpt-widget-text-xss {
          font-size: 0.65rem;
          line-height: 0.65rem;
          padding-bottom: 0.2rem;
        }
        .chatgpt-widget-text-xs {
          font-size: 0.75rem;
          line-height: 1rem;
        }
        .chatgpt-widget-cursor-pointer {
          cursor: pointer;
        }
        .chatgpt-widget-flex-1 {
          flex: 1 1 0%;
        }
        .chatgpt-widget-p-4 {
          padding: 1rem;
        }
        .chatgpt-widget-overflow-y-auto {
          overflow-y: auto;
        }
        .chatgpt-widget-border-t {
          border-top-width: 1px;
        }
        .chatgpt-widget-border-gray-200 {
          --tw-border-opacity: 1;
          border-color: rgba(229, 231, 235, var(--tw-border-opacity));
        }
        .chatgpt-widget-space-x-4 > :not([hidden]) ~ :not([hidden]) {
          --tw-space-x-reverse: 0;
          margin-right: calc(1rem * var(--tw-space-x-reverse));
          margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
        }
        .chatgpt-widget-border {
          border-width: 1px;
        }
        .chatgpt-widget-border-gray-300 {
          --tw-border-opacity: 1;
          border-color: rgba(209, 213, 219, var(--tw-border-opacity));
        }
        .chatgpt-widget-px-4 {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .chatgpt-widget-mx-1 {
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }
        .chatgpt-widget-py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
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
          border-radius: 0.5rem;
        }
        .chatgpt-widget-bg-gray-200 {
            --tw-bg-opacity: 1;
            background-color: rgba(229,231,235,var(--tw-bg-opacity));
        }
        .chatgpt-widget-mb-3 {
          margin-bottom: 0.75rem;
        }
        .chatgpt-widget-hidden {
          display: none;
        }
        .chatgpt-widget-text-red-500 {
          --tw-text-opacity: 1;
          color: rgba(239, 68, 68, var(--tw-text-opacity));
        }
        .chatgpt-widget-time{
          color: rgba(0,0,0,.25);
          display: flex;
          flex-direction: column;
          justify-content: flex-end; /* Align content to the bottom */
        }
        #chatgpt-widget-messages, #chatgpt-widget-input-container{
            border-left-color: rgba(229, 213, 219, var(--tw-border-opacity));
            border-left-style: dotted;
            border-left-width: 1px;
            border-right-color: rgba(229, 213, 219, var(--tw-border-opacity));
            border-right-style: dotted;
            border-right-width: 1px;
            border-bottom-color: rgba(229, 213, 219, var(--tw-border-opacity));
            border-bottom-style: dotted;
            border-bottom-width: 1px;
        }
        #chatgpt-widget-container {
          position: fixed;
          bottom: 10px;
          right: 20px;
          flex-direction: column;
          z-index: 1999;
        }
        #chatgpt-widget-popup {
          height: 85vh;
          max-height: 85vh;
          transition: all 0.3s;
          overflow: hidden;
          width: 32rem;
          font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji';
        }
        #chatgpt-widget-input{
          resize: none;
          overflow: hidden;
        }
        @media (max-width: 576px) {
          #chatgpt-widget-popup {
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
      document.body.appendChild(chatWidgetContainer);

      // Inject the HTML
      chatWidgetContainer.innerHTML = `
        <div id="chatgpt-widget-bubble" class="chatgpt-widget-w-10 chatgpt-widget-h-10 chatgpt-widget-bg-gray-800 chatgpt-widget-rounded-full chatgpt-widget-flex chatgpt-widget-items-center chatgpt-widget-justify-center chatgpt-widget-cursor-pointer chatgpt-widget-text-3xl">
          <svg id="chatgpt-widget-expand" viewBox="0 0 24 24" class="chatgpt-widget-hidden chatgpt-widget-w-6 chatgpt-widget-h-6 chatgpt-widget-text-white" style="fill: white;">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.601 8.39897C18.269 8.06702 17.7309 8.06702 17.3989 8.39897L12 13.7979L6.60099 8.39897C6.26904 8.06702 5.73086 8.06702 5.39891 8.39897C5.06696 8.73091 5.06696 9.2691 5.39891 9.60105L11.3989 15.601C11.7309 15.933 12.269 15.933 12.601 15.601L18.601 9.60105C18.9329 9.2691 18.9329 8.73091 18.601 8.39897Z"></path>
          </svg>
          <svg id="chatgpt-widget-shrink" xmlns="http://www.w3.org/2000/svg" class="chatgpt-widget-w-6 chatgpt-widget-h-6 chatgpt-widget-text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div id="chatgpt-widget-popup" class="chatgpt-widget-hidden chatgpt-widget-absolute chatgpt-widget-bottom-12 chatgpt-widget-right-0 chatgpt-widget-w-96 chatgpt-widget-bg-white chatgpt-widget-rounded-md chatgpt-widget-shadow-md chatgpt-widget-flex chatgpt-widget-flex-col chatgpt-widget-transition-all chatgpt-widget-text-sm">
          <div id="chat-header" class="chatgpt-widget-flex chatgpt-widget-justify-between chatgpt-widget-items-center chatgpt-widget-p-1 chatgpt-widget-bg-gray-800 chatgpt-widget-text-white chatgpt-widget-rounded-t-md">
            <h3 class="chatgpt-widget-ml-2 chatgpt-widget-m-0 chatgpt-widget-text-xs">${this.def.title}</h3>
              <svg id="chatgpt-widget-close-popup" xmlns="http://www.w3.org/2000/svg" class="chatgpt-widget-h-6 chatgpt-widget-w-6 chatgpt-widget-cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </div>
          <div id="chatgpt-widget-messages" class="chatgpt-widget-flex-1 chatgpt-widget-p-4 chatgpt-widget-overflow-y-auto"></div>
          <div id="chatgpt-widget-input-container" class="chatgpt-widget-p-4 chatgpt-widget-border-t chatgpt-widget-border-gray-200">
            <div class="chatgpt-widget-flex chatgpt-widget-space-x-4 chatgpt-widget-items-center">
              <textarea rows="1" id="chatgpt-widget-input" class="chatgpt-widget-flex-1 chatgpt-widget-border chatgpt-widget-border-gray-300 chatgpt-widget-rounded-md chatgpt-widget-px-4 chatgpt-widget-py-2 chatgpt-widget-outline-none chatgpt-widget-w-3/4" placeholder="New lines(Ctrl+Enter)"></textarea>
              <a id="chatgpt-widget-clear-chat" class="chatgpt-widget-cursor-pointer">Clear</a>
              <button id="chatgpt-widget-submit" class="chatgpt-widget-bg-gray-800 chatgpt-widget-text-white chatgpt-widget-rounded-md chatgpt-widget-px-4 chatgpt-widget-py-2 chatgpt-widget-cursor-pointer">Send</button>
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

      that.dom.chatSubmit.addEventListener('click', function() {

        const message = that.dom.chatInput.value.trim();
        if (!message) return;

        that.dom.chatMessages.scrollTop = that.dom.chatMessages.scrollHeight;

        that.dom.chatInput.value = '';

        that.onUserRequest(message);

      });

      that.dom.chatInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
          if(!event.ctrlKey){
            that.dom.chatSubmit.click();
            that.dom.chatInput.rows = 1;
          }else{
            that.dom.chatInput.value += "\n";
            that.dom.chatInput.rows = 2;
            that.dom.chatInput.scrollTo(0, that.dom.chatInput.scrollHeight);
          }
        }
      });

      that.dom.chatBubble.addEventListener('click', function() {
        that.togglePopup();
      });

      that.dom.closePopup.addEventListener('click', function() {
        that.togglePopup();
      });

      that.dom.clearChat.addEventListener('click', function(){
        that.dom.chatMessages.innerHTML = '';
        localStorage.setItem('message', '');
        that.reply(that.def.welcome);
        document.getElementById('chatgpt-widget-input').focus();
      })
    },
    sendChatCompletion: async (that) =>  {
      let data = {
        model: that.def.model,
        stream: true,
        temperature: that.def.temperature,
        messages: that.getMessageStorage(true)
      };
      console.log(data);
      const id = that.reply('');
      const replyElement = document.getElementById(id);
      replyElement.innerHTML = that.loadingSvg;
      try{
        let response = await fetch(that.def.endpoint, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if(response.status !== 200){
          console.log('status ->  ' + response.status);
          let jsonResponse = await response.json();
          if(jsonResponse.hasOwnProperty('error')){
            that.innerErrorText(replyElement, 'Error: ' + jsonResponse.error.message);
          }else{
            that.innerErrorText(replyElement, 'Error: Unknown error.');
          }
          return;
        }
        // Read the response as a stream of data
        const reader = response.body?.getReader();
        console.log('continue ->');

        while (true) {
          const { done, value } = await reader.read();
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
            if(deltaText !== undefined){
              if(replyElement.innerHTML === that.loadingSvg){
                replyElement.innerHTML = '';
              }
              that.innerText(replyElement, replyElement.innerText + deltaText);
            }
          }
          that.scrollToBottom();
        }
        console.log('AI response: ' + replyElement.innerText);
        that.setMessageStorage('assistant', replyElement.innerText);
      }catch (e){
        console.log(e);
        that.innerErrorText(replyElement, 'Error: API fetch error.');
      }
  },
    innerErrorText: function(element, text){
      element.innerHTML = `<div class="chatgpt-widget-text-red-500">${text}</div>`;
      this.scrollToBottom();
    },
    innerText: function(element, text){
      element.innerText = text;
    },
    getMessageStorage: function(withoutTime) {
      let messageHistory = localStorage.getItem('message');
      if(!messageHistory){
        return [];
      }
      let messageHistoryJson = JSON.parse(messageHistory);
      if(withoutTime){
        for(let i in messageHistoryJson){
          delete messageHistoryJson[i].time;
        }
      }
      return messageHistoryJson;
    },
    setMessageStorage: function(role, message) {
      let messageHistory = this.getMessageStorage();
      if(messageHistory.length >= this.def.max_history_size){
        messageHistory.shift();
      }
      messageHistory.push({
        role: role,
        content: message,
        time: new Date().getTime()
      })
      localStorage.setItem('message', JSON.stringify(messageHistory));
    },
    togglePopup: function() {
      const chatPopup = document.getElementById('chatgpt-widget-popup');
      chatPopup.classList.toggle('chatgpt-widget-hidden');
      document.getElementById('chatgpt-widget-expand').classList.toggle('chatgpt-widget-hidden');
      document.getElementById('chatgpt-widget-shrink').classList.toggle('chatgpt-widget-hidden');
      if (!chatPopup.classList.contains('chatgpt-widget-hidden')) {
        document.getElementById('chatgpt-widget-input').focus();
        this.scrollToBottom();
      }
    },
    onUserRequest: function(message) {
      // Handle user request here
      console.log('User request:', message);
      this.setMessageStorage('user', message)

      // Display user message
      this.ask(message);

      // Reply to the user
      this.sendChatCompletion(this);
    },
    formatTimestamp: function(timestamp) {
      if(!timestamp) timestamp = new Date().getTime();
      const seconds = Math.floor((new Date() - timestamp) / 1000);

      let interval = Math.floor(seconds / 31536000);
      if (interval > 1) return interval + ' years ago';

      interval = Math.floor(seconds / 2592000);
      if (interval > 1) return interval + ' months ago';

      interval = Math.floor(seconds / 86400);
      if (interval > 1) return interval + ' days ago';

      interval = Math.floor(seconds / 3600);
      if (interval > 1) return interval + ' hours ago';

      const date = new Date(timestamp);
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    ask: function(message, timestamp) {
      message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');
      const messageElement = document.createElement('div');
      let time = this.formatTimestamp(timestamp);
      messageElement.className = 'chatgpt-widget-flex chatgpt-widget-justify-end chatgpt-widget-mb-3';
      messageElement.innerHTML = `
        <div class="chatgpt-widget-mx-1 chatgpt-widget-time chatgpt-widget-text-xss">${time}</div>
        <div class="chatgpt-widget-bg-gray-800 chatgpt-widget-text-white chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]">
          ${message}
        </div>
      `;
      this.dom.chatMessages.appendChild(messageElement);
      this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

      this.dom.chatInput.value = '';
    },
    reply: function(message, timestamp) {
      const chatMessages = document.getElementById('chatgpt-widget-messages');
      const replyElement = document.createElement('div');
      const id = 'reply' + (new Date()).getTime();
      message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');
      let time = this.formatTimestamp(timestamp);
      replyElement.className = 'chatgpt-widget-flex chatgpt-widget-mb-3';
      replyElement.innerHTML = `
        <div id="${id}" class="chatgpt-widget-bg-gray-200 text-black chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]">
          ${message}
        </div>
        <div class="chatgpt-widget-mx-1 chatgpt-widget-time chatgpt-widget-text-xss">${time}</div>
      `;
      chatMessages.appendChild(replyElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return id;
    },
    scrollToBottom: function() {
      document.getElementById("chatgpt-widget-messages").scrollTo(0, document.getElementById("chatgpt-widget-messages").scrollHeight);
    },
    initHistory: function () {
      let chatMessagesHistory = this.getMessageStorage();
      let lastTimestamp = 0
      if(chatMessagesHistory.length > 0){
        for(let key in chatMessagesHistory){
          if(chatMessagesHistory[key].role === 'user'){
            this.ask(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
          }else if(chatMessagesHistory[key].role === 'assistant'){
            this.reply(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
          }
          lastTimestamp = chatMessagesHistory[key].time || new Date().getTime();
        }
      }
      if(new Date().getTime() - lastTimestamp > 86400000){
        this.reply(this.def.welcome);
      }
    }
  };

  global.chatgptWidget = chatgptWidget;

})(this);
