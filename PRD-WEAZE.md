# PRD — Weaze

**Plataforma White-Label de Comunidades com Feed TikTok-Style**

| Versão | Data | Autor | Status |
|--------|------|-------|--------|
| 1.0 | 25/05/2026 | contatolistin-lab | Rascunho |

---

## 1. Resumo Executivo

Weaze é uma plataforma **white-label** que permite marcas e criadores (B2B) construírem e gerenciarem suas próprias comunidades com identidade visual personalizada. Os usuários finais (B2C) consomem conteúdo em um feed vertical estilo TikTok, interagem, ganham pontos e participam de discussões. A plataforma é mobile-first, habilitada como PWA, e funciona como uma "infraestrutura para comunidades".

**Taglines:** "Infraestrutura para comunidades" · "Sua Comunidade, Sua Marca"

---

## 2. Stack Tecnológica

### Vite/React (v1 — Produção)
| Camada | Tecnologia |
|--------|-----------|
| Framework | Vite 5.4 + React 18.3 + React Router DOM 6 |
| Estilização | Tailwind CSS 3.4 + shadcn/ui + Radix UI |
| Dados | TanStack React Query 5 + Supabase JS 2.104 |
| Formulários | react-hook-form + zod |
| Animação | Framer Motion 12 |
| Gráficos | Recharts 2.15 |
| Ícones | Lucide React |
| Data | date-fns |
| Testes | Vitest 3 + Testing Library |
| Gerenciador | bun |
| PWA | Service Worker customizado |
| Origem | Lovable.dev |

### Next.js (v2 — Reconstrução v0.dev)
| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 + React 19 + App Router |
| Estilização | Tailwind CSS 4 + OKLCH + tw-animate-css |
| Dados | TanStack React Query 5 + Zustand 5 + Supabase JS 2.106 |
| Formulários | react-hook-form + zod |
| Animação | Framer Motion 12 |
| Gráficos | Recharts 2.15 |
| Ícones | Lucide React |
| Deploy | Vercel + @vercel/analytics |
| Gerenciador | pnpm 11.3 |
| PWA | Manifest + Service Worker |
| Origem | v0.dev (Vercel AI) |

---

## 3. Público-Alvo

### B2B — Marcas e Criadores (Clientes)
- Donos de marca que querem criar comunidade própria
- Criadores de conteúdo que buscam monetizar engajamento
- Empresas com programa de fidelidade ou comunidade de clientes
- Profissionais de serviços (beleza, saúde, consultoria)

### B2C — Usuários Finais (Membros)
- Consumidores que seguem marcas/criadores
- Usuários que buscam conteúdo em formato vertical (TikTok-like)
- Membros de comunidades que participam ativamente

---

## 4. Funcionalidades

### 4.1 Autenticação e Usuários
- [x] Login/signup com email e senha (Supabase Auth)
- [x] Separação de papéis: B2B (creator/admin), B2C (member)
- [x] Perfil de usuário com avatar, bio, dados de contato
- [x] Recuperação de senha
- [x] Sessão persistente com refresh automático
- [x] Mock users para demonstração (admin/creator/member)

### 4.2 Multi-Tenant (White-Label)
- [x] Cada marca/creator possui um **tenant** (comunidade)
- [x] Personalização: logo, nome, cores primária/secundária
- [x] Slug único por comunidade (ex: `/c/minha-marca`)
- [x] Planos de assinatura por tenant
- [x] Métricas MRR por tenant
- [x] Ativação/desativação de tenants

### 4.3 Feed Vertical (TikTok-Style)
- [x] Feed de vídeo com scroll vertical e snap
- [x] Suporte a vídeo, imagem e texto
- [x] Botão de Call-to-Action (CTA) no post
- [x] Like, comentário e compartilhamento
- [x] Thumbnail e descrição personalizáveis
- [x] Posts fixados no topo

### 4.4 Sistema de Call-to-Action (CTA)
6 tipos de CTA disponíveis em posts:
| Tipo | Funcionalidade |
|------|---------------|
| **buy** | Link de compra externo |
| **schedule** | Agendamento de serviços (com availability_rules, blocked_dates) |
| **quote** | Solicitação de orçamento |
| **register** | Inscrição em eventos |
| **info** | Link informativo externo |
| **live** | Transmissão ao vivo (link externo) |

### 4.5 Fórum de Discussão (Tópicos)
- [x] Tópicos com título e descrição
- [x] Mensagens encadeadas com replies
- [x] Menções a usuários
- [x] Posts fixados e locked
- [x] Contagem de respostas e likes
- [x] Soft delete (edited_at / deleted_at)

