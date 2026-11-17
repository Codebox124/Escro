"use client"
import React, { useState } from 'react'
import  DataTable  from '../DataTable'
import { columns } from '../users/columns'
import { useAdminContext } from '../AdminContext'
import { Download } from '@/components/icons'
import FilterOptions from '../users/FilterOptions'
import { useGridApiRef/*, gridExportToCsv*/  } from '@mui/x-data-grid'
import AgentInfo from '../users/UserInfo'
import Stats from '../users/Stats'
import {AnimatePresence} from "framer-motion"
import PageHeader from '../PageHeader'
import { btnPrimary, pageWrapper } from '../ui'

function Agents() {
  const {agents, setAgents, agentsTableSearchResults, isSearchingAgentsTable, showAgentInfo} = useAdminContext()



const apiRef:any = useGridApiRef();

const exportCSV = () => {
  apiRef.current.exportDataAsCsv({
    fileName: "my-agents-table",
  });
};

  return <>
  <AnimatePresence>
    {
    showAgentInfo && <AgentInfo />
  }
  </AnimatePresence>
    <div className={pageWrapper}>
        <PageHeader
          title='Agents'
          subtitle='Manage your team, verification status and assignments.'
          actions={<button onClick={exportCSV} className={`${btnPrimary} w-full sm:w-auto`}><Download size={16} /> Export Agents</button>}
        />
        <Stats />
        <FilterOptions />
        <DataTable apiRef={apiRef} columns={columns} rows={isSearchingAgentsTable ? agentsTableSearchResults : agents} />
    </div>
  </>
}

export default Agents
