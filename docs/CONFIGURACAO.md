# Início rápido

1. Instale Node.js 20+.
2. Rode `npm install` e `npm run dev`.
3. Copie `.env.example` para `.env` e preencha apenas as chaves públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` quando o projeto Supabase existir.
4. Rode `npm run build` antes de publicar.
5. Na Vercel, importe este repositório, escolha framework Vite, Build Command `npm run build`, Output Directory `dist`.

## Integrações
Supabase Cloud: https://supabase.com/dashboard — crie projeto e copie URL/anon key; nunca exponha service-role.
Asaas: https://www.asaas.com — use ambiente sandbox, configure secrets no Supabase Edge Functions.
Anthropic: https://console.anthropic.com — API key apenas no backend.
WhatsApp Cloud: https://developers.facebook.com — tokens apenas no backend.
Open-Meteo: https://open-meteo.com — API sem chave, quando ativada.

Não configure webhooks ou pagamentos reais antes das Edge Functions, migrations e validações de segurança.
