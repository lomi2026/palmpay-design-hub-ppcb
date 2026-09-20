'use server';
import { listContentReferences } from '@/lib/content-references';
import type { ContentType } from '@/lib/content-types';
export async function referenceOptions(type: ContentType) {
  return listContentReferences(type);
}
