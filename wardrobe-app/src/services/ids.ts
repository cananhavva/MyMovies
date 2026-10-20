import { randomUUID } from 'expo-crypto';
import type { ID } from '@/domain/types';

export function newId(): ID {
  return randomUUID();
}
