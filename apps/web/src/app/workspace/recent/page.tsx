import { redirect } from 'next/navigation';

export default function RecentPage() {
  redirect('/workspace/favorites?tab=recent');
}
