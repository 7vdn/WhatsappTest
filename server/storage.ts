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
      ...insertUser,
      id,
      password: hashedPassword,
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
    const id = randomUUID();
    const accessToken = generateAccessToken();
    const hashedPassword = await hashPassword(insertUser.password);

    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      accessToken,
      messageCount: 0,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
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

