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
            endpoint_image_create: 'https:///api.openai.com/v1/images/generations',
            image_proxy: 'https://opaiauth.sockio.com/imgProxy.php?url=',
            api_key: null,
            top_p: 1,
            temperature: 0.7,
            model: 'gpt-4-1106-preview',
            max_history_storage: 45,
            max_history_size: 5,
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
                    max_history_storage: 'Max history message storage(1-75)',
                    max_history_size: 'Max history message sent(1-10)',
                    image_generation: 'Image generation',
                    image_size: 'Image size',
                },
                actions:{
                    retry: 'Retry send',
                    copy: 'Copy message',
                    delete: 'Delete message',
                    forget: 'Cut the above chat history',
                    forgotten: 'AI has forgotten the above chat memories',
                },
                progress:{
                    calling: 'AI is calling image create function...',
                    generating: 'AI is generating...',
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
                    width: '680px',
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
        .chatgpt-widget-overflow-y-auto::-webkit-scrollbar {
            width: 8px !important;
        }
        .chatgpt-widget-overflow-y-auto::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,.25);
            border-radius: 4px;
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
        .chatgpt-widget-justify-start{
          position: relative;
        }
        .chatgpt-widget-justify-start::before{
            position: absolute; 
            top: 18px; 
            left: -8px; 
            border-top: 8px solid transparent; 
            border-bottom: 8px solid transparent; 
            border-right: 10px solid ${this.def.theme.bot_message.background_color};
            content: '';  
        }
        .chatgpt-widget-justify-end {
          justify-content: flex-end;
          position: relative;
        }
        .chatgpt-widget-justify-end::before{
            position: absolute; 
            top: 18px; 
            right: -8px; 
            border-top: 8px solid transparent; 
            border-bottom: 8px solid transparent; 
            border-left: 10px solid ${this.def.theme.user_message.background_color};
            content: '';  
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
        @media (max-width: 768px) {
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
          .chatgpt-widget-rounded-t-md{
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
        .chatgpt-messages p {
            margin: 8px 0;
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
        .chatgpt-messages li {
            margin: 3px 0;
        }
        .chatgpt-messages code{
            padding: 2px 4px;
            font-size: 90%;
            color: #c7254e;
            background-color: #f9f2f4;
            border-radius: 4px;
        }
        .chatgpt-pre-head{
            background-color: #e0e0e0;
            border: 1px dashed #ccc;
            border-bottom: none;
            font-size: 11px;
            padding: 2px 8px;
            margin-top: 10px;
        }
        .chatgpt-pre-head svg{
            float: right;
            top: 4px;
            position: relative;
        }
        .chatgpt-pre-head span{
            color: #999999;
        }
        .chatgpt-messages pre{
            display: block;
            padding: 9.5px;
            margin: 0 0 10px 0;
            font-size: 13px;
            line-height: 1.42857143;
            color: #333;
            word-break: break-all;
            word-wrap: break-word;
            background-color: #f5f5f5;
            border: 1px dashed #ccc;
            border-radius: 4px;
            overflow-x: auto;
        }
        .chatgpt-messages pre::-webkit-scrollbar {
            height: 8px !important;
        }
        .chatgpt-messages pre::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,.25);
            border-radius: 4px;
        }
        .chatgpt-messages blockquote {
            padding: 5px 10px;
            margin: 0 0 20px;
            font-size: 16px;
            border-left: 5px solid #bbb;
        }
        .chatgpt-messages table {
          border-collapse: collapse;
          margin: 12px 0;
          background-color: #f5f5f5;
        }
        
        .chatgpt-messages th, .chatgpt-messages td {
          border: 1px solid #ccc;
          padding: 4px 10px;
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

            let model = this.getOptionsStorage('model'), modelSelect4, modelSelect35;
            switch (model){
                case 'gpt-4-1106':
                    modelSelect4 ='selected';
                    modelSelect35 = '';
                    break;
                case 'gpt-3.5-turbo-1106':
                    modelSelect4 = '';
                    modelSelect35 ='selected';
                    break;
                default:
                    modelSelect4 = '';
                    modelSelect35 = '';
            }
            let imageSize = this.getOptionsStorage('image_size'), s1024, sw1792, sh1792;
            switch (imageSize){
                case '1024x1024':
                    s1024 ='selected';
                    sw1792 = '';
                    sh1792 = '';
                    break;
                case '1792x1024':
                    s1024 = '';
                    sw1792 ='selected';
                    sh1792 = '';
                    break;
                case '1024x1792':
                    s1024 = '';
                    sw1792 = '';
                    sh1792 ='selected';
                    break;
            }
            let imageGeneration = this.getOptionsStorage('image_generation'), imageGen0, imageGen1;
            switch (imageGeneration){
                case '0':
                    imageGen0 ='selected';
                    imageGen1 = '';
                    break;
                case '1':
                    imageGen0 = '';
                    imageGen1 ='selected';
                    break;
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
                        <option value="gpt-4-1106-preview" ${modelSelect4}>gpt-4-1106-preview</option>
                        <option value="gpt-3.5-turbo-1106" ${modelSelect35}>gpt-3.5-turbo-1106</option>
                    </select>
                </div>
                <div>${this.def.language.settings.temperature}: <input class="chatgpt-options" data-name="temperature" value="${this.getOptionsStorage('temperature')}" type="number" step="0.1" min="0" max="2"/></div>
                <div>${this.def.language.settings.max_history_size}: <input class="chatgpt-options" data-name="max_history_size" value="${this.getOptionsStorage('max_history_size')}" type="number" min="1" max="10"/></div>
                <div>${this.def.language.settings.max_history_storage}: <input class="chatgpt-options" data-name="max_history_storage" value="${this.getOptionsStorage('max_history_storage') || this.def.max_history_storage}" type="number" min="1" max="75"/></div>
                <div>${this.def.language.settings.image_generation}:
                    <select class="chatgpt-options" data-name="image_generation">
                        <option value="0" ${imageGen0}>No</option>
                        <option value="1" ${imageGen1}>Yes</option>
                    </select>
                </div>
                <div>${this.def.language.settings.image_size}: 
                    <select class="chatgpt-options" data-name="image_size">
                        <option value="1024x1024" ${s1024}>1024x1024</option>
                        <option value="1792x1024" ${sw1792}>1792x1024</option>
                        <option value="1024x1792" ${sh1792}>1024x1792</option>
                    </select>
                </div>
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

            that.dom.chatInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    if (!event.ctrlKey) {
                        that.dom.chatSubmit.click();
                        that.dom.chatInput.rows = 1;
                        event.preventDefault();
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
            document.addEventListener('click', function(event) {
                let elementContainer = document.getElementById('chatgpt-widget-container');
                let elementPopup = document.getElementById('chatgpt-widget-popup');
                if (window.getComputedStyle(elementPopup).display !== 'none' && !elementContainer.contains(event.target)) {
                    that.togglePopup();
                }
            });
        },
        sendImageGeneration: async (that, id, now, options) => {
            let data = {
                prompt: options.prompt,
                // model: 'dall-e-2',
                model: 'dall-e-3',
                size: that.getOptionsStorage('image_size') || '1024x1024'
                // size: '256x256',
            };
            console.log(JSON.stringify(data));
            const replyElement = document.getElementById(id);
            replyElement.innerHTML = that.loadingSvg + that.def.language.progress.generating;
            try {
                let response = await fetch(that.def.endpoint_image_create, {
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
                let jsonResponse = await response.json();
                console.log(jsonResponse);
                const img = new Image();
                img.onload = function() {
                    that.setMessageStorage('assistant', '', now, jsonResponse.data[0].url);
                    replyElement.innerHTML = that.imageHtml(jsonResponse.data[0].url);
                    that.doForget(id);
                    that.scrollToBottom();
                };
                img.src = that.def.image_proxy + encodeURIComponent(jsonResponse.data[0].url);
            } catch (e) {
                console.log(e);
                that.scrollToBottom();
            }
            that.dom.chatInput.disabled = false;
            that.dom.chatInput.focus();
            that.scrollToBottom();
        },
        sendChatCompletion: async (that) => {
            let model = that.getOptionsStorage('model');
            if(model === 'gpt-4'){
                model = 'gpt-4-1106-preview';
            }else if(model === 'gpt-3.5-turbo'){
                model = 'gpt-3.5-turbo-1106';
            }
            let data = {
                model: model,
                stream: true,
                temperature: parseFloat(that.getOptionsStorage('temperature')),
                top_p: parseFloat(that.getOptionsStorage('top_p')),
                messages: that.getMessageStorage(true, true)
            };
            if(that.getOptionsStorage('image_generation') === '1'){
                data.tools = [
                    {
                        type: "function",
                        function: {
                            description: "If the user asks to draw a picture, the picture is generated based on the prompt word",
                            name: "sendImageGeneration",
                            parameters: {
                                type: "object",
                                properties: {
                                    prompt: {
                                        type: "string",
                                        description: "Generate specific prompt words to describe the content of the picture"
                                    }
                                },
                                required: ["prompt"]
                            }
                        }
                    }
                ];
                data.tool_choice = 'auto';
            }
            console.log(JSON.stringify(data));
            const now = new Date().getTime();
            const id = that.reply('', now);
            const replyElement = document.getElementById(id);
            replyElement.innerHTML = that.loadingSvg;
            that.dom.chatInput.disabled = true;
            that.scrollToBottom();
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
                let functionName, functionArgs = '';

                let buffer = new Uint8Array(512);
                let bufferIdx = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    for (let i = 0; i < value.byteLength; ++i) {
                        // Write to the buffer until we reach a double new-line
                        // delimiter
                        buffer[bufferIdx++] = value[i];

                        if (bufferIdx >= 2 && value[i] == 10 && buffer[bufferIdx - 2] == 10) {
                            // Handle one data object
                            const lineBuffer = buffer.subarray(0, bufferIdx - 2);
                            const decoder = new TextDecoder("utf-8");
                            const line = decoder.decode(lineBuffer);

                            // Each line starts with a "data: " prefix, followed by
                            // the actual data, which is usually a JSON object
                            if (line.indexOf('data: ') !== 0)
                                throw new Error('Expected "data:" prefix in: ' + line);

                            // Trim the "data: " prefix
                            const dataStr = line.substring(6);

                            // Stop if we reached the end of the stream
                            if (dataStr === '[DONE]')
                                break;

                            // Parse and handle data
                            const obj = JSON.parse(dataStr);

                            const deltaText = obj?.choices?.[0]?.delta?.content;
                            const toolCalls = obj?.choices?.[0]?.delta?.tool_calls;
                            if (deltaText) {
                                if (replyElement.innerHTML === that.loadingSvg) {
                                    replyElement.innerHTML = '';
                                }
                                responseText += deltaText;
                                that.innerText(replyElement, deltaText);
                            }else if(toolCalls){
                                if(toolCalls[0]?.function?.name){
                                    functionName = toolCalls[0]?.function?.name;
                                }
                                if(toolCalls[0]?.function?.arguments === ''){
                                    toolCalls[0].function.arguments = "\n";
                                }
                                if(toolCalls[0]?.function?.arguments){
                                    functionArgs += toolCalls[0]?.function?.arguments;
                                }
                            }

                            // Reset buffer and continue reading
                            bufferIdx = 0;
                        }
                    }
                    that.scrollToBottom();
                }
                console.log('responseText: ' + responseText + ', functionName: ' + functionName + ', functionArgs: ' + functionArgs);
                if(responseText){
                    that.setMessageStorage('assistant', responseText, now);
                    replyElement.nextElementSibling.classList.toggle('chatgpt-widget-hidden');
                    replyElement.innerHTML = that.parseMarkdownToHtml(responseText);
                }else if(functionName && functionArgs){
                    let functionArgsArray = functionArgs.split("\n"), prompt = [];
                    for(let i in functionArgsArray){
                        if(functionArgsArray[i] === '') continue;
                        let functionArgsLine = JSON.parse(functionArgsArray[i]);
                        prompt.push(functionArgsLine.prompt);
                    }
                    let functionArgsString = prompt.join(", ");
                    console.log(functionArgsString);
                    replyElement.nextElementSibling.classList.toggle('chatgpt-widget-hidden');
                    replyElement.innerHTML = that.loadingSvg + that.def.language.progress.calling;
                    switch (functionName){
                        case 'sendImageGeneration':
                            that.sendImageGeneration(that, id, now, {prompt: functionArgsString});
                            break;
                        default:
                            that.innerErrorText(replyElement, 'Error: No such function, ' + functionName);
                            that.scrollToBottom();
                    }
                }
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
        getMessageById: function(id){
            let messages = localStorage.getItem('chatgpt-messages');
            if(!messages) return null;
            messages = JSON.parse(messages);
            for(let i in messages){
                if('m' + messages[i].time === id){
                    return messages[i];
                }
            }
            return null;
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
                for(let i in messageHistoryJson){
                    if(forgetId && 'm' + messageHistoryJson[i].time === forgetId){
                        forgetIndex = i;
                    }
                    if(messageHistoryJson[i].image_url){
                        forgetIndex = i;
                        this.doForget('m' + messageHistoryJson[i].time)
                    }
                }
            }
            if(forgetIndex !== null){
                messageHistoryJson = messageHistoryJson.slice(-(messageHistoryJson.length - forgetIndex - 1));
            }
            if (withoutExtend) {
                console.log(messageHistoryJson);
                for (let i in messageHistoryJson) {
                    if(messageHistoryJson[i] && messageHistoryJson[i].image_url){
                        messageHistoryJson.splice(i, 1);
                    }
                }
                for (let i in messageHistoryJson) {
                    delete messageHistoryJson[i].time;
                }
            }
            return messageHistoryJson;
        },
        setMessageStorage: function (role, content, timestamp, imageUrl) {
            let messageHistory = this.getMessageStorage();
            let maxSize = this.getOptionsStorage('max_history_storage') || this.def.max_history_storage;
            let time = timestamp || new Date().getTime();
            let message = {
                role: role,
                content: content,
                time: time
            };
            if(imageUrl){
                message.image_url = imageUrl;
            }
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
            this.dom.chatPopup.classList.toggle('chatgpt-widget-hidden');
            document.getElementById('chatgpt-widget-expand').classList.toggle('chatgpt-widget-hidden');
            document.getElementById('chatgpt-widget-shrink').classList.toggle('chatgpt-widget-hidden');
            if (!this.dom.chatPopup.classList.contains('chatgpt-widget-hidden')) {
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
                setTimeout(function (){
                    deleted[i].parentNode.removeChild(deleted[i]);
                }, 0);
            }
            this.sendChatCompletion(this);
        },
        copyMessage: function(obj, message){
            if(!message){
                message = this.getMessageById(obj.dataset.id).content;
            }
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
                that.deleteMessageStorage(this.dataset.id);
                setTimeout(function (){
                    messageContainer.parentNode.removeChild(messageContainer);
                }, 0);
            });
        },
        doForget: function(id){
            localStorage.setItem('chatgpt-forget', id);
            this.clearForgetAll();
            this.appendForget(id);
            this.dom.chatInput.focus();
        },
        addEventForget: function(element){
            let that = this;
            element.querySelector('.chatgpt-actions-forget-icon').addEventListener('click', function(){
                that.doForget(this.dataset.id);
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
                  <div title="${this.def.language.actions.copy}" class="chatgpt-actions-copy chatgpt-inline ${welcomeHidden}">
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
        <div class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="max-width: -webkit-fill-available; background-color: ${this.def.theme.user_message.background_color}; color: ${this.def.theme.user_message.text_color};">
          ${chatMessageHtml}
        </div>
      `;
            this.addActionsEvents(messageElement);
            this.dom.chatMessages.appendChild(messageElement);
            this.scrollToBottom();

            this.dom.chatInput.value = '';
            return id;
        },
        imageHtml: function(url){
            url = this.def.image_proxy + encodeURIComponent(url);
            return `<a href="${url}" target="_blank" style="margin: 10px; display: table"><img src="${url}" width="250"/></a>`;
        },
        reply: function (message, timestamp, imageUrl) {
            const replyElement = document.createElement('div');
            let welcomeHidden = '';
            if(message === this.def.language.welcome){
                welcomeHidden = 'chatgpt-widget-hidden';
            }

            let id = 'm' + timestamp;
            let time = this.formatTimestamp(timestamp);
            let hidden = '';
            if(imageUrl){
                message = this.imageHtml(imageUrl);
                welcomeHidden = 'chatgpt-widget-hidden';
            }else{
                message = this.parseMarkdownToHtml(message);
                hidden = message === '' ? 'chatgpt-widget-hidden' : '';
            }
            let chatMessageHtml = this.getChatMessageHtml(id, message, time, hidden, welcomeHidden);
            replyElement.className = 'chatgpt-widget-flex chatgpt-widget-justify-start chatgpt-widget-mb-3';
            replyElement.dataset.id = id;
            replyElement.dataset.type = 'assistant';
            replyElement.innerHTML = `
        <div class="chatgpt-widget-rounded-lg chatgpt-widget-py-2 chatgpt-widget-px-4 max-w-[70%]" style="max-width: -webkit-fill-available; background-color: ${this.def.theme.bot_message.background_color}; color: ${this.def.theme.bot_message.text_color};">
            ${chatMessageHtml}
        </div>
      `;
            this.addActionsEvents(replyElement);
            this.dom.chatMessages.appendChild(replyElement);
            this.scrollToBottom();
            return id;
        },
        copyCode: function(obj){
            this.copyMessage(obj, obj.parentNode.nextSibling.innerText);
        },
        parseMarkdownToHtml: function(src){
            let rx_lt = /</g;
            let rx_gt = />/g;
            let rx_space = /\t|\r|\uf8ff/g;
            let rx_escape = /\\([\\\|`*_{}\[\]()#+\-~])/g;
            let rx_hr = /^([*\-=_] *){3,}$/gm;
            let rx_blockquote = /\n *&gt; *([^]*?)(?=(\n|$){2})/g;
            let rx_list = /\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g;
            let rx_listjoin = /<\/(ol|ul)>\n\n<\1>/g;
            let rx_highlight = /(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*?)\2\8(?!\2)(?=\W|_|$)/g;
            let rx_code = /\n((```|~~~)(.*)\n?([^]*?)\n?\2|((    .*?\n)+))/g;
            let rx_link = /((!?)\[(.*?)\]\((.*?)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g;
            let rx_table = /\n(( *\|.*?\| *\n)+)/g;
            let rx_thead = /^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/;
            let rx_row = /.*\n/g;
            let rx_cell = /\||(.*?[^\\])\|/g;
            let rx_heading = /(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/g;
            let rx_para = /(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g;
            let rx_stash = /-\d+\uf8ff/g;

            function replace(rex, fn) {
                src = src.replace(rex, fn);
            }

            function element(tag, content) {
                return '<' + tag + '>' + content + '</' + tag + '>';
            }

            function blockquote(src) {
                return src.replace(rx_blockquote, function(all, content) {
                    return element('blockquote', blockquote(highlight(content.replace(/^ *&gt; */gm, ''))));
                });
            }

            function list(src) {
                return src.replace(rx_list, function(all, ind, ol, num, low, content) {
                    let entry = element('li', highlight(content.split(
                        RegExp('\n ?' + ind + '(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +', 'g')).map(list).join('</li><li>')));

                    return '\n' + (ol
                        ? '<ol start="' + (num
                        ? ol + '">'
                        : parseInt(ol,36) - 9 + '" style="list-style-type:' + (low ? 'low' : 'upp') + 'er-alpha">') + entry + '</ol>'
                        : element('ul', entry));
                });
            }

            function highlight(src) {
                return src.replace(rx_highlight, function(all, _, p1, emp, sub, sup, small, big, p2, content) {
                    return _ + element(
                        emp ? (p2 ? 'strong' : 'em')
                            : sub ? (p2 ? 's' : 'sub')
                                : sup ? 'sup'
                                    : small ? 'small'
                                        : big ? 'big'
                                            : 'code',
                        highlight(content));
                });
            }

            function unesc(str) {
                return str.replace(rx_escape, '$1');
            }

            let stash = [];
            let si = 0;

            src = '\n' + src + '\n';

            replace(rx_lt, '&lt;');
            replace(rx_gt, '&gt;');
            replace(rx_space, '  ');

            // blockquote
            src = blockquote(src);

            // horizontal rule
            replace(rx_hr, '<hr/>');

            // list
            src = list(src);
            replace(rx_listjoin, '');

            // code
            replace(rx_code, function(all, p1, p2, p3, p4, p5) {
                stash[--si] = element('pre',p4||p5.replace(/^    /gm, ''));
                return '<div class="chatgpt-pre-head">' +
                    `<span>${p3 || 'code'}</span>` +
                    '<svg onclick="chatgptWidget.prototype.copyCode(this)" style="cursor: pointer" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg class="chatgpt-actions-copy-done chatgpt-widget-hidden" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                    '</div>'
                 + si + '\uf8ff';
            });


            // link or image
            replace(rx_link, function(all, p1, p2, p3, p4, p5, p6) {
                stash[--si] = p4
                    ? p2
                        ? '<img src="' + p4 + '" alt="' + p3 + '"/>'
                        : '<a href="' + p4 + '" target="_blank">' + unesc(highlight(p3)) + '</a>'
                    : p6;
                return si + '\uf8ff';
            });

            // table
            replace(rx_table, function(all, table) {
                let sep = table.match(rx_thead)[1];
                return '\n' + element('table',
                    table.replace(rx_row, function(row, ri) {
                        return row == sep ? '' : element('tr', row.replace(rx_cell, function(all, cell, ci) {
                            return ci ? element(sep && !ri ? 'th' : 'td', unesc(highlight(cell || ''))) : ''
                        }))
                    })
                )
            });

            // heading
            replace(rx_heading, function(all, _, p1, p2) { return _ + element('h' + p1.length, unesc(highlight(p2))) });

            // paragraph
            replace(rx_para, function(all, content) { return element('p', unesc(highlight(content))) });

            // stash
            replace(rx_stash, function(all) { return stash[parseInt(all)] });

            return src.trim();
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
                        this.reply(chatMessagesHistory[key].content, chatMessagesHistory[key].time, chatMessagesHistory[key].image_url);
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
