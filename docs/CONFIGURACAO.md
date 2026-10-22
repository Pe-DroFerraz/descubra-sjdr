# Início rápido

1. Instale Node.js 22.12+ (validado com 24).
2. Rode `npm ci` e `npm run dev`.
3. Copie `.env.example` para `.env.local` e preencha apenas as chaves públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` quando o projeto Supabase existir.
4. Rode `npm run build` antes de publicar.
5. Na Vercel, importe este repositório, escolha framework Vite, Build Command `npm run build`, Output Directory `dist`.

## Integrações
Supabase Cloud: https://supabase.com/dashboard — crie projeto e copie URL/anon key; nunca exponha service-role.
Asaas: https://www.asaas.com — use ambiente sandbox, configure secrets no Supabase Edge Functions.
Anthropic: https://console.anthropic.com — API key apenas no backend.
WhatsApp Cloud: https://developers.facebook.com — tokens apenas no backend.
Open-Meteo: https://open-meteo.com — API sem chave, quando ativada.

Não configure webhooks ou pagamentos reais antes das Edge Functions, migrations e validações de segurança.

## Banco e validação

Consulte [BANCO.md](BANCO.md). Execute `npm run lint`, `npm test`, `npm run build` e, com Docker, `npm run test:db`. Nunca aplique `supabase/tests/bootstrap.sql` em um projeto Supabase. O frontend continua demonstrativo; pagamentos, IA e módulos turísticos serão integrados nas próximas etapas.
