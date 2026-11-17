"use client"
import React from 'react'
import Projs from '../projects/Projs'
import Stats from '../projects/Stats'
import FilterOptions from '../projects/FilterOptions'
import { useAdminContext } from '../AdminContext';
import AgentInfo from '../users/UserInfo';
import { Plus } from '@/components/icons';
import CreateProjectModal from '../projects/CreateProjectModal';
import ProjectInfo from '../projects/ProjectInfo'
import { AnimatePresence } from 'framer-motion';
import PageHeader from '../PageHeader';
import { btnPrimary, pageWrapper } from '../ui';
function Projects() {
  const {setShowCreateProjectModal, showCreateProjectModal, showProjectInfo} = useAdminContext()
  return <>
  {
    showCreateProjectModal && <CreateProjectModal setShowCreateProjectModal={setShowCreateProjectModal} />
  }
  <AnimatePresence>
    {
      showProjectInfo && <ProjectInfo />
    }
  </AnimatePresence>
    <div className={pageWrapper}>
        <PageHeader
          title='Projects'
          subtitle='Track milestones and progress across every active engagement.'
          actions={<button onClick={() => setShowCreateProjectModal(true)} className={`${btnPrimary} w-full sm:w-auto`}><Plus size={16} /> Add Project</button>}
        />
        <Stats />
        <FilterOptions />
        <Projs />
    </div>
  </>
}

export default Projects
