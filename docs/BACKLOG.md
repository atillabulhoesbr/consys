# Backlog

## Em andamento — Validação remota Supabase

- Migrations aplicadas; Super Admin global e tenant de teste verificados no
  Supabase.
- Login Supabase verificado para Super Admin, síndico e morador; morador
  aprovado e vinculado à unidade `A-101`.
- Investigar erro 500 intermitente no login administrativo do deployment
  `consys-hazel.vercel.app`; validar configuração de URL/chave pública e
  service role, além dos logs do deployment Vercel. A tela agora falha fechada
  e informa quando faltam as variáveis públicas.
- Testar login, aprovação de moradores e operações RLS com dois tenants e
  usuários distintos, inclusive tentativa de adulterar tenant/unidade.
- Adicionar teste de rota e Server Action simulando adulteração de slug/IDs.
- Implementar verificação server-side para cada operação sensível e IDOR.
- Adicionar proteção de força bruta distribuída antes de publicar login.
- Planejar migração de JSON de desenvolvimento sem copiar segredos/sessões.

## Administração da plataforma

- Edição, ativação e suspensão de organizações.
- Provisionamento de administradores e fluxo de recuperação de senha.

## Gestão condominial

- Dashboard com dados reais, condomínio, blocos, unidades e moradores.
- Listas paginadas com busca, filtros e feedback de formulário.
- Melhorar gestão de blocos/unidades com cadastro estruturado no painel.
- Completar gestão estruturada de blocos/unidades no painel para poder lançar
  cobranças de unidades ainda não vinculadas a moradores.
- Integrar PIX/boleto com um provedor somente após definição e credenciais.

## Aplicativo móvel

- Completar telas dedicadas de notificações, atas/assembleias e edição do perfil;
  a navegação inferior atual aponta para seções do app web simulado.
- Publicar apps nativos e configurar os links oficiais da App Store e Google
  Play na LP.
- Implementar notificações push para comunicados e solicitações aguardando
  aprovação/resposta.
- Substituir notificações visuais no painel por canal de email/push.
- Configurar senha temporária, recuperação e troca de senha para moradores.

## Validação final

- Testes de integração RLS e autenticação.
- Responsividade, acessibilidade, lint, tipos e build de produção.
- Deploy conectado ao Supabase, sem JSON em produção.
