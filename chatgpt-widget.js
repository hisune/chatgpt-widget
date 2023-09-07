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
            max_history_storage: 45,
            max_history_size: 7,
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
                },
                settings:{
                    model: 'OpenAI model',
                    temperature: 'Temperature(0-2)',
                    top_p: 'Top P(0-1)',
                    max_history_storage: 'Max History Message Storage(1-75)',
                    max_history_size: 'Max History Message Sent(1-10)',
                },
                actions:{
                    retry: 'Retry send',
                    copy: 'Copy message',
                    delete: 'Delete message',
                    forget: 'Cut the above chat history',
                    forgotten: 'AI has forgotten the above chat memories',
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
                    width: '560px',
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
            chatSettingsButton: null,
            chatSettings: null,
            chatOptions: null
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
        #chatgpt-widget-container a {
          text-decoration-line: underline;
          text-decoration-style: dotted;
          color: #337ab7;
          text-decoration-color: #337ab7;
        }
        #chatgpt-widget-container br{
            content: "";
            margin: 10px;
            display: block;
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
          line-height: 19px;
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
          margin-right: calc(8px * var(--tw-space-x-reverse));
          margin-left: calc(8px * calc(1 - var(--tw-space-x-reverse)));
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
        .chatgpt-widget-text-red-500 {
          --tw-text-opacity: 1;
          color: rgba(239, 68, 68, var(--tw-text-opacity));
        }
        .chatgpt-actions{
          text-align: right;
        }
        .chatgpt-actions-forget, .chatgpt-actions-copy, .chatgpt-actions-refresh, .chatgpt-actions-delete {
          cursor: pointer;
        }
        .chatgpt-inline{
          display: inline;
          margin: 0 1px;
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
          height: 88vh;
          max-height: 88vh;
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
        #chatgpt-settings{
            text-align: right;
            padding: 8px 16px;
        }
        #chatgpt-settings > div{
            margin: 6px 0;
        }
        #chatgpt-settings input, #chatgpt-settings select{
            border-color: rgba(209, 213, 219);
            border-radius: 2px;
            border-width: 1px;
            padding: 0 2px;
        }
        #chatgpt-settings input{
            width: 60px;
        }
        #chatgpt-settings a{
            text-decoration-line: none;
        }
        .chatgpt-widget-hidden {
            display: none;
        }
        .chatgpt-separator {
            display: flex;
            align-items: center;
            text-align: center;
            color: #cccccc;
            margin-bottom: 12px;
        }
        .chatgpt-separator::before,
        .chatgpt-separator::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #eee;
        }

        .chatgpt-separator:not(:empty)::before {
            margin-right: 20px;
        }

        .chatgpt-separator:not(:empty)::after {
            margin-left: 20px;
        }
        .chatgpt-messages ul, .chatgpt-messages ol {
            padding-inline-start: 25px;
        }
        .chatgpt-messages ul{
            list-style-type: circle;
        }
        .chatgpt-messages ol {
            list-style-type: decimal;
        }
        .chatgpt-messages code{
            padding: 2px 4px;
            font-size: 90%;
            color: #c7254e;
            background-color: #f9f2f4;
            border-radius: 4px;
        }
        .chatgpt-messages pre{
            display: block;
            padding: 9.5px;
            margin: 10px 0 10px 0;
            font-size: 13px;
            line-height: 1.42857143;
            color: #333;
            word-break: break-all;
            word-wrap: break-word;
            background-color: #f5f5f5;
            border: 1px dashed #ccc;
            border-radius: 4px;
        }
        .chatgpt-messages blockquote {
            padding: 5px 10px;
            margin: 0 0 20px;
            font-size: 16px;
            border-left: 5px solid #bbb;
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

            let model = this.getOptionsStorage('model'), modelSelect4, modelSelect35, modelSelect3516k;
            if(model == 'gpt-4'){
                modelSelect4 = 'selected';
                modelSelect35 = '';
                modelSelect3516k = '';
            }else if(model == 'gpt-3.5-turbo'){
                modelSelect4 = '';
                modelSelect35 = 'selected';
                modelSelect3516k = '';
            }else{
                modelSelect4 = '';
                modelSelect35 = '';
                modelSelect3516k = 'selected';
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
              <svg id="chatgpt-settings-button" xmlns="http://www.w3.org/2000/svg" class="chatgpt-widget-cursor-pointer" width="21px" height="21px" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <button id="chatgpt-widget-submit" class="chatgpt-widget-rounded-md chatgpt-widget-px-4 chatgpt-widget-py-2 chatgpt-widget-cursor-pointer" style="background-color: ${this.def.theme.send_button.background_color}; color: ${this.def.theme.send_button.text_color};">${this.def.language.send}</button>
            </div>
          </div>
           <div id="chatgpt-settings" class="chatgpt-widget-hidden">
                <div>${this.def.language.settings.model}: 
                    <select class="chatgpt-options" data-name="model">
                        <option value="gpt-4" ${modelSelect4}>gpt-4</option>
                        <option value="gpt-3.5-turbo" ${modelSelect35}>gpt-3.5-turbo</option>
                        <option value="gpt-3.5-turbo-16k" ${modelSelect3516k}>gpt-3.5-turbo-16k</option>
                    </select>
                </div>
                <div>${this.def.language.settings.temperature}: <input class="chatgpt-options" data-name="temperature" value="${this.getOptionsStorage('temperature')}" type="number" step="0.1" min="0" max="2"/></div>
                <div>${this.def.language.settings.top_p}: <input class="chatgpt-options" data-name="top_p" value="${this.getOptionsStorage('top_p')}" type="number" step="0.1" min="0" max="1"/></div>
                <div>${this.def.language.settings.max_history_size}: <input class="chatgpt-options" data-name="max_history_size" value="${this.getOptionsStorage('max_history_size')}" type="number" min="1" max="10"/></div>
                <div>${this.def.language.settings.max_history_storage}: <input class="chatgpt-options" data-name="max_history_storage" value="${this.getOptionsStorage('max_history_storage') || this.def.max_history_storage}" type="number" min="1" max="75"/></div>
                <div>
                    <a id="chatgpt-widget-clear-chat" class="chatgpt-widget-cursor-pointer" style="color: ${this.def.theme.clear_button.text_color};">
                         <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eraser" width="21" height="20" viewBox="0 0 21 20" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3"></path>
                            <path d="M18 13.3l-6.3 -6.3"></path>
                        </svg>
                        ${this.def.language.clear}
                    </a>
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
            that.dom.chatSettingsButton = document.getElementById('chatgpt-settings-button');
            that.dom.chatSettings = document.getElementById('chatgpt-settings');
            that.dom.chatOptions = document.getElementsByClassName('chatgpt-options');

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
                localStorage.setItem('chatgpt-messages', '');
                that.reply(that.def.language.welcome, new Date().getTime());
                that.dom.chatInput.focus();
            })

            that.dom.chatSettingsButton.addEventListener('click', function(){
                that.dom.chatSettings.classList.toggle('chatgpt-widget-hidden');
            })
            for(let i = 0; i < that.dom.chatOptions.length; i++){
                that.dom.chatOptions[i].addEventListener('change', function(){
                    that.setOptionsStorage(this.dataset.name, this.value);
                })
            }

        },
        sendChatCompletion: async (that) => {
            let data = {
                model: that.getOptionsStorage('model'),
                stream: true,
                temperature: parseFloat(that.getOptionsStorage('temperature')),
                top_p: parseFloat(that.getOptionsStorage('top_p')),
                messages: that.getMessageStorage(true, true)
            };
            console.log(data);
            const now = new Date().getTime();
            const id = that.reply('', now);
            const replyElement = document.getElementById(id);
            replyElement.innerHTML = that.loadingSvg;
            that.scrollToBottom();
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
                    that.dom.chatInput.disabled = false;
                    that.dom.chatInput.focus();
                    that.scrollToBottom();
                    return;
                }
                // Read the response as a stream of data
                const reader = response.body?.getReader();
                let responseText = '';
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

                        const json = line.replace("data: ", "");
                        const obj = JSON.parse(json);

                        const deltaText = obj?.choices?.[0]?.delta?.content;
                        if (deltaText !== undefined) {
                            if (replyElement.innerHTML === that.loadingSvg) {
                                replyElement.innerHTML = '';
                            }
                            responseText += deltaText;
                            that.innerText(replyElement, deltaText);
                        }
                    }
                    that.scrollToBottom();
                }
                console.log('AI response: ' + responseText);
                that.setMessageStorage('assistant', responseText, now);
                replyElement.nextElementSibling.classList.toggle('chatgpt-widget-hidden');
                replyElement.innerHTML = that.parseMarkdownToHtml(responseText);
                that.scrollToBottom();
            } catch (e) {
                console.log(e);
                that.innerErrorText(replyElement, 'Error: API fetch error.');
                that.scrollToBottom();
            }
            that.dom.chatInput.disabled = false;
            that.dom.chatInput.focus();
            that.scrollToBottom();
        },
        innerErrorText: function (element, text) {
            element.innerHTML = `<div class="chatgpt-widget-text-red-500">${text}</div>`;
            this.scrollToBottom();
        },
        innerText: function (element, text) {
            element.innerText = element.innerText + text;
        },
        getOptionsStorage: function(name){
            let optionsString = localStorage.getItem('chatgpt-options'), options;
            if(!optionsString){
                options = this.def;
            }else{
                options = JSON.parse(optionsString);
            }
            return name ? options[name] : options;
        },
        setOptionsStorage: function(name, value){
            let options = this.getOptionsStorage();
            switch(name){
                case 'temperature':
                    if(value < 0) value = 0;
                    if(value > 2) value = 2;
                    break;
                case 'top_p':
                    if(value < 0) value = 0;
                    if(value > 1) value = 1;
                    break;
                case 'max_history_size':
                    if(value < 1) value = 1;
                    if(value > 10) value = 10;
                    break;
                case 'max_history_storage':
                    if(value < 1) value = 1;
                    if(value > 75) value = 75;
                    break;
            }
            options[name] = value;
            localStorage.setItem('chatgpt-options', JSON.stringify(options));
        },
        getMessageStorage: function (withoutExtend, slice) {
            let messageHistory = localStorage.getItem('chatgpt-messages');
            if (!messageHistory) {
                return [];
            }
            let messageHistoryJson = JSON.parse(messageHistory);
            let forgetIndex = null;
            if(slice){
                let maxSize = this.getOptionsStorage('max_history_size') || this.def.max_history_size;
                messageHistoryJson = messageHistoryJson.slice(-Math.abs(maxSize));
                let forgetId = localStorage.getItem('chatgpt-forget');
                if(forgetId){
                    for(let i in messageHistoryJson){
                        if('m' + messageHistoryJson[i].time === forgetId){
                            forgetIndex = i;
                        }
                    }
                }
            }
            if (withoutExtend) {
                for (let i in messageHistoryJson) {
                    delete messageHistoryJson[i].time;
                }
            }
            if(forgetIndex !== null){
                messageHistoryJson = messageHistoryJson.slice(-(messageHistoryJson.length - forgetIndex - 1));
            }
            return messageHistoryJson;
        },
        setMessageStorage: function (role, content, timestamp) {
            let messageHistory = this.getMessageStorage();
            let maxSize = this.getOptionsStorage('max_history_storage') || this.def.max_history_storage;
            let time = timestamp || new Date().getTime();
            let message = {
                role: role,
                content: content,
                time: time,
            };
            messageHistory = messageHistory.slice(-Math.abs(maxSize) + 1);
            messageHistory.push(message)
            localStorage.setItem('chatgpt-messages', JSON.stringify(messageHistory));
            return message;
        },
        deleteMessageStorage: function(id){
            console.log('delete id ' + id);
            let messages = this.getMessageStorage();
            for(let i in messages){
                if('m' + messages[i].time === id){
                    console.log('deleted index ' + i);
                    messages.splice(i, 1)
                }
            }
            localStorage.setItem('chatgpt-messages', JSON.stringify(messages));
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
        onUserRequest: function (text) {
            // Handle user request here
            console.log('User request:', text);
            let message = this.setMessageStorage('user', text)

            // Display user message
            this.ask(text, message.time);

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
        refreshLastAnswer: function(obj){
            let messageContainer = document.getElementById(obj.dataset.id).parentNode.parentNode

            let deleted = [];

            if(messageContainer.dataset.type !== 'user'){
                deleted.push(messageContainer);
            }

            let nextSibling = messageContainer.nextElementSibling;
            while (nextSibling) {
                deleted.push(nextSibling);
                nextSibling = nextSibling.nextElementSibling;
            }
            for(let i in deleted){
                console.log('delete------ ' + deleted[i].innerText);
                this.deleteMessageStorage(deleted[i].dataset.id);
                deleted[i].parentNode.removeChild(deleted[i]);
            }
            this.sendChatCompletion(this);
        },
        copyMessage: function(obj, message){
            message = message || document.getElementById(obj.dataset.id).innerText.trim();
            console.log(message);
            this.copyToClipboard(message, function(err){
                if(!err){
                    obj.classList.toggle('chatgpt-widget-hidden');
                    obj.nextElementSibling.classList.toggle('chatgpt-widget-hidden');
                    setTimeout(function(){
                        obj.classList.toggle('chatgpt-widget-hidden');
                        obj.nextElementSibling.classList.toggle('chatgpt-widget-hidden');
                    }, 2000);
                }
            });
        },
        copyToClipboard: function(text, callback){
            const type = 'text/plain';
            const blob = new Blob([text], {type});
            const data = [new ClipboardItem({[type]: blob})];
            navigator.clipboard.write(data).then(function() {
                console.log('Copied to clipboard!');
                callback(null);
            }, function() {
                console.log('Failed to copy to clipboard.');
                callback('Failed to copy to clipboard.');
            });
        },
        addEventCopy: function(element){
            let that = this;
            element.querySelector('.chatgpt-actions-copy-icon').addEventListener('click', function(){
                that.copyMessage(this);
            });
        },
        addEventRefresh: function(element){
            let that = this;
            element.querySelector('.chatgpt-actions-refresh-icon').addEventListener('click', function(){
                that.refreshLastAnswer(this);
            });
        },
        addEventDelete: function(element){
            let that = this;
            element.querySelector('.chatgpt-actions-delete-icon').addEventListener('click', function(){
                let messageContainer = document.getElementById(this.dataset.id).parentNode.parentNode
                if(messageContainer.nextSibling && messageContainer.nextSibling.classList.contains('chatgpt-separator-forget')){
                    localStorage.setItem('chatgpt-forget', messageContainer.previousSibling.dataset.id);
                }
                messageContainer.parentNode.removeChild(messageContainer);
                that.deleteMessageStorage(this.dataset.id);
            });
        },
        addEventForget: function(element){
            let that = this;
            element.querySelector('.chatgpt-actions-forget-icon').addEventListener('click', function(){
                localStorage.setItem('chatgpt-forget', this.dataset.id);
                that.clearForgetAll();
                that.appendForget(this.dataset.id);
            });
        },
        appendForget: function(id){
            let forgetElement = document.createElement('div');
            forgetElement.className = 'chatgpt-separator chatgpt-separator-forget';
            forgetElement.innerText = this.def.language.actions.forgotten;
            let widgetElement = document.getElementById(id).parentNode.parentNode;
            widgetElement.parentNode.insertBefore(forgetElement, widgetElement.nextSibling);
            if(widgetElement.parentNode.lastChild === forgetElement){
                this.scrollToBottom();
            }
        },
        clearForgetAll: function(){
            const forgetAll = document.getElementsByClassName('chatgpt-separator-forget');
            for(let i = 0; i < forgetAll.length; i++){
                forgetAll[i].parentNode.removeChild(forgetAll[i]);
            }
        },
        getChatMessageHtml: function(id, message, time, hidden, welcomeHidden){
            return `
            <div id="${id}" class="chatgpt-messages">
                  ${message}
              </div>    
              <div class="chatgpt-actions ${hidden}">
                  <div title="${this.def.language.actions.forget}" class="chatgpt-actions-forget chatgpt-inline ${welcomeHidden}">
                      <svg data-id="${id}" class="chatgpt-actions-forget-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                  </div>
                  <div title="${this.def.language.actions.copy}" class="chatgpt-actions-copy chatgpt-inline">
                      <svg data-id="${id}" class="chatgpt-actions-copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      <svg class="chatgpt-actions-copy-done chatgpt-widget-hidden" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div title="${this.def.language.actions.retry}" class="chatgpt-actions-refresh chatgpt-inline ${welcomeHidden}">
                      <svg data-id="${id}" class="chatgpt-actions-refresh-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"> <path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                  </div>
                  <div title="${this.def.language.actions.delete}" class="chatgpt-actions-delete chatgpt-inline">
                      <svg data-id="${id}" class="chatgpt-actions-delete-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  <div class="chatgpt-actions-time chatgpt-inline chatgpt-widget-text-xss" style="opacity: 0.3;">
                    ${time}
                  </div>
              </div>
            `;
        },
        addActionsEvents: function(element){
            this.addEventCopy(element);
            this.addEventRefresh(element);
            this.addEventDelete(element);
            this.addEventForget(element);
        },
        ask: function (message, timestamp) {
            message = this.parseMarkdownToHtml(message);
            const messageElement = document.createElement('div');
            let id = 'm' + timestamp;
            let time = this.formatTimestamp(timestamp);
            let chatMessageHtml = this.getChatMessageHtml(id, message, time, '', '');
            messageElement.className = 'chatgpt-widget-flex chatgpt-widget-justify-end chatgpt-widget-mb-3';
            messageElement.dataset.id = id;
            messageElement.dataset.type = 'user';
            messageElement.innerHTML = `
        <div class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="max-width: 100%; background-color: ${this.def.theme.user_message.background_color}; color: ${this.def.theme.user_message.text_color};">
          ${chatMessageHtml}
        </div>
      `;
            this.addActionsEvents(messageElement);
            this.dom.chatMessages.appendChild(messageElement);
            this.scrollToBottom();

            this.dom.chatInput.value = '';
            return id;
        },
        reply: function (message, timestamp) {
            const replyElement = document.createElement('div');
            let welcomeHidden = '';
            if(message === this.def.language.welcome){
                welcomeHidden = 'chatgpt-widget-hidden';
            }

            message = this.parseMarkdownToHtml(message);
            let id = 'm' + timestamp;
            let time = this.formatTimestamp(timestamp);
            let hidden = message === '' ? 'chatgpt-widget-hidden' : '';
            let chatMessageHtml = this.getChatMessageHtml(id, message, time, hidden, welcomeHidden);
            replyElement.className = 'chatgpt-widget-flex chatgpt-widget-mb-3';
            replyElement.dataset.id = id;
            replyElement.dataset.type = 'assistant';
            replyElement.innerHTML = `
        <div class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="max-width: 100%; background-color: ${this.def.theme.bot_message.background_color}; color: ${this.def.theme.bot_message.text_color};">
            ${chatMessageHtml}
        </div>
      `;
            this.addActionsEvents(replyElement);
            this.dom.chatMessages.appendChild(replyElement);
            this.scrollToBottom();
            return id;
        },
        copyCode: function(obj){
            this.copyMessage(obj, obj.parentNode.previousSibling.innerText);
        },
        parseMarkdownToHtml: function(md){
            md = md.replace(/[&<>]/g, function(tag) {
                let tagsToReplace = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;'
                };
                return tagsToReplace[tag] || tag;
            })
            //ul
            md = md.replace(/^\s*\n\*/gm, '<ul>\n*');
            md = md.replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2');
            md = md.replace(/^\*(.+)/gm, '<li>$1</li>');

            md = md.replace(/^\s*\n\-/gm, '<ul>\n-');
            md = md.replace(/^(\-.+)\s*\n([^\-])/gm, '$1\n</ul>\n\n$2');
            md = md.replace(/^\-(.+)/gm, '<li>$1</li>');

            //ol
            md = md.replace(/^\s*\n\d\./gm, '<ol>\n1.');
            md = md.replace(/^(\d\..+)\s*\n([^\d\.])/gm, '$1\n</ol>\n\n$2');
            md = md.replace(/^\d\.(.+)/gm, '<li>$1</li>');

            //blockquote
            md = md.replace(/^\>(.+)/gm, '<blockquote>$1</blockquote>');

            //images
            md = md.replace(/\!\[([^\]]+)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');

            //links
            md = md.replace(/[\[]{1}([^\]]+)[\]]{1}[\(]{1}([^\)\"]+)(\"(.+)\")?[\)]{1}/g, '<a href="$2" title="$4">$1</a>');

            //font styles
            md = md.replace(/[\*\_]{2}([^\*\_]+)[\*\_]{2}/g, '<b>$1</b>');
            md = md.replace(/[\~]{2}([^\~]+)[\~]{2}/g, '<del>$1</del>');

            //pre
            md = md.replace(/(.*?)\n```([^\n]*?)\n([\s\S]*?)```/gm, function(match, before, language, code) {
                language = language.trim(); // 去除前后空格作为代码块语言
                return before + '<pre class="' + language + '">' + code + '</pre>' + '<div style="text-align: right;margin-top: -30px; padding-bottom: 10px; margin-right: 5px;"><svg onclick="chatgptWidget.prototype.copyCode(this)" style="cursor: pointer" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg class="chatgpt-actions-copy-done chatgpt-widget-hidden" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
            });


            //code
            md = md.replace(/[\`]{1}([^\`]+)[\`]{1}/g, '<code>$1</code>');

            //p
            md = md.replace(/^\s*(\n)?(.+)/gm, function(m){
                return  /\<(\/)?(h\d|ul|ol|li|blockquote|pre|img)/.test(m) ? m : '<p>'+m+'</p>';
            });

            //strip p from pre
            md = md.replace(/(\<pre.+\>)\s*\n\<p\>(.+)\<\/p\>/gm, '$1$2');
            md = md.replace(/<pre[^>]*>[\s\S]*?<\/pre>/g, function(match) {
                return match.replace(/<p>([\s\S]*?)<\/p>/g, function(match, innerContent) {
                    return innerContent;
                })
            });
            return md;
        },
        scrollToBottom: function () {
            document.getElementById("chatgpt-widget-messages").scrollTo(0, document.getElementById("chatgpt-widget-messages").scrollHeight);
        },
        initHistory: function () {
            let chatMessagesHistory = this.getMessageStorage();
            let lastTimestamp = 0
            let forgetId = localStorage.getItem('chatgpt-forget');
            if (chatMessagesHistory.length > 0) {
                for (let key in chatMessagesHistory) {
                    if (chatMessagesHistory[key].role === 'user') {
                        this.ask(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
                    } else if (chatMessagesHistory[key].role === 'assistant') {
                        this.reply(chatMessagesHistory[key].content, chatMessagesHistory[key].time);
                    }
                    lastTimestamp = chatMessagesHistory[key].time || new Date().getTime();
                    if('m' + chatMessagesHistory[key].time === forgetId){
                        this.appendForget('m' + chatMessagesHistory[key].time);
                    }
                }
            }
            let now = new Date().getTime();
            if (now - lastTimestamp > 86400000) {
                this.reply(this.def.language.welcome, now);
            }
        }
    };

    global.chatgptWidget = chatgptWidget;

})(this);
