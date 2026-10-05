/**
 * ContaFácil - Lógica Principal do Aplicativo
 * Gestão de Contas a Pagar & Receber, Projeção Contínua de Saldos e Planejamento Financeiro
 * Conectado ao Supabase (PostgreSQL em Tempo Real)
 * Suporte a Entradas (Receitas) e Saídas (Despesas)
 * Suporte a Tema Claro & Tema Escuro (Google Stitch)
 */

// Configurações do Supabase
const SUPABASE_CONFIG = {
  URL: 'https://bpwvaxvywohekvysmbii.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd3ZheHZ5d29oZWt2eXNtYmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDgwMTksImV4cCI6MjEwNjc4NDAxOX0.RehHCDm5yGFMeg7mmzyG3kbaGsTpnhkCjVZVizWH_c0'
};

let supabaseClient = null;
let isSupabaseConnected = false;

// Chaves de armazenamento (Fallback local e Tema)
const STORAGE_KEYS = {
  BILLS: 'contafacil_bills',
  BALANCES: 'contafacil_balances',
  THEME: 'contafacil_theme'
};

// Categorias de Despesas (Saídas)
const EXPENSE_CATEGORIES = [
  { id: 'Moradia', label: 'Moradia', icon: 'home', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  { id: 'Alimentação', label: 'Alimentação', icon: 'restaurant', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'Saúde', label: 'Saúde', icon: 'medical_services', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'Cartão de Crédito', label: 'Cartão', icon: 'credit_card', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'Transporte', label: 'Transporte', icon: 'directions_car', bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
  { id: 'Educação', label: 'Educação', icon: 'school', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { id: 'Serviços', label: 'Serviços', icon: 'bolt', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' },
  { id: 'Outros', label: 'Outros', icon: 'category', bg: 'bg-surface-container text-on-surface-variant dark:bg-surface-container-high dark:text-on-surface' }
];

// Categorias de Receitas (Entradas)
const INCOME_CATEGORIES = [
  { id: 'Salário', label: 'Salário', icon: 'payments', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'Freelance', label: 'Freelance', icon: 'work', bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
  { id: 'Investimentos', label: 'Rendimentos', icon: 'trending_up', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { id: 'Vendas', label: 'Vendas', icon: 'storefront', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'Benefícios', label: 'Benefícios', icon: 'card_giftcard', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'Outras Entradas', label: 'Outras', icon: 'savings', bg: 'bg-surface-container text-on-surface-variant dark:bg-surface-container-high dark:text-on-surface' }
];

const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Estado da Aplicação
const appState = {
  currentDate: new Date(),
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1, // 1-12
  activeTab: 'inicio', // 'inicio', 'contas', 'planejamento'
  activeFilter: 'todas', // 'todas', 'a-pagar', 'pagas', 'atrasadas'
  natureFilter: 'todos', // 'todos', 'despesas', 'receitas'
  searchQuery: '',
  entryNature: 'despesa', // 'despesa' ou 'receita'
  selectedCategory: 'Moradia',
  billType: 'parcelada', // 'parcelada' ou 'fixa'
  editingBillId: null,
  bills: [], // Carregado do Supabase
  balances: {}, // Carregado do Supabase { 'YYYY-MM': number }
  isInitialLoadComplete: false
};

// ==========================================
// Utilitários de Persistência e Mapeamento
// ==========================================

function getStoredBills() {
  return appState.bills || [];
}

function getStoredBalances() {
  return appState.balances || {};
}

function saveLocalBackup() {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(appState.bills));
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(appState.balances));
  } catch (e) {
    console.error('Erro ao salvar backup local:', e);
  }
}

function loadLocalBackup() {
  try {
    const rawBills = localStorage.getItem(STORAGE_KEYS.BILLS);
    const rawBalances = localStorage.getItem(STORAGE_KEYS.BALANCES);
    if (rawBills) appState.bills = JSON.parse(rawBills);
    if (rawBalances) appState.balances = JSON.parse(rawBalances);
  } catch (e) {
    console.error('Erro ao ler backup local:', e);
  }
}

function saveStoredBills(bills) {
  appState.bills = bills;
  saveLocalBackup();
}

function saveStoredBalances(balances) {
  appState.balances = balances;
  saveLocalBackup();
}

function mapSupabaseBillToApp(row) {
  const isIncome = row.nature === 'income' || row.nature === 'receita';
  return {
    id: String(row.id),
    name: row.name || 'Sem nome',
    amount: parseFloat(row.amount) || 0,
    dueDate: row.due_date ? String(row.due_date).substring(0, 10) : '',
    category: row.category || (isIncome ? 'Salário' : 'Moradia'),
    nature: isIncome ? 'receita' : 'despesa',
    type: row.type || 'parcelada',
    currentInstallment: parseInt(row.current_installment, 10) || 1,
    totalInstallments: parseInt(row.total_installments, 10) || 1,
    status: row.status || 'pending',
    paidAt: row.paid_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

function mapAppBillToSupabase(bill) {
  return {
    id: String(bill.id),
    name: bill.name,
    amount: parseFloat(bill.amount) || 0,
    due_date: bill.dueDate,
    category: bill.category || (bill.nature === 'receita' ? 'Salário' : 'Moradia'),
    nature: bill.nature || 'despesa',
    type: bill.type || 'parcelada',
    current_installment: parseInt(bill.currentInstallment, 10) || 1,
    total_installments: parseInt(bill.totalInstallments, 10) || 1,
    status: bill.status || 'pending',
    paid_at: bill.paidAt || null,
    updated_at: new Date().toISOString()
  };
}

// ==========================================
// Conexão e Sincronização Supabase
// ==========================================

async function initSupabase() {
  loadLocalBackup();
  updateSupabaseSyncStatus('syncing');

  try {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
      
      // Carregar dados iniciais do Supabase
      await loadDataFromSupabase();

      // Escutar alterações em tempo real via WebSocket
      supabaseClient
        .channel('public:db_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload) => {
          console.log('Realtime Supabase bills:', payload.eventType);
          loadDataFromSupabase(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, (payload) => {
          console.log('Realtime Supabase balances:', payload.eventType);
          loadDataFromSupabase(false);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Supabase Realtime ativo!');
          }
        });
    } else {
      console.warn('Supabase SDK não carregado no navegador.');
      updateSupabaseSyncStatus('error');
    }
  } catch (err) {
    console.error('Falha ao conectar no Supabase:', err);
    updateSupabaseSyncStatus('error');
  }
}

async function loadDataFromSupabase(showToastFeedback = false) {
  if (!supabaseClient) return;

  try {
    updateSupabaseSyncStatus('syncing');

    // 1. Buscar Lançamentos (bills)
    const { data: billsData, error: billsError } = await supabaseClient
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });

    if (billsError) {
      console.warn('Aviso Supabase bills:', billsError.message);
      if (billsError.code === 'PGRST205' || billsError.message.includes('not find')) {
        updateSupabaseSyncStatus('needs_table');
      } else {
        updateSupabaseSyncStatus('error');
      }
    } else if (billsData) {
      appState.bills = billsData.map(mapSupabaseBillToApp);
      saveLocalBackup();
      isSupabaseConnected = true;
      updateSupabaseSyncStatus('connected');
    }

    // 2. Buscar Saldos Iniciais Manuais (balances)
    const { data: balancesData, error: balancesError } = await supabaseClient
      .from('balances')
      .select('*');

    if (!balancesError && balancesData) {
      const balanceMap = {};
      balancesData.forEach(row => {
        if (row.year_month) {
          balanceMap[row.year_month] = parseFloat(row.balance) || 0;
        }
      });
      appState.balances = balanceMap;
      saveLocalBackup();
    }

    renderCurrentView();

    if (showToastFeedback) {
      showToast('Dados sincronizados com o Supabase!');
    }
  } catch (err) {
    console.error('Erro na sincronização com Supabase:', err);
    updateSupabaseSyncStatus('error');
  }
}

function updateSupabaseSyncStatus(status) {
  const icon = document.getElementById('supabase-sync-icon');
  const btn = document.getElementById('supabase-sync-btn');
  if (!icon || !btn) return;

  if (status === 'syncing') {
    icon.textContent = 'cloud_sync';
    icon.className = 'material-symbols-outlined text-[16px] text-primary animate-spin';
    btn.title = 'Sincronizando com a nuvem Supabase...';
  } else if (status === 'connected') {
    icon.textContent = 'cloud_done';
    icon.className = 'material-symbols-outlined text-[16px] text-secondary';
    btn.title = 'Nuvem Supabase Conectada (Tempo Real)';
  } else if (status === 'needs_table') {
    icon.textContent = 'database';
    icon.className = 'material-symbols-outlined text-[16px] text-amber-500';
    btn.title = 'Tabelas não criadas no Supabase. Execute o script no SQL Editor.';
  } else {
    icon.textContent = 'cloud_off';
    icon.className = 'material-symbols-outlined text-[16px] text-outline';
    btn.title = 'Modo Local / Verifique a conexão com o Supabase';
  }
}

function syncWithSupabase(manual = false) {
  if (manual) {
    showToast('Sincronizando com a nuvem Supabase...');
  }
  loadDataFromSupabase(manual);
}

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

function parseCurrencyInput(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanStr = value.toString().replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  return parseFloat(cleanStr) || 0;
}

function getYearMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function parseDateBR(dateBR) {
  if (!dateBR) return '';
  const parts = dateBR.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateBR;
}

function getCategoryInfo(categoryId, nature = 'despesa') {
  const match = CATEGORIES.find(c => c.id === categoryId);
  if (match) return match;
  return nature === 'receita' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
}

// Retorna informação amigável de status e prazo relativo
function getBillDueInfo(dueDateStr, status, nature = 'despesa') {
  const isReceita = nature === 'receita';
  if (status === 'paid') {
    return {
      text: isReceita ? 'Recebida' : 'Quitada',
      badgeClass: 'bg-secondary-container/60 text-on-secondary-container dark:bg-emerald-950/60 dark:text-emerald-300 font-medium',
      isOverdue: false,
      isDueToday: false
    };
  }

  if (!dueDateStr) {
    return {
      text: 'Sem data',
      badgeClass: 'bg-surface-container text-on-surface-variant font-medium',
      isOverdue: false,
      isDueToday: false
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: daysAgo === 1 ? 'Atrasada (ontem)' : `Atrasada (${daysAgo} dias)`,
      badgeClass: isReceita 
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-semibold' 
        : 'bg-error-container text-on-error-container dark:bg-red-950/70 dark:text-red-300 font-semibold',
      isOverdue: true,
      isDueToday: false
    };
  } else if (diffDays === 0) {
    return {
      text: isReceita ? 'Recebe Hoje' : 'Vence Hoje',
      badgeClass: isReceita 
        ? 'bg-secondary-container text-on-secondary-container dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold animate-pulse' 
        : 'bg-error-container text-on-error-container dark:bg-red-950/70 dark:text-red-300 font-semibold animate-pulse',
      isOverdue: false,
      isDueToday: true
    };
  } else if (diffDays === 1) {
    return {
      text: isReceita ? 'Recebe Amanhã' : 'Vence Amanhã',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-medium',
      isOverdue: false,
      isDueToday: false
    };
  } else if (diffDays <= 7) {
    return {
      text: `Em ${diffDays} dias`,
      badgeClass: 'bg-surface-container-high text-on-surface-variant font-medium',
      isOverdue: false,
      isDueToday: false
    };
  } else {
    return {
      text: `${d} ${MONTH_SHORT[m - 1]}`,
      badgeClass: 'bg-surface-container text-on-surface-variant font-medium',
      isOverdue: false,
      isDueToday: false
    };
  }
}

// ==========================================
// Sistema de Temas (Claro / Escuro)
// ==========================================

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (!saved && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  showToast(isDark ? 'Tema escuro ativado' : 'Tema claro ativado');
  renderCurrentView();
}

function updateThemeIcon(isDark) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }
}