### 4.6 Grupos
- [x] Grupos privados e internos
- [x] Posts exclusivos dentro de grupos
- [x] Replies em posts de grupo
- [x] Mensagens sistêmicas do grupo
- [x] Busca de membros do grupo
- [x] Membrosia com aprovação

### 4.7 Mensagens Diretas
- [x] Threads DM entre marca e usuário
- [x] Mensagens com suporte a edição e deleção
- [x] Mensagens em comunidade (chat comunitário)
- [x] Notificações de novas mensagens

### 4.8 Eventos
- [x] Criação de eventos com data, título e descrição
- [x] Limite de capacidade
- [x] Inscrição com formulário customizado (payload_json)
- [x] Registro de presença

### 4.9 Agendamento
- [x] Serviços com nome, duração e preço
- [x] Regras de disponibilidade por serviço
- [x] Datas bloqueadas
- [x] Agendamento com status: pending, confirmed, cancelled, completed

### 4.10 Gamificação
- [x] Pontos por ações de engajamento:
  - Like: 1 pt
  - Comentário: 2 pts
  - Reply: 3 pts
  - Receber reply: 5 pts
  - Participar de live: 10 pts
  - Clique em CTA: 2 pts
- [x] Ranking mensal e anual
- [x] Recompensas configuráveis por posição
- [x] Log de transações de pontos (auditável)
- [x] Limite de 100 pts por transação

### 4.11 Convites
- [x] Links de convite por comunidade
- [x] Tracking por campanha e ref
- [x] Eventos: visit, signup, login
- [x] Landing page de convite com preview da comunidade

### 4.12 Analytics e Métricas
- [x] Visão geral de KPIs
- [x] Receita (MRR por tenant)
- [x] Funil de CTA (visualizações → cliques → conversões)
- [x] Métricas de usuários
- [x] Métricas de conteúdo
- [x] Tracking de convites
- [x] View agregada `tenant_stats`

### 4.13 Notificações
- [x] Notificações in-app
- [x] Diferentes níveis de prioridade
- [x] Notificações de: novos seguidores, likes, comentários, mensagens, convites

### 4.14 Onboarding
- [x] Tour guiado para novos usuários
- [x] Estado de onboarding por usuário
- [x] Criação de marca durante onboarding

### 4.15 Solicitações de Entrada
- [x] Solicitação para entrar em comunidade
- [x] Aprovação/rejeição por admin
- [x] Status: pending, approved, rejected
- [x] Página de aprovação pendente (waiting)

### 4.16 PWA
- [x] Instalável como aplicativo mobile
- [x] Service Worker com cache management
- [x] Banner de instalação
- [x] Banner de atualização disponível
- [x] Página offline
- [x] Detecção de modo PWA

---

## 5. Estrutura do Banco de Dados (Supabase)

### 5.1 Tabelas Core
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (nome, email, avatar, bio, localização) |
| `tenants` | Comunidades de marca (nome, slug, logo, cores, plano, MRR) |
| `memberships` | Relação usuário-tenant (role: owner/admin/member, is_active) |
| `user_roles` | Papéis no sistema (admin, b2b, b2c) |

### 5.2 Tabelas de Conteúdo
| Tabela | Descrição |
|--------|-----------|
| `posts` | Posts de conteúdo (video/image/text, media_url, thumbnail, is_pinned) |
| `post_cta` | Call-to-action nos posts (buy, schedule, quote, register, info, live) |
| `interactions` | Ações do usuário (view, like, comment, click_cta, conversion) |
| `topics` | Tópicos de discussão (title, is_pinned, is_locked, replies_count) |
| `topic_messages` | Mensagens em tópicos (content, parent_id, likes_count, mentions) |

### 5.3 Tabelas de Comunicação
| Tabela | Descrição |
|--------|-----------|
| `message_threads` | Threads de DM entre marca e usuário |
| `messages` | Mensagens individuais (content, edited_at, deleted_at) |
| `community_messages` | Chat comunitário |

### 5.4 Tabelas de Grupos
| Tabela | Descrição |
|--------|-----------|
| `groups` | Grupos (private/internal) |
| `group_members` | Membros do grupo |
| `group_posts` | Posts dentro de grupos |
| `group_replies` | Replies em posts de grupo |
| `group_system_messages` | Notificações sistêmicas |

### 5.5 Tabelas de Agendamento
| Tabela | Descrição |
|--------|-----------|
| `services` | Serviços (nome, duração, preço) |
| `appointments` | Agendamentos (status, data, cliente) |
| `availability_rules` | Regras de disponibilidade |
| `blocked_dates` | Datas bloqueadas |
| `appointment_cta` | Configuração de CTA de agendamento |
| `appointment_requests` | Solicitações de agendamento |

### 5.6 Tabelas de Comércio
| Tabela | Descrição |
|--------|-----------|
| `quotes` | Solicitações de orçamento |
| `budget_requests` | Pedidos de orçamento |

