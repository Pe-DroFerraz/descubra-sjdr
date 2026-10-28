# Experiência pública, 3D e parceiros — 28/10/2026

## Escopo desta branch

- Navegação pública: **Mapa 3D**, **Fontes oficiais**, **Editais** e **Anuncie**.
- Layout responsivo ampliado, chamadas de ação e cards consistentes.
- Mapa experimental em MapLibre GL JS 6.16.0 (CDN fixada em versão): relevo Mapterhorn, mapa base OSM, câmera inclinável, marcadores somente de lugares publicados pelo catálogo. **Não reproduz fachadas em 3D** nem substitui o mapa tradicional Leaflet.
- Fontes institucionais referenciadas diretamente, sem vínculo formal com a prefeitura nem dados de editais copiados sem sincronização autorizada. Verificar periodicamente os links.
- Plano anunciado só aparece quando \`plans.published=true\`, com preço lido do Supabase. Nenhuma assinatura, cobrança ou propaganda é ativada automaticamente.
- Captação de interessados por Edge Function \`partner-intake\`, com verificação de origem, honeypot, tamanho de mensagem, validação de campos, consentimento e limite básico por e-mail. Nenhum disparo automático de e-mail ou WhatsApp. A função só grava o nome do negócio e o e-mail na tabela existente \`public.leads\`. Os demais campos enviados não são persistidos — a UI deve deixar claro esse limite antes de ampliar a gestão de mensagens.
- Apenas \`public.leads\` recebe novos registros por \`service_role\` na Edge Function. RLS para o visitante continua inalterada. E-mails de interessados são dados pessoais e exigem retenção/eliminação definida antes da produção.

## Acordos e limitações

A integração ao governo nesta etapa consiste em **links externos oficiais**. O portal não está conectado ao sistema interno da prefeitura nem oferece publicação automática de editais.

MapLibre e Mapterhorn requerem conexão e compatibilidade WebGL, e a Política de Segurança de Conteúdo adicionou explicitamente os domínios necessários. Validar uso, atribuição e limites de tiles antes de divulgação ampla.

A ingestão comercial ainda não envia mensagens, não cadastra anunciante automaticamente e não cria cobranças Asaas. O painel central administrativo permanece para a etapa final conforme escolha do usuário.

## Homologação

1. Testes GitHub Actions: build TS/Vite, ESLint, Vitest e Playwright; testar /mapa-3d sem WebGL.
2. Preview Vercel: abrir as quatro rotas em smartphone e desktop.
3. Configurar a Edge Function de captação no Supabase e testar uma requisição real voluntária antes de divulgar o formulário.
4. Conferir links externos atualizados, políticas de privacidade, retenção de leads e chave publishable válida em Preview.
5. Não publicar ofertas, editais específicos, horários ou preços sem origem verificada.

Esta entrega não habilita envio automático de mensagens e não simula uma integração governamental com API.
