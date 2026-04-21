# TelegramProxy

Cloudflare Worker che fa da reverse proxy verso `api.telegram.org`. Utile per bypassare restrizioni di rete (proxy aziendali, firewall) che bloccano le connessioni dirette ai server Telegram.

## Deploy

```bash
npm install
npm run deploy
```

Al primo deploy, `wrangler` chiederà di autenticarsi con il tuo account Cloudflare.

## Sviluppo locale

```bash
npm run dev
```

## Uso

Una volta deployato, il worker sarà disponibile su:

```
https://telegram-proxy.<tuo-subdomain>.workers.dev
```

Configura il tuo bot Telegram per usare questo URL come base URL al posto di `https://api.telegram.org`.
