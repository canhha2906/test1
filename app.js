// ---------- State ----------
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

// ---------- DOM refs ----------
const budgetLabel      = document.getElementById('budget-label');
const editBudgetBtn    = document.getElementById('edit-budget-btn');
const budgetForm       = document.getElementById('budget-form');
const budgetInput      = document.getElementById('budget-input');
const saveBudgetBtn    = document.getElementById('save-budget-btn');
const cancelBudgetBtn  = document.getElementById('cancel-budget-btn');

const summaryBudget    = document.getElementById('summary-budget');
const summarySpent     = document.getElementById('summary-spent');
const summaryRemaining = document.getElementById('summary-remaining');
const progressBar      = document.getElementById('progress-bar');
const progressLabel    = document.getElementById('progress-label');
const overBudgetAlert  = document.getElementById('over-budget-alert');

const expenseForm      = document.getElementById('expense-form');
const expenseName      = document.getElementById('expense-name');
const expenseAmount    = document.getElementById('expense-amount');
const expenseList      = document.getElementById('expense-list');
const emptyState       = document.getElementById('empty-state');
const clearAllBtn      = document.getElementById('clear-all-btn');

// ---------- Helpers ----------
function fmt(n) {
  return '$' + n.toFixed(2);
}

function totalSpent() {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function save() {
  localStorage.setItem('budget', budget);
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------- Render ----------
function render() {
  const spent     = totalSpent();
  const remaining = budget - spent;
  const pct       = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  // Budget label
  budgetLabel.textContent = budget > 0 ? fmt(budget) + ' / month' : 'No budget set';

  // Summary
  summaryBudget.textContent    = fmt(budget);
  summarySpent.textContent     = fmt(spent);
  summaryRemaining.textContent = fmt(Math.abs(remaining));

  summaryRemaining.className = 'summary-value ' + (remaining >= 0 ? 'positive' : 'negative');
  summaryRemaining.textContent = (remaining < 0 ? '-' : '') + fmt(Math.abs(remaining));

  // Progress bar
  progressBar.style.width = pct + '%';
  progressBar.className   = 'progress-bar';
  if (pct >= 100 || remaining < 0) {
    progressBar.classList.add('danger');
  } else if (pct >= 75) {
    progressBar.classList.add('warning');
  }
  progressLabel.textContent = budget > 0
    ? Math.round((spent / budget) * 100) + '% used'
    : '0% used';

  // Over-budget alert
  if (remaining < 0) {
    overBudgetAlert.classList.remove('hidden');
    overBudgetAlert.textContent = 'You are over budget by ' + fmt(Math.abs(remaining)) + '!';
  } else {
    overBudgetAlert.classList.add('hidden');
  }

  // Expense list
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    expenseList.appendChild(emptyState);
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    expenses.slice().reverse().forEach((expense, reversedIdx) => {
      const realIdx = expenses.length - 1 - reversedIdx;
      const li = document.createElement('li');
      li.className = 'expense-item';
      li.innerHTML = `
        <div class="expense-info">
          <div class="expense-name">${escHtml(expense.name)}</div>
          <div class="expense-date">${formatDate(expense.date)}</div>
        </div>
        <span class="expense-amount">-${fmt(expense.amount)}</span>
        <button class="delete-btn" data-idx="${realIdx}" title="Delete">&#x2715;</button>
      `;
      expenseList.appendChild(li);
    });
  }
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- Budget handlers ----------
editBudgetBtn.addEventListener('click', () => {
  budgetForm.classList.remove('hidden');
  budgetInput.value = budget > 0 ? budget : '';
  budgetInput.focus();
  editBudgetBtn.classList.add('hidden');
});

cancelBudgetBtn.addEventListener('click', () => {
  budgetForm.classList.add('hidden');
  editBudgetBtn.classList.remove('hidden');
});

saveBudgetBtn.addEventListener('click', () => {
  const val = parseFloat(budgetInput.value);
  if (isNaN(val) || val <= 0) {
    budgetInput.focus();
    return;
  }
  budget = val;
  save();
  budgetForm.classList.add('hidden');
  editBudgetBtn.classList.remove('hidden');
  render();
});

// Allow pressing Enter in budget input
budgetInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveBudgetBtn.click();
  if (e.key === 'Escape') cancelBudgetBtn.click();
});

// ---------- Expense handlers ----------
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name   = expenseName.value.trim();
  const amount = parseFloat(expenseAmount.value);
  if (!name || isNaN(amount) || amount <= 0) return;

  expenses.push({ name, amount, date: new Date().toISOString() });
  save();
  render();

  expenseName.value   = '';
  expenseAmount.value = '';
  expenseName.focus();
});

expenseList.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  expenses.splice(idx, 1);
  save();
  render();
});

clearAllBtn.addEventListener('click', () => {
  if (expenses.length === 0) return;
  if (confirm('Delete all expenses?')) {
    expenses = [];
    save();
    render();
  }
});

// ---------- Init ----------
render();
