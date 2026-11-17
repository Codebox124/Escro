"use client"
import BottomNav from '@/components/ui/bottom-nav'
import { useAdminContext } from './AdminContext'
import { navItems } from './Sidebar'

export default function AdminBottomNav() {
    const { currentPage, setCurrentPage } = useAdminContext()
    const current = currentPage || navItems[0].label
    return (
        <BottomNav
            id='admin-nav'
            items={navItems.map(({ label, icon }) => ({
                label,
                icon,
                active: current === label,
                onClick: () => setCurrentPage(label),
            }))}
        />
    )
}
