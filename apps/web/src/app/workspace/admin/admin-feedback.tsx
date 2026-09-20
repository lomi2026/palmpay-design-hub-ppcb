'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import type { AdminSaveResult } from './admin-save-result';
export function showAdminFeedback(result: AdminSaveResult) {
  if (result.status !== 'idle') showActionFeedback(result.status, result.message, 'admin-save');
}