### 5.7 Tabelas de Gamificação
| Tabela | Descrição |
|--------|-----------|
| `user_engagement_points` | Pontos por usuário/tenant (total, mensal, anual) |
| `engagement_logs` | Log auditável de transações |
| `tenant_rewards` | Recompensas configuráveis |

### 5.8 Tabelas Auxiliares
| Tabela | Descrição |
|--------|-----------|
| `invite_link_events` | Tracking de convites (visit, signup, login) |
| `usage_tracking` | Métricas mensais de uso |
| `notifications` | Notificações in-app |
| `community_requests` | Solicitações de entrada |
| `onboarding_state` | Estado do onboarding |
| `events` | Eventos da comunidade |
| `event_registrations` | Inscrições em eventos |

### 5.9 Views
| View | Descrição |
|------|-----------|
| `tenant_stats` | Estatísticas agregadas por tenant |
| `users` | View básica de usuários |

### 5.10 Enums
| Enum | Valores |
|------|---------|
| `app_role` | admin, b2b, b2c |
| `tenant_role` | owner, member, admin |
| `post_type` | video, image, text |
| `cta_type` | buy, schedule, quote, register, info, live |
| `interaction_type` | view, like, comment, click_cta, conversion |
| `appointment_status` | pending, confirmed, cancelled, completed |

### 5.11 RPC Functions
| Função | Descrição |
|--------|-----------|
| `award_engagement_points` | Conceder pontos de engajamento |
| `get_monthly_ranking` / `get_yearly_ranking` | Leaderboard |
| `get_user_engagement_stats` | Estatísticas individuais |
| `is_tenant_member` / `is_tenant_owner` | Verificação de segurança |
| `has_role` | Verificação de papel |
| `approve/reject_community_member` | Gerenciar solicitações |
| `request_community_join` | Solicitar entrada |
| `get_pending_members` | Solicitações pendentes |
| `search_group_members` | Buscar membros do grupo |
| `get_profiles_by_ids` | Buscar perfis em lote |

---

## 6. Rotas e Páginas

### 6.1 Next.js (v2 — v0.dev)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Landing | Página de marketing |
| `/login` | Login | Autenticação |
| `/signup` | Signup | Cadastro |
| `/app` | Feed | Feed TikTok-style |
| `/app/communities` | Comunidades | Lista de comunidades |
| `/app/conversas` | Fórum | Tópicos de discussão |
| `/app/create` | Criar | Criação de conteúdo |
| `/app/events` | Eventos | Eventos da comunidade |
| `/app/groups` | Grupos | Gerenciar grupos |
| `/app/lives` | Lives | Transmissões ao vivo |
| `/app/members` | Membros | Gerenciar membros |
| `/app/messages` | Mensagens | DM |
| `/app/metrics/*` | Analytics | Dashboard de métricas |
| `/app/notifications` | Notificações | Central de notificações |
| `/app/profile` | Perfil | Perfil do usuário |
| `/app/ranking` | Ranking | Leaderboard de gamificação |
| `/app/requests` | Solicitações | Solicitações de entrada |
| `/app/settings` | Configurações | Ajustes do usuário |
| `/invite/:slug` | Convite | Landing page de convite |
| `/c/:slug` | Comunidade | Página da comunidade |
| `/m/:slug` | Mobile | Versão mobile da comunidade |
| `/onboarding` | Onboarding | Tour guiado |
| `/blocked` | Bloqueado | Conta bloqueada |
| `/waiting` | Aguardando | Aprovação pendente |
| `/offline` | Offline | Fallback offline |

### 6.2 Vite/React (v1 — Lovable)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Landing | Marketing |
| `/auth` | Auth | Login/signup |
| `/auth/b2b` | Auth B2B | Cadastro para creators |
| `/feed` | Feed | Feed TikTok-style |
| `/messages` | Mensagens | DM |
| `/conversas` | Fórum | Tópicos |
| `/create` | Criar | Criar conteúdo |
| `/notifications` | Notificações | Central |
| `/profile` | Perfil | Perfil |
| `/members` | Membros | Gerenciar (B2B) |
| `/requests` | Solicitações | Aprovar (B2B) |
| `/groups` | Grupos (B2B) | Gerenciar |
| `/groups/b2c` | Grupos (B2C) | Listar |
| `/communities` | Comunidades | Lista (B2B) |
| `/community/:slug` | Comunidade | Página |
| `/community` | Chat | Chat comunitário |
| `/onboarding` | Onboarding | Tour |
| `/metrics/*` | Analytics | Dashboard |
| `/invite/:slug` | Convite | Landing |
| `/admin` | Admin | Superadmin |
| `/offline` | Offline | Fallback |
| `/blocked` | Bloqueado | Conta bloqueada |
| `/waiting` | Aguardando | Aprovação |

