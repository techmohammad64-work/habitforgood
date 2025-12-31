import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    template: `
    <nav class="navbar" data-test-id="navbar">
      <div class="navbar-container">
        <a [routerLink]="getHomeRoute()" class="navbar-brand" data-test-id="navbar-logo">
          <span class="logo-icon">🌱</span>
          <span class="logo-text">Habits for Good</span>
        </a>
        
        <div class="navbar-links">
          <div class="nav-items">
            <a routerLink="/campaigns" routerLinkActive="active" class="nav-link" data-test-id="nav-campaigns-link">Campaigns</a>
            
            @if (authService.isAuthenticated()) {
              @switch (authService.currentUser()?.role) {
                @case ('student') {
                  <a routerLink="/student/dashboard" routerLinkActive="active" class="nav-link" data-test-id="nav-dashboard-link">Dashboard</a>
                }
                @case ('admin') {
                  <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link" data-test-id="nav-dashboard-link">Dashboard</a>
                }
                @case ('sponsor') {
                  <a routerLink="/sponsor/dashboard" routerLinkActive="active" class="nav-link" data-test-id="nav-dashboard-link">Dashboard</a>
                }
              }
            }
          </div>
          
          <div class="nav-actions">
            @if (authService.isAuthenticated()) {
              <div class="user-menu">
                <button class="user-menu-button" (click)="toggleUserMenu()" data-test-id="user-menu-button">
                  <span class="user-avatar">{{ getUserInitial() }}</span>
                  <span class="user-name">{{ getUserDisplayName() }}</span>
                  <span class="menu-icon">{{ userMenuOpen ? '▲' : '▼' }}</span>
                </button>
                
                @if (userMenuOpen) {
                  <div class="dropdown-backdrop" (click)="closeUserMenu()"></div>
                  <div class="user-dropdown">
                    <a routerLink="/profile" class="dropdown-item" (click)="closeUserMenu()" data-test-id="dropdown-profile-link">
                      <span class="item-icon">👤</span>
                      Profile
                    </a>
                    <a routerLink="/settings" class="dropdown-item" (click)="closeUserMenu()" data-test-id="dropdown-settings-link">
                      <span class="item-icon">⚙️</span>
                      Settings
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" (click)="logout()" data-test-id="dropdown-logout-button">
                      <span class="item-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login" class="btn btn-ghost btn-sm" data-test-id="login-button">Login</a>
              <a routerLink="/register" class="btn btn-primary btn-sm" data-test-id="register-button">Get Started</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    .navbar {
      height: 64px;
      background-color: var(--color-snow);
      border-bottom: 1px solid var(--color-hare);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .navbar-container {
      max-width: var(--max-width-xl);
      height: 100%;
      margin: 0 auto;
      padding: 0 var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-extrabold);
      color: var(--color-primary);
      text-decoration: none;
      transition: opacity var(--transition-fast);
      
      &:hover {
        opacity: 0.8;
      }
    }
    
    .logo-icon {
      font-size: 28px;
    }
    
    .navbar-links {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
    }
    
    .nav-items {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .nav-link {
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--color-wolf);
      font-weight: var(--font-weight-semibold);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      position: relative;
      
      &:hover {
        color: var(--color-eel);
        background-color: var(--color-swan);
      }
      
      &.active {
        color: var(--color-primary);
        background-color: var(--color-sky);
      }
    }
    
    .nav-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding-left: var(--spacing-lg);
      border-left: 1px solid var(--color-hare);
    }
    
    /* User Menu */
    .user-menu {
      position: relative;
    }
    
    .user-menu-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-md);
      background: transparent;
      border: 1px solid var(--color-hare);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition-fast);
      font-weight: var(--font-weight-semibold);
      color: var(--color-eel);
      
      &:hover {
        background-color: var(--color-swan);
        border-color: var(--color-wolf);
      }
    }
    
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-circle);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-mint) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
    }
    
    .user-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .menu-icon {
      font-size: 10px;
      color: var(--color-wolf);
    }
    
    .user-dropdown {
      position: absolute;
      top: calc(100% + var(--spacing-xs));
      right: 0;
      min-width: 200px;
      background: white;
      border: 1px solid var(--color-hare);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--spacing-xs);
      z-index: 1000;
      animation: slideDown 0.2s ease-out;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--color-eel);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      
      &:hover {
        background-color: var(--color-swan);
        color: var(--color-primary);
      }
    }
    
    .item-icon {
      font-size: var(--font-size-lg);
    }
    
    .dropdown-divider {
      height: 1px;
      background-color: var(--color-hare);
      margin: var(--spacing-xs) 0;
    }
    
    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }
    
    .btn-ghost {
      background: transparent;
      color: var(--color-wolf);
      border: 1px solid transparent;
      
      &:hover {
        background-color: var(--color-swan);
        color: var(--color-eel);
      }
    }
    
    @media (max-width: 768px) {
      .logo-text {
        display: none;
      }
      
      .navbar-container {
        padding: 0 var(--spacing-md);
      }
      
      .navbar-links {
        gap: var(--spacing-sm);
      }
      
      .nav-items {
        gap: 0;
      }
      
      .nav-link {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: var(--font-size-sm);
      }
      
      .nav-actions {
        padding-left: var(--spacing-sm);
      }
      
      .user-name {
        display: none;
      }
      
      .user-menu-button {
        padding: var(--spacing-xs);
      }
    }
  `],
})
export class NavbarComponent {
    userMenuOpen = false;

    constructor(public authService: AuthService) { }

    getHomeRoute(): string {
        if (this.authService.isAuthenticated()) {
            const role = this.authService.currentUser()?.role;
            switch (role) {
                case 'student': return '/student/dashboard';
                case 'admin': return '/admin/dashboard';
                case 'sponsor': return '/sponsor/dashboard';
                default: return '/';
            }
        }
        return '/';
    }

    getUserInitial(): string {
        const email = this.authService.currentUser()?.email || '';
        return email.charAt(0).toUpperCase();
    }

    getUserDisplayName(): string {
        const email = this.authService.currentUser()?.email || 'User';
        return email.split('@')[0];
    }

    toggleUserMenu(): void {
        this.userMenuOpen = !this.userMenuOpen;
    }

    closeUserMenu(): void {
        this.userMenuOpen = false;
    }

    logout(): void {
        this.closeUserMenu();
        this.authService.logout();
    }
}
