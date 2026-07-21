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
    this.selectedItemId = null;
    this.isRoleModalOpen = false;
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
        this.closeDetailModal();
      }
    });
  }

  closeDetailModal() {
    this.selectedItemId = null;
    this.render();
  }

  openRoleModal() {
    this.isRoleModalOpen = true;
    this.render();
  }

  closeRoleModal() {
    this.isRoleModalOpen = false;
    this.render();
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
                대시보드
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
              placeholder="이곳에 할 일을 등록하세요..." 
              required 
              autocomplete="off"
            />
            
            <input 
              type="date" 
              id="input-date" 
              class="select-type" 
              value="${this.selectedDateISO || formatDateISO(new Date())}"
              title="날짜/마감일 선택"
              style="font-family: inherit; color: var(--text-main);"
            />

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
          ${activeRoleId === 'all' ? `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Overall Tasks Top Section -->
              <section class="column-card" style="border-top: 3.5px solid var(--accent-warm-earth);">
                <div class="column-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                  <div class="column-title">
                    <div class="column-icon icon-dday" style="background: rgba(224, 122, 95, 0.15); color: var(--accent-warm-earth);">
                      <i data-lucide="list-todo" style="width: 16px; height: 16px;"></i>
                    </div>
                    <div>
                      <h2 style="font-size: 1.05rem;">태스크</h2>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">카테고리 구분 없이 마감 임박순 정렬</span>
                    </div>
                  </div>
                  <span class="item-count" style="background: rgba(224, 122, 95, 0.15); color: var(--accent-warm-earth);">
                    ${sortedUpcomingTasks.filter(i => !i.completed).length}개 남음
                  </span>
                </div>

                <div class="item-list" style="max-height: 280px; overflow-y: auto;">
                  ${sortedUpcomingTasks.filter(i => !i.completed).length === 0 ? `
                    <div class="empty-state" style="padding: 20px 10px;">
                      <p style="font-size: 0.85rem; color: var(--text-muted);">남은 미완료 태스크가 없습니다! 🎉</p>
                    </div>
                  ` : sortedUpcomingTasks.filter(i => !i.completed).map(item => {
                    const role = getRole(roles, item.roleId);
                    const diffDays = getDiffDaysFromSelected(item.dueDate, this.selectedDateISO);
                    let ddayText = '';
                    let badgeBg = 'rgba(45, 90, 39, 0.1)';
                    let badgeColor = 'var(--accent-forest)';

                    if (diffDays === 999) {
                      ddayText = '📅 상시';
                      badgeBg = 'rgba(0, 0, 0, 0.05)';
                      badgeColor = 'var(--text-muted)';
                    } else if (diffDays === 0) {
                      ddayText = '🔥 오늘 마감!';
                      badgeBg = 'rgba(224, 122, 95, 0.2)';
                      badgeColor = 'var(--accent-warm-earth)';
                    } else if (diffDays > 0) {
                      ddayText = `D-${diffDays} (${formatDate(item.dueDate)})`;
                      if (diffDays <= 3) {
                        badgeBg = 'rgba(224, 122, 95, 0.15)';
                        badgeColor = 'var(--accent-warm-earth)';
                      }
                    } else {
                      ddayText = `D+${Math.abs(diffDays)} (${formatDate(item.dueDate)})`;
                      badgeBg = 'rgba(0,0,0,0.06)';
                      badgeColor = 'var(--text-dim)';
                    }

                    return `
                      <div class="task-item" data-detail-id="${item.id}" style="cursor: pointer;">
                        <div class="task-checkbox" data-toggle-id="${item.id}"></div>
                        <div class="task-content">
                          <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between;">
                            <span class="task-title" style="font-size: 0.9rem;">${this.escapeHtml(item.title)}</span>
                            <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; white-space: nowrap;">
                              ${ddayText}
                            </span>
                          </div>
                          <div style="display: flex; gap: 6px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
                            <span class="role-tag" style="background: ${role.color}15; color: ${role.color}; font-size: 0.72rem;">
                              ${role.name}
                            </span>
                            ${item.memo ? '<span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.04); padding: 1px 5px; border-radius: 4px;">📝 메모</span>' : ''}
                          </div>
                        </div>
                        <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                          <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </section>

              <!-- Overall View: Grid of All Categories -->
              <main class="dashboard-grid">
                ${roles.filter(r => r.id !== 'all').map(role => {
                  const roleItems = filteredItems.filter(item => item.roleId === role.id);
                  const pendingItems = roleItems.filter(i => !i.completed);

                  return `
                    <section class="column-card" style="border-top: 3.5px solid ${role.color};">
                      <div class="column-header">
                        <div class="column-title">
                          <span class="role-tag" style="background: ${role.color}18; color: ${role.color}; font-size: 0.95rem; padding: 4px 10px; font-weight: 700;">
                            ${role.name}
                          </span>
                        </div>
                        <span class="item-count" style="background: ${role.color}15; color: ${role.color};">
                          ${pendingItems.length}개 남음
                        </span>
                      </div>

                      <div class="item-list">
                        ${roleItems.length === 0 ? `
                          <div class="empty-state" style="padding: 28px 10px;">
                            <i data-lucide="check-circle-2" style="width: 28px; height: 28px; opacity: 0.35;"></i>
                            <p style="font-size: 0.82rem;">등록된 할 일이 없습니다.</p>
                          </div>
                        ` : roleItems.map(item => {
                          const ddayStr = item.dueDate ? getDDayString(item.dueDate) : '';
                          return `
                            <div class="task-item ${item.completed ? 'completed' : ''}" data-detail-id="${item.id}" style="cursor: pointer;">
                              <div class="task-checkbox ${item.completed ? 'checked' : ''}" data-toggle-id="${item.id}">
                                ${item.completed ? '<i data-lucide="check" style="width: 13px; height: 13px;"></i>' : ''}
                              </div>
                              <div class="task-content">
                                <span class="task-title" style="font-size: 0.88rem;">${this.escapeHtml(item.title)}</span>
                                <div style="display: flex; gap: 6px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
                                  ${item.dueDate ? `
                                    <span style="font-size: 0.72rem; font-weight: 600; color: var(--accent-forest); background: rgba(45,90,39,0.08); padding: 1px 6px; border-radius: 4px;">
                                      ${ddayStr} (${formatDate(item.dueDate)})
                                    </span>
                                  ` : ''}
                                  ${item.memo ? '<span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.04); padding: 1px 5px; border-radius: 4px;">📝 메모</span>' : ''}
                                </div>
                              </div>
                              <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                              </button>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </section>
                  `;
                }).join('')}
              </main>
            </div>
          ` : `
            <!-- Single Category Focused View -->
            ${(() => {
              const currentRole = getRole(roles, activeRoleId);
              const roleItems = filteredItems;
              const pendingItems = roleItems.filter(i => !i.completed);
              const completedItems = roleItems.filter(i => i.completed);
              const completedPercent = roleItems.length > 0 ? Math.round((completedItems.length / roleItems.length) * 100) : 0;

              return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                  <!-- Category Header -->
                  <div class="column-card" style="border-left: 5px solid ${currentRole.color};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                      <div>
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: ${currentRole.color}; margin-bottom: 2px;">${currentRole.name} 할 일 관리</h2>
                        <span style="font-size: 0.82rem; color: var(--text-muted);">총 ${roleItems.length}개 항목 중 ${pendingItems.length}개 남음</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 10px; min-width: 200px;">
                        <div style="flex: 1; height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden;">
                          <div style="width: ${completedPercent}%; height: 100%; background: ${currentRole.color}; transition: width 0.3s ease;"></div>
                        </div>
                        <span style="font-weight: 700; font-size: 0.85rem; color: ${currentRole.color};">${completedPercent}% 완료</span>
                      </div>
                    </div>
                  </div>

                  <!-- 2 Column Layout: Pending vs Completed -->
                  <div class="dashboard-grid" style="grid-template-columns: 2fr 1fr;">
                    <!-- Pending Section -->
                    <section class="column-card">
                      <div class="column-header">
                        <div class="column-title">
                          <h2 style="font-size: 1.05rem;">📌 진행 중인 할 일</h2>
                        </div>
                        <span class="item-count" style="background: ${currentRole.color}15; color: ${currentRole.color};">${pendingItems.length}개</span>
                      </div>

                      <div class="item-list">
                        ${pendingItems.length === 0 ? `
                          <div class="empty-state">
                            <i data-lucide="sparkles" style="width: 32px; height: 32px; color: var(--accent-forest);"></i>
                            <p style="font-size: 0.88rem; font-weight: 600;">모든 할 일을 구체적으로 완료했습니다! 🎉</p>
                          </div>
                        ` : pendingItems.map(item => {
                          const ddayStr = item.dueDate ? getDDayString(item.dueDate) : '';
                          return `
                            <div class="task-item" data-detail-id="${item.id}" style="cursor: pointer;">
                              <div class="task-checkbox" data-toggle-id="${item.id}"></div>
                              <div class="task-content">
                                <span class="task-title" style="font-size: 0.92rem;">${this.escapeHtml(item.title)}</span>
                                <div style="display: flex; gap: 6px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
                                  ${item.dueDate ? `
                                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--accent-forest); background: rgba(45,90,39,0.08); padding: 2px 7px; border-radius: 4px;">
                                      ${ddayStr} (${formatDate(item.dueDate)})
                                    </span>
                                  ` : ''}
                                  ${item.memo ? '<span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px;">📝 메모</span>' : ''}
                                </div>
                              </div>
                              <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                              </button>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </section>

                    <!-- Completed Section -->
                    <section class="column-card">
                      <div class="column-header">
                        <div class="column-title">
                          <h2 style="font-size: 1.05rem;">✅ 완료함</h2>
                        </div>
                        <span class="item-count">${completedItems.length}개</span>
                      </div>

                      <div class="item-list">
                        ${completedItems.length === 0 ? `
                          <div class="empty-state" style="padding: 24px 10px;">
                            <p style="font-size: 0.82rem;">완료된 항목이 없습니다.</p>
                          </div>
                        ` : completedItems.map(item => {
                          return `
                            <div class="task-item completed" data-detail-id="${item.id}" style="cursor: pointer;">
                              <div class="task-checkbox checked" data-toggle-id="${item.id}">
                                <i data-lucide="check" style="width: 13px; height: 13px;"></i>
                              </div>
                              <div class="task-content">
                                <span class="task-title" style="font-size: 0.88rem;">${this.escapeHtml(item.title)}</span>
                              </div>
                              <button class="btn-action-delete" data-delete-id="${item.id}" title="삭제">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                              </button>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </section>
                  </div>
                </div>
              `;
            })()}
          `}` : `
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
                    <div class="side-task-item ${item.completed ? 'completed' : ''}" data-detail-id="${item.id}" style="cursor: pointer;">
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
      <div class="modal-overlay ${this.isRoleModalOpen ? 'open' : ''}" id="role-modal">
        <div class="modal-card" style="max-width: 500px; padding: 26px; gap: 20px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header" style="padding-bottom: 4px; border-bottom: 1px solid var(--border-color);">
            <h3 style="font-size: 1.2rem;">설정 & 커스텀 관리</h3>
            <button class="btn-close" id="btn-close-modal">✕</button>
          </div>

          <form id="form-add-role" class="form-group" style="gap: 8px;">
            <label style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">1. 나만의 역할(Role) 추가하기</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="role-name-input" class="form-input" placeholder="예: 💼 동아리장, 🚗 운전면허..." required style="flex: 1;" />
              <input type="color" id="role-color-input" value="#2d5a27" style="width: 40px; height: 38px; border: none; border-radius: 6px; cursor: pointer; background: transparent;" />
              <button type="submit" class="btn-primary" style="white-space: nowrap;">추가</button>
            </div>
          </form>

          <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
            <label style="font-size: 0.88rem; font-weight: 600; color: var(--text-main); display: block; margin-bottom: 10px;">현재 카테고리 목록 <span style="font-size: 0.78rem; font-weight: 400; color: var(--text-muted);">(색상 팔레트를 눌러 색상 변경)</span></label>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
              ${roles.filter(r => r.id !== 'all').map(r => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="color" class="input-role-color" data-color-role-id="${r.id}" value="${r.color}" title="색상 변경" style="width: 24px; height: 24px; border: none; border-radius: 50%; cursor: pointer; background: transparent; padding: 0;" />
                    <span style="color: ${r.color}; font-weight: 600; font-size: 0.9rem;">${r.name}</span>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn-action-move" data-move-role-id="${r.id}" data-dir="up" title="위로 이동" style="background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 7px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s ease;">
                      ▲
                    </button>
                    <button class="btn-action-move" data-move-role-id="${r.id}" data-dir="down" title="아래로 이동" style="background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 7px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s ease;">
                      ▼
                    </button>
                    <button class="btn-action-edit" data-edit-role-id="${r.id}" title="이름 수정" style="background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; transition: all 0.2s ease;">
                      이름 수정
                    </button>
                    <button class="btn-action-delete" data-delete-role-id="${r.id}" title="삭제" style="opacity: 1; font-size: 0.78rem; padding: 4px 8px;">
                      삭제
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; flex-direction: column; gap: 10px;">
            <label style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">2. 플래너 초기화 및 샘플 관리</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn-primary" id="btn-clear-tasks" style="background: rgba(224, 122, 95, 0.12); color: var(--accent-warm-earth); border: 1px solid rgba(224, 122, 95, 0.25); flex: 1; min-width: 140px; padding: 8px 12px;">
                🧹 모든 할 일 비우기
              </button>
              <button type="button" class="btn-primary" id="btn-load-samples" style="background: rgba(45, 90, 39, 0.1); color: var(--accent-forest); border: 1px solid rgba(45, 90, 39, 0.22); flex: 1; min-width: 140px; padding: 8px 12px;">
                💡 가이드 샘플 불러오기
              </button>
              <button type="button" class="btn-primary" id="btn-full-reset" style="background: rgba(0, 0, 0, 0.05); color: #d90429; border: 1px solid rgba(217, 4, 41, 0.25); width: 100%; padding: 8px 12px; margin-top: 2px;">
                🔄 전체 초기화 (기본 상태로 리셋)
              </button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; flex-direction: column; gap: 10px;">
            <label style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">3. 내 데이터 백업 & 복원</label>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-primary" id="btn-export-json" style="background: rgba(0, 0, 0, 0.03); color: var(--text-main); border: 1px solid var(--border-color); flex: 1; padding: 8px 12px;">
                💾 JSON 내보내기
              </button>
              <button type="button" class="btn-primary" id="btn-import-json" style="background: rgba(0, 0, 0, 0.03); color: var(--text-main); border: 1px solid var(--border-color); flex: 1; padding: 8px 12px;">
                📂 JSON 불러오기
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- Task Detail Modal -->
      <div class="modal-overlay ${this.selectedItemId ? 'open' : ''}" id="task-detail-modal">
        ${(() => {
          if (!this.selectedItemId) return '';
          const activeItem = state.items.find(i => i.id === this.selectedItemId);
          if (!activeItem) return '';
          const role = getRole(roles, activeItem.roleId);

          return `
            <div class="modal-card" style="max-width: 480px;">
              <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="role-tag" style="background: ${role.color}15; color: ${role.color}; font-size: 0.82rem;">${role.name}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">
                    ${activeItem.type === 'dday' ? '🏆 D-Day' : (activeItem.type === 'weekly' ? '📅 주간 과제' : '🔔 일상')}
                  </span>
                </div>
                <button class="btn-close" id="btn-close-detail-modal">✕</button>
              </div>

              <form id="form-edit-task" class="form-group" style="gap: 12px;">
                <div>
                  <label style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.85rem;">할 일 제목</label>
                  <input type="text" id="detail-title-input" class="form-input" value="${this.escapeHtml(activeItem.title)}" required style="width: 100%; font-size: 0.95rem; font-weight: 600;" />
                </div>

                <div style="display: flex; gap: 10px;">
                  <div style="flex: 1;">
                    <label style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.85rem;">마감일 / 날짜</label>
                    <input type="date" id="detail-date-input" class="form-input" value="${activeItem.dueDate || ''}" style="width: 100%;" />
                  </div>
                  <div style="flex: 1;">
                    <label style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.85rem;">카테고리</label>
                    <select id="detail-role-select" class="form-input" style="width: 100%;">
                      ${roles.filter(r => r.id !== 'all').map(r => `
                        <option value="${r.id}" ${r.id === activeItem.roleId ? 'selected' : ''}>${r.name}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <div>
                  <label style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.85rem;">📝 상세 메모 & 메모장</label>
                  <textarea id="detail-memo-input" class="form-input" rows="4" placeholder="자세한 정보, 메모, 챙길 것 등을 입력해두세요..." style="width: 100%; resize: vertical; font-family: inherit; font-size: 0.88rem; line-height: 1.5;">${this.escapeHtml(activeItem.memo || '')}</textarea>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                  <button type="button" id="btn-delete-detail-item" style="background: rgba(224,122,95,0.12); color: var(--accent-warm-earth); border: 1px solid rgba(224,122,95,0.25); border-radius: 6px; font-size: 0.82rem; font-weight: 600; padding: 6px 12px; cursor: pointer;">
                    🗑️ 삭제
                  </button>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-primary" id="btn-cancel-detail" style="background: rgba(0,0,0,0.05); color: var(--text-main); border: 1px solid var(--border-color);">취소</button>
                    <button type="submit" class="btn-primary">저장하기</button>
                  </div>
                </div>
              </form>
            </div>
          `;
        })()}
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
        const dateInput = document.getElementById('input-date');
        const roleSelect = document.getElementById('select-role');

        const title = titleInput.value.trim();
        const roleId = roleSelect.value;
        const dueDate = (dateInput && dateInput.value) ? dateInput.value : (this.selectedDateISO || formatDateISO(new Date()));

        if (!title) return;

        store.addItem({
          title,
          type: 'task',
          roleId,
          dueDate,
          category: '📌 할 일'
        });

        // 사용자가 선택한 카테고리로 탭을 맞춰 생성된 항목이 즉시 보이게 함
        if (store.activeRoleId !== 'all' && store.activeRoleId !== roleId) {
          store.setActiveRole(roleId);
        }

        titleInput.value = '';
      });
    }

    document.querySelectorAll('[data-detail-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.task-checkbox') || e.target.closest('.btn-action-delete')) {
          return;
        }
        const id = el.getAttribute('data-detail-id');
        this.selectedItemId = id;
        this.render();
      });
    });

    const btnCloseDetail = document.getElementById('btn-close-detail-modal');
    if (btnCloseDetail) {
      btnCloseDetail.addEventListener('click', () => this.closeDetailModal());
    }

    const btnCancelDetail = document.getElementById('btn-cancel-detail');
    if (btnCancelDetail) {
      btnCancelDetail.addEventListener('click', () => this.closeDetailModal());
    }

    const btnDeleteDetail = document.getElementById('btn-delete-detail-item');
    if (btnDeleteDetail) {
      btnDeleteDetail.addEventListener('click', () => {
        if (this.selectedItemId && confirm('이 태스크를 삭제하시겠습니까?')) {
          store.deleteItem(this.selectedItemId);
          this.closeDetailModal();
        }
      });
    }

    const formEditTask = document.getElementById('form-edit-task');
    if (formEditTask) {
      formEditTask.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.selectedItemId) return;
        const titleInput = document.getElementById('detail-title-input');
        const dateInput = document.getElementById('detail-date-input');
        const roleSelect = document.getElementById('detail-role-select');
        const memoInput = document.getElementById('detail-memo-input');

        const title = titleInput.value.trim();
        const dueDate = dateInput.value;
        const roleId = roleSelect.value;
        const memo = memoInput.value;

        if (title) {
          store.updateItem(this.selectedItemId, {
            title,
            dueDate,
            roleId,
            memo
          });
          this.closeDetailModal();
        }
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
        }
      });
    }

    document.querySelectorAll('.btn-action-move[data-move-role-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.currentTarget.getAttribute('data-move-role-id');
        const dir = e.currentTarget.getAttribute('data-dir');
        store.reorderRole(roleId, dir);
      });
    });

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

    const btnFullReset = document.getElementById('btn-full-reset');
    if (btnFullReset) {
      btnFullReset.addEventListener('click', () => {
        if (confirm('카테고리와 할 일을 초기 기본값으로 완전히 리셋하시겠습니까?')) {
          store.resetToDefault();
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
