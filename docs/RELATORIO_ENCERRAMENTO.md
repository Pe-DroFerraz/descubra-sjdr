# Descubra SJDR — status de entrega e encerramento
Atualizado em 04/11/2026.

## Ambiente inspecionado
- Repositório: Pe-DroFerraz/descubra-sjdr; PR #16 na branch work/fechamento-painel-operacional.
- Frontend: React, Vite, TypeScript; Vercel Preview para homologação.
- Supabase Cloud: projeto itegpsgjtuclbsatcdxr, PostgreSQL 17.11. 29 tabelas públicas com RLS.
- 11 migrações registradas no Cloud, incluindo segurança, rotas, MFA, origem editorial, leads e planos.
- Dados verificados em 04/11/2026: 5 locais; 5 categorias; 0 eventos; 0 roteiros; 0 usuários Auth.
- Edge Functions partner-intake e public-notices estavam ACTIVE. Ativo não comprova disponibilidade do PNCP nem operação comercial homologada.
- Preview Vercel possui VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. O ambiente Production deve ser configurado e homologado separadamente.
- Backup real permanece somente no computador do responsável. O teste anterior validou restauração da aplicação com limitações; não comprovou Auth e Storage completos.

## Módulos disponíveis
| Área | Implementação | Limite da homologação |
| --- | --- | --- |
| Home, lugares e fotos | Telas públicas editoriais e catálogo | Publicar apenas informações verificadas e fotografias licenciadas |
| Mapa 2D | Leaflet/OpenStreetMap + coordenadas de referência + dados publicados | Conferir tiles, GPS, pins e dispositivos reais |
| Mapa 3D | MapLibre no bundle + terreno/worker Vite | Conferir em aparelho com WebGL2 e conexão real |
| Roteiros, eventos e favoritos | Telas e fluxos demonstrativos/locais | 0 roteiros e 0 eventos no banco remoto; não anunciar programação não verificada |
| Editais | Página, links oficiais e consulta PNCP por função | Consultar sempre o documento oficial e confirmar disponibilidade da fonte |
| Captura de interessados | Formulário público com Edge Function | Teste real autorizado, regras antispam e política de consentimento |
| Painel administrativo | Editores CMS + central operacional na seção overview | Nenhum administrador Auth cadastrado; teste real com MFA/RLS pendente |
| CRM do admin | Leads, etapas, histórico, notas e retornos via Supabase | Homologação com usuário administrativo real |
| Comercial | Empresas, planos, assinaturas verificadas, moderação | Integração de gateway de pagamentos e webhooks ainda não homologada |
| Mensagens automáticas | Não entregue como serviço externo homologado | Credenciais, opt-in, política de envio e monitoração necessárias |
| Estúdio visual | Rota /estudio personalizável, versões/JSON e comparação | Aprovação visual não publica automaticamente em produção |
| Painel demonstrativo | Rota /painel-demo com dados fictícios e sem banco | Demonstração não é comprovação de integração autenticada |

## Regras de segurança
- Não habilitar acesso público ao CRUD do admin, nem incluir chaves service_role no browser.
- Exigir papel admin, sessão e MFA/AAL2 em todas as ações administrativas reais.
- Usar RLS e confirmação de atualização concorrente para salvar alterações.
- Não tratar planos como receita; métricas financeiras só consideram pagamentos recebidos e verificados.
- Revisar alertas do Supabase Security Advisor sobre SECURITY DEFINER por contrato: algumas funções têm leitura pública intencional; outras podem precisar de ACL mais restritiva.
- Nunca colocar dump do banco, arquivos pessoais, credenciais, traces autenticados ou ambiente .env no GitHub.

## Condições para arquivamento definitivo
1. Criar usuário admin real por fluxo seguro do proprietário, conceder papel em banco e habilitar MFA; testar escrita e negação de acesso.
2. Homologar todas as telas de gestão com dados reais, inclusive mídia, rotas, mapa e CRM.
3. Escolher identidade visual no estúdio; aplicar configuração aprovada ao frontend definitivo.
4. Validar eventos, anúncios, roteiros, permissões e política de dados, com conteúdo real.
5. Para cobranças ou mensagens automáticas, homologar provedor e webhooks com credenciais próprias, sem inventar integração.
6. Reexecutar testes automatizados, revisão mobile, acessibilidade, performance e recuperação.
7. Configurar variáveis e callbacks do Production, realizar deploy controlado e verificar a URL de produção.
8. Registrar release/tag e só depois decidir pelo arquivamento do repositório. Arquivar código antes de validar a operação deixaria o portal incompleto.

Este documento não declara a plataforma 100% pronta. Ele distingue o código implementado dos testes que ainda dependem de autenticação e provedores externos.
