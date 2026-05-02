import { CustomDecorator, SetMetadata } from '@nestjs/common';

export type Scope = 'PUBLIC' | 'SUPABASE_USER';

export const PublicAuth = () => Scopes('PUBLIC');
export const SupabaseUserAuth = () => Scopes('SUPABASE_USER');

export const SCOPES_KEY = 'Scopes';
export const Scopes = (...scopes: Scope[]): CustomDecorator<string> => SetMetadata(SCOPES_KEY, scopes);
