import type { SupabaseClient } from '../../core/supabase/client';

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface AuthRepository {
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
}

export function createAuthRepository(supabase: SupabaseClient): AuthRepository {
  return {
    async createRefreshToken({ userId, tokenHash, expiresAt }) {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt.toISOString() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async findValidRefreshToken(tokenHash) {
      const { data } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      return data;
    },

    async revokeRefreshToken(id) {
      const { error } = await supabase
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}