// ==========================================
// Projeção Contínua e Automática de Saldos
// (Saldo Final = Saldo Inicial + Receitas - Despesas)
// ==========================================

function getEffectiveInitialBalance(year, month) {
  const balances = getStoredBalances();
  const allBills = getStoredBills();
  const targetKey = getYearMonthKey(year, month);

  // 1. Se houver um saldo manual explicitamente definido para este mês:
  if (balances[targetKey] !== undefined && balances[targetKey] !== null) {
    return {
      balance: parseFloat(balances[targetKey]) || 0,
      isManual: true,
      sourceMonth: null
    };
  }

  // 2. Se não houver, procuramos o histórico anterior mais próximo com saldo definido
  const keysWithBalance = Object.keys(balances)
    .filter(k => balances[k] !== undefined && balances[k] !== null)
    .sort();

  if (keysWithBalance.length === 0) {
    return { balance: 0, isManual: false, sourceMonth: null };
  }

  const priorKeys = keysWithBalance.filter(k => k < targetKey);
  if (priorKeys.length === 0) {
    return { balance: 0, isManual: false, sourceMonth: null };
  }

  // Mês âncora inicial
  const anchorKey = priorKeys[priorKeys.length - 1];
  let [curY, curM] = anchorKey.split('-').map(Number);
  let runningBalance = parseFloat(balances[anchorKey]) || 0;
  let lastProcessedKey = anchorKey;

  // Percorre mês a mês acumulando entradas e saídas para projetar o saldo final
  while (getYearMonthKey(curY, curM) < targetKey) {
    const curKey = getYearMonthKey(curY, curM);

    // Se este mês intermediário tiver um saldo manual explícito, adota-o
    if (curKey !== anchorKey && balances[curKey] !== undefined && balances[curKey] !== null) {
      runningBalance = parseFloat(balances[curKey]) || 0;
    }

    // Calcula o total de receitas e despesas previstas deste mês
    const monthBills = allBills.filter(b => b.dueDate && b.dueDate.startsWith(curKey));
    const monthReceitas = monthBills.filter(b => b.nature === 'receita').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
    const monthDespesas = monthBills.filter(b => b.nature !== 'receita').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

    // Saldo projetado ao fim do mês
    runningBalance = runningBalance + monthReceitas - monthDespesas;
    lastProcessedKey = curKey;

    // Avança 1 mês
    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }

  return {
    balance: runningBalance,
    isManual: false,
    sourceMonth: lastProcessedKey
  };
}

// ==========================================
// Cálculos e Agregações do Mês
// ==========================================

function getMonthFinancialData(year, month) {
  const ymKey = getYearMonthKey(year, month);
  const allBills = getStoredBills();

  // Filtrar lançamentos que vencem neste ano/mês
  const monthBills = allBills.filter(bill => {
    return bill.dueDate && bill.dueDate.startsWith(ymKey);
  });

  // Saldo inicial contínuo (herdado ou manual)
  const balanceInfo = getEffectiveInitialBalance(year, month);
  const initialBalance = balanceInfo.balance;
  const isManualBalance = balanceInfo.isManual;
  const sourceMonth = balanceInfo.sourceMonth;

  let totalReceitasPrevistas = 0;
  let totalReceitasRecebidas = 0;
  let totalReceitasPendentes = 0;
  let countReceitas = 0;

  let totalDespesasPrevistas = 0;
  let totalDespesasPagas = 0;
  let totalDespesasPendentes = 0;
  let countDespesas = 0;

  let countPagas = 0;
  let countPendentes = 0;
  let countAtrasadas = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  monthBills.forEach(bill => {
    const val = parseFloat(bill.amount) || 0;
    const isReceita = bill.nature === 'receita';

    if (isReceita) {
      totalReceitasPrevistas += val;
      countReceitas++;
      if (bill.status === 'paid') {
        totalReceitasRecebidas += val;
        countPagas++;
      } else {
        totalReceitasPendentes += val;
        countPendentes++;
        if (bill.dueDate < todayStr) {
          countAtrasadas++;
        }
      }
    } else {
      totalDespesasPrevistas += val;
      countDespesas++;
      if (bill.status === 'paid') {
        totalDespesasPagas += val;
        countPagas++;
      } else {
        totalDespesasPendentes += val;
        countPendentes++;
        if (bill.dueDate < todayStr) {
          countAtrasadas++;
        }
      }
    }
  });

  const saldoAtualReal = initialBalance + totalReceitasRecebidas - totalDespesasPagas;
  const saldoProjetadoFinal = initialBalance + totalReceitasPrevistas - totalDespesasPrevistas;
  const resultadoMes = totalReceitasPrevistas - totalDespesasPrevistas;

  const pctExecucao = totalDespesasPrevistas > 0 
    ? Math.min(100, Math.round((totalDespesasPagas / totalDespesasPrevistas) * 100)) 
    : (totalDespesasPagas > 0 ? 100 : 0);

  return {
    year,
    month,
    ymKey,
    monthBills,
    initialBalance,
    isManualBalance,
    sourceMonth,
    totalReceitasPrevistas,
    totalReceitasRecebidas,
    totalReceitasPendentes,
    countReceitas,
    totalDespesasPrevistas,
    totalDespesasPagas,
    totalDespesasPendentes,
    countDespesas,
    totalPrevisto: totalDespesasPrevistas,
    totalPago: totalDespesasPagas,
    totalPendente: totalDespesasPendentes,
    countTotal: monthBills.length,
    countPagas,
    countPendentes,
    countAtrasadas,
    saldoAtualReal,
    saldoProjetadoFinal,
    resultadoMes,
    pctExecucao
  };
}

