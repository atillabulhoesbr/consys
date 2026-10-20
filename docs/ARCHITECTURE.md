# Arquitetura

## Visão geral

O ConSys usa Next.js App Router com TypeScript strict, React Server Components
por padrão e uma rota raiz pública para a landing page. O ambiente de cada
cliente é identificado pelo path `/{client}`; em produção, o host poderá ser
`app.seudominio.com`, mantendo o slug do cliente no path.

A URL identifica o tenant solicitado, mas não concede autorização. Páginas
protegidas resolvem o slug contra o registro no servidor, carregam a identidade
a partir de uma sessão opaca e verificam o papel global ou a associação do
usuário com o UUID do tenant. Tenant inexistente/suspenso ou usuário sem acesso
recebem 404. Cada nova operação sensível deve repetir a autorização no servidor;
não deve confiar em `tenant_id`, role ou identidade vindos do navegador.

## Armazenamento provisório

Sem credenciais Supabase, a aplicação em desenvolvimento/teste lê os tenants
de `dados_json/tenants.json` e mantém contas e sessões em
`dados_json/runtime.json`. O módulo server-only `src/lib/storage/json-store.ts`
valida os arquivos com Zod, serializa gravações dentro do processo e grava o
runtime por arquivo temporário + rename. `runtime.json` é ignorado pelo Git,
tem permissões restritas e armazena somente hashes de senha e de sessão.

O primeiro Super Admin é criado no primeiro login a partir de
`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` e `INITIAL_ADMIN_NAME`; a senha
é derivada com scrypt e nunca escrita em texto puro. O bootstrap só cria a
conta se ainda não existir um Super Admin. Alterar essas variáveis depois não
troca a senha de uma conta existente.

O painel administrativo está em `/admin` e o login em `/admin/login`. A página
do painel e a Server Action de criação de clientes verificam no servidor se a
conta autenticada tem papel `super_admin`. Criar tenant também cria o primeiro
síndico, com credencial scrypt e membership de gestão restrito ao tenant.
Tenants armazenam UUID interno, slug e código de entrada público no formato
`{slug}@consys.com`.

O login web em `/admin/login` solicita email e senha, sem slug nem código do
condomínio. O servidor direciona Super Admin para `/admin` e o síndico para o
único tenant ativo vinculado ao seu usuário. O código público do condomínio é
pedido exclusivamente na entrada do app do morador em `/app`.

Credenciais locais de teste ficam em `.env.local`, ignorado pelo Git. Não
documente nem copie senhas para arquivos versionados ou ambientes compartilhados.

O modo JSON padrão serve para desenvolvimento local: não tem transações entre
processos, persistência confiável em serverless, backup, replicação, proteção
contra acesso ao filesystem do host ou limitação de tentativas distribuída. Por
isso a aplicação recusa esse modo em `production`.

Uma exceção explícita, `CONSYS_DEMO_JSON=true`, permite uma demonstração
temporária em produção sem Supabase. Nessa modalidade, tenants são lidos do
JSON versionado e o runtime gravável fica em `/tmp/consys-demo-json`; alterações
podem desaparecer em reinícios/deploys e divergir entre instâncias. O login
provisiona o síndico restrito ao tenant `condominio-demo` por `DEMO_MANAGER_*`
e o morador com associação somente à unidade configurada por
`DEMO_RESIDENT_*`. As contas precisam ter emails distintos. `INITIAL_ADMIN_*`
não é usado nesse modo e o Super Admin global não é provisionado. A interface
avisa que alterações não têm persistência garantida.

As sessões do modo demo usam cookie assinado HMAC-SHA256 com
`DEMO_SESSION_SECRET` (mínimo 32 bytes aleatórios), para que a autenticação não
dependa de runtime JSON compartilhado entre funções Vercel. A identidade e o
tenant são reconstruídos apenas a partir dos emails configurados e do tenant
demo; o cookie é HTTP-only, Secure, SameSite Strict e expira em oito horas.

