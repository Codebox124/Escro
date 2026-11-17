import { notFound } from 'next/navigation'
import AgencyApp from '@/components/ui/agency/AgencyApp'

// /agency/users, /agency/settings, ... open that section directly.
// (Kept here rather than imported: helpers from a "use client" file can't run on the server.)
const PAGES = ['Dashboard', 'Agents', 'Projects', 'Messages', 'Settings']

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const initialPage = PAGES.find((p) => p.toLowerCase() === page.toLowerCase())
  if (!initialPage) notFound()
  return <AgencyApp initialPage={initialPage} />
}
