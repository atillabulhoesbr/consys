# Decisões arquiteturais

## Aplicação e identidade

- O nome inicial do produto é ConSys. A raiz `/` apresenta uma landing page
  pública; o produto é acessado por `/{client}` e pode ser hospedado sob um
  subdomínio `app` configurado no DNS/deploy.
- Cada tenant tem UUID interno e código público de entrada como
  `residencial-modelo@consys.com`. O app resolve o código para tenant; o código
  não concede acesso. O servidor confere sessão e vínculo ao UUID.
- Um slug desconhecido, tenant suspenso ou usuário não associado não recebe
  conteúdo privado; a implementação responde como not found para não revelar
  detalhes de outros clientes.
- O primeiro Super Admin é provisionado por variáveis privadas de ambiente.
  Não existe senha padrão no código nem conta criada automaticamente sem
  configuração explícita.
- O painel global fica em `/admin`, com login próprio em `/admin/login`. A
  criação de organizações é uma Server Action que revalida o papel Super Admin.
- O Admin Geral cadastra condomínio e primeira conta de síndico no mesmo fluxo.
  O síndico pode gerir apenas o condomínio ao qual foi vinculado.
- O acesso web administrativo começa em `/admin/login` e usa email/senha, sem
  exigir código ou link do condomínio. Após autenticar, Admin Geral vai a
  `/admin`; síndico vai ao painel do único tenant ativo vinculado à conta.
- O código público do condomínio é solicitado somente no fluxo de entrada do
  app do morador (`/app`); não é credencial nem requisito para o painel web.
- Os slugs `admin`, `api`, `app` e `_next` são reservados para evitar colisões entre
  URLs de tenants e rotas internas da plataforma.
- O `.env.local` deste checkout fornece uma credencial fraca exclusivamente
  para teste de desenvolvimento. O arquivo é ignorado pelo Git; a senha não
  pode ser usada em ambiente compartilhado ou produção.

## Armazenamento temporário

- Enquanto Supabase não está configurado, desenvolvimento local usa JSON em
  `dados_json/`. Tenants de demonstração ficam em `tenants.json`; credenciais
  derivadas e sessões ficam em `runtime.json`, ignorado pelo Git.
- Senhas são armazenadas como scrypt com salt; sessões usam token aleatório
  HTTP-only e apenas seu hash é persistido.
- O modo JSON padrão é negado em produção, quando credenciais Supabase estão
  parcialmente configuradas, ou quando ambas estão configuradas mas o
  adaptador Supabase ainda não está pronto. Não há fallback silencioso.
- Exceção temporária para demonstração Vercel: `CONSYS_DEMO_JSON=true` permite
  runtime JSON em `/tmp/consys-demo-json` somente em produção sem Supabase. O
  runtime é efêmero e específico por instância serverless; a interface avisa
  sobre a ausência de persistência. `DEMO_MANAGER_*` provisiona um síndico
  limitado ao tenant de demonstração e não cria acesso Super Admin.
  `INITIAL_ADMIN_*` não são usados no demo. Esta exceção não representa suporte
  a JSON para produção real.
- JSON não é adequado a múltiplos processos/serverless; esta limitação é
  intencional e deve ser removida ao implementar Supabase.
- Organizações criadas pelo painel são guardadas no runtime JSON local e não
  são sincronizadas ao Supabase.
- Cobranças, reservas, comunicados/enquetes e chamados também são persistidos
  no JSON local. Moradores enviam pedidos de reserva e chamados pelo app; o
  síndico faz a gestão no painel. Comunicados e regras são publicados pelo
  síndico no Mural e exibidos no app. Cobranças permitem apenas registrar e
  baixar manualmente; PIX/boleto real depende de integração futura.
- Horários de reservas sobrepostos para o mesmo espaço/tenant não são aceitos.
  Enquetes limitam a um voto por usuário.
- Um cadastro de morador começa como solicitação pendente sem acesso. O síndico
  confirma a unidade ao aprovar; contas residentes recebem associação explícita
  ao tenant e unidade. A aprovação é o único caminho que cria esse vínculo.
- Unidades são códigos textuais no JSON provisório; moradores recebem apenas
  cobranças da unidade associada, seus próprios pedidos/chamados e conteúdo do
  tenant. Mutações administrativas exigem Super Admin ou síndico daquele tenant.

## Segurança incremental

- Validação de slug, leitura da sessão e checagem de associação ocorrem no
  servidor. A autorização não se baseia em campos do formulário nem no path
  sozinho.
- A conta Super Admin tem acesso global e é armazenada separadamente da
  associação de síndicos e moradores.
- RLS permanece habilitado e sem policies permissivas até a implementação da
  Etapa de segurança Supabase. Nenhuma migration remota foi executada.
- Verificações puras de acesso cobrem membership, tenant suspenso e slug
  inválido. Testes reais de integração entre tenants no backend escolhido
  ainda são necessários.

## Interface

- A LP simples do ConSys é a página pública `/`.
- O painel de gestão usa sidebar recolhível. O app do morador tem entrada por
  código do condomínio, pedido de cadastro, aprovação do síndico e telas de
  comunicados, taxas, reservas e chamados.
- Os mockups de celular na LP são ilustrações de interface do produto; badges
  das lojas são visuais e não clicáveis enquanto não existirem links oficiais.
- No mockup promocional, o telefone da esquerda usa uma câmera frontal em ponto
  circular no lugar do traço de alto-falante, diferenciando-o visualmente do
  iPhone à direita.
- O rodapé da LP usa uma faixa ampla verde-escura, com identidade da marca,
  links agrupados e assinatura institucional para encerrar a página com
  hierarquia visual consistente. O fundo do documento também usa esse verde
  somente na landing page, e o deslocamento elástico vertical nas extremidades
  é desabilitado para evitar que o rodapé suba ao forçar a rolagem. O rodapé
  permanece no fluxo normal da página e não cobre o conteúdo.
- CTAs de acesso da LP levam ao login web do síndico em `/admin/login`. O link
  separado **Acesse o app** abre a simulação web do morador em
  `/condominio-demo/login`; credenciais de demonstração ficam somente no
  runtime local, não são versionadas e não devem ser usadas fora do
  desenvolvimento.
- A identidade visual segue a referência enviada: superfícies claras e brancas,
  texto verde profundo, verde natural nos controles principais e lima como
  acento pontual. A interface evita fundo preto e gradientes neon para manter
  uma aparência acolhedora e familiar a usuários não técnicos.
- A referência orienta somente a paleta e a clareza dos componentes. A
  composição, ilustração de edifícios, conteúdo e navegação foram desenhados
  para gestão condominial e não reproduzem o layout ou telas da referência.
- As abas internas da referência são representadas por uma sidebar
  recolhível/responsiva, não por navbar horizontal. O conteúdo e a aparência
  foram adaptados ao ConSys e às operações condominiais.
- O app simulado do morador usa navegação inferior persistente com Início,
  Notificações, Assembleias e Perfil. Os destinos levam às áreas correspondentes
  na página; atas/assembleias exibem os comunicados dessa categoria ou um estado
  vazio até haver conteúdo. O cabeçalho não oferece ação de sair.
