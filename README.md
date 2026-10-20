# ConSys

Plataforma de gestão condominial da MabFy Systems. A landing page pública está
em `/`, o app do morador começa em `/app` e a administração geral fica em
`/admin`. Cada condomínio recebe um link próprio (`/{slug}`).

## Requisitos

- Node.js 20.9 ou superior e npm.
- Docker apenas se for executar Supabase local.

## Iniciar em modo local JSON

1. Instale as dependências:

   ```bash
   npm install
   ```

2. `.env.local` é o arquivo local de desenvolvimento e contém uma conta de
   demonstração. Deixe as variáveis Supabase vazias para usar o armazenamento
   JSON local:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   INITIAL_ADMIN_EMAIL=admin@consys.com
   INITIAL_ADMIN_PASSWORD=defina-uma-senha-local
   INITIAL_ADMIN_NAME=Administrador ConSys
   ```

   Defina sua senha somente em `.env.local`, que está ignorado pelo Git. A
   conta é criada no primeiro login e a senha é persistida somente como hash
   scrypt em `dados_json/runtime.json`, também ignorado pelo Git.

3. Inicie a aplicação:

   ```bash
   npm run dev
   ```

4. Acesse:

   - LP ConSys: [http://localhost:3000](http://localhost:3000)
   - Painel administrativo:
     [http://localhost:3000/admin](http://localhost:3000/admin)
   - Conta local de teste: email e senha definidos em `.env.local`
   - Entrada do app do morador:
     [http://localhost:3000/app](http://localhost:3000/app)
   - App do condomínio de demonstração:
     [http://localhost:3000/condominio-demo/login](http://localhost:3000/condominio-demo/login)

As credenciais de demonstração são mantidas somente no runtime local e não
devem ser publicadas. O síndico entra em `/admin/login`; o link **Acesse o
app**, no rodapé da landing page, abre a simulação web do morador no condomínio
de demonstração.

O Admin Geral cadastra o condomínio e o primeiro síndico. Cada condomínio tem
UUID próprio e código de entrada derivado do identificador (por exemplo,
`residencial-modelo@consys.com`). O síndico compartilha esse código/link com os
moradores.

O acesso web administrativo é feito em `/admin/login` apenas com email e senha:
o painel descobre o condomínio pelo vínculo da conta do síndico. Não é preciso
informar o código/link do condomínio nesse login. O código público é usado
somente no app, em `/app`.

O morador entra por `/app`, informa o código do condomínio e solicita seu
cadastro. O síndico vê os pedidos pendentes em **Moradores**, confirma a unidade
e aprova ou recusa. Somente após a aprovação a conta é vinculada ao UUID e à
unidade, e pode abrir o app em `/{client}/app`.

O painel do condomínio exige conta de síndico vinculada ao tenant. Nele o
síndico publica comunicados/regras/enquetes no Mural, administra cobranças,
aprova ou recusa reservas solicitadas no app e responde a chamados abertos no
app. Mural e taxas são lidos pelo app; chamados e reservas mostram ao morador
somente os próprios registros. Não há processamento PIX/boleto.

As imagens de celular na LP são prévias visuais do produto. Os botões App Store
e Google Play permanecem indisponíveis até a publicação e configuração dos
links oficiais.

## Isolamento e limites atuais

O código de entrada resolve para um tenant ativo; o código não autentica nem
autoriza o morador. A sessão é comparada com associação de unidade provisionada
pelo síndico. Operações de gestão exigem Super Admin ou papel de síndico para
aquele tenant. Moradores veem cobranças da sua unidade, comunicados do
condomínio e somente suas próprias reservas e chamados.

O modo JSON padrão é destinado somente ao desenvolvimento/teste local: não
suporta concorrência entre processos, escala serverless, backup/replicação,
bloqueio distribuído de tentativas ou persistência de produção. O sistema
recusa esse modo em `NODE_ENV=production`, exceto pela demonstração temporária
explicitamente habilitada abaixo. Quando URL e chave pública Supabase estão configuradas, autenticação e dados
passam pelo Supabase. Se somente uma das duas existir, o app falha
explicitamente; não há fallback para JSON.

### Demonstração temporária na Vercel

É possível habilitar uma demonstração JSON separada antes da produção com
`CONSYS_DEMO_JSON=true` no ambiente Vercel. Essa exceção é aceita somente em
produção e somente sem variáveis Supabase configuradas. Os tenants iniciais
continuam sendo lidos de `dados_json/tenants.json`; os dados gravados pelo app
vão para `/tmp` e podem desaparecer em reinícios/deploys ou ficar diferentes
entre instâncias serverless. Não use para dados reais nem conte com persistência.

Configure no ambiente Vercel, como variáveis privadas:

- `DEMO_MANAGER_EMAIL`, `DEMO_MANAGER_PASSWORD` e `DEMO_MANAGER_NAME` para
  provisionar o síndico restrito ao condomínio `condominio-demo`. A senha deve
  ter ao menos 8 caracteres.
- `DEMO_SESSION_SECRET` com pelo menos 32 bytes gerados aleatoriamente. Essa
  chave assina o cookie de sessão demo para que os acessos funcionem em funções
  serverless diferentes; mantenha-a secreta e igual em Production/Preview.
- `DEMO_RESIDENT_EMAIL`, `DEMO_RESIDENT_PASSWORD`, `DEMO_RESIDENT_NAME` e
  `DEMO_RESIDENT_UNIT` para provisionar um morador de demonstração na unidade
  indicada. Use email diferente do síndico e senha com ao menos 8 caracteres.
  Para a demonstração combinada solicitada: `morador@consys.com`,
  `12345678`, `Morador Demonstração` e `Bloco A · 101`.
- `CONSYS_DEMO_JSON=true`.
- Não configure `NEXT_PUBLIC_SUPABASE_URL` nem
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` enquanto estiver usando a demo JSON.

