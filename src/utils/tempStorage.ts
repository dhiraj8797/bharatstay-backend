// Temporary storage for unverified registrations
// In production, use Redis or similar for distributed systems

interface TempUserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  otp: string;
  otpExpires: Date;
  createdAt: Date;
}

interface TempHostData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  state: string;
  city: string;
  pincode: string;
  otp: string;
  otpExpires: Date;
  idType?: string;
  idProofPath?: string;
  idFileName?: string;
  aadharPath?: string;
  panPath?: string;
  licensePath?: string;
  fullAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyPostalCode?: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string;
  createdAt: Date;
}

class TempStorage {
  private userStore: Map<string, TempUserData> = new Map();
  private hostStore: Map<string, TempHostData> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 15 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 15 * 60 * 1000);
  }

  // User methods
  setUser(id: string, data: TempUserData): void {
    this.userStore.set(id, data);
  }

  getUser(id: string): TempUserData | undefined {
    return this.userStore.get(id);
  }

  deleteUser(id: string): void {
    this.userStore.delete(id);
  }

  // Host methods
  setHost(id: string, data: TempHostData): void {
    this.hostStore.set(id, data);
  }

  getHost(id: string): TempHostData | undefined {
    return this.hostStore.get(id);
  }

  updateHost(id: string, updates: Partial<TempHostData>): boolean {
    const existing = this.hostStore.get(id);
    if (existing) {
      this.hostStore.set(id, { ...existing, ...updates });
      return true;
    }
    return false;
  }

  deleteHost(id: string): void {
    this.hostStore.delete(id);
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = new Date();
    
    // Clean users
    for (const [id, data] of this.userStore.entries()) {
      if (data.otpExpires < now) {
        this.userStore.delete(id);
      }
    }

    // Clean hosts
    for (const [id, data] of this.hostStore.entries()) {
      if (data.otpExpires < now) {
        this.hostStore.delete(id);
      }
    }
  }

  // For testing/debugging
  getStats(): { users: number; hosts: number } {
    return {
      users: this.userStore.size,
      hosts: this.hostStore.size
    };
  }
}

export const tempStorage = new TempStorage();
export type { TempUserData, TempHostData };
