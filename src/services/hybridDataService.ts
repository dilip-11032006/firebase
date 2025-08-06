import { dataService } from './dataService';
import { firebaseService } from './firebaseService';
import { SystemData, User, Component, BorrowRequest, Notification, LoginSession } from '../types';

class HybridDataService {
  private static instance: HybridDataService;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  static getInstance(): HybridDataService {
    if (!HybridDataService.instance) {
      HybridDataService.instance = new HybridDataService();
    }
    return HybridDataService.instance;
  }

  constructor() {
    this.setupOnlineListener();
    this.initializeSync();
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithFirebase();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async initializeSync() {
    if (this.isOnline) {
      try {
        await this.syncWithFirebase();
      } catch (error) {
        console.warn('Initial sync failed, using local data:', error);
      }
    }
  }

  async syncWithFirebase(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      // Get local data
      const localData = dataService.getData();
      
      // Check if Firebase has data
      const firebaseData = await firebaseService.syncWithFirebase();
      
      // If Firebase is empty, migrate local data
      if (this.isFirebaseEmpty(firebaseData)) {
        console.log('Migrating local data to Firebase...');
        await firebaseService.migrateLocalDataToFirebase(localData);
      } else {
        // Merge Firebase data with local data
        console.log('Syncing Firebase data with local storage...');
        const mergedData = this.mergeData(localData, firebaseData);
        dataService.saveData(mergedData);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private isFirebaseEmpty(data: SystemData): boolean {
    return data.users.length === 0 && 
           data.components.length === 0 && 
           data.requests.length === 0;
  }

  private mergeData(localData: SystemData, firebaseData: SystemData): SystemData {
    // Simple merge strategy - Firebase data takes precedence
    // In a production app, you'd want more sophisticated conflict resolution
    return {
      users: this.mergeArrays(localData.users, firebaseData.users, 'id'),
      components: this.mergeArrays(localData.components, firebaseData.components, 'id'),
      requests: this.mergeArrays(localData.requests, firebaseData.requests, 'id'),
      notifications: this.mergeArrays(localData.notifications, firebaseData.notifications, 'id'),
      loginSessions: this.mergeArrays(localData.loginSessions, firebaseData.loginSessions, 'id')
    };
  }

  private mergeArrays<T extends { id: string; [key: string]: any }>(
    local: T[], 
    firebase: T[], 
    idField: string
  ): T[] {
    const merged = [...firebase];
    
    local.forEach(localItem => {
      const existingIndex = merged.findIndex(item => item[idField] === localItem[idField]);
      if (existingIndex === -1) {
        // Item doesn't exist in Firebase, add it
        merged.push(localItem);
      }
      // If it exists in Firebase, keep the Firebase version (Firebase takes precedence)
    });

    return merged;
  }

  // Wrapper methods that handle online/offline scenarios
  async addUser(user: User): Promise<void> {
    // Always save locally first
    dataService.addUser(user);

    // Try to sync with Firebase if online
    if (this.isOnline) {
      try {
        await firebaseService.createUser(user);
      } catch (error) {
        console.warn('Failed to sync user to Firebase:', error);
      }
    }
  }

  async updateUser(user: User): Promise<void> {
    dataService.updateUser(user);

    if (this.isOnline) {
      try {
        await firebaseService.updateUser(user.id, user);
      } catch (error) {
        console.warn('Failed to sync user update to Firebase:', error);
      }
    }
  }

  async addComponent(component: Component): Promise<void> {
    dataService.addComponent(component);

    if (this.isOnline) {
      try {
        await firebaseService.createComponent(component);
      } catch (error) {
        console.warn('Failed to sync component to Firebase:', error);
      }
    }
  }

  async updateComponent(component: Component): Promise<void> {
    dataService.updateComponent(component);

    if (this.isOnline) {
      try {
        await firebaseService.updateComponent(component.id, component);
      } catch (error) {
        console.warn('Failed to sync component update to Firebase:', error);
      }
    }
  }

  async deleteComponent(componentId: string): Promise<void> {
    dataService.deleteComponent(componentId);

    if (this.isOnline) {
      try {
        await firebaseService.deleteComponent(componentId);
      } catch (error) {
        console.warn('Failed to sync component deletion to Firebase:', error);
      }
    }
  }

  async addRequest(request: BorrowRequest): Promise<void> {
    dataService.addRequest(request);

    if (this.isOnline) {
      try {
        await firebaseService.createRequest(request);
      } catch (error) {
        console.warn('Failed to sync request to Firebase:', error);
      }
    }
  }

  async updateRequest(request: BorrowRequest): Promise<void> {
    dataService.updateRequest(request);

    if (this.isOnline) {
      try {
        await firebaseService.updateRequest(request.id, request);
      } catch (error) {
        console.warn('Failed to sync request update to Firebase:', error);
      }
    }
  }

  async addNotification(notification: Notification): Promise<void> {
    dataService.addNotification(notification);

    if (this.isOnline) {
      try {
        await firebaseService.createNotification(notification);
      } catch (error) {
        console.warn('Failed to sync notification to Firebase:', error);
      }
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    dataService.markNotificationAsRead(notificationId);

    if (this.isOnline) {
      try {
        await firebaseService.markNotificationAsRead(notificationId);
      } catch (error) {
        console.warn('Failed to sync notification read status to Firebase:', error);
      }
    }
  }

  async createLoginSession(user: User): Promise<LoginSession> {
    const session = dataService.createLoginSession(user);

    if (this.isOnline) {
      try {
        await firebaseService.createLoginSession(session);
      } catch (error) {
        console.warn('Failed to sync login session to Firebase:', error);
      }
    }

    return session;
  }

  async endLoginSession(userId: string): Promise<void> {
    dataService.endLoginSession(userId);

    if (this.isOnline) {
      try {
        // Find active sessions for the user and end them in Firebase
        const sessions = await firebaseService.getAllLoginSessions();
        const activeSessions = sessions.filter(s => s.userId === userId && s.isActive);
        
        for (const session of activeSessions) {
          await firebaseService.updateLoginSession(session.id, {
            isActive: false,
            logoutTime: new Date().toISOString(),
            sessionDuration: new Date().getTime() - new Date(session.loginTime).getTime()
          });
        }
      } catch (error) {
        console.warn('Failed to sync session end to Firebase:', error);
      }
    }
  }

  // Read methods - these can use local data for better performance
  getData(): SystemData {
    return dataService.getData();
  }

  getComponents(): Component[] {
    return dataService.getComponents();
  }

  getRequests(): BorrowRequest[] {
    return dataService.getRequests();
  }

  getUserRequests(userId: string): BorrowRequest[] {
    return dataService.getUserRequests(userId);
  }

  getUserNotifications(userId: string): Notification[] {
    return dataService.getUserNotifications(userId);
  }

  getLoginSessions(): LoginSession[] {
    return dataService.getLoginSessions();
  }

  getSystemStats() {
    return dataService.getSystemStats();
  }

  getUser(email: string): User | undefined {
    return dataService.getUser(email);
  }

  authenticateUser(email: string, password: string): User | null {
    return dataService.authenticateUser(email, password);
  }

  exportLoginSessionsCSV(): string {
    return dataService.exportLoginSessionsCSV();
  }

  // Connection status
  getConnectionStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync method for manual sync
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncWithFirebase();
    }
  }
}

export const hybridDataService = HybridDataService.getInstance();