# Backlog

## Próxima etapa — Segurança e armazenamento real

- Implementar Auth SSR Supabase e autorização por associação validada no banco.
- Criar RPC/policies RLS fail-closed para papel de plataforma e memberships.
- Criar bootstrap seguro do primeiro Super Admin no Supabase.
- Migrar o fluxo de síndicos e moradores para Auth/RLS Supabase.
- Avaliar código público independente do slug antes de abrir novos cadastros.
- Adicionar teste de rota e Server Action simulando adulteração de slug/IDs.
- Implementar verificação server-side para cada operação sensível e IDOR.
- Testar dois usuários e tenants distintos contra rotas e queries reais.
- Adicionar proteção de força bruta distribuída antes de publicar login.
- Planejar migração de JSON de desenvolvimento sem copiar segredos/sessões.

## Administração da plataforma

- Cadastro, edição, ativação e suspensão de organizações.
- Provisionamento de administradores e fluxo de recuperação de senha.

## Gestão condominial

- Dashboard com dados reais, condomínio, blocos, unidades e moradores.
- Listas paginadas com busca, filtros e feedback de formulário.
- Melhorar gestão de blocos/unidades com cadastro estruturado no painel.
- Migrar cobranças, reservas, enquetes e chamados do JSON para tabelas com RLS.
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