O Super Admin global não é provisionado nem pode entrar no modo demo; isso
mantém a demonstração limitada ao condomínio de teste. As variáveis
`INITIAL_ADMIN_*` ficam para o ambiente local e para o futuro ambiente
administrativo de produção.

Após adicionar ou alterar `DEMO_SESSION_SECRET`, faça redeploy. Sem essa chave,
o login demo falha de forma explícita; não use senha de usuário como chave de
assinatura.

O síndico entra em `/admin/login`. O morador localiza
`condominio-demo@consys.com` em `/app` e entra em
`/condominio-demo/login` com as credenciais `DEMO_RESIDENT_*`. A senha
`12345678` é fraca e serve exclusivamente para o demo público; não a reutilize
em outros ambientes ou contas.

O modo de demonstração não é o ambiente de produção: a persistência JSON
compartilhada exige armazenamento externo ou um servidor com disco persistente.
Para produção, desative `CONSYS_DEMO_JSON` e implemente/configure Supabase
Auth, autorização e RLS antes do deploy.

## Supabase

O modo Supabase usa Supabase Auth SSR para login e sessão, PostgreSQL para
dados e RLS para o isolamento por tenant/unidade. A migration cria as tabelas
de condomínios, blocos, unidades, moradores, associações, solicitações,
cobranças, reservas, comunicados/enquetes, votos e chamados. RLS está habilitado
e as policies não confiam no tenant ou papel enviados pelo navegador.

Configure localmente em `.env.local` (nunca versione esse arquivo):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...
INITIAL_ADMIN_EMAIL=admin@seudominio.com
INITIAL_ADMIN_PASSWORD=use-uma-senha-forte-com-12-ou-mais-caracteres
INITIAL_ADMIN_NAME=Administrador ConSys
CONSYS_DEMO_JSON=false
```

A chave Publishable é própria para o cliente, mas não substitui RLS. A chave
`SUPABASE_SERVICE_ROLE_KEY` ignora RLS: mantenha-a somente no ambiente
server-side, nunca use prefixo `NEXT_PUBLIC_`, nunca a envie pelo chat e nunca
a use no navegador. Ela é necessária para provisionar contas via Auth Admin
durante a criação de síndicos e solicitações de moradores.

Para iniciar um projeto remoto vazio:

1. Aplique as migrations versionadas com Supabase CLI (`supabase db push`) ou
   pelo SQL Editor, revisando a migration antes de executar. Não crie tabelas
   manualmente em paralelo às migrations.
2. Configure as variáveis acima em `.env.local`.
3. Execute uma única vez `npm run db:bootstrap-admin` com um email válido e
   senha forte. O script falha se já houver Super Admin configurado.
4. Inicie `npm run dev`, entre em `/admin/login` e crie o condomínio e a conta
   do primeiro síndico.
5. Cadastre uma solicitação de morador em `/{slug}/cadastro`; após aprovação e
   definição da unidade pelo síndico, o acesso ao app fica ativo.

O bootstrap exige `SUPABASE_SERVICE_ROLE_KEY`, criada pelo próprio projeto.
Não cole esse segredo em issues, commits ou mensagens. Na Vercel, cadastre URL
e Publishable como variáveis públicas de configuração e a service role como
variável server-only; depois faça um novo deploy. Deixe
`CONSYS_DEMO_JSON=false` ou remova essa variável.

Com Docker instalado:

```bash
npm run db:start
npm run db:reset
npm run db:stop
```

O projeto remoto requer credenciais do proprietário para aplicar migrations;
nenhuma migration remota é aplicada automaticamente pelo app.

## Comandos úteis

```bash
npm run dev
npm run lint
npm test
npx tsc --noEmit
npm run build
```

## Deploy

A Vercel pode atender o modo Supabase depois de aplicar as migrations,
configurar variáveis e testar login de cada papel, isolamento entre dois tenants
e operações RLS no projeto remoto. Não execute migrations destrutivas
automaticamente no deploy. JSON permanece somente em desenvolvimento e no
modo de demo explicitamente habilitado.

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Decisões arquiteturais](./docs/DECISIONS.md)
- [Backlog](./docs/BACKLOG.md)
