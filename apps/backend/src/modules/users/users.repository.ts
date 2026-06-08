import type { SupabaseClient } from '../../core/supabase/client';

export interface User {
  id: string;
  bubble_id: string | null;
  bubble_token: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  gender: 'male' | 'female' | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  bubble_id?: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female';
  profile_completed?: boolean;
  phone?: string;
  bubble_id?: string;
  bubble_token?: string;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByBubbleId(bubbleId: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, patch: UpdateUserInput): Promise<User>;
}

export function createUsersRepository(supabase: SupabaseClient): UsersRepository {
  return {
    async findById(id) {
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      return data;
    },

    async findByEmail(email) {
      const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      return data;
    },

    async findByBubbleId(bubbleId) {
      const { data } = await supabase.from('users').select('*').eq('bubble_id', bubbleId).maybeSingle();
      return data;
    },

    async create(input) {
      const { data, error } = await supabase.from('users').insert(input).select().single();
      if (error) throw new Error(error.message);
      return data;
    },

    async update(id, patch) {
      const { data, error } = await supabase
        .from('users')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  };
}
