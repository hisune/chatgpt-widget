<img src="https://github.com/hisune/chatgpt-widget/assets/7941669/2bae7c83-723d-4bb1-ac6b-801296db72ee" height="80" width="auto"/>

Quickly deploy chatgpt chat widget to your website!

### feature
- Easy to deploy
- Support PC and mobile
- Support custom openai domain name

### screenshot
![230814 145541](https://github.com/hisune/chatgpt-widget/assets/7941669/c493645b-51df-47e3-a176-12da29b34314)

### usage
Add js asset to html header tag.
```html
<script src="https://YOUR_SERVER_DOMAIN/chatgpt-widget.js"></script>
```
Add js code to end of body tag.
```js
new chatgptWidget();
```
Default options:
```js
new chatgptWidget({
    endpoint: 'https://api.openai.com/v1/chat/completions',
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
            days: 'days ago',
            months: 'months ago',
            years: 'years ago',
            hours: 'hours ago',
        }
    },
    theme:{
        bubble: {
            text_color: '--tw-text-opacity: 1; color: rgba(255, 255, 255, var(--tw-text-opacity))',
            background_color: 'rgba(31, 41, 55)'
        },
        widget: {
            background_color: 'rgba(255, 255, 255)',
        },
        title: {
            text_color: 'rgba(255, 255, 255)',
            background_color: 'rgba(31, 41, 55)'
        },
        user_message:{
            text_color: 'rgba(255, 255, 255)',
            background_color: 'rgba(31, 41, 55)'
        },
        bot_message:{
            text_color: 'rgba(0, 0, 0)',
            background_color: 'rgba(229,231,235)'
        },
        send_button:{
            text_color: 'rgba(255, 255, 255)',
            background_color: 'rgba(31, 41, 55)'
        },
        clear_button:{
            text_color: 'rgba(0, 0, 0)',
        },
        time: {
            text_color: 'rgba(0,0,0,.25)'
        }
    }
});
```
### backend proxy
nginx example, replace {YOUR_SSL_KEY}, {YOUR_DOMAIN} and {YOUR_OPENAI_KEY} with your own:
```conf
server
       {
            listen 443 ssl;
            ssl_certificate {YOUR_SSL_KEY}/fullchain.cer;
            ssl_certificate_key {YOUR_SSL_KEY}.key;
            server_name {YOUR_DOMAIN};
            
            location /v1/chat/completions{
               if ($request_method = 'OPTIONS') {
            	   add_header Access-Control-Allow-Headers 'authorization,content-type';
            	   add_header Access-Control-Allow-Origin *;
            	   add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            	   return 200;
               }
               resolver 8.8.8.8;
            
               proxy_set_header authorization "Bearer {YOUR_OPENAI_KEY}";
               proxy_set_header X-Real-IP $http_x_client;
               proxy_set_header X-Forwarded-For $remote_addr;
               proxy_ssl_server_name on;
               proxy_ssl_session_reuse off;
               proxy_read_timeout 1200s;
               proxy_pass https://api.openai.com;
               proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
               chunked_transfer_encoding off;
               proxy_buffering off;
               proxy_cache off;
            }
}
```
