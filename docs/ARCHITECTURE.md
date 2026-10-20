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

## Supabase como armazenamento

URL do projeto e chave Publishable ficam em
`src/lib/supabase/config.ts`, sem depender de variáveis públicas na Vercel. A
Publishable key é pública e não concede acesso por si só: autenticação e RLS
no banco continuam obrigatórias. O login valida email e senha no Supabase Auth;
senhas nunca são consultadas nem devolvidas pelo banco.

O primeiro Super Admin é provisionado uma única vez com `npm run
db:bootstrap-admin`, usando a chave service role apenas no servidor. O script
cria uma conta Auth confirmada e concede o papel global pela função
`grant_initial_platform_admin`. O bootstrap Supabase foi executado no projeto
ConSys em 20/10/2026.

O painel administrativo está em `/admin` e o login em `/admin/login`. A página
do painel e a Server Action de criação de clientes verificam no servidor se a
conta autenticada tem papel `super_admin`. Criar tenant também cria o primeiro
síndico pelo Supabase Auth e cria membership de gestão restrito ao tenant.
O Super Admin é uma identidade global em `platform_roles`, sem membership,
residente ou vínculo a condomínio; síndicos e moradores usam identidades Auth
próprias, com perfil e vínculos associados ao ID do tenant. Em caso de erro de
conexão ou autenticação Supabase, o acesso falha de forma fechada; não há
fallback para JSON.
Tenants armazenam UUID interno, slug e código de entrada público no formato
`{slug}@consys.com`.

O login web em `/admin/login` solicita email e senha, sem slug nem código do
condomínio. O servidor direciona Super Admin para `/admin` e o síndico para o
único tenant ativo vinculado ao seu usuário. O código público do condomínio é
pedido exclusivamente na entrada do app do morador em `/app`.

Dados de validação remota no Supabase: tenant `residencial-modelo`, síndico
`sindico.modelo@consys.com` e morador `morador.modelo@consys.com`, aprovado e
vinculado à unidade `A-101`. As senhas temporárias são compartilhadas fora da
documentação e não devem ser usadas em produção.

`SUPABASE_SERVICE_ROLE_KEY` continua necessária somente para operações
administrativas que criam contas Auth; ela é secreta, server-only e nunca pode
ser embutida no código ou enviada ao navegador. Credenciais locais ficam em
`.env.local`, ignorado pelo Git. Não documente senhas em arquivos versionados.

## Isolamento por tenant

- O Supabase associa slug a UUID e estado ativo/suspenso do tenant.
- Código de entrada identifica tenant, mas não autoriza leitura nem login.
- O slug passa por validação de formato e comparação exata no servidor.
- Slugs reservados por rotas do sistema (`admin`, `api`, `app` e `_next`) não podem
  ser usados como tenants.
- Sessões são geridas pelo Supabase Auth em cookies HTTP-only, SameSite Strict,
  `Secure` em produção.
- Síndicos recebem membership de gestão no momento da criação pelo Admin Geral.
  `canManageTenant` só autoriza esse papel no UUID do tenant correspondente.
- Solicitações de morador não recebem acesso. Após o síndico confirmar a unidade,
  a aprovação cria o membership do tenant e unidade.
- App do morador filtra cobranças pela unidade associada, reservas pelo autor e
  chamados pelo autor; comunicados/enquetes são compartilhados no tenant.
- A rota privada repete a verificação em seu layout. As Server Actions de
  negócio também devem executar a autorização, mesmo quando o layout já o fez.
- Nenhuma página protegida usa o slug diretamente para ler dados arbitrários.

Autorização das rotas e ações é revalidada no servidor; as políticas RLS também
restringem as consultas diretamente no banco.

## Portal interno e módulos

O painel de gestão do condomínio utiliza sidebar recolhível no desktop e menu
lateral no mobile. As páginas `/{client}/taxas`, `/reservas`, `/mural`,
`/chamados` e `/moradores` consultam e persistem dados no Supabase, associados ao UUID
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

`src/lib/supabase/config.ts` define a URL do Supabase e a chave pública
Publishable. `src/lib/auth.ts` usa Supabase Auth SSR (`getUser`,
`signInWithPassword`, `signOut`) e carrega perfil, papel global, memberships e
unidades do banco. A aplicação não usa JSON como fallback.

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

As migrations são versionadas e foram aplicadas ao projeto remoto; a validação
de isolamento com dois tenants continua pendente. Nenhuma migração remota é
executada automaticamente.

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
- `src/lib/auth.ts`: sessão e permissões derivadas do Supabase Auth.
- `src/lib/storage/json-store.ts`: camada de acesso aos dados do Supabase.
- `src/lib/tenant-access.ts`: regra pura de permissão de tenant.
- `src/components/create-tenant-form.tsx`: cadastro de tenants com autorização
  repetida na Server Action.
- `src/components/tenant-sidebar.tsx`: navegação lateral recolhível e responsiva.
- `src/lib/tenant-actions.ts`: mutações validadas e protegidas dos módulos.
- `src/lib/resident-actions.ts`: identificação do tenant, solicitações e
  mutações do app do morador.
- `supabase/migrations`: esquema PostgreSQL versionado.
- `src/lib/supabase/config.ts`: URL e chave pública Publishable do projeto.
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
