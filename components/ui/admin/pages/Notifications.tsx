import React from 'react'
import PageHeader from '../PageHeader'
import { pageWrapper } from '../ui'

function Notifications() {
  return (
    <div className={pageWrapper}>
        <PageHeader title='Notifications' subtitle='Everything that needs your attention, in one place.' />
    </div>
  )
}

export default Notifications
