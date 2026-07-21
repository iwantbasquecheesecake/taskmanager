/* ==========================================
   OneGlance Roles - Main Application Logic
   ========================================== */

import { store } from './store.js';

// Calculate D-Day Difference from Today
function getDDayString(dueDateStr) {
  if (!dueDateStr) return 'D-Day';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dueDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day!';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

// Calculate Diff Days from Selected Date
function getDiffDaysFromSelected(dueDateStr, selectedDateISO) {
  if (!dueDateStr) return 999;
  const selDate = new Date(selectedDateISO);
  selDate.setHours(0, 0, 0, 0);

  const targetDate = new Date(dueDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - selDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format Date string
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// Format Date ISO (YYYY-MM-DD)
function formatDateISO(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get Role Obj
function getRole(roles, roleId) {
  return roles.find(r => r.id === roleId) || { name: '일반', color: '#2d5a27' };
}

class AppUI {
  constructor() {
    this.appEl = document.getElementById('app');
    this.viewMode = 'dashboard';
    this.calendarDate = new Date();
    this.selectedDateISO = formatDateISO(new Date());
    this.init();
    store.subscribe(() => this.render());
  }

  init() {
    this.render();
    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeRoleModal();
      }
    });
  }

  openRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.add('open');
  }

  closeRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.remove('open');
  }

  renderCalendarDays(filteredItems, roles) {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayISO = formatDateISO(new Date());

    const daysHTML = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      daysHTML.push(`
        <div class="calendar-day-cell other-month">
          <span class="day-number">${pDay}</span>
        </div>
      `);
    }

    for (let d = 1; d <= totalDays; d++) {
      const currentDateObj = new Date(year, month, d);
      const dateISO = formatDateISO(currentDateObj);
      const isToday = dateISO === todayISO;
      const isSelected = dateISO === this.selectedDateISO;

      const daysEvents = filteredItems.filter(i => i.dueDate && i.dueDate === dateISO);

      daysHTML.push(`
        <div class="calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date-iso="${dateISO}">
          <span class="day-number">${d}</span>
          <div class="day-events">
            ${daysEvents.map(item => {
              const role = getRole(roles, item.roleId);
              return `
                <div class="event-chip" style="background: ${role.color}22; color: ${role.color}; border: 1px solid ${role.color}40;" title="${this.escapeHtml(item.title)}">
                  <i data-lucide="${item.type === 'dday' ? 'trophy' : 'bell'}" style="width: 10px; height: 10px; flex-shrink: 0;"></i>
                  <span>${this.escapeHtml(item.title)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `);
    }

    const totalCells = daysHTML.length;
    const remainingCells = (42 - totalCells) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      daysHTML.push(`
        <div class="calendar-day-cell other-month">
          <span class="day-number">${n}</span>
        </div>
      `);
    }

    return daysHTML.join('');
  }

  render() {
    const state = store.getState();
    const { roles, activeRoleId, filteredItems } = state;

    const ddayItems = filteredItems.filter(i => i.type === 'dday');
    const weeklyItems = filteredItems.filter(i => i.type === 'weekly');
    const reminderItems = filteredItems.filter(i => i.type === 'reminder');

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth() + 1;

    const sortedUpcomingTasks = [...filteredItems].sort((a, b) => {
      const diffA = getDiffDaysFromSelected(a.dueDate, this.selectedDateISO);
      const diffB = getDiffDaysFromSelected(b.dueDate, this.selectedDateISO);

      if (diffA >= 0 && diffB < 0) return -1;
      if (diffA < 0 && diffB >= 0) return 1;

      return diffA - diffB;
    });

    this.appEl.innerHTML = `
      <div class="app-container">
        <!-- App Header -->
        <header class="app-header">
          <div class="header-top">
            <div class="brand-title">
              <h1 style="font-size: 1.3rem;">놓지마 정신줄</h1>
            </div>






            <!-- View Switcher -->
            <div class="view-switcher">
              <button class="view-btn ${this.viewMode === 'dashboard' ? 'active' : ''}" id="btn-view-dashboard">
                <i data-lucide="layout-grid" style="width: 14px; height: 14px;"></i>
                3단 대시보드
              </button>
              <button class="view-btn ${this.viewMode === 'calendar' ? 'active' : ''}" id="btn-view-calendar">
                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                월간 캘린더 + 임박순
              </button>
            </div>

            <!-- Role Filter Bar -->
            <div class="role-bar">
              ${roles.map(role => {
                const isActive = activeRoleId === role.id;
                return `
                  <button 
                    class="role-chip ${isActive ? 'active' : ''}" 
                    data-role-id="${role.id}"
                    style="${isActive ? `--chip-color: ${role.color}; --chip-shadow: ${role.shadow || role.color + '66'};` : ''}"
                  >
                    <span>${role.name}</span>
                  </button>
                `;
              }).join('')}
              <button class="btn-add-role" id="btn-open-role-modal">
                <i data-lucide="settings" style="width: 13px; height: 13px;"></i>
                설정 & 커스텀
              </button>
            </div>
          </div>

          <!-- Quick Add Bar -->
          <form class="quick-add-container" id="quick-add-form">
            <i data-lucide="sparkles" style="color: var(--accent-forest); width: 16px; height: 16px;"></i>
            <input 
              type="text" 
              id="input-title" 
              class="quick-add-input" 
              placeholder="자신만의 할 일, 자격증, 병원 예약을 1초 만에 등록하세요..." 
              required 
              autocomplete="off"
            />
            
            <select id="select-type" class="select-type">
              <option value="weekly">📅 이번 주 과제</option>
              <option value="reminder">🔔 일상</option>
              <option value="dday">🏆 D-Day 마감일/시험</option>
            </select>



            <select id="select-role" class="select-role-inline">
              ${roles.filter(r => r.id !== 'all').map(r => `
                <option value="${r.id}" ${activeRoleId === r.id ? 'selected' : ''}>${r.name}</option>
              `).join('')}
            </select>

            <button type="submit" class="btn-primary" style="padding: 6px 14px;">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
              등록
            </button>
          </form>
        </header>

        <!-- Main Content View Switch -->
        ${this.viewMode === 'dashboard' ? `
          <!-- 3-Column Grid Dashboard -->
          <main class="dashboard-grid">
            
            <!-- Column 1: D-Day & Long-term Goals -->
            <section class="column-card">
              <div class="column-header">
                <div class="column-title">
                  <div class="column-icon icon-dday">
                    <i data-lucide="trophy" style="width: 16px; height: 16px;"></i>
                  </div>
                  <h2>D-Day & 마감일</h2>
                </div>
                <span class="item-count">${ddayItems.length}개</span>
              </div>

              <div class="item-list">
                ${ddayItems.length === 0 ? `
                  <div class="empty-state">
                    <i data-lucide="calendar" style="width: 32px; height: 32px;"></i>
                    <p style="font-size: 0.85rem;">등록된 D-Day 시험이나 마감일이 없습니다.</p>
                  </div>
                ` : ddayItems.map(item => {
                  const role = getRole(roles, item.roleId);
                  const ddayStr = getDDayString(item.dueDate);
                  return `
                    <div class="dday-card">
                      <div class="dday-top">
                        <div class="dday-info">
                          <h3 style="font-size: 0.95rem;">${this.escapeHtml(item.title)}</h3>
                          <span class="role-tag" style="background: ${role.color}15; color: ${role.color};">
                            ${role.name}
                          </span>
                        </div>
                        <span class="dday-badge">${ddayStr}</span>
                      </div>
                      <div class="dday-meta">
                        <span>🎯 마감: ${formatDate(item.dueDate) || '날짜 미정'}</span>
                        <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                          <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>

            <!-- Column 2: Weekly Focus Tasks -->
            <section class="column-card">
              <div class="column-header">
                <div class="column-title">
                  <div class="column-icon icon-weekly">
                    <i data-lucide="check-square" style="width: 16px; height: 16px;"></i>
                  </div>
                  <h2>이번 주 핵심 과제</h2>
                </div>
                <span class="item-count">${weeklyItems.filter(i => !i.completed).length}개 남음</span>
              </div>

              <div class="item-list">
                ${weeklyItems.length === 0 ? `
                  <div class="empty-state">
                    <i data-lucide="check-circle" style="width: 32px; height: 32px;"></i>
                    <p style="font-size: 0.85rem;">이번 주 할 일이 비어있습니다!</p>
                  </div>
                ` : weeklyItems.map(item => {
                  const role = getRole(roles, item.roleId);
                  return `
                    <div class="task-item ${item.completed ? 'completed' : ''}">
                      <div class="task-checkbox ${item.completed ? 'checked' : ''}" data-toggle-id="${item.id}">
                        ${item.completed ? '<i data-lucide="check" style="width: 13px; height: 13px;"></i>' : ''}
                      </div>
                      <div class="task-content">
                        <span class="task-title" style="font-size: 0.9rem;">${this.escapeHtml(item.title)}</span>
                        <span class="role-tag" style="background: ${role.color}15; color: ${role.color}; width: fit-content;">
                          ${role.name}
                        </span>
                      </div>
                      <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>

            <!-- Column 3: Quick Life Reminders -->
            <section class="column-card">
              <div class="column-header">
                <div class="column-title">
                  <div class="column-icon icon-reminder">
                    <i data-lucide="bell" style="width: 16px; height: 16px;"></i>
                  </div>
                  <h2>일상</h2>
                </div>
                <span class="item-count">${reminderItems.filter(i => !i.completed).length}개</span>
              </div>


              <div class="item-list">
                ${reminderItems.length === 0 ? `
                  <div class="empty-state">
                    <i data-lucide="heart" style="width: 32px; height: 32px;"></i>
                    <p style="font-size: 0.85rem;">병원 예약, 중요 전화 등을 적어두세요.</p>
                  </div>
                ` : reminderItems.map(item => {
                  const role = getRole(roles, item.roleId);
                  return `
                    <div class="reminder-item ${item.completed ? 'completed' : ''} ${item.pinned ? 'pinned' : ''}">
                      <div class="task-checkbox ${item.completed ? 'checked' : ''}" data-toggle-id="${item.id}">
                        ${item.completed ? '<i data-lucide="check" style="width: 13px; height: 13px;"></i>' : ''}
                      </div>
                      <div class="task-content">
                        <div style="display: flex; gap: 6px; align-items: center;">
                          <span class="reminder-cat-badge">${item.category || '📌 리마인더'}</span>
                          <span class="task-title" style="font-size: 0.88rem;">${this.escapeHtml(item.title)}</span>
                        </div>
                        <span class="role-tag" style="background: ${role.color}15; color: ${role.color}; width: fit-content;">
                          ${role.name}
                        </span>
                      </div>
                      <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>

          </main>
        ` : `
          <!-- Calendar 2-Column Layout -->
          <div class="calendar-layout-grid">
            <main class="calendar-card" style="padding: 16px;">
              <div class="calendar-header">
                <div class="column-title">
                  <div class="column-icon icon-dday">
                    <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                  </div>
                  <h2 style="font-size: 1.05rem;">월간 일정 캘린더</h2>
                </div>

                <div class="calendar-controls">
                  <button class="btn-nav-month" id="btn-prev-month">
                    <i data-lucide="chevron-left" style="width: 15px; height: 15px;"></i>
                  </button>
                  <h3 class="calendar-month-title" style="font-size: 1.1rem; min-width: 110px;">${year}년 ${month}월</h3>
                  <button class="btn-nav-month" id="btn-next-month">
                    <i data-lucide="chevron-right" style="width: 15px; height: 15px;"></i>
                  </button>
                </div>
              </div>

              <div class="calendar-grid-weekdays">
                <span class="weekday-sun">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span class="weekday-sat">토</span>
              </div>

              <div class="calendar-grid-days">
                ${this.renderCalendarDays(filteredItems, roles)}
              </div>
            </main>

            <aside class="calendar-side-card">
              <div class="column-header" style="padding-bottom: 8px;">
                <div class="column-title">
                  <div class="column-icon icon-weekly">
                    <i data-lucide="flame" style="width: 15px; height: 15px; color: var(--accent-warm-earth);"></i>
                  </div>
                  <div>
                    <h2 style="font-size: 0.95rem;">마감 임박순 태스크</h2>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${this.selectedDateISO} 기준</span>
                  </div>
                </div>
              </div>

              <div class="item-list" style="max-height: 480px;">
                ${sortedUpcomingTasks.length === 0 ? `
                  <div class="empty-state" style="padding: 24px 10px;">
                    <i data-lucide="check-circle" style="width: 28px; height: 28px;"></i>
                    <p style="font-size: 0.8rem;">등록된 일정이 없습니다.</p>
                  </div>
                ` : sortedUpcomingTasks.map(item => {
                  const role = getRole(roles, item.roleId);
                  const diffDays = getDiffDaysFromSelected(item.dueDate, this.selectedDateISO);
                  let urgencyBadge = '';
                  let badgeBg = 'rgba(0, 0, 0, 0.05)';
                  let badgeColor = 'var(--text-muted)';

                  if (diffDays === 999) {
                    urgencyBadge = '상시';
                  } else if (diffDays === 0) {
                    urgencyBadge = '🔥 오늘 마감!';
                    badgeBg = 'rgba(224, 122, 95, 0.18)';
                    badgeColor = 'var(--accent-warm-earth)';
                  } else if (diffDays > 0) {
                    urgencyBadge = `${diffDays}일 남음`;
                    if (diffDays <= 3) {
                      badgeBg = 'rgba(45, 90, 39, 0.12)';
                      badgeColor = 'var(--accent-forest)';
                    }
                  } else {
                    urgencyBadge = `${Math.abs(diffDays)}일 지남`;
                  }

                  return `
                    <div class="side-task-item ${item.completed ? 'completed' : ''}">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                        <span class="task-title" style="font-size: 0.88rem; flex: 1;">${this.escapeHtml(item.title)}</span>
                        <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; white-space: nowrap;">
                          ${urgencyBadge}
                        </span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                        <span class="role-tag" style="background: ${role.color}15; color: ${role.color}; font-size: 0.7rem;">
                          ${role.name}
                        </span>
                        <span style="font-size: 0.7rem; color: var(--text-dim);">
                          🎯 ${item.dueDate ? formatDate(item.dueDate) : '기한 없음'}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </aside>
          </div>
        `}
      </div>

      <!-- Settings Modal -->
      <div class="modal-overlay" id="role-modal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>설정 & 커스텀 관리</h3>
            <button class="btn-close" id="btn-close-modal">✕</button>
          </div>

          <form id="form-add-role" class="form-group">
            <label style="font-weight: 600;">1. 나만의 역할(Role) 추가하기</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="role-name-input" class="form-input" placeholder="예: 💼 동아리장, 🚗 운전면허..." required style="flex: 1;" />
              <input type="color" id="role-color-input" value="#2d5a27" style="width: 40px; height: 38px; border: none; border-radius: 6px; cursor: pointer; background: transparent;" />
              <button type="submit" class="btn-primary">추가</button>
            </div>
          </form>

          <div style="border-top: 1px solid var(--border-color); pt-3;">
            <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 8px;">현재 카테고리 목록 (색상 팔레트를 눌러 색상 변경 가능)</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto;">
              ${roles.filter(r => r.id !== 'all').map(r => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(0,0,0,0.03); border-radius: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="color" class="input-role-color" data-color-role-id="${r.id}" value="${r.color}" title="색상 변경" style="width: 22px; height: 22px; border: none; border-radius: 50%; cursor: pointer; background: transparent; padding: 0;" />
                    <span style="color: ${r.color}; font-weight: 600; font-size: 0.88rem;">${r.name}</span>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn-action-edit" data-edit-role-id="${r.id}" title="이름 수정" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s ease;">
                      이름 수정
                    </button>
                    <button class="btn-action-delete" data-delete-role-id="${r.id}" title="삭제" style="opacity: 1; font-size: 0.75rem;">
                      삭제
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); pt-3; display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">2. 플래너 초기화</label>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-primary" id="btn-clear-tasks" style="background: rgba(224, 122, 95, 0.15); color: var(--accent-warm-earth); border: 1px solid rgba(224, 122, 95, 0.3); flex: 1;">
                🧹 모든 할 일 비우기
              </button>
              <button type="button" class="btn-primary" id="btn-load-samples" style="background: rgba(45, 90, 39, 0.12); color: var(--accent-forest); border: 1px solid rgba(45, 90, 39, 0.25); flex: 1;">
                💡 가이드 샘플 불러오기
              </button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); pt-3; display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">3. 내 데이터 백업 & 복원</label>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-primary" id="btn-export-json" style="background: rgba(0, 0, 0, 0.05); color: var(--text-main); border: 1px solid var(--border-color); flex: 1;">
                💾 JSON 내보내기
              </button>
              <button type="button" class="btn-primary" id="btn-import-json" style="background: rgba(0, 0, 0, 0.05); color: var(--text-main); border: 1px solid var(--border-color); flex: 1;">
                📂 JSON 불러오기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.attachEvents();
  }

  escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  attachEvents() {
    document.querySelectorAll('.calendar-day-cell[data-date-iso]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateISO = e.currentTarget.getAttribute('data-date-iso');
        if (dateISO) {
          this.selectedDateISO = dateISO;
          this.render();
        }
      });
    });

    const btnViewDash = document.getElementById('btn-view-dashboard');
    if (btnViewDash) {
      btnViewDash.addEventListener('click', () => {
        this.viewMode = 'dashboard';
        this.render();
      });
    }

    const btnViewCal = document.getElementById('btn-view-calendar');
    if (btnViewCal) {
      btnViewCal.addEventListener('click', () => {
        this.viewMode = 'calendar';
        this.render();
      });
    }

    const btnPrevMonth = document.getElementById('btn-prev-month');
    if (btnPrevMonth) {
      btnPrevMonth.addEventListener('click', () => {
        this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
        this.render();
      });
    }

    const btnNextMonth = document.getElementById('btn-next-month');
    if (btnNextMonth) {
      btnNextMonth.addEventListener('click', () => {
        this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
        this.render();
      });
    }

    document.querySelectorAll('.role-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.currentTarget.getAttribute('data-role-id');
        store.setActiveRole(roleId);
      });
    });

    const quickForm = document.getElementById('quick-add-form');
    if (quickForm) {
      quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('input-title');
        const typeSelect = document.getElementById('select-type');
        const roleSelect = document.getElementById('select-role');

        const title = titleInput.value.trim();
        const type = typeSelect.value;
        const roleId = roleSelect.value;

        if (!title) return;

        let dueDate = this.selectedDateISO || formatDateISO(new Date());
        let category = '📌 일반';

        if (type === 'dday') {
          const userDate = prompt('마감일 또는 시험일을 입력하세요 (YYYY-MM-DD):', dueDate);
          if (!userDate) return;
          dueDate = userDate;
        } else if (type === 'reminder') {
          if (title.includes('병원') || title.includes('진료') || title.includes('검진')) category = '🏥 병원';
          else if (title.includes('전화') || title.includes('연락') || title.includes('통화')) category = '📞 중요 연락';
          else if (title.includes('과제') || title.includes('제출') || title.includes('보고서')) category = '📝 과제';
        }

        store.addItem({
          title,
          type,
          roleId,
          dueDate,
          category
        });

        titleInput.value = '';
      });
    }

    document.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-toggle-id');
        store.toggleItemComplete(id);
      });
    });

    document.querySelectorAll('.btn-action-delete[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-id');
        if (confirm('이 항목을 삭제하시겠습니까?')) {
          store.deleteItem(id);
        }
      });
    });

    const btnOpenRole = document.getElementById('btn-open-role-modal');
    if (btnOpenRole) {
      btnOpenRole.addEventListener('click', () => this.openRoleModal());
    }

    const btnCloseRole = document.getElementById('btn-close-modal');
    if (btnCloseRole) {
      btnCloseRole.addEventListener('click', () => this.closeRoleModal());
    }

    const formAddRole = document.getElementById('form-add-role');
    if (formAddRole) {
      formAddRole.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputName = document.getElementById('role-name-input');
        const inputColor = document.getElementById('role-color-input');

        const name = inputName.value.trim();
        const color = inputColor.value;

        if (name) {
          store.addRole(name, color);
          inputName.value = '';
          this.closeRoleModal();
        }
      });
    }

    document.querySelectorAll('.input-role-color[data-color-role-id]').forEach(input => {
      input.addEventListener('change', (e) => {
        const roleId = e.currentTarget.getAttribute('data-color-role-id');
        const newColor = e.currentTarget.value;
        store.updateRole(roleId, null, newColor);
      });
    });

    document.querySelectorAll('.btn-action-edit[data-edit-role-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.currentTarget.getAttribute('data-edit-role-id');
        const currentRole = store.roles.find(r => r.id === roleId);
        if (currentRole) {
          const newName = prompt('변경할 카테고리 이름을 입력하세요:', currentRole.name);
          if (newName !== null && newName.trim() !== '') {
            store.updateRole(roleId, newName.trim(), null);
          }
        }
      });
    });

    document.querySelectorAll('.btn-action-delete[data-delete-role-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.currentTarget.getAttribute('data-delete-role-id');
        if (confirm('이 카테고리를 삭제하시겠습니까?')) {
          store.deleteRole(roleId);
        }
      });
    });

    const btnClearTasks = document.getElementById('btn-clear-tasks');
    if (btnClearTasks) {
      btnClearTasks.addEventListener('click', () => {
        if (confirm('모든 할 일을 비우고 새로 시작하시겠습니까?')) {
          store.clearAllTasks();
          this.closeRoleModal();
        }
      });
    }

    const btnLoadSamples = document.getElementById('btn-load-samples');
    if (btnLoadSamples) {
      btnLoadSamples.addEventListener('click', () => {
        if (confirm('가이드용 예시 데이터를 불러오시겠습니까?')) {
          store.loadSampleGuide();
          this.closeRoleModal();
        }
      });
    }

    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        const json = store.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_planner_backup_${formatDateISO(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const btnImportJSON = document.getElementById('btn-import-json');
    if (btnImportJSON) {
      btnImportJSON.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const ok = store.importJSON(event.target.result);
              if (ok) {
                alert('성공적으로 불러왔습니다.');
                this.closeRoleModal();
              } else {
                alert('올바르지 않은 파일입니다.');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      });
    }
  }
}

new AppUI();
