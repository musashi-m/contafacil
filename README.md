# 💰 ContaFácil - PWA de Controle de Contas a Pagar

Aplicativo mobile-first, moderno e responsivo para gestão financeira pessoal, controle de contas a pagar, liquidações e projeção contínua de saldos em tempo real.

Conectado ao **Supabase (PostgreSQL Realtime)** e pronto para deploy no **Vercel** como **PWA instalável**.

---

## ✨ Principais Funcionalidades

- 📱 **Mobile-First & PWA**: Experiência nativa em smartphones (iOS e Android), podendo ser instalado na tela de início com ícone personalizado e funcionamento offline.
- 🌗 **Tema Claro & Tema Escuro (Google Stitch)**: Design responsivo com alternância dinâmica de tema e persistência local.
- ⚡ **Sincronização em Tempo Real (Supabase Realtime)**: Alterações refletem instantaneamente entre dispositivos.
- 📈 **Projeção Contínua de Saldos**: O saldo final de um mês é automaticamente propagado para os próximos períodos, calculando despesas futuras e sobras estimadas.
- 🔍 **Filtros e Busca Instantânea**: Pesquise por nome, categoria ou filtre por contas a pagar, pagas e atrasadas.
- 🔄 **Lançamentos Fixos e Parcelados**: Suporte a parcelamentos e recorrência automática.

---

## 🚀 Como Fazer o Deploy no Vercel

1. Suba este repositório para o seu **GitHub**.
2. Acesse o painel da [Vercel](https://vercel.com/) e clique em **Add New Project**.
3. Importe este repositório.
4. Clique em **Deploy** (não requer build command ou framework presets, pois é HTML/CSS/JS estático puro).
5. Pronto! Acesse a URL gerada pelo Vercel e adicione à tela inicial do seu celular.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

O aplicativo utiliza as seguintes tabelas no PostgreSQL:

```sql
-- TABELA DE CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    category TEXT DEFAULT 'Moradia',
    type TEXT DEFAULT 'parcelada',
    current_installment INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA DE SALDOS INICIAIS MENSAIS
CREATE TABLE IF NOT EXISTS public.balances (
    year_month TEXT PRIMARY KEY, -- 'YYYY-MM'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & ACESSO PÚBLICO
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico total bills" ON public.bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico total balances" ON public.balances FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.balances;
```

---

## 📁 Estrutura de Arquivos

```
├── index.html        # Estrutura principal e layout PWA
├── styles.css        # Estilos, tokens HSL e suporte a Dark Mode
├── app.js            # Lógica de negócios, projeção e cliente Supabase
├── manifest.json     # Manifesto PWA com metadados e ícones
├── sw.js             # Service Worker para cache e funcionamento offline
├── vercel.json       # Configuração de rotas e headers para o Vercel
├── icons/            # Ícones do aplicativo (192px, 512px, SVG)
└── README.md         # Documentação
```