Se qualquer configuração Supabase for parcialmente ou totalmente preenchida,
o modo JSON é recusado; não há fallback silencioso. A exceção demo deve ser
desligada e substituída por Auth/autorização/RLS Supabase antes da produção real.

## Isolamento por tenant

- `dados_json/tenants.json` associa slug a um UUID e estado ativo/suspenso.
- Código de entrada identifica tenant, mas não autoriza leitura nem login.
- O slug passa por validação de formato e comparação exata no servidor.
- Slugs reservados por rotas do sistema (`admin`, `api`, `app` e `_next`) não podem
  ser usados como tenants.
- Sessões são identificadas por token aleatório HTTP-only, SameSite Strict,
  `Secure` em produção e prazo de oito horas. Só o SHA-256 do token é persistido.
- Síndicos recebem membership de gestão no momento da criação pelo Admin Geral.
  `canManageTenant` só autoriza esse papel no UUID do tenant correspondente.
- Solicitações de morador não recebem acesso. Após o síndico confirmar a unidade,
  a aprovação cria o membership do tenant e unidade.
- App do morador filtra cobranças pela unidade associada, reservas pelo autor e
  chamados pelo autor; comunicados/enquetes são compartilhados no tenant.
- A rota privada repete a verificação em seu layout. As Server Actions de
  negócio também devem executar a autorização, mesmo quando o layout já o fez.
- Nenhuma página protegida usa o slug diretamente para ler dados arbitrários.

O JSON local é protótipo e não suporta operação concorrente/serverless. A
autorização das rotas e ações é revalidada no servidor; a migração para Auth e
RLS Supabase permanece requisito antes da publicação.

## Portal interno e módulos

O painel de gestão do condomínio utiliza sidebar recolhível no desktop e menu
lateral no mobile. As páginas `/{client}/taxas`, `/reservas`, `/mural`,
`/chamados` e `/moradores` consultam e persistem dados JSON associados ao UUID
resolvido do tenant. Mutações administrativas exigem Super Admin ou síndico
vinculado àquele tenant.

- Taxas registram valor, competência, vencimento e baixa manual. PIX e boleto
  não processam pagamentos; requerem integração de provedor posterior.
- Moradores solicitam reservas no app; o painel lista pedidos e permite aprovar
  ou recusar. Solicitações com horário sobreposto para o mesmo espaço são
  rejeitadas.
- Mural publica avisos categorizados, com prioridade, fixação e enquetes. Cada
  conta pode registrar um voto por enquete.
- Moradores abrem chamados no app; o painel permite responder e atualizar o
  estado de atendimento.
- A página `/app` recebe o código público do condomínio e redireciona para seu
  login/cadastro. `/{client}/app` é o app web responsivo dos moradores.

O síndico recebe indicação visual de pedidos de cadastro pendentes na sidebar e
no dashboard. Ao aprovar, confirma unidade; a tela nunca exibe hash de senha.

## Supabase e RLS

Quando `NEXT_PUBLIC_SUPABASE_URL` e a chave Publishable/anon estão ambas
configuradas, `src/lib/auth.ts` usa Supabase Auth SSR (`getUser`,
`signInWithPassword`, `signOut`) e carrega perfil, papel global, memberships e
unidades do banco. Sem configuração, o modo JSON local continua disponível;
configuração parcial falha explicitamente, sem fallback.

`20261020010000_multitenant_access_and_operations.sql` acrescenta cobrança,
reserva, chamado, solicitação de morador, categoria/prioridade/enquete e votos,
além de RLS com papéis por tenant e vínculos por unidade. Reservas sobrepostas
são barradas por constraint GiST no banco; voto único é garantido por chave
única. O código público `slug@consys.com` apenas localiza tenant ativo; não é
autorização. O perfil é provisionado por trigger após criar usuário Auth.

