# ConSys

Plataforma de gestão condominial da MabFy Systems. A landing page pública está
em `/`, o app do morador começa em `/app` e a administração geral fica em
`/admin`. Cada condomínio recebe um link próprio (`/{slug}`).

## Requisitos

- Node.js 20.9 ou superior e npm.
- Docker apenas se for executar Supabase local.

## Iniciar conectado ao Supabase

1. Instale as dependências:

   ```bash
   npm install
   ```

2. O projeto Supabase e a chave Publishable ficam configurados em
   `src/lib/supabase/config.ts`. A URL e a chave pública não precisam de
   variáveis de ambiente. Para operações administrativas que criam contas Auth,
   configure a service role somente no servidor:

   ```dotenv
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. Inicie a aplicação:

   ```bash
   npm run dev
   ```

4. Acesse:

   - LP ConSys: [http://localhost:3000](http://localhost:3000)
   - Painel administrativo:
     [http://localhost:3000/admin](http://localhost:3000/admin)
   - Login: contas cadastradas no Supabase Auth
   - Entrada do app do morador:
     [http://localhost:3000/app](http://localhost:3000/app)

O síndico entra em `/admin/login`; o morador usa `/app`.

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

Toda autenticação e persistência de dados da aplicação usam Supabase. Senhas
são verificadas pelo Supabase Auth e não podem ser recuperadas em texto puro.

## Supabase

O modo Supabase usa Supabase Auth SSR para login e sessão, PostgreSQL para
dados e RLS para o isolamento por tenant/unidade. A migration cria as tabelas
de condomínios, blocos, unidades, moradores, associações, solicitações,
cobranças, reservas, comunicados/enquetes, votos e chamados. RLS está habilitado
e as policies não confiam no tenant ou papel enviados pelo navegador.

URL do projeto e chave Publishable ficam em
`src/lib/supabase/config.ts`. Configure em `.env.local` apenas segredos e dados
do bootstrap, nunca versione esse arquivo:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=...
INITIAL_ADMIN_EMAIL=admin@seudominio.com
INITIAL_ADMIN_PASSWORD=use-uma-senha-forte-com-12-ou-mais-caracteres
INITIAL_ADMIN_NAME=Administrador ConSys
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
2. Configure a service role e os dados do Super Admin em `.env.local`.
3. Execute uma única vez `npm run db:bootstrap-admin` com um email válido e
   senha forte. O script falha se já houver Super Admin configurado.
4. Inicie `npm run dev`, entre em `/admin/login` e crie o condomínio e a conta
   do primeiro síndico.
5. Cadastre uma solicitação de morador em `/{slug}/cadastro`; após aprovação e
   definição da unidade pelo síndico, o acesso ao app fica ativo.

O bootstrap exige `SUPABASE_SERVICE_ROLE_KEY`, criada pelo próprio projeto.
Não cole esse segredo em issues, commits ou mensagens. A service role só é
necessária nas rotinas de provisionamento; cadastre-a na Vercel como segredo
server-only. URL e chave Publishable não precisam de variáveis na Vercel.

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

A Vercel conecta ao Supabase com URL e chave Publishable definidas no código.
Antes de produção, teste login de cada papel, isolamento entre tenants e
operações RLS no projeto remoto. Não execute migrations destrutivas
automaticamente no deploy.

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Decisões arquiteturais](./docs/DECISIONS.md)
- [Backlog](./docs/BACKLOG.md)
