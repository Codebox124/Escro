import { notFound } from 'next/navigation'
import AdminApp from '@/components/ui/admin/AdminApp'

// /admin/users, /admin/settings, ... open that section directly.
// (Kept here rather than imported: helpers from a "use client" file can't run on the server.)
const PAGES = ['Dashboard', 'Users', 'Disputes', 'Finance', 'Settings']

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const initialPage = PAGES.find((p) => p.toLowerCase() === page.toLowerCase())
  if (!initialPage) notFound()
  return <AdminApp initialPage={initialPage} />
}
