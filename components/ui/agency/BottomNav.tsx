"use client"
import BottomNav from '@/components/ui/bottom-nav'
import { useAgencyContext } from './AgencyContext'
import { navItems } from './Sidebar'

export default function AgencyBottomNav() {
    const { currentPage, setCurrentPage } = useAgencyContext()
    const current = currentPage || navItems[0].label
    return (
        <BottomNav
            id='agency-nav'
            items={navItems.map(({ label, icon }) => ({
                label,
                icon,
                active: current === label,
                onClick: () => setCurrentPage(label),
            }))}
        />
    )
}