As funções `provision_tenant` e `grant_initial_platform_admin` são restritas a
`service_role`. A aprovação de morador é uma RPC transacional que verifica
papel de síndico, cria/ativa unidade, membership e vínculo à unidade, e só
então confirma a conta Auth. As funções sensíveis vivem no schema `private` ou
têm execução revogada para `anon` e `authenticated`, salvo a aprovação que
verifica o membership no corpo da função.

`SUPABASE_SERVICE_ROLE_KEY` só pode ser usada server-side para provisionamento
Auth; ela ignora RLS e nunca deve ser prefixada com `NEXT_PUBLIC_`. Leituras e
gravações normais usam o cliente SSR Publishable e permanecem sob RLS. O
adaptador em `src/lib/supabase/store.ts` mantém os mesmos formatos de domínio
usados pelas telas, mas executa consultas no momento da requisição; não há
sincronização em background.

As migrations são versionadas, mas ainda precisam ser aplicadas ao projeto
remoto e verificadas com duas contas/tenants reais antes de considerar o
ambiente pronto para produção. Esse passo requer acesso autenticado ao projeto
Supabase; nenhuma migração remota é executada automaticamente.

## Estrutura

- `src/app`: landing page e rotas App Router.
- `src/app/icon.svg`: favicon ConSys em vetor, com o símbolo de edifício e a
  paleta verde/lima da identidade visual.
- `src/app/[client]/login`: login por ambiente do cliente.
- `src/app/app`: identificação do condomínio para entrar no app.
- `src/app/[client]/app`: app web do morador.
- `src/app/[client]/cadastro`: solicitação de acesso sujeita à aprovação.
- `src/app/[client]/(app)`: páginas protegidas por sessão e autorização.
- `src/app/[client]/(app)/taxas`: cobranças e baixas manuais.
- `src/app/[client]/(app)/reservas`: solicitações, conflitos de horário e
  aprovação administrativa.
- `src/app/[client]/(app)/mural`: comunicados e enquetes.
- `src/app/[client]/(app)/chamados`: ocorrências e respostas administrativas.
- `src/app/[client]/(app)/moradores`: aprovação de contas e vínculo de unidade.
- `src/app/admin`: painel global do Super Admin.
- `src/app/admin/login`: acesso administrativo separado.
- `src/app/globals.css`: tokens visuais compartilhados em verde natural e
  superfícies claras.
- `src/components/ui`: componentes shadcn/ui.
- `src/lib/auth.ts`: bootstrap local, senha e sessão.
- `src/lib/storage/json-store.ts`: acesso server-only ao JSON.
- `src/lib/tenant-access.ts`: regra pura de permissão de tenant.
- `src/components/create-tenant-form.tsx`: cadastro de tenants com autorização
  repetida na Server Action.
- `src/components/tenant-sidebar.tsx`: navegação lateral recolhível e responsiva.
- `src/lib/tenant-actions.ts`: mutações validadas e protegidas dos módulos.
- `src/lib/resident-actions.ts`: identificação do tenant, solicitações e
  mutações do app do morador.
- `supabase/migrations`: esquema PostgreSQL versionado.
- `dados_json`: tenants de desenvolvimento e runtime local ignorado.
- `docs`: arquitetura, decisões e backlog.

## Identidade visual

A experiência utiliza fundo branco e tons claros para a navegação e os
formulários. Verde profundo é usado para marca e ações principais; lima aparece
como acento, conforme a referência visual aprovada. A landing page, login e área
protegida devem manter esses mesmos princípios.

A referência é inspiração de paleta e legibilidade, não de composição. A LP usa
uma ilustração original de edifícios e conteúdo específico de condomínios; não
deve copiar telas, arranjo de dispositivos ou componentes do trabalho citado.
O rodapé público usa fundo verde-escuro, agrupamento de links e assinatura
institucional, mantendo contraste e consistência com a identidade do ConSys.
