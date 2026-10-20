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
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
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
explicitamente habilitada abaixo. Se qualquer configuração Supabase for
preenchida, JSON é desativado; o adaptador Supabase de autenticação e
autorização ainda precisa ser implementado antes dessa configuração.

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
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` devem ficar
  vazias/removidas até a migração para o modo Supabase.

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

Os clientes SSR e migrations relacionais estão preparados, mas as policies
RLS específicas, Auth e bootstrap Supabase ainda não foram implementados. A
migration habilita RLS sem policies permissivas. Não configure as variáveis
Supabase esperando que o modo JSON seja usado como fallback.

Com Docker instalado:

```bash
npm run db:start
npm run db:reset
npm run db:stop
```

Para o projeto remoto, configure o Supabase e aplique as migrations somente
após revisar as policies da etapa de segurança.

## Comandos úteis

```bash
npm run dev
npm run lint
npm test
npx tsc --noEmit
npm run build
```

## Deploy

A landing pode ser publicada na Vercel, mas o ambiente privado ainda não está
pronto para produção. Não habilite o login em produção com armazenamento JSON.
Antes de lançar, implemente e teste Auth Supabase, policies RLS, autorização
server-side e mitigação de tentativas de login; então configure o host `app`,
DNS e as variáveis Supabase. Não execute migrations destrutivas automaticamente
no deploy.

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Decisões arquiteturais](./docs/DECISIONS.md)
- [Backlog](./docs/BACKLOG.md)
