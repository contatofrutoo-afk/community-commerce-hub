# WEAZE — PRD Visual

> **Plataforma social de comunidades entre marcas e pessoas**
> Documento de produto para implementação no FlutterFlow
> Versão 1.0 — Maio 2026

---

## Índice

1. [Identidade Visual](#1-identidade-visual)
2. [Design System](#2-design-system)
3. [Estrutura de Navegação](#3-estrutura-de-navegação)
4. [Landing Page](#4-landing-page)
5. [Autenticação](#5-autenticação)
6. [Feed Principal](#6-feed-principal)
7. [Comunidades](#7-comunidades)
8. [Perfil B2C](#8-perfil-b2c)
9. [Perfil B2B / Marca](#9-perfil-b2b--marca)
10. [Grupos](#10-grupos)
11. [Mensagens](#11-mensagens)
12. [Notificações](#12-notificações)
13. [Criação de Conteúdo](#13-criação-de-conteúdo)
14. [Admin / Gestão B2B](#14-admin--gestão-b2b)
15. [Componentes](#15-componentes)
16. [Estados e Comportamentos](#16-estados-e-comportamentos)
17. [Responsividade](#17-responsividade)
18. [Animações e Micro-interações](#18-animações-e-micro-interações)
19. [Fluxos Completos](#19-fluxos-completos)

---

## 1. Identidade Visual

### 1.1 Marca

| Atributo | Valor |
|---|---|
| Nome | WEAZE |
| Tagline | *Sua comunidade, seu jeito* |
| Tom | Jovem, moderno, premium, acolhedor |
| Público | 16–40 anos, criadores de conteúdo, comunidades de nicho |

### 1.2 Paleta de Cores

```
Preto Profundo    #0D0D0D  — fundo principal
Cinza Grafite     #1A1A2E  — cards, superfícies
Cinza Médio       #2D2D44  — bordas, separadores
Cinza Suave       #6B6B80  — texto secundário
Branco Suave      #F5F5F7  — texto primário
Branco Muted      #A0A0B0  — texto terciário

Roxo Neon         #7C3AED  — primary, CTAs, destaque
Roxo Claro        #A78BFA  — hover, glow
Roxo Escuro       #5B21B6  — pressed, active

Azul Vibrante     #3B82F6  — secondary, links
Azul Claro        #60A5FA  — hover

Verde Sucesso     #10B981  — online, sucesso
Vermelho Alerta   #EF4444  — erro, notificação
Amarelo Destaque  #F59E0B  — warning, badge
```

### 1.3 Tipografia

| Elemento | Fonte | Peso | Tamanho (mobile) |
|---|---|---|---|
| Display (títulos grandes) | Satoshi / Inter | Black 900 | 32–40px |
| Headings | Satoshi / Inter | Bold 700 | 20–28px |
| Subheadings | Satoshi / Inter | SemiBold 600 | 16–18px |
| Body | Inter | Regular 400 | 14–16px |
| Caption | Inter | Medium 500 | 12–13px |
| Tiny | Inter | Regular 400 | 10–11px |

### 1.4 Iconografia

- Estilo: Lucide / Feather — linhas finas, consistentes
- Tamanhos: 16px (inline), 20px (ui), 24px (navegação), 32px (destaque)
- Cor: herda do texto do elemento, exceto ícones de navegação ativa (roxo neon)

### 1.5 Espaçamento

Sistema de 4px:

| Token | px | Uso |
|---|---|---|
| `space-1` | 4 | Micro espaçamento |
| `space-2` | 8 | Ícone/texto |
| `space-3` | 12 | Cards internos |
| `space-4` | 16 | Padding cards |
| `space-5` | 20 | Seções |
| `space-6` | 24 | Margens |
| `space-8` | 32 | Seções grandes |
| `space-10` | 40 | Hero sections |
| `space-12` | 48 | Page padding |

### 1.6 Bordas e Cantos

| Token | Raio | Uso |
|---|---|---|
| `radius-sm` | 6px | Inputs, chips |
| `radius-md` | 12px | Cards, modais |
| `radius-lg` | 16px | Bottom sheets, containers |
| `radius-xl` | 24px | Cards de destaque |
| `radius-full` | 999px | Avatares, badges |

### 1.7 Sombras

| Token | Mobile | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | Cards elevados |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Modais |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Bottom sheets |
| `shadow-glow` | `0 0 20px rgba(124,58,237,0.3)` | Destaque roxo |

---

## 2. Design System

### 2.1 Botões

#### Primary Button
```
Fundo: Roxo Neon #7C3AED
Texto: Branco #FFFFFF
Padding: 16px horizontal, 14px vertical
Border radius: 12px
Font: SemiBold 16px
Ícone: opcional 20px à esquerda

Estados:
  Default:  #7C3AED
  Hover:    #8B5CF6 + shadow-glow
  Pressed:  #6D28D9
  Disabled: #2D2D44 + texto #6B6B80
  Loading:  spinner branco substitui texto
```

#### Secondary Button
```
Fundo: Transparente
Borda: 1.5px solid #7C3AED
Texto: #7C3AED
Padding: 16px horizontal, 14px vertical
Border radius: 12px

Estados:
  Default:  borda #7C3AED
  Hover:    fundo #7C3AED20 (12% opacidade)
  Pressed:  fundo #7C3AED30
```

#### Ghost Button
```
Fundo: Transparente
Texto: #A0A0B0
Padding: 12px horizontal, 10px vertical
Border radius: 10px

Estados:
  Default:  texto #A0A0B0
  Hover:    fundo #FFFFFF10 + texto #F5F5F7
  Pressed:  fundo #FFFFFF15
```

#### Icon Button
```
Tamanho: 40x40px ou 48x48px
Ícone: 20–24px
Fundo: Transparente
Border radius: 12px

Estados:
  Default:  ícone #A0A0B0
  Hover:    fundo #FFFFFF10
  Pressed:  fundo #FFFFFF15
  Active:   ícone #7C3AED
```

### 2.2 Inputs

#### Text Input
```
Fundo: #1A1A2E
Borda: 1.5px solid #2D2D44
Texto: #F5F5F7 (14px Regular)
Placeholder: #6B6B80 (14px Regular)
Label: #A0A0B0 (12px Medium, acima)
Padding: 14px 16px
Border radius: 12px

Estados:
  Default:  borda #2D2D44
  Focus:    borda #7C3AED + glow sutil
  Error:    borda #EF4444
  Success:  borda #10B981
  Disabled: fundo #0D0D0D, texto #6B6B80
```

#### Search Bar
```
Ícone: lupa 18px à esquerda
Placeholder: "Buscar comunidades..."
Mesmo estilo do Text Input
Altura fixa: 44px
```

### 2.3 Avatares

| Tamanho | px | Uso |
|---|---|---|
| `avatar-xs` | 24px | Badges, listas |
| `avatar-sm` | 32px | Comentários |
| `avatar-md` | 40px | Feed, chat |
| `avatar-lg` | 56px | Perfil, cards |
| `avatar-xl` | 80px | Tela de perfil |
| `avatar-xxl` | 120px | Banner de comunidade |

Borda: 2px `#2D2D44` (padrão), 2px `#7C3AED` (online/story)

### 2.4 Cards

#### Post Card (Feed)
```
Fundo: #1A1A2E
Border radius: 16px
Overflow: hidden
Largura: 100% no mobile
Altura: 100dvh (fullscreen no mobile)
Layout: vertical flex column

Camadas (de cima para baixo):
  1. Mídia (vídeo/imagem) — fill, aspect-ratio automático
  2. Gradient overlay (preto 0% → preto 80%) na base
  3. Informações sobrepostas:
     - Avatar comunidade (32px) + Nome + · + Tempo
     - Descrição do post (2 linhas max)
     - Action row: Curtir · Comentar · Compartilhar · CTA
```

#### Community Card
```
Fundo: #1A1A2E
Border radius: 16px
Padding: 20px
Layout: horizontal (avatar + info) + botão

  - Banner opcional (topo, 80px altura, border-radius 16px 16px 0 0)
  - Avatar 56px
  - Nome (18px Bold)
  - Descrição (14px Regular, 2 linhas)
  - Tags/Chips (categoria)
  - Botão "Entrar" ou "Participando" (status toggle)
```

#### Group Card
```
Mesmo estilo Community Card, com:
  - Badge de privacidade (🔒 Privado / 🌐 Público)
  - Contador de membros
  - Última atividade (relative time)
```

### 2.5 Loaders / Skeleton

#### Skeleton Feed
```
Placeholder de post inteiro:
  - Retângulo 100% x 60% (mídia)
  - Círculo 32px (avatar)
  - Linha 60% width (nome)
  - Linha 40% width (descrição)
  - 3 círculos 24px (ações)

Animação: shimmer — gradiente animado left-to-right
Cores do shimmer: #1A1A2E → #2D2D44 → #1A1A2E
```

#### Skeleton Card
```
Placeholder de community card:
  - Retângulo 56x56px (avatar)
  - Linha 70% (nome)
  - Linha 50% (descrição)
  - Retângulo arredondado 80x32px (botão)
```

### 2.6 Modais e Bottom Sheets

#### Modal Padrão
```
Overlay: preto 70%
Fundo: #1A1A2E
Border radius: 20px (topo) no mobile
Padding: 24px
Largura: 90% no mobile, 480px no desktop
Altura: auto (max 80vh com scroll)
Drag indicator: barra 32x4px #2D2D44 no topo (mobile)
```

#### Bottom Sheet
```
Fundo: #1A1A2E
Border radius: 24px (topo apenas)
Altura: auto (max 90vh)
Drag: swipe down para fechar
Padding: 24px
```

---

## 3. Estrutura de Navegação

### 3.1 Mobile — Bottom Navigation

```
┌──────────────────────────────────────┐
│                                      │
│              (CONTEÚDO)              │
│                                      │
├──────────────────────────────────────┤
│  🏠    🔍    ➕    💬    👤         │
│ Feed  Buscar  Criar  Msgs  Perfil   │
│                                      │
└──────────────────────────────────────┘
```

- Altura: 64px (incluindo safe-area bottom)
- Fundo: #0D0D0D com blur 10px no topo
- Ícones ativos: #7C3AED + indicador (dot 4px)
- Ícones inativos: #6B6B80
- Transição: fade + slide up (300ms)
- Rótulos: 10px Medium, margin-top 4px

### 3.2 Desktop — Sidebar

```
┌──────┬──────────────────────┬────────┐
│      │                      │        │
│  🏠  │                      │ 🤝   │
│ Feed │                      │ Comun. │
│      │                      │ em      │
│  🔍  │                      │ destaq.│
│ Busca│     CONTEÚDO         │        │
│      │     CENTRAL          │ 🎯   │
│  ➕  │                      │ CTA    │
│ Criar│                      │        │
│      │                      │ 📊   │
│  💬  │                      │ Stats  │
│ Msgs │                      │        │
│      │                      │        │
│  👤  │                      │        │
│ Perf │                      │        │
│      │                      │        │
├──────┴──────────────────────┴────────┤
│         Top Bar (breadcrumb)         │
└──────────────────────────────────────┘
```

**Sidebar Esquerda:**
- Largura: 240px
- Fundo: #0D0D0D com borda direita 1px #2D2D44
- Logo no topo (32px padding)
- Itens de navegação com tooltip e highlight
- Avatar do usuário no canto inferior

**Painel Direito (opcional):**
- Largura: 300px
- Fundo: #1A1A2E
- Bordas arredondadas
- Comunidades em destaque
- Sugestões
- CTA "Criar comunidade"

### 3.3 Header / Top Bar

```
┌──────────────────────────────────────┐
│  ← Voltar    Título     🔔 ➕ ⋮    │
└──────────────────────────────────────┘
```

- Altura: 56px (mobile)
- Fundo: transparente com blur (no scroll) ou #0D0D0D
- Título: 18px SemiBold
- Ícones de ação à direita
- Seta de voltar à esquerda (quando aplicável)
- Só aparece em telas secundárias (não no feed)

---

## 4. Landing Page

### 4.1 Estrutura Geral

Layout mobile-first, seções empilhadas verticalmente, cada uma ocupando viewport height ou mais.

### 4.2 Hero Section

```
┌──────────────────────────────────────┐
│                                      │
│     ┌────────────────────┐          │
│     │   WEAZE            │          │
│     │   (logo 180px)     │          │
│     └────────────────────┘          │
│                                      │
│   Sua comunidade,                    │
│   seu jeito                          │
│                                      │
│   Crie sua comunidade em segundos    │
│   e conecte-se com quem importa.     │
│                                      │
│  ┌──────────────────┐               │
│  │  Criar comunidade │               │
│  └──────────────────┘               │
│                                      │
│  ┌──────────────────┐               │
│  │  Explorar         │               │
│  └──────────────────┘               │
│                                      │
│    ↓ Role para descobrir            │
│                                      │
└──────────────────────────────────────┘
```

**Elementos visuais:**
- Fundo: gradiente #0D0D0D → #1A1A2E com partículas flutuantes (círculos roxos translúcidos em movimento)
- Logo centralizado, 180px
- Headline: Display 40px Black, gradiente roxo-branco
- Subheadline: Body 18px, #A0A0B0
- Dois CTAs empilhados: Primary "Criar comunidade", Secondary "Explorar"
- Animação: fade-in progressivo com 300ms de delay entre elementos
- Fundo com grid pattern sutil (linhas 1px #FFFFFF05)

### 4.3 Preview do Feed

```
┌──────────────────────────────────────┐
│   Como funciona                      │
│                                      │
│  ┌────────────────────────────┐     │
│  │                            │     │
│  │   ▶️ Preview do Feed       │     │
│  │   (mockup animado)         │     │
│  │                            │     │
│  │   🎥 Vídeo vertical        │     │
│  │   scrollando              │     │
│  │                            │     │
│  │   👤 Marca · há 2h        │     │
│  │   "Conteúdo incrível..."  │     │
│  │   ♥️ 234  💬 12  📤 8     │     │
│  └────────────────────────────┘     │
│                                      │
│   Feed infinito de comunidades       │
│   Deslize, curta, conecte-se.        │
│                                      │
└──────────────────────────────────────┘
```

- Mockup de smartphone centralizado com feed rodando em loop
- Gradiente roxo na borda do mockup
- Abaixo: grid de 3 ícones com descrições (Feed, Comunidades, Mensagens)

### 4.4 Funcionalidades

Grid 2 colunas no mobile, 3 no desktop:

```
┌────────────┬────────────┐
│ 📹         │ 👥         │
│ Feed       │ Comunidades│
│ Infinito   │ Privadas   │
├────────────┼────────────┤
│ 💬         │ 📊         │
│ Mensagens  │ Analytics  │
│ Tempo real │ Para Marcas│
├────────────┼────────────┤
│ 🎯         │ 🔒         │
│ CTAs       │ Grupos     │
│ Inteligent.│ Exclusivos │
└────────────┴────────────┘
```

Cada card: ícone 32px roxo, título 16px Bold, descrição 14px Regular #A0A0B0, fundo #1A1A2E, border-radius 16px.

### 4.5 Planos / Pricing

Cards lado a lado (stack no mobile):

```
┌────────────┬────────────┬────────────┐
│ GRATUITO   │ PROFISSIONAL│ EMPRESARIAL│
│            │            │            │
│ R$ 0       │ R$ 29/mês  │ R$ 99/mês  │
│            │            │            │
│ Feed       │ Feed +    │ Tudo do    │
│ Básico     │ Analytics  │ Pro +      │
│ 1 Comuni.  │ Ilimitado  │ Prioridade │
│            │ Lives      │ API        │
│            │ CTAs       │ Suporte VIP│
│            │            │            │
│ [Começar]  │ [Assinar]  │ [Falar]    │
└────────────┴────────────┴────────────┘
```

Card destacado (Profissional): borda roxa 2px, badge "Popular", glow sutil.

### 4.6 FAQ

Acordeão estilizado:
- Fundo do item: #1A1A2E
- Padding: 16px 20px
- Border radius: 12px entre itens
- Espaçamento: 8px entre itens
- Seta animada (180º ao abrir)
- Transição de altura suave (300ms ease)

### 4.7 Footer

```
┌──────────────────────────────────────┐
│   WEAZE © 2026                       │
│                                      │
│   Produto   ·   Empresa   ·   Ajuda  │
│   Termos    ·   Privacidade          │
│                                      │
│   Feito com 💜 para comunidades     │
└──────────────────────────────────────┘
```

---

## 5. Autenticação

### 5.1 Auth B2C

#### Tela de Login

```
┌──────────────────────────────────────┐
│                                      │
│          ┌────────────┐              │
│          │   WEAZE    │              │
│          │  (120px)   │              │
│          └────────────┘              │
│                                      │
│   Entrar                             │
│                                      │
│   Email                              │
│   ┌──────────────────────────┐      │
│   │  seu@email.com           │      │
│   └──────────────────────────┘      │
│                                      │
│   Senha                              │
│   ┌──────────────────────────┐      │
│   │  ••••••••••             │ 👁️  │
│   └──────────────────────────┘      │
│                                      │
│   Esqueceu a senha?                  │
│                                      │
│  ┌──────────────────────────┐       │
│  │  Entrar                   │       │
│  └──────────────────────────┘       │
│                                      │
│   ─── ou ───                        │
│                                      │
│   Não tem conta? Criar conta         │
│                                      │
│   ┌──────────────────────────┐      │
│   │  Sou uma marca           │      │
│   └──────────────────────────┘      │
│                                      │
└──────────────────────────────────────┘
```

**Elementos:**
- Fundo: gradiente sutil #0D0D0D → #1A1A2E com bolhas roxas decorativas
- Logo no topo, 120px
- Tabs "Entrar" | "Criar conta" (estilo segment control)
- Campos com ícones à esquerda
- Eye toggle na senha
- Botão "Sou uma marca" navega para /auth/b2b
- Loading state: botão desabilita + spinner

#### Tela de Cadastro

```
┌──────────────────────────────────────┐
│   ← Voltar                          │
│                                      │
│   Criar conta                        │
│                                      │
│   ┌────────────────────────────┐    │
│   │  👤  Nome                  │    │
│   └────────────────────────────┘    │
│                                      │
│   ┌────────────────────────────┐    │
│   │  📧  Email                 │    │
│   └────────────────────────────┘    │
│                                      │
│   ┌────────────────────────────┐    │
│   │  🔒  Senha                 │    │
│   └────────────────────────────┘    │
│                                      │
│   ┌────────────────────────────┐    │
│   │  🔒  Confirmar senha       │    │
│   └────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Criar conta                 │   │
│  └──────────────────────────────┘   │
│                                      │
│   Já tem conta? Entrar              │
│                                      │
└──────────────────────────────────────┘
```

- Validação visual inline (check verde / X vermelho)
- Progresso visual: barra sutil no topo com 4 steps (Dados → Verificar → Pronto)
- Password strength indicator abaixo da senha

### 5.2 Auth B2B (Fluxo Separado)

Visualmente idêntico ao B2C, mas com badge "Marca" no topo e campos adicionais:

```
┌──────────────────────────────────────┐
│   ← Voltar                          │
│                                      │
│   ┌────────────────────┐            │
│   │ 🏢 Sou uma marca   │            │
│   └────────────────────┘            │
│                                      │
│   Criar conta de marca              │
│                                      │
│   ┌────────────────────────────┐    │
│   │  🏢  Nome da marca         │    │
│   └────────────────────────────┘    │
│                                      │
│   ┌────────────────────────────┐    │
│   │  📧  Email                 │    │
│   └────────────────────────────┘    │
│                                      │
│   ┌────────────────────────────┐    │
│   │  🔒  Senha                 │    │
│   └────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Criar conta da marca        │   │
│  └──────────────────────────────┘   │
│                                      │
│   É usuário? Entrar                 │
│                                      │
└──────────────────────────────────────┘
```

**Após cadastro B2B:** redirecionar para feed vazio com CTA "Faça sua primeira postagem" — NUNCA mostrar tela B2C.

### 5.3 Recuperar Senha

```
┌──────────────────────────────────────┐
│   ← Voltar                          │
│                                      │
│   Recuperar senha                    │
│                                      │
│   Digite seu email para receber      │
│   o link de recuperação.            │
│                                      │
│   ┌────────────────────────────┐    │
│   │  seu@email.com             │    │
│   └────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Enviar link                 │   │
│  └──────────────────────────────┘   │
│                                      │
│   Estado de sucesso:                 │
│   ✅ Email enviado!                 │
│   Verifique sua caixa de entrada.   │
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Feed Principal

### 6.1 Estrutura Mobile

```
┌──────────────────────────────────────┐
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │     🎥 / 📷                 │   │
│  │     POST VERTICAL            │   │
│  │     FULLSCREEN               │   │
│  │                              │   │
│  │                              │   │
│  │                              │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  ░ GRADIENT OVERLAY ░░░░░  │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │                              │   │
│  │  👤  MarcaXYZ · há 2h      │   │
│  │  "Descrição do post aqui    │   │
│  │   com até 2 linhas..."      │   │
│  │                              │   │
│  │  ♥ 234  💬 12  📤 8  🎯    │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│        • • • (indicador página)      │
│                                      │
├──────────────────────────────────────┤
│  🏠    🔍    ➕    💬    👤        │
└──────────────────────────────────────┘
```

**Comportamento:**
- Scroll vertical, snap por post (cada post = viewport cheia)
- Swipe up/down para navegar entre posts
- Tap na área de vídeo: pause/play
- Tap no avatar: navega para perfil da comunidade
- Long press no post: share sheet
- Duplo tap: like (com animação de coração)
- Ações à direita (like, comment, share) — alinhadas verticalmente

### 6.2 Post Card — Componente

```
┌──────────────────────────────────────┐
│                                      │
│  ┌──────────────────────────────┐   │
│  │  ▶️ CROP FILL                │   │
│  │  MÍDIA (VÍDEO/IMAGEM)       │   │
│  │                              │   │
│  │                              │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ─── OVERLAY INFERIOR ───           │
│                                      │
│  ┌────────────────────────┐         │
│  │ 👤 MarcaXYZ · 2h      │  📌    │
│  │ "Descrição do post..." │         │
│  │                        │         │
│  │ ♥ 234  💬 12  📤 8   │         │
│  └────────────────────────┘         │
│                                      │
│  ─── ACTION ROW LATERAL ───         │
│                                      │
│  ┌──┐                               │
│  │ ♥ │  234                         │
│  ├──┤                               │
│  │ 💬│  12                          │
│  ├──┤                               │
│  │ 📤│  8                           │
│  ├──┤                               │
│  │ 🎯│  Comprar                     │
│  └──┘                               │
│                                      │
└──────────────────────────────────────┘
```

**Especificação:**

- **Container:** altura = 100dvh, scroll snap start, fundo #0D0D0D
- **Mídia:** object-fit cover, fill width, fill height
- **Overlay inferior:** gradiente linear (0% transparente → 100% #0D0D0D), altura 40% do card
- **Avatar comunidade:** 40px, borda 2px #7C3AED, clique → perfil
- **Nome comunidade:** 14px Bold #FFFFFF
- **Tempo:** 12px Regular #A0A0B0
- **Descrição:** 14px Regular #F5F5F7, max 2 linhas, ellipsis
- **Ações laterais:** 44px de largura, padding 8px, ícones 28px
- **CTA:** botão destaque 44px, roxo, "Comprar" ou "Agendar" ou "Saiba mais"

### 6.3 Estados do Feed

#### Loading (primeira carga)

```
┌──────────────────────────────────────┐
│                                      │
│     ┌────────────────────────┐      │
│     │ ░░░░░░░░░░░░░░░░░░░░ │      │
│     │ ░░ SKELETON ░░░░░░░░ │      │
│     │ ░░░░░░░░░░░░░░░░░░░░ │      │
│     └────────────────────────┘      │
│                                      │
│     ┌──┐ ┌────┐ ┌──┐              │
│     │░░│ │░░░░│ │░░│              │
│     └──┘ └────┘ └──┘              │
│                                      │
│          Carregando...               │
│                                      │
└──────────────────────────────────────┘
```

**Spinner:** círculo 32px, borda 3px #2D2D44 + borda-top #7C3AED, animação spin 800ms linear infinite.

#### Feed Vazio (B2B)

```
┌──────────────────────────────────────┐
│                                      │
│     ┌────────────────────┐          │
│     │  🎥                │          │
│     │  (ícone 80px)      │          │
│     └────────────────────┘          │
│                                      │
│  Crie sua marca                      │
│                                      │
│  Publique vídeos, construa           │
│  comunidade e converta em            │
│  resultados.                         │
│                                      │
│  ┌──────────────────────────┐       │
│  │  + Criar marca           │       │
│  └──────────────────────────┘       │
│                                      │
└──────────────────────────────────────┘
```

#### Feed Vazio (B2C)

```
┌──────────────────────────────────────┐
│                                      │
│     ┌────────────────────┐          │
│     │  👋                │          │
│     │  (ícone 80px)      │          │
│     └────────────────────┘          │
│                                      │
│  Explore comunidades                 │
│                                      │
│  Siga comunidades para               │
│  ver conteúdos aqui.                │
│                                      │
│  ┌──────────────────────────┐       │
│  │  🔍 Explorar             │       │
│  └──────────────────────────┘       │
│                                      │
└──────────────────────────────────────┘
```

### 6.4 Indicador de Live

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────┐    │
│ │ 🔴 🔴 Há uma live          │    │
│ │     acontecendo agora!      │    │
│ │               Assistir →    │    │
│ └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

- Fundo: #EF444415 + borda #EF444430
- Pulse animado no círculo vermelho
- Clique: abre live em nova guia

### 6.5 Like Animation

Ao dar duplo tap no post:

1. Ícone de curtida aparece no centro
2. Escala de 0 → 1.2 → 1 (200ms ease-out)
3. Partículas roxas explodem do centro (6 partículas, 400ms)
4. Ícone diminui e some (300ms)
5. Contador de curtidas atualiza

---

## 7. Comunidades

### 7.1 Tela de Comunidades (Grid)

```
┌──────────────────────────────────────┐
│  🔍 Buscar comunidades...           │
│                                      │
│  ┌────────────┬────────────┐       │
│  │ ┌──────┐  │ ┌──────┐  │       │
│  │ │ 👤   │  │ │ 👤   │  │       │
│  │ └──────┘  │ └──────┘  │       │
│  │ MarcaXYZ  │ OutraMarca│       │
│  │ 1.2k mems │ 890 mems  │       │
│  │ [Entrar]  │ [Entrar]  │       │
│  ├────────────┼────────────┤       │
│  │ ┌──────┐  │ ┌──────┐  │       │
│  │ │ 👤   │  │ │ 👤   │  │       │
│  │ └──────┘  │ └──────┘  │       │
│  │ MarcaC    │ MarcaD    │       │
│  │ 2.1k mems │ 450 mems  │       │
│  │ [Entrar]  │ [Entrar]  │       │
│  └────────────┴────────────┘       │
│                                      │
└──────────────────────────────────────┘
```

**Grid:** 2 colunas no mobile, 3 no tablet, 4 no desktop
**Cada card:** avatar 80px, nome 16px Bold, contador 12px #6B6B80, botão "Entrar" secundário
**Categorias:** chips horizontais no topo (Todas · Tecnologia · Moda · Esporte · Música)

### 7.2 Página da Comunidade

```
┌──────────────────────────────────────┐
│                                      │
│  ┌────────────────────────────┐     │
│  │  BANNER 300px             │     │
│  │  (gradiente roxo)         │     │
│  │                            │     │
│  │       ┌────┐              │     │
│  │       │ 👤 │  Avatar      │     │
│  │       │80px│  120px       │     │
│  │       └────┘  (sobreposto)│     │
│  └────────────────────────────┘     │
│                                      │
│  MarcaXYZ                            │
│  @marcaxyz                          │
│                                      │
│  Descrição da comunidade em até      │
│  3 linhas mostrando o propósito      │
│  e o que os membros esperam...      │
│                                      │
│  ┌──────────────┐ ┌──────────┐     │
│  │  Participando │ │ 🔔       │     │
│  └──────────────┘ └──────────┘     │
│                                      │
│  📊 1.2k membros  ·  📹 45 posts   │
│                                      │
│  ── Membros Recentes ──             │
│  [👤][👤][👤][👤][👤] +12         │
│                                      │
│  ── Feed da Comunidade ──           │
│  ┌────────────────────────────┐     │
│  │ ▶️ Post 1                  │     │
│  ├────────────────────────────┤     │
│  │ ▶️ Post 2                  │     │
│  ├────────────────────────────┤     │
│  │ ▶️ Post 3                  │     │
│  └────────────────────────────┘     │
│                                      │
└──────────────────────────────────────┘
```

**Banner:** gradiente personalizável pela marca, altura 200px (mobile) / 300px (desktop)
**Avatar:** 80px (mobile) / 120px (desktop), borda 4px #0D0D0D, -40px de margin-top (sobreposto ao banner)
**Nome:** 24px Bold
**Handle:** @slug, 14px #A0A0B0
**Botões:** "Participando" (primary) / "Sair" (ghost) + sino de notificações
**Métricas:** inline, 14px, com ícones
**Membros:** 5 avatares + "+12" texto
**Feed da comunidade:** grid de posts estilo TikTok reduzido

### 7.3 Estados da Comunidade

#### Comunidade Vazia (sem posts)
```
Mensagem central:
"📹 Nada aqui ainda"
"Seja o primeiro a postar!" (B2B)
"Os membros ainda não publicaram" (B2C)
```

#### Comunidade Privada
```
Badge 🔒 "Comunidade Privada"
"Solicite para entrar"
Botão "Solicitar entrada"
```

---

## 8. Perfil B2C

### 8.1 Tela de Perfil

```
┌──────────────────────────────────────┐
│                                      │
│       ┌──────────┐                  │
│       │   👤     │  Avatar 80px     │
│       │          │                  │
│       └──────────┘                  │
│                                      │
│  Nome do Usuário                     │
│  @username                          │
│                                      │
│  Bio do usuário em até 3 linhas     │
│  mostrando interesse e hobbies...   │
│                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 12     │ │ 5      │ │ 234    │  │
│  │ Comuni.│ │ Grupos │ │ Seguid.│  │
│  └────────┘ └────────┘ └────────┘  │
│                                      │
│  ── Comunidades ──                  │
│  [👤][👤][👤][👤][👤] Ver todas   │
│                                      │
│  ── Atividades Recentes ──          │
│  💬 Comentou em "Post X" · 2h      │
│  ♥️ Curtiu "Post Y" · 5h          │
│  📤 Compartilhou "Post Z" · 1d     │
│                                      │
│  ── Posts Curtidos ──               │
│  〉Ver todos                         │
│                                      │
│  ⚙️ Configurações                   │
│                                      │
└──────────────────────────────────────┘
```

### 8.2 Configurações B2C

```
┌──────────────────────────────────────┐
│  ← Perfil     Configurações         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 👤 Editar perfil            │   │
│  ├──────────────────────────────┤   │
│  │ 🔔 Notificações             │   │
│  ├──────────────────────────────┤   │
│  │ 🔒 Privacidade              │   │
│  ├──────────────────────────────┤   │
│  │ 🌙 Tema escuro              │   │
│  ├──────────────────────────────┤   │
│  │ 💾 Dados e armazenamento    │   │
│  ├──────────────────────────────┤   │
│  │ ❓ Ajuda                     │   │
│  ├──────────────────────────────┤   │
│  │ 🚪 Sair                      │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

Estilo: lista de tiles com ícone + label + seta, padding 16px, separador 1px #2D2D44.

---

## 9. Perfil B2B / Marca

### 9.1 Tela da Marca (Admin View)

```
┌──────────────────────────────────────┐
│                                      │
│  ┌────────────────────────────┐     │
│  │  BANNER 200px             │     │
│  │  + Editar capa            │     │
│  │                            │     │
│  │       ┌────┐              │     │
│  │       │ 👤 │  +           │     │
│  │       └────┘  Editar logo │     │
│  └────────────────────────────┘     │
│                                      │
│  Nome da Marca  ⚙️                  │
│  @slug                              │
│                                      │
│  Bio da marca com propósito...      │
│                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 1.2k   │ │ 45     │ │ 890    │  │
│  │ Membros│ │ Posts  │ │ Engaj. │  │
│  └────────┘ └────────┘ └────────┘  │
│                                      │
│  ── Ações Rápidas ──               │
│  ┌──────────┐ ┌──────────┐        │
│  │ + Postar  │ │ 👥 Memb. │        │
│  ├──────────┤ ├──────────┤        │
│  │ 📊 Anal. │ │ 📅 Editar │        │
│  └──────────┘ └──────────┘        │
│                                      │
│  ── Conteúdo Recente ──            │
│  [▸ Post 1] [▸ Post 2] [▸ Post 3] │
│                                      │
│  ── Analytics Rápido ──            │
│  Pequeno gráfico de barras         │
│  Visualizações (últimos 7 dias)    │
│                                      │
└──────────────────────────────────────┘
```

**Diferenças visuais do B2B para o B2C:**
- Banner editável
- Métricas de engajamento (não seguidores)
- Ações rápidas: Postar, Membros, Analytics, Editar
- Aba "Conteúdo" com preview grid
- Aba "Analytics" com gráfico
- Navegação interna: Conteúdo | Membros | Grupos | Lives | Analytics

### 9.2 Abas Internas (B2B)

#### Conteúdo
```
Grid de posts publicados (thumbnail)
Cada card: thumbnail + duração (vídeos) + engajamento
Botão flutuante "+" para novo post
Estado vazio: "Nenhum post ainda. Crie o primeiro!"
```

#### Membros
```
Lista com avatar + nome + role (Owner/Admin/Membro)
Badge de status (Online/Offline)
Ações: remover, promover, bloquear
Search bar no topo
```

#### Analytics
```
Cards de métricas:
  - Visualizações (7d / 30d)
  - Engajamento (curtidas + comentários)
  - Crescimento de membros
  - Top posts

Gráfico de linha (visualizações por dia)
Gráfico de pizza (tipo de conteúdo)
```

#### Configurações da Marca
```
Editar: nome, slug, descrição, links
Cores da marca (personalização do perfil)
Convites (link de convite para comunidade)
Perigo: "Excluir comunidade"
```

---

## 10. Grupos

### 10.1 Tela de Grupos

```
┌──────────────────────────────────────┐
│  🔍 Buscar grupos...                │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 👥  Grupo A                  │   │
│  │ 📌 12 membros · Público     │   │
│  │ 📝 Última msg: "Olá pessoal!"│   │
│  ├──────────────────────────────┤   │
│  │ 🔒 Grupo B (Privado)        │   │
│  │ 📌 5 membros · Privado      │   │
│  │ 📝 Última msg: "Reunião..."  │   │
│  ├──────────────────────────────┤   │
│  │ 👥  Grupo C                  │   │
│  │ 📌 34 membros · Público     │   │
│  │ 📝 Novidade no grupo!       │   │
│  └──────────────────────────────┘   │
│                                      │
│  Tabs: Todos · Públicos · Privados  │
│                                      │
└──────────────────────────────────────┘
```

### 10.2 Grupo — Tópicos

Layout estilo Discord moderno:

```
┌──────────────────────────────────────┐
│  ← Grupos    #nome-do-grupo         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 📌 Fixado: Regras do grupo   │   │
│  ├──────────────────────────────┤   │
│  │ 👤 User · 2h                │   │
│  │ "Conteúdo do tópico..."     │   │
│  │ ♥ 12  💬 5                  │   │
│  ├──────────────────────────────┤   │
│  │ 👤 User2 · 5h               │   │
│  │ "Outro tópico importante"   │   │
│  │ ♥ 8  💬 3                   │   │
│  ├──────────────────────────────┤   │
│  │ 👤 User3 · 1d               │   │
│  │ "Mais um tópico..."         │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  📝 Escreva um tópico...    │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Input fixo no final:** "Escreva um tópico..." com botão de enviar.

### 10.3 Grupo — Chat em Tempo Real

```
┌──────────────────────────────────────┐
│  ← Tópicos   Nome do Tópico    ⋮    │
│                                      │
│  👤 User · 10:30                    │
│  ┌──────────────────────────┐       │
│  │ Mensagem do usuário      │       │
│  │ com texto e talvez       │       │
│  │ mais de uma linha...     │       │
│  └──────────────────────────┘       │
│                                      │
│  👤 User2 · 10:32                   │
│  ┌──────────────────────────┐       │
│  │ Resposta à mensagem      │       │
│  │ com 📷 imagem anexada    │       │
│  └──────────────────────────┘       │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  📷  Mensagem...         ➤  │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

- Bolhas de mensagem: fundo #1A1A2E (própria), #2D2D44 (outros)
- Input no final com attach + text field + send
- Timestamp relativo
- Loading histórico: skeleton de mensagens

---

## 11. Mensagens

### 11.1 Inbox

```
┌──────────────────────────────────────┐
│  Mensagens                           │
│                                      │
│  🔍 Buscar conversas...             │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 👤  User · "Última msg"   🔴 │   │
│  ├──────────────────────────────┤   │
│  │ 👤  User2 · "Oi!"          │   │
│  ├──────────────────────────────┤   │
│  │ 👥  Grupo · "Alguém vem?"  │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Cada item:** avatar 48px, nome 16px SemiBold, última mensagem 14px #A0A0B0 (1 linha), timestamp 12px #6B6B80, badge vermelho (não lidas).

### 11.2 Chat Individual

```
┌──────────────────────────────────────┐
│  ←      Nome do usuário       ⋮     │
│          Online                      │
│                                      │
│  ┌── ──  10:30  ── ──┐            │
│                                      │
│  ┌────────────────────┐             │
│  │ Oi! Tudo bem?      │             │
│  └────────────────────┘             │
│                                      │
│                    ┌──────────────┐ │
│                    │ Tudo ótimo! │ │
│                    └──────────────┘ │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Viu o post da comunidade?   │   │
│  └──────────────────────────────┘   │
│                                      │
│                    ┌──────────────┐ │
│                    │ Ainda não!  │ │
│                    │ Manda o link│ │
│                    └──────────────┘ │
│                                      │
│  ┌── ──  10:35  ── ──┐            │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ▶️ Compartilhou um post      │   │
│  │ (thumbnail pequena)          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  📷  Mensagem...         ➤  │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

- Bolha própria: fundo #7C3AED, texto branco, border-radius 16px (canto inferior direito reto)
- Bolha do outro: fundo #1A1A2E, texto branco, border-radius 16px (canto inferior esquerdo reto)
- Input: altura 44px, border-radius 22px, fundo #1A1A2E
- Online indicator: bolinha verde 8px ao lado do nome

---

## 12. Notificações

### 12.1 Central de Notificações

```
┌──────────────────────────────────────┐
│  ←          Notificações            │
│                                      │
│  Tabs: Todas · Curtidas · Coments   │
│                                      │
│  ── Hoje ──                         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ♥️  MarcaXYZ curtiu seu      │   │
│  │     comentário               │ 2h│
│  ├──────────────────────────────┤   │
│  │ 💬  User respondeu você     │   │
│  │     "Verdade, faz sentido!"  │ 3h│
│  ├──────────────────────────────┤   │
│  │ 👥  Novo membro entrou      │   │
│  │     em "Grupo X"            │ 5h│
│  └──────────────────────────────┘   │
│                                      │
│  ── Ontem ──                        │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 📤  User compartilhou seu    │   │
│  │     post                     │ 1d│
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Cada notificação:**
- Ícone/avatar à esquerda (32px)
- Texto: 14px Regular, nome em Bold
- Timestamp: 12px #6B6B80
- Badge azul (não lida) à direita
- Clique: navega para o contexto

### 12.2 Badges

- **Ícone de sino:** bolinha vermelha 8px no canto superior direito
- **Número:** bolinha vermelha 16px com texto 10px Bold branco (até 99+)
- Aparecem no Bottom Nav, Top Bar e ícone de sino

---

## 13. Criação de Conteúdo

### 13.1 Tela de Criar Post

```
┌──────────────────────────────────────┐
│  ←         Novo Post          Publicar│
│                                      │
│  ┌────────────────────────────┐     │
│  │                            │     │
│  │     + Adicionar mídia      │     │
│  │     (Tap para selecionar)  │     │
│  │                            │     │
│  │     📷 📹 🎵             │     │
│  │   Galeria  Vídeo  Música  │     │
│  │                            │     │
│  └────────────────────────────┘     │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Na comunidade: MarcaXYZ ▾  │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Descrição do post...        │   │
│  └──────────────────────────────┘   │
│                                      │
│  ── CTA ──                          │
│  ┌──────────────────────────────┐   │
│  │  Tipo: Comprar ▾            │   │
│  ├──────────────────────────────┤   │
│  │  Link: https://...          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ── Agendamento ──                  │
│  ┌──────────────────────────────┐   │
│  │  📅 Publicar agora ▾        │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Especificação visual:**
- Preview da mídia: ratio 9:16, fundo #0D0D0D
- Botão "Publicar": primary roxo, desabilitado até ter mídia
- Selector de comunidade: dropdown com avatar + nome
- CTA é opcional, collapse expand
- Agendamento é opcional, collapse expand
- Text area: altura mínima 80px, expande até 200px

---

## 14. Admin / Gestão B2B

### 14.1 Dashboard Admin

```
┌──────────────────────────────────────┐
│  ← Perfil       Painel Admin        │
│                                      │
│  ┌────────────┬────────────┐        │
│  │ 👁️ 12.4k  │ ♥️ 3.2k   │        │
│  │ Visualiz. │ Curtidas   │        │
│  ├────────────┼────────────┤        │
│  │ 👥 1.2k   │ 📈 +12%   │        │
│  │ Membros   │ Crescim.   │        │
│  └────────────┴────────────┘        │
│                                      │
│  ── Gráfico de Visualizações ──     │
│  ┌────────────────────────────┐     │
│  │  ██                          │     │
│  │  ██ ██                      │     │
│  │  ██ ██ ██ ██                │     │
│  │  ██ ██ ██ ██ ██ ██ ██      │     │
│  │  ██ ██ ██ ██ ██ ██ ██      │     │
│  │  S  T  Q  Q  S  S  D       │     │
│  └────────────────────────────┘     │
│                                      │
│  ── Conteúdo Recente ──            │
│  ┌──────────┬──────────┬──────────┐│
│  │ ▶️ Post 1│ ▶️ Post 2│ ▶️ Post 3││
│  │ ♥ 234   │ ♥ 189   │ ♥ 456   ││
│  └──────────┴──────────┴──────────┘│
│                                      │
│  ── Ações Rápidas ──               │
│  ┌──────────┐ ┌──────────┐        │
│  │ + Postar │ │ 👥 Memb.  │        │
│  ├──────────┤ ├──────────┤        │
│  │ 📅 Event.│ │ 🔴 Live  │        │
│  └──────────┘ └──────────┘        │
│                                      │
└──────────────────────────────────────┘
```

### 14.2 Lives

```
┌──────────────────────────────────────┐
│  ← Admin          Lives             │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 🔴 AO VIVO AGORA            │   │
│  │                              │   │
│  │ ▶️ Live: "Lançamento!"     │   │
│  │ 🎥 45 espectadores         │   │
│  │ [Gerenciar] [Encerrar]     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ── Lives Anteriores ──             │
│  ┌──────────────────────────────┐   │
│  │ ▶️ Live "Semana passada"    │   │
│  │ 🎥 230 views · 45min       │   │
│  ├──────────────────────────────┤   │
│  │ ▶️ Live "Mês passado"      │   │
│  │ 🎥 89 views · 30min        │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────┐       │
│  │  🔴 + Criar nova live    │       │
│  └──────────────────────────┘       │
└──────────────────────────────────────┘
```

### 14.3 Calendário de Conteúdo

```
┌──────────────────────────────────────┐
│  ← Admin         Calendário         │
│                                      │
│  < Maio 2026 >                       │
│                                      │
│  Dom  Seg  Ter  Qua  Qui  Sex  Sab  │
│               1    2    3    4    5  │
│               📝   📹               │
│   6    7    8    9   10   11   12   │
│             📹   🔴                 │
│  13   14   15   16   17   18   19   │
│  📝                             📹  │
│  20   21   22   23   24   25   26   │
│                                      │
│  27   28   29   30   31             │
│              🔴                     │
│                                      │
│  📝 Post agendado                   │
│  📹 Post publicado                  │
│  🔴 Live agendada                   │
│                                      │
└──────────────────────────────────────┘
```

---

## 15. Componentes

### 15.1 Globais

| Componente | Descrição | Estados |
|---|---|---|
| `App Bar` | Topo 56px, título + ações | Default, Scroll |
| `Bottom Nav` | 5 ícones + label, 64px | Active, Inactive |
| `Sidebar` | Desktop 240px, navegação + perfil | Default, Collapsed |
| `Loading` | Spinner 32px + texto | Default |
| `Error Boundary` | Tela de erro com retry | Error |
| `Offline Banner` | Barra "Sem conexão" | Offline |

### 15.2 Feedback

| Componente | Descrição | Variações |
|---|---|---|
| `Toast` | Notificação temporária 48px | Success, Error, Info |
| `Snackbar` | Barra inferior com ação | Default, Undo |
| `Modal` | Diálogo centralizado | Default, Fullscreen |
| `Bottom Sheet` | Painel inferior deslizante | Default, 50%, 90% |
| `Alert Dialog` | Confirmação destrutiva | Danger, Warning |
| `Tooltip` | Dica flutuante | Top, Bottom |

### 15.3 Navegação

| Componente | Descrição |
|---|---|
| `Tab Bar` | Horizontal, indicador animado |
| `Segmented Control` | 2-3 opções, fundo preenchido |
| `Filter Chips` | Chips horizontais roláveis |
| `Pagination Dots` | 3-5 dots, ativo destaque |
| `Stepper` | Progresso numérico (1/4) |

### 15.4 Dados

| Componente | Descrição | Variações |
|---|---|---|
| `Post Card` | Card de feed completo | Video, Image, CTA |
| `Community Card` | Card de comunidade | Default, Member |
| `Group Card` | Card de grupo | Public, Private |
| `User Card` | Card de usuário | Default, Following |
| `Metric Card` | Card de analytics | Number, Graph |
| `Stat Row` | Linha de métricas | 2-4 colunas |

### 15.5 Inputs

| Componente | Descrição | Estados |
|---|---|---|
| `Text Field` | Input padrão | Default, Focus, Error, Success |
| `Search Bar` | Input com lupa | Default, Active |
| `Text Area` | Multi-linha | Default, Focus |
| `Dropdown` | Select estilizado | Default, Open |
| `Date Picker` | Calendário | Default, Range |
| `Toggle` | Switch | On, Off |
| `Slider` | Range | Default |
| `Avatar Picker` | Foto + editar | Default, Uploading |

### 15.6 Mídia

| Componente | Descrição |
|---|---|
| `Video Player` | Player vertical com play/pause |
| `Image Viewer` | Visualização com zoom |
| `Media Grid` | Grid 1-4 mídias |
| `Story Ring` | Círculo com gradiente (story) |
| `Live Badge` | 🔴 AO VIVO com pulse |

---

## 16. Estados e Comportamentos

### 16.1 Estados Globais

| Estado | Comportamento Visual |
|---|---|
| **Loading inicial** | Skeleton matchando layout final |
| **Loading ação** | Botão desabilita + spinner |
| **Vazio (empty)** | Ilustração + texto + CTA |
| **Erro** | Cartão de erro com retry |
| **Offline** | Banner "Sem conexão" no topo |
| **Sucesso** | Toast verde, 3s |
| **Refresh (pull)** | Spinner no topo + haptics |

### 16.2 Micro-interações

| Interação | Animação | Duração |
|---|---|---|
| Botão hover | Fundo escurece 10% | 150ms |
| Botão press | Scale 0.97 | 100ms |
| Card tap | Scale 0.98 | 100ms |
| Page transition | Fade + slide 20px | 300ms |
| Modal open | Scale 0.9 → 1 + fade overlay | 250ms |
| Bottom sheet | Slide up 300px | 300ms |
| Like | Heart explode + particles | 500ms |
| Tab switch | Indicator slide + content fade | 250ms |
| Skeleton | Shimmer left-to-right | 1500ms loop |
| Badge appear | Scale 0 → 1 | 200ms |

---

## 17. Responsividade

### 17.1 Mobile (prioridade — 0–767px)

```
Layout: 1 coluna, full width
Bottom Nav: fixa 64px
Top Bar: 56px (telas secundárias)
Feed: fullscreen vertical
Cards: width 100%, padding 0
Grid: 2 colunas
Sidebar: hidden (drawer no lugar)
Touch targets: mínimo 44px
```

### 17.2 Tablet (768–1023px)

```
Layout: 1 coluna com sidebar opcional
Bottom Nav: fixa 64px (ou sidebar)
Feed: largura máxima 480px centralizada
Cards: width 100% com padding 16px
Grid: 2-3 colunas
Sidebar: collapsível 64px (ícones)
```

### 17.3 Desktop (1024px+)

```
Layout: 3 colunas
  Sidebar esquerda: 240px fixa
  Conteúdo central: max 600px
  Painel direito: 300px fixo (opcional)
Bottom Nav: HIDDEN
Top Bar: 56px com breadcrumb
Feed: max 480px centralizado, sem fullscreen
Cards: border-radius 16px, sombra
Grid: 3-4 colunas
Sidebar: sempre visível
```

### 17.4 PWA

- Suporte a instalável (manifest.json)
- Splash screen personalizada
- Offline page com mensagem amigável
- Service worker para cache de assets
- Safe area insets (notch, home indicator)

---

## 18. Animações e Micro-interações

### 18.1 Transições de Página

| Transição | Descrição |
|---|---|
| Feed → Comunidade | Slide up (nova página sobrepõe) |
| Feed → Perfil | Slide right (stack navigation) |
| Feed → Criar | Bottom sheet slide up (mobile) |
| Feed → Mensagens | Fade + scale (modal) |
| Abertura de modal | Scale up (0.9 → 1) + overlay fade |
| Fechamento | Scale down (1 → 0.9) + overlay fade |

### 18.2 Animações de Feed

- **Like:** coração aparece no centro, escala 1.5x, partículas roxas explodem, depois coração vai para o ícone de ação
- **Compartilhar:** bottom sheet slide up com opções
- **Comentar:** input focus automático + teclado aparece
- **Scroll:** snap suave com easing cubic-bezier(0.4, 0, 0.2, 1)

### 18.3 Loading States

- **Skeleton shimmer:** gradiente animado em loop (1.5s)
- **Spinner:** rotação 360° (800ms linear infinite)
- **Pulsing dot:** live indicator escala 1 → 1.2 (500ms ease-in-out infinite)
- **Progress bar:** fill animado (300ms ease-out)

### 18.4 Hover/Feedback (Desktop)

- Cards: elevam 2px com sombra (200ms ease)
- Botões: background shift ou glow
- Links: underline slide-in
- List items: background highlight

---

## 19. Fluxos Completos

### 19.1 Onboarding B2C

```
Landing → "Explorar" → Auth (Login/Cadastro)
→ Feed (vazio) → "Explorar comunidades" → 
Grid de comunidades → Entra em uma →
Feed da comunidade com conteúdo
```

### 19.2 Onboarding B2B

```
Landing → "Criar comunidade" → Auth B2B →
Feed vazio → "Faça sua primeira postagem" →
Tela de criar post → Publica →
Feed da sua comunidade
```

### 19.3 Consumo de Conteúdo

```
Feed → Scroll vertical → Like (duplo tap) →
Comentar (tap 💬) → Compartilhar (tap 📤) →
Clica no avatar → Perfil da comunidade →
"Participando" → Segue
```

### 19.4 Gestão B2B

```
Perfil (admin view) → "Membros" → Lista →
Gerenciar permissões → "Analytics" →
Gráficos → "Criar post" → Mídia + descrição →
Publicar → Feed atualiza
```

### 19.5 Grupo

```
Feed → Card de grupo → Ver grupo →
Tópicos → Clica em tópico → Chat →
Mensagens em tempo real → Volta
```

---

## Diretrizes Finais para Implementação no FlutterFlow

### Organização de Telas

```
/ (Landing)
/auth (Login/Cadastro B2C)
/auth/b2b (Cadastro Marca)
/feed (Feed Principal)
/feed/community (Feed da Comunidade)
/m/:slug (Perfil da Comunidade)
/c/:slug (Comunidade)
/onboarding (Onboarding)
/communities (Grid de Comunidades)
/messages (Inbox Mensagens)
/messages/:id (Chat)
/notifications (Central)
/profile (Perfil B2C)
/profile/brand (Perfil B2B / Admin)
/groups (Lista de Grupos)
/groups/:id (Tópicos do Grupo)
/groups/:id/topic/:id (Chat do Tópico)
/create (Criar Post)
/waiting (Aprovação Pendente)
/blocked (Acesso Bloqueado)
/offline (Sem Conexão)
```

### Design Tokens (FlutterFlow)

Criar Theme com:
- `Colors`: 12 cores da paleta
- `Typography`: 6 text styles
- `Spacing`: 10 spacing tokens
- `Border Radius`: 5 radius tokens
- `Shadows`: 4 shadow tokens
- `Animations`: 5 duration tokens

### Componentes Globais

Registrar no FlutterFlow:
- `AppBar` (componente base)
- `BottomNav` (componente base)
- `LoadingOverlay` (componente overlay)
- `ErrorState` (componente de erro)
- `EmptyState` (componente vazio)
- `Toast` (componente de notificação)

---

> **Documento gerado em 28/05/2026**
> **Versão 1.0 — Pronto para implementação no FlutterFlow**
>
> WEAZE — Sua comunidade, seu jeito.