// ==========================================
// Navegação e Renderização Geral
// ==========================================

function setMonth(delta) {
  let m = appState.currentMonth + delta;
  let y = appState.currentYear;

  if (m > 12) {
    m = 1;
    y++;
  } else if (m < 1) {
    m = 12;
    y--;
  }

  appState.currentMonth = m;
  appState.currentYear = y;
  renderCurrentView();
}

function setSpecificMonth(year, month) {
  appState.currentYear = year;
  appState.currentMonth = month;
  renderCurrentView();
}

function switchTab(tabName) {
  appState.activeTab = tabName;

  // Resetar scroll imediatamente para o topo do container central
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  const mainScroll = document.getElementById('main-content-scroll');
  if (mainScroll) mainScroll.scrollTop = 0;

  // Atualizar subtítulo no header unificado
  const subtitleEl = document.getElementById('header-tab-subtitle');
  if (subtitleEl) {
    if (tabName === 'inicio') subtitleEl.textContent = 'Início';
    else if (tabName === 'contas') subtitleEl.textContent = 'Lançamentos';
    else if (tabName === 'planejamento') subtitleEl.textContent = 'Planejamento';
  }

  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });

  const targetTab = document.getElementById(`tab-view-${tabName}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Atualizar bottom bar
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    const path = btn.getAttribute('data-path');
    if (path === tabName) {
      btn.className = 'bottom-nav-item flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors text-primary font-semibold';
    } else {
      btn.className = 'bottom-nav-item flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-on-surface-variant hover:text-on-surface transition-colors';
    }
  });

  renderCurrentView();
}

function renderCurrentView() {
  if (appState.activeTab === 'inicio') {
    renderHomeView();
  } else if (appState.activeTab === 'contas') {
    renderBillsView();
  } else if (appState.activeTab === 'planejamento') {
    renderPlanningView();
  }
}

// ==========================================
// TELA 1: INÍCIO (Visão Mensal & Projeção)
// ==========================================

function renderHomeView() {
  const data = getMonthFinancialData(appState.currentYear, appState.currentMonth);
  const monthName = MONTH_NAMES[appState.currentMonth - 1];
  const now = new Date();
  const isCurrentMonth = (now.getFullYear() === appState.currentYear && (now.getMonth() + 1) === appState.currentMonth);

  // Label do mês e badge atual
  const monthLabel = document.getElementById('home-month-label');
  if (monthLabel) monthLabel.textContent = `${monthName} ${appState.currentYear}`;

  const currentBadge = document.getElementById('home-current-badge');
  if (currentBadge) {
    currentBadge.style.display = isCurrentMonth ? 'inline-block' : 'none';
  }

  // Pílulas de meses rápidos
  renderMonthPills('home-month-pills');

  // Hero Card de Fechamento
  const projectedBalanceEl = document.getElementById('home-projected-balance');
  const projectedBadgeEl = document.getElementById('home-projected-badge');
  const initialBalanceEl = document.getElementById('home-initial-balance');
  const realBalanceEl = document.getElementById('home-real-balance');

  if (projectedBalanceEl) {
    projectedBalanceEl.textContent = formatCurrency(data.saldoProjetadoFinal);
  }

  if (projectedBadgeEl) {
    if (data.saldoProjetadoFinal >= 0) {
      projectedBadgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/30 text-secondary-fixed dark:text-emerald-300 dark:bg-emerald-950/60 font-label-sm text-[11px] font-semibold';
      projectedBadgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span> Sobra Positiva';
    } else {
      projectedBadgeEl.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container dark:bg-red-950/80 dark:text-red-300 font-label-sm text-[11px] font-semibold';
      projectedBadgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span> Déficit Estimado';
    }
  }

  if (initialBalanceEl) initialBalanceEl.textContent = formatCurrency(data.initialBalance);
  if (realBalanceEl) realBalanceEl.textContent = formatCurrency(data.saldoAtualReal);

  // Grid de 3 Colunas (Receitas (+), Despesas (-), A Pagar)
  const totalReceitasVal = document.getElementById('home-total-receitas-val');
  const totalReceitasSub = document.getElementById('home-total-receitas-sub');
  const totalDespesasVal = document.getElementById('home-total-despesas-val');
  const totalDespesasSub = document.getElementById('home-total-despesas-sub');
  const totalPagarVal = document.getElementById('home-total-pagar-val');
  const totalPagarSub = document.getElementById('home-total-pagar-sub');

  if (totalReceitasVal) totalReceitasVal.textContent = formatCurrency(data.totalReceitasPrevistas);
  if (totalReceitasSub) totalReceitasSub.textContent = `${data.countReceitas} ${data.countReceitas === 1 ? 'entrada' : 'entradas'}`;

  if (totalDespesasVal) totalDespesasVal.textContent = formatCurrency(data.totalDespesasPrevistas);
  if (totalDespesasSub) totalDespesasSub.textContent = `${data.countDespesas} ${data.countDespesas === 1 ? 'saída' : 'saídas'}`;

  if (totalPagarVal) totalPagarVal.textContent = formatCurrency(data.totalDespesasPendentes);
  if (totalPagarSub) totalPagarSub.textContent = `${data.countPendentes} ${data.countPendentes === 1 ? 'pendente' : 'pendentes'}`;

  // Barra de Progresso
  const progressPct = document.getElementById('home-progress-pct');
  const progressBar = document.getElementById('home-progress-bar');
  const progressPaid = document.getElementById('home-progress-paid');
  const progressRemaining = document.getElementById('home-progress-remaining');

  if (progressPct) progressPct.textContent = `${data.pctExecucao}% quitado`;
  if (progressBar) progressBar.style.width = `${data.pctExecucao}%`;
  if (progressPaid) progressPaid.textContent = `${formatCurrency(data.totalDespesasPagas)} quitadas`;
  if (progressRemaining) progressRemaining.textContent = `Faltam ${formatCurrency(data.totalDespesasPendentes)}`;

  // Próximos Vencimentos
  renderHomeUpcomingBills(data.monthBills);
}

function renderMonthPills(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;

  // Gerar 4 meses ao redor do mês atual
  const months = [];
  for (let i = -1; i <= 3; i++) {
    let m = currentM + i;
    let y = currentY;
    if (m > 12) {
      m = m - 12;
      y++;
    } else if (m < 1) {
      m = m + 12;
      y--;
    }
    months.push({ year: y, month: m });
  }

  container.innerHTML = months.map(item => {
    const isSelected = item.year === appState.currentYear && item.month === appState.currentMonth;
    const label = `${MONTH_SHORT[item.month - 1]} ${item.year}`;
    if (isSelected) {
      return `
        <button onclick="setSpecificMonth(${item.year}, ${item.month})" class="px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-[11px] font-semibold shrink-0 shadow-sm transition-transform active:scale-95">
          ${label}
        </button>
      `;
    } else {
      return `
        <button onclick="setSpecificMonth(${item.year}, ${item.month})" class="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-[11px] shrink-0 transition-colors">
          ${label}
        </button>
      `;
    }
  }).join('');
}

function renderHomeUpcomingBills(bills) {
  const listContainer = document.getElementById('home-upcoming-list');
  const emptyState = document.getElementById('home-empty-state');
  if (!listContainer) return;

  if (bills.length === 0) {
    listContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Ordenar por vencimento
  const sorted = [...bills].sort((a, b) => {
    if (a.status === 'paid' && b.status !== 'paid') return 1;
    if (a.status !== 'paid' && b.status === 'paid') return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  listContainer.innerHTML = sorted.map(bill => {
    const isReceita = bill.nature === 'receita';
    const cat = getCategoryInfo(bill.category, bill.nature);
    const dueInfo = getBillDueInfo(bill.dueDate, bill.status, bill.nature);
    const isPaid = bill.status === 'paid';

    const amountColor = isReceita ? 'text-secondary' : 'text-on-surface';
    const amountSign = isReceita ? '+' : '-';

    const actionBtnText = isReceita 
      ? (isPaid ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">done</span> Recebido</span>' : 'Receber')
      : (isPaid ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">done</span> Pago</span>' : 'Pagar');

    const actionBtnClass = isPaid
      ? 'bg-secondary text-on-secondary'
      : (isReceita ? 'bg-secondary text-on-secondary hover:opacity-90' : 'bg-primary text-on-primary hover:opacity-90');

    return `
      <div class="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-2.5 transition-transform active:scale-[0.99] border border-surface-container-low ${isPaid ? 'opacity-75' : ''}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-body-md text-[13px] font-semibold text-on-surface truncate ${isPaid ? 'line-through decoration-outline/60' : ''}">
                ${escapeHtml(bill.name)}
              </span>
              <span class="px-1.5 py-0.2 rounded-full font-label-sm text-[9px] font-semibold ${isReceita ? 'bg-secondary/15 text-secondary' : 'bg-error-container/30 text-error'}">
                ${isReceita ? 'Receita' : 'Despesa'}
              </span>
            </div>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${dueInfo.badgeClass} font-label-sm text-[10px]">
                ${dueInfo.isDueToday ? '<span class="material-symbols-outlined text-[11px]">alarm</span>' : ''}
                ${dueInfo.text}
              </span>
              <span class="text-on-surface-variant font-body-sm text-[11px] truncate">• ${escapeHtml(bill.category || (isReceita ? 'Entradas' : 'Moradia'))}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end shrink-0 gap-1">
          <span class="font-amount-metric text-[14px] ${amountColor} font-bold tabular-nums ${isPaid ? 'line-through text-on-surface-variant' : ''}">
            ${amountSign} ${formatCurrency(bill.amount)}
          </span>
          <button onclick="toggleBillPayment('${bill.id}')" class="pay-btn px-2.5 py-1 rounded-lg ${actionBtnClass} font-label-sm text-[11px] font-medium active:scale-95 transition-all shadow-sm">
            ${actionBtnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// TELA 2: CONTAS / LANÇAMENTOS (Gestão Filtrável)
// ==========================================

function renderBillsView() {
  const data = getMonthFinancialData(appState.currentYear, appState.currentMonth);
  const monthName = MONTH_NAMES[appState.currentMonth - 1];

  // Seletor de mês
  const monthLabel = document.getElementById('bills-month-label');
  if (monthLabel) monthLabel.textContent = `${monthName} ${appState.currentYear}`;

  // Metric Ribbon
  const ribbonReceitas = document.getElementById('bills-ribbon-receitas');
  const ribbonDespesas = document.getElementById('bills-ribbon-despesas');
  const ribbonRestante = document.getElementById('bills-ribbon-restante');
  if (ribbonReceitas) ribbonReceitas.textContent = formatCurrency(data.totalReceitasPrevistas);
  if (ribbonDespesas) ribbonDespesas.textContent = formatCurrency(data.totalDespesasPrevistas);
  if (ribbonRestante) ribbonRestante.textContent = formatCurrency(data.totalDespesasPendentes);

  // Contadores nas Abas de Filtro
  const countTodas = document.getElementById('count-tab-todas');
  const countAPagar = document.getElementById('count-tab-a-pagar');
  const countPagas = document.getElementById('count-tab-pagas');
  const countAtrasadas = document.getElementById('count-tab-atrasadas');

  if (countTodas) countTodas.textContent = data.countTotal;
  if (countAPagar) countAPagar.textContent = data.countPendentes;
  if (countPagas) countPagas.textContent = data.countPagas;
  if (countAtrasadas) countAtrasadas.textContent = data.countAtrasadas;

  // Filtragem dos lançamentos
  let filtered = [...data.monthBills];
  const query = appState.searchQuery.toLowerCase().trim();

  // Filtro de Busca
  if (query) {
    filtered = filtered.filter(b => {
      const name = (b.name || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();
      return name.includes(query) || cat.includes(query);
    });
  }

  // Filtro por Natureza (Todos, Despesas, Receitas)
  if (appState.natureFilter === 'despesas') {
    filtered = filtered.filter(b => b.nature !== 'receita');
  } else if (appState.natureFilter === 'receitas') {
    filtered = filtered.filter(b => b.nature === 'receita');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtro por Status
  if (appState.activeFilter === 'a-pagar') {
    filtered = filtered.filter(b => b.status !== 'paid');
  } else if (appState.activeFilter === 'pagas') {
    filtered = filtered.filter(b => b.status === 'paid');
  } else if (appState.activeFilter === 'atrasadas') {
    filtered = filtered.filter(b => b.status !== 'paid' && b.dueDate < todayStr);
  }

  // Ordenar por vencimento mais próximo
  filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Renderizar Lista
  const container = document.getElementById('bills-list-container');
  const emptyState = document.getElementById('bills-empty-state');
  const listSummaryCount = document.getElementById('bills-listed-count');

  if (listSummaryCount) {
    listSummaryCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'item listado' : 'itens listados'}`;
  }

  if (filtered.length === 0) {
    if (container) container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Separar em grupos amigáveis
  const groupAtrasadas = [];
  const groupHoje7Dias = [];
  const groupMaisAdiante = [];
  const groupPagas = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  filtered.forEach(bill => {
    if (bill.status === 'paid') {
      groupPagas.push(bill);
      return;
    }

    const [y, m, d] = bill.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      groupAtrasadas.push(bill);
    } else if (diffDays <= 7) {
      groupHoje7Dias.push(bill);
    } else {
      groupMaisAdiante.push(bill);
    }
  });

  let html = '';

  if (groupAtrasadas.length > 0) {
    html += renderBillGroup('Pendentes Atrasados', groupAtrasadas, 'bg-error', 'text-error');
  }
  if (groupHoje7Dias.length > 0) {
    html += renderBillGroup('Hoje e Próximos 7 Dias', groupHoje7Dias, 'bg-amber-500 animate-pulse', 'text-on-surface');
  }
  if (groupMaisAdiante.length > 0) {
    html += renderBillGroup('Próximos do Mês', groupMaisAdiante, 'bg-primary', 'text-on-surface');
  }
  if (groupPagas.length > 0) {
    html += renderBillGroup('Quitados e Recebidos', groupPagas, 'bg-secondary', 'text-secondary');
  }

  if (container) container.innerHTML = html;
}

function renderBillGroup(title, bills, dotClass, textClass) {
  return `
    <div class="bill-group flex flex-col gap-2 mb-2">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${dotClass}"></span>
          <h2 class="font-headline-sm text-[14px] ${textClass} font-semibold">${title}</h2>
        </div>
        <span class="font-label-sm text-[10px] text-on-surface-variant">${bills.length} ${bills.length === 1 ? 'item' : 'itens'}</span>
      </div>
      <div class="flex flex-col gap-2">
        ${bills.map(b => renderBillCard(b)).join('')}
      </div>
    </div>
  `;
}

function renderBillCard(bill) {
  const isReceita = bill.nature === 'receita';
  const cat = getCategoryInfo(bill.category, bill.nature);
  const dueInfo = getBillDueInfo(bill.dueDate, bill.status, bill.nature);
  const isPaid = bill.status === 'paid';

  let installmentInfo = '';
  if (bill.type === 'parcelada' && bill.totalInstallments > 1) {
    installmentInfo = `<span>• Parcela ${bill.currentInstallment || 1}/${bill.totalInstallments}</span>`;
  } else if (bill.type === 'fixa') {
    installmentInfo = `<span>• Recorrente</span>`;
  }

  const amountColor = isReceita ? 'text-secondary' : 'text-on-surface';
  const amountSign = isReceita ? '+' : '-';

  const actionBtnText = isReceita 
    ? (isPaid ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">done</span> Recebido</span>' : '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">arrow_downward</span> Receber</span>')
    : (isPaid ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">done</span> Paga</span>' : 'Pagar');

  const actionBtnClass = isPaid
    ? 'bg-secondary text-on-secondary'
    : (isReceita ? 'bg-secondary text-on-secondary hover:opacity-90' : 'bg-primary text-on-primary hover:opacity-90');

  return `
    <article class="bill-card bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-2 transition-transform active:scale-[0.99] border border-surface-container-low ${isPaid ? 'opacity-80' : ''}" data-id="${bill.id}">
      <div class="flex items-start justify-between gap-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <h3 class="font-headline-sm text-[14px] leading-snug text-on-surface truncate font-semibold ${isPaid ? 'line-through decoration-outline/60' : ''}">
                ${escapeHtml(bill.name)}
              </h3>
              <span class="px-1.5 py-0.2 rounded-full font-label-sm text-[9px] font-semibold ${isReceita ? 'bg-secondary/15 text-secondary' : 'bg-error-container/30 text-error'}">
                ${isReceita ? 'Receita' : 'Despesa'}
              </span>
            </div>
            <p class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1 flex-wrap mt-0.5">
              <span>${escapeHtml(bill.category || (isReceita ? 'Entradas' : 'Moradia'))}</span>
              ${installmentInfo}
              <span>•</span>
              <span class="${dueInfo.isOverdue || dueInfo.isDueToday ? (isReceita ? 'text-amber-500 font-medium' : 'text-error font-medium') : ''}">${dueInfo.text}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end shrink-0">
          <span class="font-amount-metric text-[14px] ${amountColor} font-bold tabular-nums ${isPaid ? 'line-through opacity-80' : ''}">
            ${amountSign} ${formatCurrency(bill.amount)}
          </span>
          <span class="mt-0.5 px-2 py-0.5 rounded-full ${dueInfo.badgeClass} font-label-sm text-[9px] tracking-wide">
            ${dueInfo.text.toUpperCase()}
          </span>
        </div>
      </div>
      <!-- Barra de Ações Rápidas -->
      <div class="pt-1.5 flex items-center justify-between border-t border-surface-container-low">
        <div class="flex items-center gap-1.5">
          <button onclick="editBill('${bill.id}')" title="Editar" class="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button onclick="confirmDeleteBill('${bill.id}')" title="Excluir" class="w-7 h-7 rounded-lg bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
        <button onclick="toggleBillPayment('${bill.id}')" class="px-3 h-7 rounded-lg ${actionBtnClass} font-label-md text-[11px] font-medium flex items-center gap-1 shadow-sm active:scale-95 transition-all">
          ${actionBtnText}
        </button>
      </div>
    </article>
  `;
}

function setBillFilter(filterName) {
  appState.activeFilter = filterName;

  document.querySelectorAll('.filter-tab').forEach(btn => {
    const f = btn.getAttribute('data-filter');
    if (f === filterName) {
      btn.className = 'filter-tab px-3 h-7 rounded-full bg-primary text-on-primary font-label-md text-[11px] flex items-center gap-1 shadow-sm transition-all';
    } else {
      btn.className = 'filter-tab px-3 h-7 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-[11px] flex items-center gap-1 shadow-sm transition-all';
    }
  });

  renderBillsView();
}

function setNatureFilter(filter) {
  appState.natureFilter = filter;
  document.querySelectorAll('.nature-pill').forEach(btn => {
    btn.className = 'nature-pill px-2.5 py-0.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant font-label-sm text-[10px] transition-all flex items-center gap-1';
  });

  const activeBtn = document.getElementById(`nature-tab-${filter}`);
  if (activeBtn) {
    activeBtn.className = 'nature-pill px-2.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-[10px] font-semibold transition-all flex items-center gap-1';
  }

  renderBillsView();
}

// ==========================================
// TELA 3: PLANEJAMENTO & SALDOS
// ==========================================

function renderPlanningView() {
  const data = getMonthFinancialData(appState.currentYear, appState.currentMonth);
  const monthName = MONTH_NAMES[appState.currentMonth - 1];

  // Seletor de mês
  const monthLabel = document.getElementById('planning-month-label');
  if (monthLabel) monthLabel.textContent = `${monthName} ${appState.currentYear}`;

  // Saldo Inicial
  const initialDisplay = document.getElementById('planning-initial-display');
  const initialInput = document.getElementById('planning-initial-input');
  const initialDesc = document.getElementById('planning-initial-desc');
  const initialBadge = document.getElementById('planning-initial-badge');

  if (initialDisplay) initialDisplay.textContent = formatCurrency(data.initialBalance);
  if (initialInput) initialInput.value = data.initialBalance.toFixed(2).replace('.', ',');

  if (initialBadge) {
    if (data.isManualBalance) {
      initialBadge.className = 'px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-[10px] text-on-surface-variant font-medium';
      initialBadge.textContent = 'Manual';
    } else if (data.sourceMonth) {
      const [sY, sM] = data.sourceMonth.split('-').map(Number);
      initialBadge.className = 'px-2 py-0.5 rounded-full bg-secondary-container/60 font-label-sm text-[10px] text-on-secondary-container dark:bg-emerald-950/60 dark:text-emerald-300 font-medium flex items-center gap-1';
      initialBadge.innerHTML = `<span class="material-symbols-outlined text-[12px]">auto_mode</span> Herdado de ${MONTH_SHORT[sM - 1]} ${sY}`;
    } else {
      initialBadge.className = 'px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-[10px] text-on-surface-variant font-medium';
      initialBadge.textContent = 'Não definido';
    }
  }

  if (initialDesc) {
    if (data.isManualBalance) {
      initialDesc.textContent = `Valor fixado manualmente para o dia 1º de ${monthName}.`;
    } else if (data.sourceMonth) {
      const [sY, sM] = data.sourceMonth.split('-').map(Number);
      initialDesc.textContent = `Projetado automaticamente a partir do saldo final de ${MONTH_NAMES[sM - 1]} ${sY}.`;
    } else {
      initialDesc.textContent = `Defina o saldo para iniciar a projeção contínua nos meses seguintes.`;
    }
  }

  // Saldo Projetado Final
  const projectedBalanceEl = document.getElementById('planning-projected-balance');
  const statusBadge = document.getElementById('planning-status-badge');

  if (projectedBalanceEl) projectedBalanceEl.textContent = formatCurrency(data.saldoProjetadoFinal);
  if (statusBadge) {
    if (data.saldoProjetadoFinal >= 0) {
      statusBadge.className = 'px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant dark:bg-emerald-950/60 dark:text-emerald-300 font-label-sm text-[10px] font-semibold';
      statusBadge.textContent = 'Balanço Positivo';
    } else {
      statusBadge.className = 'px-2 py-0.5 rounded-full bg-error-container text-on-error-container dark:bg-red-950/80 dark:text-red-300 font-label-sm text-[10px] font-semibold';
      statusBadge.textContent = 'Déficit Previsto';
    }
  }

  // Grid Planejado vs Realizado (2x2)
  const incomeTotalEl = document.getElementById('planning-income-total');
  const incomeCountEl = document.getElementById('planning-income-count');
  const billsTotalEl = document.getElementById('planning-bills-total');
  const billsCountEl = document.getElementById('planning-bills-count');
  const realBalanceEl = document.getElementById('planning-real-balance');
  const monthResultEl = document.getElementById('planning-month-result');
  const monthResultSub = document.getElementById('planning-month-result-sub');

  if (incomeTotalEl) incomeTotalEl.textContent = formatCurrency(data.totalReceitasPrevistas);
  if (incomeCountEl) incomeCountEl.textContent = `${data.countReceitas} ${data.countReceitas === 1 ? 'entrada' : 'entradas'}`;

  if (billsTotalEl) billsTotalEl.textContent = formatCurrency(data.totalDespesasPrevistas);
  if (billsCountEl) billsCountEl.textContent = `${data.countDespesas} ${data.countDespesas === 1 ? 'saída' : 'saídas'}`;

  if (realBalanceEl) realBalanceEl.textContent = formatCurrency(data.saldoAtualReal);

  if (monthResultEl) {
    monthResultEl.textContent = formatCurrency(data.resultadoMes);
    monthResultEl.className = `font-amount-metric text-[14px] ${data.resultadoMes >= 0 ? 'text-secondary font-bold' : 'text-error font-bold'} mt-0.5 tabular-nums`;
  }
  if (monthResultSub) {
    monthResultSub.textContent = data.resultadoMes >= 0 ? 'Superávit no mês' : 'Déficit no mês';
  }

  // Barra de Progresso da Execução
  const executionPctEl = document.getElementById('planning-execution-pct');
  const executionBarPaid = document.getElementById('planning-bar-paid');
  const executionBarPending = document.getElementById('planning-bar-pending');
  const paidText = document.getElementById('planning-paid-text');
  const pendingText = document.getElementById('planning-pending-text');

  if (executionPctEl) executionPctEl.textContent = `${data.pctExecucao}% liquidado`;
  if (executionBarPaid) executionBarPaid.style.width = `${data.pctExecucao}%`;
  if (executionBarPending) executionBarPending.style.width = `${100 - data.pctExecucao}%`;
  if (paidText) paidText.textContent = formatCurrency(data.totalDespesasPagas);
  if (pendingText) pendingText.textContent = formatCurrency(data.totalDespesasPendentes);

  // Projeção Futura em Cascata Contínua
  renderPlanningFutureProjections(data.saldoProjetadoFinal);
}

function renderPlanningFutureProjections(currentMonthFinalBalance) {
  const container = document.getElementById('planning-projections-container');
  if (!container) return;

  const allBills = getStoredBills();
  const balances = getStoredBalances();
  const currentY = appState.currentYear;
  const currentM = appState.currentMonth;

  let html = '';
  let rollingBalance = currentMonthFinalBalance;

  for (let i = 1; i <= 3; i++) {
    let m = currentM + i;
    let y = currentY;
    if (m > 12) {
      m = m - 12;
      y++;
    }

    const ymKey = getYearMonthKey(y, m);
    // Se o usuário colocou saldo manual no mês futuro, ele sobrepõe
    if (balances[ymKey] !== undefined && balances[ymKey] !== null) {
      rollingBalance = parseFloat(balances[ymKey]) || 0;
    }

    const monthBills = allBills.filter(b => b.dueDate && b.dueDate.startsWith(ymKey));
    const monthReceitas = monthBills.filter(b => b.nature === 'receita').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
    const monthDespesas = monthBills.filter(b => b.nature !== 'receita').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
    const sobraEstimada = rollingBalance + monthReceitas - monthDespesas;

    const namesPreview = monthBills.slice(0, 3).map(b => b.name).join(', ') || 'Nenhum lançamento agendado';

    html += `
      <div class="bg-surface-container-lowest p-3 rounded-xl shadow-sm space-y-1.5 border border-surface-container-low">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span class="font-label-md text-[12px] font-bold">${String(m).padStart(2, '0')}</span>
            </div>
            <div>
              <h4 class="font-headline-sm text-[14px] text-on-surface font-semibold">${MONTH_NAMES[m - 1]} ${y}</h4>
              <span class="font-body-sm text-[11px] text-on-surface-variant">${monthBills.length} ${monthBills.length === 1 ? 'item previsto' : 'itens previstos'}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-1.5 justify-end">
              <span class="font-amount-metric text-[12px] text-secondary font-semibold tabular-nums">+${formatCurrency(monthReceitas)}</span>
              <span class="font-amount-metric text-[12px] text-error font-semibold tabular-nums">-${formatCurrency(monthDespesas)}</span>
            </div>
            <div class="font-label-sm text-[10px] ${sobraEstimada >= 0 ? 'text-secondary font-semibold' : 'text-error font-semibold'} tabular-nums mt-0.5">
              Sobra est.: ${formatCurrency(sobraEstimada)}
            </div>
          </div>
        </div>
        <div class="bg-surface-container-low px-2.5 py-1.5 rounded-lg flex items-center justify-between text-on-surface-variant">
          <span class="font-body-sm text-[11px] truncate pr-2">${escapeHtml(namesPreview)}</span>
          <button onclick="setSpecificMonth(${y}, ${m}); switchTab('contas');" class="text-primary hover:opacity-80 flex items-center gap-0.5 text-[11px] font-semibold shrink-0">
            <span>Ver</span>
            <span class="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      </div>
    `;

    // Atualiza o saldo para o próximo mês em cascata contínua
    rollingBalance = sobraEstimada;
  }

  container.innerHTML = html;
}

// Edição inline de saldo inicial
function toggleInlineBalanceEdit() {
  const box = document.getElementById('planning-inline-edit-box');
  if (!box) return;
  box.classList.toggle('hidden');
  box.classList.toggle('flex');
}

async function saveMonthInitialBalance() {
  const input = document.getElementById('planning-initial-input');
  if (!input) return;

  const val = parseCurrencyInput(input.value);
  const ymKey = getYearMonthKey(appState.currentYear, appState.currentMonth);

  const balances = getStoredBalances();
  balances[ymKey] = val;
  saveStoredBalances(balances);

  toggleInlineBalanceEdit();
  renderCurrentView();
  showToast(`Saldo inicial de ${MONTH_NAMES[appState.currentMonth - 1]} definido para ${formatCurrency(val)}`);

  // Sincronização Supabase
  if (supabaseClient) {
    try {
      updateSupabaseSyncStatus('syncing');
      const { error } = await supabaseClient
        .from('balances')
        .upsert({
          year_month: ymKey,
          balance: val,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar saldo no Supabase:', error);
        updateSupabaseSyncStatus('error');
      } else {
        updateSupabaseSyncStatus('connected');
      }
    } catch (err) {
      console.error('Falha de rede ao salvar saldo no Supabase:', err);
      updateSupabaseSyncStatus('error');
    }
  }
}

async function resetMonthInitialBalanceToAuto() {
  const ymKey = getYearMonthKey(appState.currentYear, appState.currentMonth);
  const balances = getStoredBalances();
  delete balances[ymKey];
  saveStoredBalances(balances);

  toggleInlineBalanceEdit();
  renderCurrentView();
  showToast(`Saldo inicial de ${MONTH_NAMES[appState.currentMonth - 1]} agora é herdado automaticamente.`);

  // Sincronização Supabase
  if (supabaseClient) {
    try {
      updateSupabaseSyncStatus('syncing');
      const { error } = await supabaseClient
        .from('balances')
        .delete()
        .eq('year_month', ymKey);

      if (error) {
        console.error('Erro ao resetar saldo no Supabase:', error);
        updateSupabaseSyncStatus('error');
      } else {
        updateSupabaseSyncStatus('connected');
      }
    } catch (err) {
      console.error('Falha ao resetar saldo no Supabase:', err);
      updateSupabaseSyncStatus('error');
    }
  }
}

// ==========================================
// TELA 4: MODAL DE NOVO / EDITAR LANÇAMENTO
// ==========================================

function setBillNature(nature) {
  appState.entryNature = nature;
  const isReceita = nature === 'receita';

  const tabDespesa = document.getElementById('tab-nature-despesa');
  const tabReceita = document.getElementById('tab-nature-receita');
  const dot = document.getElementById('modal-nature-dot');
  const title = document.getElementById('modal-bill-title');
  const amountLabel = document.getElementById('modal-amount-label');
  const impactDiv = document.getElementById('modal-amount-impact');
  const impactIcon = document.getElementById('modal-amount-impact-icon');
  const impactText = document.getElementById('modal-amount-impact-text');
  const dateLabel = document.getElementById('modal-date-label');
  const saveBtn = document.getElementById('btn-modal-save');

  if (isReceita) {
    if (tabReceita) {
      tabReceita.className = 'w-full py-2 px-2 rounded-lg bg-surface-container-lowest shadow-sm text-secondary font-headline-sm text-label-md flex items-center justify-center gap-1.5 transition-all';
    }
    if (tabDespesa) {
      tabDespesa.className = 'w-full py-2 px-2 rounded-lg text-on-surface-variant font-headline-sm text-label-md flex items-center justify-center gap-1.5 hover:text-on-surface transition-all';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-secondary animate-pulse';
    if (title) title.textContent = appState.editingBillId ? 'Editar Receita' : 'Nova Receita';
    if (amountLabel) amountLabel.textContent = 'Valor da Receita';
    if (impactDiv) impactDiv.className = 'flex items-center gap-1 text-secondary font-label-sm text-[11px] bg-secondary-container/30 px-3 py-0.5 rounded-full mt-1';
    if (impactIcon) impactIcon.textContent = 'trending_up';
    if (impactText) impactText.textContent = 'Impacto positivo no orçamento';
    if (dateLabel) dateLabel.textContent = 'Data de Recebimento (DD/MM/AAAA)';
    if (saveBtn) {
      saveBtn.className = 'w-full h-11 bg-secondary text-on-secondary rounded-xl font-headline-sm text-[14px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer';
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span><span>Salvar Receita</span>';
    }
  } else {
    if (tabDespesa) {
      tabDespesa.className = 'w-full py-2 px-2 rounded-lg bg-surface-container-lowest shadow-sm text-error font-headline-sm text-label-md flex items-center justify-center gap-1.5 transition-all';
    }
    if (tabReceita) {
      tabReceita.className = 'w-full py-2 px-2 rounded-lg text-on-surface-variant font-headline-sm text-label-md flex items-center justify-center gap-1.5 hover:text-on-surface transition-all';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-error animate-pulse';
    if (title) title.textContent = appState.editingBillId ? 'Editar Despesa' : 'Nova Despesa';
    if (amountLabel) amountLabel.textContent = 'Valor da Despesa';
    if (impactDiv) impactDiv.className = 'flex items-center gap-1 text-error font-label-sm text-[11px] bg-error-container/40 dark:bg-red-950/50 px-3 py-0.5 rounded-full mt-1';
    if (impactIcon) impactIcon.textContent = 'trending_down';
    if (impactText) impactText.textContent = 'Impacto negativo no orçamento';
    if (dateLabel) dateLabel.textContent = 'Data de Vencimento (DD/MM/AAAA)';
    if (saveBtn) {
      saveBtn.className = 'w-full h-11 bg-primary text-on-primary rounded-xl font-headline-sm text-[14px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer';
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span><span>Salvar Despesa</span>';
    }
  }

  renderModalCategories();
}

function renderModalCategories() {
  const container = document.getElementById('modal-categories-list');
  if (!container) return;

  const categories = appState.entryNature === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  // Garantir que selectedCategory pertence à lista atual
  if (!categories.some(c => c.id === appState.selectedCategory)) {
    appState.selectedCategory = categories[0].id;
  }

  const label = document.getElementById('modal-selected-cat-name');
  if (label) label.textContent = appState.selectedCategory;

  container.innerHTML = categories.map(cat => {
    const isSelected = cat.id === appState.selectedCategory;
    const isReceita = appState.entryNature === 'receita';
    const activeColor = isReceita ? 'bg-secondary text-on-secondary border-secondary' : 'bg-primary text-on-primary border-primary';

    if (isSelected) {
      return `
        <button class="cat-pill selected flex flex-col items-center gap-1 p-2 rounded-xl ${activeColor} shadow-sm min-w-[64px] transition-all cursor-pointer border" data-category="${cat.id}" onclick="selectCategoryInModal('${cat.id}')" type="button">
          <div class="cat-icon-container w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center text-inherit">
            <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
          </div>
          <span class="font-body-sm text-[11px] font-semibold">${escapeHtml(cat.label)}</span>
        </button>
      `;
    } else {
      return `
        <button class="cat-pill flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-container-lowest shadow-sm min-w-[64px] text-on-surface-variant hover:text-on-surface transition-all cursor-pointer border border-surface-container-high" data-category="${cat.id}" onclick="selectCategoryInModal('${cat.id}')" type="button">
          <div class="cat-icon-container w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
            <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
          </div>
          <span class="font-body-sm text-[11px]">${escapeHtml(cat.label)}</span>
        </button>
      `;
    }
  }).join('');
}

function openBillModal(billId = null) {
  appState.editingBillId = billId;
  const modal = document.getElementById('bill-modal');
  if (!modal) return;

  const nameInput = document.getElementById('modal-bill-name');
  const amountInput = document.getElementById('modal-amount-input');
  const dueDateInput = document.getElementById('modal-due-date');
  const installmentsContainer = document.getElementById('installments-container');
  const installmentsInput = document.getElementById('modal-installments-count');

  if (billId) {
    // Modo Edição
    const allBills = getStoredBills();
    const bill = allBills.find(b => b.id === billId);
    if (!bill) return;

    setBillNature(bill.nature || 'despesa');

    if (nameInput) nameInput.value = bill.name || '';
    if (amountInput) amountInput.value = bill.amount ? bill.amount.toFixed(2).replace('.', ',') : '';
    if (dueDateInput) dueDateInput.value = formatDateBR(bill.dueDate);

    selectCategoryInModal(bill.category || (bill.nature === 'receita' ? 'Salário' : 'Moradia'));
    setBillType(bill.type || 'parcelada');

    if (installmentsContainer) installmentsContainer.classList.add('hidden');
  } else {
    // Modo Novo Lançamento
    setBillNature('despesa');

    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';

    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(appState.currentMonth).padStart(2, '0');
    const y = appState.currentYear;
    if (dueDateInput) dueDateInput.value = `${d}/${m}/${y}`;

    if (installmentsInput) installmentsInput.value = '1';
    selectCategoryInModal('Moradia');
    setBillType('parcelada');

    if (installmentsContainer) installmentsContainer.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeBillModal() {
  const modal = document.getElementById('bill-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  appState.editingBillId = null;
}

function setBillType(type) {
  appState.billType = type;
  const tabParcelada = document.getElementById('tab-parcelada');
  const tabFixa = document.getElementById('tab-fixa');
  const installmentsContainer = document.getElementById('installments-container');

  if (type === 'parcelada') {
    if (tabParcelada) {
      tabParcelada.className = 'w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface font-headline-sm text-label-md flex items-center justify-center gap-1.5 transition-all';
    }
    if (tabFixa) {
      tabFixa.className = 'w-full py-1.5 px-2 rounded-lg text-on-surface-variant font-headline-sm text-label-md flex items-center justify-center gap-1.5 hover:text-on-surface transition-all';
    }
    if (installmentsContainer && !appState.editingBillId) {
      installmentsContainer.classList.remove('hidden');
    }
  } else {
    if (tabFixa) {
      tabFixa.className = 'w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface font-headline-sm text-label-md flex items-center justify-center gap-1.5 transition-all';
    }
    if (tabParcelada) {
      tabParcelada.className = 'w-full py-1.5 px-2 rounded-lg text-on-surface-variant font-headline-sm text-label-md flex items-center justify-center gap-1.5 hover:text-on-surface transition-all';
    }
    if (installmentsContainer) {
      installmentsContainer.classList.add('hidden');
    }
  }
}

function selectCategoryInModal(categoryName) {
  appState.selectedCategory = categoryName;
  const label = document.getElementById('modal-selected-cat-name');
  if (label) label.textContent = categoryName;

  document.querySelectorAll('#modal-categories-list .cat-pill').forEach(pill => {
    const catAttr = pill.getAttribute('data-category');
    const isSelected = catAttr === categoryName;
    const isReceita = appState.entryNature === 'receita';
    const activeColor = isReceita ? 'bg-secondary text-on-secondary border-secondary' : 'bg-primary text-on-primary border-primary';

    if (isSelected) {
      pill.className = `cat-pill selected flex flex-col items-center gap-1 p-2 rounded-xl ${activeColor} shadow-sm min-w-[64px] transition-all cursor-pointer border`;
    } else {
      pill.className = `cat-pill flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-container-lowest shadow-sm min-w-[64px] text-on-surface-variant hover:text-on-surface transition-all cursor-pointer border border-surface-container-high`;
    }
  });
}

function setDateShortcut(type) {
  const dateInput = document.getElementById('modal-due-date');
  if (!dateInput) return;

  const today = new Date();
  let target = new Date();

  if (type === 'Hoje') {
    target = today;
  } else if (type === 'Amanhã') {
    target.setDate(today.getDate() + 1);
  } else if (type === 'Próximo dia 10') {
    if (today.getDate() >= 10) {
      target.setMonth(today.getMonth() + 1);
    }
    target.setDate(10);
  } else if (type === 'Próximo dia 15') {
    if (today.getDate() >= 15) {
      target.setMonth(today.getMonth() + 1);
    }
    target.setDate(15);
  }

  const d = String(target.getDate()).padStart(2, '0');
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const y = target.getFullYear();

  dateInput.value = `${d}/${m}/${y}`;
}

async function handleSaveBillForm() {
  const nameInput = document.getElementById('modal-bill-name');
  const amountInput = document.getElementById('modal-amount-input');
  const dueDateInput = document.getElementById('modal-due-date');
  const installmentsInput = document.getElementById('modal-installments-count');
  const repeatToggle = document.getElementById('modal-repeat-toggle');

  const name = nameInput ? nameInput.value.trim() : '';
  const amount = parseCurrencyInput(amountInput ? amountInput.value : '');
  const dueDateBR = dueDateInput ? dueDateInput.value.trim() : '';
  const nature = appState.entryNature || 'despesa';

  if (!name) {
    alert(`Por favor, informe a descrição ou nome da ${nature === 'receita' ? 'receita' : 'despesa'}.`);
    if (nameInput) nameInput.focus();
    return;
  }

  if (amount <= 0) {
    alert('Por favor, informe um valor válido.');
    if (amountInput) amountInput.focus();
    return;
  }

  const isoDueDate = parseDateBR(dueDateBR);
  if (!isoDueDate || isNaN(Date.parse(isoDueDate))) {
    alert('Por favor, informe uma data válida (DD/MM/AAAA).');
    if (dueDateInput) dueDateInput.focus();
    return;
  }

  const allBills = getStoredBills();
  let billToUpsert = null;
  let billsToInsert = [];

  if (appState.editingBillId) {
    // Atualização de registro existente
    const index = allBills.findIndex(b => b.id === appState.editingBillId);
    if (index !== -1) {
      allBills[index] = {
        ...allBills[index],
        name,
        amount,
        dueDate: isoDueDate,
        category: appState.selectedCategory,
        nature: nature,
        type: appState.billType,
        updatedAt: new Date().toISOString()
      };
      billToUpsert = allBills[index];
      saveStoredBills(allBills);
      showToast(`${nature === 'receita' ? 'Receita' : 'Despesa'} "${name}" atualizada com sucesso!`);
    }
  } else {
    // Novo Registro
    const numInstallments = appState.billType === 'parcelada' && installmentsInput 
      ? Math.max(1, parseInt(installmentsInput.value, 10) || 1) 
      : 1;

    const repeatMonths = appState.billType === 'fixa' && repeatToggle && repeatToggle.checked 
      ? 12 
      : 1;

    const countToGenerate = appState.billType === 'parcelada' ? numInstallments : repeatMonths;
    const baseDate = new Date(isoDueDate + 'T12:00:00');

    for (let i = 0; i < countToGenerate; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + i);

      const d = String(installmentDate.getDate()).padStart(2, '0');
      const m = String(installmentDate.getMonth() + 1).padStart(2, '0');
      const y = installmentDate.getFullYear();
      const currentIsoDate = `${y}-${m}-${d}`;

      let billTitle = name;
      if (appState.billType === 'parcelada' && numInstallments > 1) {
        billTitle = `${name} (${i + 1}/${numInstallments})`;
      }

      const newBill = {
        id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '_' + i,
        name: billTitle,
        amount: amount,
        dueDate: currentIsoDate,
        category: appState.selectedCategory,
        nature: nature,
        type: appState.billType,
        currentInstallment: i + 1,
        totalInstallments: numInstallments,
        status: 'pending',
        paidAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      allBills.push(newBill);
      billsToInsert.push(newBill);
    }

    saveStoredBills(allBills);

    if (countToGenerate > 1) {
      showToast(`${countToGenerate} lançamentos gerados com sucesso!`);
    } else {
      showToast(`${nature === 'receita' ? 'Receita' : 'Despesa'} "${name}" adicionada com sucesso!`);
    }
  }

  closeBillModal();
  renderCurrentView();

  // Sincronização Supabase
  if (supabaseClient) {
    try {
      updateSupabaseSyncStatus('syncing');
      if (billToUpsert) {
        const { error } = await supabaseClient
          .from('bills')
          .upsert(mapAppBillToSupabase(billToUpsert));
        if (error) console.error('Erro ao atualizar no Supabase:', error);
      } else if (billsToInsert.length > 0) {
        const { error } = await supabaseClient
          .from('bills')
          .insert(billsToInsert.map(mapAppBillToSupabase));
        if (error) console.error('Erro ao inserir no Supabase:', error);
      }
      updateSupabaseSyncStatus('connected');
    } catch (err) {
      console.error('Falha ao salvar no Supabase:', err);
      updateSupabaseSyncStatus('error');
    }
  }
}

async function toggleBillPayment(billId) {
  const allBills = getStoredBills();
  const bill = allBills.find(b => b.id === billId);
  if (!bill) return;

  const isReceita = bill.nature === 'receita';

  if (bill.status === 'paid') {
    bill.status = 'pending';
    bill.paidAt = null;
    showToast(`"${bill.name}" marcada como pendente.`);
  } else {
    bill.status = 'paid';
    bill.paidAt = new Date().toISOString();
    showToast(`"${bill.name}" (${formatCurrency(bill.amount)}) foi ${isReceita ? 'recebida' : 'liquidada'}!`);
  }
  bill.updatedAt = new Date().toISOString();

  saveStoredBills(allBills);
  renderCurrentView();

  // Sincronização Supabase
  if (supabaseClient) {
    try {
      updateSupabaseSyncStatus('syncing');
      const { error } = await supabaseClient
        .from('bills')
        .update({
          status: bill.status,
          paid_at: bill.paidAt,
          updated_at: bill.updatedAt
        })
        .eq('id', billId);

      if (error) console.error('Erro ao atualizar status no Supabase:', error);
      updateSupabaseSyncStatus('connected');
    } catch (err) {
      console.error('Falha ao sincronizar no Supabase:', err);
      updateSupabaseSyncStatus('error');
    }
  }
}

function editBill(billId) {
  openBillModal(billId);
}

async function confirmDeleteBill(billId) {
  const allBills = getStoredBills();
  const bill = allBills.find(b => b.id === billId);
  if (!bill) return;

  const isReceita = bill.nature === 'receita';

  if (confirm(`Deseja realmente excluir a ${isReceita ? 'receita' : 'despesa'} "${bill.name}"?`)) {
    const updated = allBills.filter(b => b.id !== billId);
    saveStoredBills(updated);
    showToast(`${isReceita ? 'Receita' : 'Despesa'} "${bill.name}" excluída.`);
    renderCurrentView();

    // Sincronização Supabase
    if (supabaseClient) {
      try {
        updateSupabaseSyncStatus('syncing');
        const { error } = await supabaseClient
          .from('bills')
          .delete()
          .eq('id', billId);

        if (error) console.error('Erro ao excluir no Supabase:', error);
        updateSupabaseSyncStatus('connected');
      } catch (err) {
        console.error('Falha ao excluir no Supabase:', err);
        updateSupabaseSyncStatus('error');
      }
    }
  }
}

// ==========================================
// Toasts & Notificações de Feedback
// ==========================================

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('app-toast');
  const toastMsg = document.getElementById('app-toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;

  toast.classList.remove('-translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('-translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ==========================================
// Inicialização do Aplicativo
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Tema (Claro / Escuro com persistência)
  initTheme();

  // Inicializar Conexão Supabase em Tempo Real
  initSupabase();

  // Configurar ano e mês atual com base na data do sistema
  const now = new Date();
  appState.currentYear = now.getFullYear();
  appState.currentMonth = now.getMonth() + 1;

  // Busca em tempo real na aba Contas
  const searchInput = document.getElementById('bill-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderBillsView();
    });
  }

  // Recorrência panel toggle
  const repeatToggle = document.getElementById('modal-repeat-toggle');
  const repeatPanel = document.getElementById('modal-recurrence-panel');
  if (repeatToggle && repeatPanel) {
    repeatToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        repeatPanel.classList.remove('hidden');
        repeatPanel.classList.add('flex');
      } else {
        repeatPanel.classList.add('hidden');
        repeatPanel.classList.remove('flex');
      }
    });
  }

  // Máscara no input de valor
  const amountInput = document.getElementById('modal-amount-input');
  if (amountInput) {
    amountInput.addEventListener('blur', function() {
      if (this.value) {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
          this.value = val.toFixed(2).replace('.', ',');
        }
      }
    });
  }

  // Render inicial
  switchTab('inicio');
});
