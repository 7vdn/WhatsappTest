import "dotenv/config";
import { type User, type InsertUser } from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAccessToken(accessToken: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  incrementMessageCount(userId: string): Promise<void>;
  verifyEmailOtp(email: string, otp: string): Promise<boolean>;
  resendSignupOtp(email: string): Promise<boolean>;
  verifyUser(email: string, password: string): Promise<User | undefined>;
}

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

function generateAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByAccessToken(accessToken: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.accessToken === accessToken,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const accessToken = generateAccessToken();
    const hashedPassword = await hashPassword(insertUser.password);

    const user: User = {
      id,
      email: insertUser.email,
      password: hashedPassword,
      companyName: insertUser.companyName ?? null,
      accessToken,
      messageCount: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementMessageCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.messageCount = (user.messageCount || 0) + 1;
      this.users.set(userId, user);
    }
  }

  async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    // For MemStorage, we can just assume OTP is always valid or log it
    console.log(`[MemStorage] Verifying OTP for ${email}: ${otp}`);
    return true; 
  }

  async resendSignupOtp(email: string): Promise<boolean> {
    console.log(`[MemStorage] Resending OTP for ${email}`);
    return true;
  }

  async verifyUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    const isValid = await verifyPassword(password, user.password);
    return isValid ? user : undefined;
  }
}

// Supabase Storage Implementation
export class SupabaseStorage implements IStorage {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByAccessToken(accessToken: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('accessToken', accessToken)
      .single();

    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: insertUser.email,
      password: insertUser.password,
    });

    if (authError) {
      throw new Error(`Supabase Auth Error: ${authError.message}`);
    }

    if (!authData.user) {
       throw new Error("Supabase Auth failed to return a user.");
    }

    // 2. Insert into our custom users table (using the ID from Auth)
    const id = authData.user.id; // Use Supabase Auth ID
    const accessToken = generateAccessToken();
    const hashedPassword = await hashPassword(insertUser.password);

    const user: User = {
      id,
      email: insertUser.email,
      password: hashedPassword, // Store hashed password locally as well if needed by existing logic, or rely on Auth
      companyName: insertUser.companyName ?? null,
      accessToken,
      messageCount: 0,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      // If insert fails (e.g. user already exists in table but not auth, or other constraint), handle it
      // Note: In a real scenario, you might want to rollback the auth creation if this fails.
      throw new Error(`Failed to create user record: ${error.message}`);
    }

    return data as User;
  }

  async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (error || !data.user) {
      console.error("OTP Verification failed:", error);
      return false;
    }

    return true;
  }

  async resendSignupOtp(email: string): Promise<boolean> {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error("Resend OTP failed:", error.message);
      return false;
    }
    return true;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    return data as User;
  }

  async incrementMessageCount(userId: string): Promise<void> {
    await this.supabase.rpc('increment_message_count', { user_id: userId });
  }

  async verifyUser(email: string, password: string): Promise<User | undefined> {
    // Attempt to sign in with Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("Supabase Auth Login Failed:", error?.message);
      return undefined;
    }
    
    // Explicitly check if email is confirmed
    // Note: data.user.email_confirmed_at is a string timestamp if confirmed, or null/undefined if not.
    if (!data.user.email_confirmed_at) {
       console.error("User email not confirmed:", email);
       return undefined;
    }

    // If successful, the user is verified and credentials are correct.
    // Now fetch the local user record to return application-specific data.
    return this.getUserByEmail(email);
  }
}

// Auto-detect which storage to use
async function createStorage(): Promise<IStorage> {
  const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

  if (useSupabase) {
    console.log('Using Supabase storage');
    const { supabase } = await import('./supabase');
    return new SupabaseStorage(supabase);
  } else {
    console.log('Using in-memory storage (data will be lost on restart)');
    return new MemStorage();
  }
}

export const storage = await createStorage();