---

## 7. Casos de Uso

### 7.1 Criador (B2B)
1. Se cadastra como creator
2. Cria sua comunidade (tenant) com branding personalizado
3. Publica conteúdo (vídeo, imagem, texto) com CTAs
4. Gerencia membros e solicitações de entrada
5. Visualiza métricas de engajamento e receita
6. Cria grupos privados e tópicos de discussão
7. Configura agendamento de serviços
8. Cria eventos e campanhas de convite
9. Acompanha ranking de engajamento

### 7.2 Membro (B2C)
1. Entra em uma comunidade via convite
2. Navega pelo feed vertical
3. Interage (like, comenta, compartilha)
4. Clique em CTAs (compra, agenda, orçamento, inscrição)
5. Participa de discussões e grupos
6. Ganha pontos e sobe no ranking
7. Envia mensagens diretas para a marca
8. Recebe notificações

---

## 8. Arquitetura de Segurança

### RLS (Row-Level Security)
- Todas as tabelas possuem políticas RLS
- Funções `security definer` para operações críticas
- Revogação de execute de anon/public/authenticated em RPCs sensíveis
- Verificação de pertencimento ao tenant (`is_tenant_member`)
- Verificação de ownership (`is_tenant_owner`)

### Autenticação
- Supabase Auth com email/senha
- Refresh automático de token (15s timeout)
- Limpeza de sessão em falha de refresh
- Reconexão após visibilidade oculta (>60s)

---

## 9. UX e Design

### Temas e Cores
- Vite/React: HSL com tema claro
- Next.js: OKLCH com suporte a dark mode
- Cores personalizáveis por tenant (primary, secondary)
- shadcn/ui como design system base

### Mobile-First
- Bottom navigation com papéis B2B/B2C
- Feed vertical com snap scroll (TikTok-style)
- PWA instalável como app nativo
- Sidebar para desktop (admin)

### Componentes Compartilhados
- PWAInstallButton e UpdateBanner
- RankingSection com medalhas
- BrandInsights para métricas
- OnboardingTour interativo
- ErrorBoundary e AppEntrance
- Logo e NavLink

---

## 10. Métricas e KPIs

### Por Tenant
| Métrica | Fonte |
|---------|-------|
| Total de membros | memberships |
| Posts publicados | posts |
| Interações (views, likes, comments) | interactions |
| Cliques em CTA | interactions (click_cta) |
| Conversões | interactions (conversion) |
| MRR | tenants.mrr |
| Pontos distribuídos | engagement_logs |
| Convites aceitos | invite_link_events |

### Dashboard (Analytics)
- Overview: KPIs principais
- Revenue: Receita por tenant/período
- Funnel: Visualização → Clique → Conversão
- Users: Crescimento e retenção
- Content: Performance de posts
- Invites: Tracking de convites

---

## 11. Deploy e Ambiente

### Vite/React (Produção)
- Supabase: `https://ticixyoejcokkroqtwce.supabase.co`
- Build: `bun run build` (com bump de cache + geração de ícones)
- Servidor dev: Vite porta 8080

### Next.js (v0.dev)
- Supabase: configurável via `.env.local`
- Build: `pnpm build`
- Deploy: Vercel
- Analytics: @vercel/analytics
- Projeto v0: `prj_NWkow2zEi5EXu1dXwye8aB7l4BgU`

---

## 12. Roadmap Sugerido

### Fase 1 — Estabilização (Atual)
- [ ] Unificar as duas bases de código (Vite + Next)
- [ ] Completar migrações do banco no Next.js
- [ ] Substituir dados mock por dados reais
- [ ] Corrigir integração com v0.dev (bi-directional sync)

### Fase 2 — Melhorias
- [ ] Upload de mídia (vídeo, imagem) para o storage
- [ ] Dark mode completo
- [ ] Notificações push
- [ ] Moderação de conteúdo

### Fase 3 — Expansão
- [ ] Planos de pagamento por tenant
- [ ] API pública para integrações
- [ ] Aplicativo nativo (React Native)
- [ ] Live streaming nativo (não apenas link externo)
- [ ] IA para moderação e recomendações

---

## 13. Referências

- Repositório GitHub: `github.com/contatolistin-lab/v0-reconstrucao-weaze`
- Projeto v0.dev: `https://v0.app/chat/projects/prj_NWkow2zEi5EXu1dXwye8aB7l4BgU`
- Projeto original (Lovable): `C:\Users\expre\OneDrive\Área de Trabalho\projeto weaze`
- Supabase Dashboard: `https://supabase.com/dashboard/project/ticixyoejcokkroqtwce`
