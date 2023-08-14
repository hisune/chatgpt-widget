<img src="https://github.com/hisune/chatgpt-widget/assets/7941669/d045ba25-0d94-44cd-bc10-feed61fb9101" height="80" width="auto"/>

One-click deployment of chatgpt to your website!

### feature
- easy to deploy
- Support PC and mobile
- Support custom openai domain name

### screenshot
![230814 145541](https://github.com/hisune/chatgpt-widget/assets/7941669/2b64e636-f2da-4650-8e9f-ad1f2bd49803)


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
    title: 'Chat with AI'
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
