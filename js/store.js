/* ==========================================
   OneGlance Roles - LocalStorage State Store
   ========================================== */

const STORAGE_KEY = 'oneglance_roles_data_v1';

// Default Initial Roles
const DEFAULT_ROLES = [
  { id: 'all', name: '✨ 전체 보기', icon: 'Sparkles', color: '#2d5a27', shadow: 'rgba(45, 90, 39, 0.3)' },
  { id: 'role-president', name: '👑 학생회장', icon: 'Crown', color: '#3a6b35', shadow: 'rgba(58, 107, 53, 0.3)' },
  { id: 'role-student', name: '🎓 대학생', icon: 'GraduationCap', color: '#1f6f8b', shadow: 'rgba(31, 111, 139, 0.3)' },
  { id: 'role-personal', name: '🎈 개인', icon: 'Smile', color: '#e07a5f', shadow: 'rgba(224, 122, 95, 0.3)' }
];


// Initial Welcome Sample Items for First Time Users
const DEFAULT_ITEMS = [
  {
    id: 'dday-welcome-1',
    type: 'dday',
    roleId: 'role-student',
    title: '정보처리기사 실기 시험 📝',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    createdAt: Date.now()
  },
  {
    id: 'weekly-welcome-1',
    type: 'weekly',
    roleId: 'role-president',
    title: '학생회 각 부서 주간 예산안 검토',
    completed: false,
    createdAt: Date.now()
  },
  {
    id: 'rem-welcome-1',
    type: 'reminder',
    roleId: 'role-personal',
    category: '🏥 병원',
    title: '치과 정기 검진 예약 (오후 3시)',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    completed: false,
    pinned: true,
    createdAt: Date.now()
  }
];

// Initial Welcome Sample Goals for First Time Users
const DEFAULT_GOALS = [
  { id: 'goal-w1', text: '이번 주 자격증 인강 5개 이상 완강하기 📚', period: 'week', completed: false, createdAt: Date.now() },
  { id: 'goal-m1', text: '이번 달 정보처리기사 실기 시험 최종 합격 🏆', period: 'month', completed: false, createdAt: Date.now() }
];

class AppStore {
  constructor() {
    this.listeners = [];
    this.load();
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.roles = parsed.roles || DEFAULT_ROLES;
        this.items = parsed.items || DEFAULT_ITEMS;
        this.goals = parsed.goals || DEFAULT_GOALS;
        this.activeRoleId = parsed.activeRoleId || 'all';
      } catch (e) {
        console.error('Failed to parse local storage:', e);
        this.initDefault();
      }
    } else {
      this.initDefault();
    }
  }

  initDefault() {
    this.roles = [...DEFAULT_ROLES];
    this.items = [...DEFAULT_ITEMS];
    this.goals = [...DEFAULT_GOALS];
    this.activeRoleId = 'all';
    this.save();
  }

  resetToDefault() {
    this.initDefault();
  }

  clearAllTasks() {
    this.items = [];
    this.save();
  }

  clearAllGoals() {
    this.goals = [];
    this.save();
  }

  loadSampleGuide() {
    this.items = [...DEFAULT_ITEMS];
    this.goals = [...DEFAULT_GOALS];
    this.save();
  }

  exportJSON() {
    return JSON.stringify({
      roles: this.roles,
      items: this.items,
      goals: this.goals,
      version: '1.1'
    }, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.roles && parsed.items) {
        this.roles = parsed.roles;
        this.items = parsed.items;
        this.goals = parsed.goals || [];
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }

  save() {
    const data = {
      roles: this.roles,
      items: this.items,
      goals: this.goals,
      activeRoleId: this.activeRoleId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.getState()));
  }

  getState() {
    return {
      roles: this.roles,
      items: this.items,
      activeRoleId: this.activeRoleId,
      filteredItems: this.getFilteredItems()
    };
  }

  setActiveRole(roleId) {
    this.activeRoleId = roleId;
    this.save();
  }

  getFilteredItems() {
    if (this.activeRoleId === 'all') {
      return this.items;
    }
    return this.items.filter(item => item.roleId === this.activeRoleId);
  }

  addItem(item) {
    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      completed: false,
      pinned: false,
      memo: '',
      createdAt: Date.now(),
      ...item
    };
    this.items.unshift(newItem);
    this.save();
  }

  updateItem(id, fields) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, fields);
      this.save();
    }
  }

  toggleItemComplete(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      this.save();
    }
  }

  deleteItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  }

  addRole(name, color) {
    const newRole = {
      id: 'role-' + Date.now(),
      name: name,
      color: color || '#2d5a27',
      shadow: `${color}66`
    };
    this.roles.push(newRole);
    this.save();
  }

  updateRole(roleId, newName, newColor) {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      if (newName) role.name = newName;
      if (newColor) {
        role.color = newColor;
        role.shadow = `${newColor}66`;
      }
      this.save();
    }
  }

  reorderRole(roleId, direction) {
    const idx = this.roles.findIndex(r => r.id === roleId);
    if (idx <= 0) return;

    if (direction === 'up' && idx > 1) {
      const temp = this.roles[idx];
      this.roles[idx] = this.roles[idx - 1];
      this.roles[idx - 1] = temp;
      this.save();
    } else if (direction === 'down' && idx < this.roles.length - 1) {
      const temp = this.roles[idx];
      this.roles[idx] = this.roles[idx + 1];
      this.roles[idx + 1] = temp;
      this.save();
    }
  }

  deleteRole(roleId) {
    if (roleId === 'all') return;
    this.roles = this.roles.filter(r => r.id !== roleId);
    const fallbackId = this.roles[1]?.id || 'all';
    this.items.forEach(item => {
      if (item.roleId === roleId) {
        item.roleId = fallbackId;
      }
    });
    if (this.activeRoleId === roleId) {
      this.activeRoleId = 'all';
    }
    this.save();
  }

  addGoal(text, period) {
    const newGoal = {
      id: 'goal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      text: text,
      period: period || 'week',
      completed: false,
      createdAt: Date.now()
    };
    this.goals.unshift(newGoal);
    this.save();
  }

  toggleGoalComplete(id) {
    const goal = this.goals.find(g => g.id === id);
    if (goal) {
      goal.completed = !goal.completed;
      this.save();
    }
  }

  deleteGoal(id) {
    this.goals = this.goals.filter(g => g.id !== id);
    this.save();
  }
}

export const store = new AppStore();
