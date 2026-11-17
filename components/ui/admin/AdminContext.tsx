"use client"

import { usePathname } from "next/navigation"
import {createContext, useContext, useState, ReactNode, useEffect} from "react"
import SERVICES from "@/components/ui/admin/data/services.json"
import PROJECTS from "@/components/ui/admin/data/projects.json"
import USERINFO from "@/components/ui/admin/data/userInfo.json"
import CONVERSATIONS from "@/components/ui/admin/data/conversations.json"
import USERS from "@/components/ui/admin/data/users.json"
import TRANSACTIONS from "@/components/ui/admin/data/transactions.json"
//import users from "@/components/ui/agency/data/users.json"

interface Props{
    children: ReactNode
}

const AdminContext = createContext<any>(null)

export const AdminContextProvider = ({children}:Props) =>{

    const [services, setServices]= useState(SERVICES)
    const [transactions, setTransactions] = useState(TRANSACTIONS)
    const [isSearchingTransactions, setIsSearchingTransactions] = useState(false)
    const [transactionsSearchResults, setTransactionsSearchResults] = useState([])
    const [projects, setProjects] = useState<any>()
    const [minimize, setMinimize] = useState(true)
    const [selectedProject, setSelectedProject] = useState(null)
    const [currentPage, setCurrentPage] = useState("")
    const [showNotifications, setShowNotifications] = useState(false)
     useEffect(() => {
       //projects

        calculateProgress(PROJECTS)


    //currentpage
    // Restore the last page only if it still exists — an empty/stale saved value
    // used to leave the screen blank on first login until a menu item was clicked.
    const VALID_PAGES = ["Dashboard", "Users", "Disputes", "Finance", "Settings"]
    let saved = ""
    try { saved = JSON.parse(localStorage.getItem("admin-current-page") || '""') } catch { saved = "" }
    setCurrentPage(VALID_PAGES.includes(saved) ? saved : "Dashboard")
  }, [])
    useEffect(()=>{
        if (currentPage) localStorage.setItem("admin-current-page", JSON.stringify(currentPage))
    }, [currentPage])

    function calculateProgress(projs:any){
        const newProjects = projs.map((proj:any)=>{
            const milestones = proj.milestones
            const completed = milestones.filter((mile:any)=>mile.completed===true)
            const progress = Math.trunc((completed.length/milestones.length) * 100)
            return {...proj, progress: `${progress}%`, status: `${(progress===100 && proj.status!="Cancelled")?"Completed":proj.status==="Cancelled"?"Cancelled":"In Progress"}`}
        })

        setProjects(newProjects)
    }
    const [alertInfo, setAlertInfo] = useState({title:"", type:""})
    const [showAlert, setShowAlert] = useState(false)
    const [userInfo, setUserInfo] = useState(USERINFO)
    const [conversations, setConversations] = useState(CONVERSATIONS)
    const [isSearching, setIsSearching] = useState(false)
    // Static users — still read by Messages search + Dashboard widgets. The Users page loads live data from adminApi.users.
    const [users, setUsers] = useState(USERS)
   // Role filter for the Users page ("all" | customer | seller | courier | agency | admin; legacy "store" maps to seller)
   const [usersFilterValue, setUsersFilterValue] = useState("all")
   const [projectsSearchResults, setprojectsSearchResults] = useState([])
   const [isSearchingProjects, setIsSearchingProjects] = useState(false)
   const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
   const [showProjectInfo, setShowProjectInfo] = useState(false)
    function handleAlert(title:string, type:string){
        setAlertInfo({title, type})
        setShowAlert(true)

        setTimeout(()=>{
            setShowAlert(false)
        }, 3000)
    }


    /** Pre-selects the role filter on the Users page (data is fetched there). */
    function handleFilterUsers(value:string){
        setUsersFilterValue((value || "all").toLowerCase())
    }

    const values = {
        /*theme,
        setTheme,*/
        minimize,
        setMinimize,
        currentPage,
        setCurrentPage,
        services,
        setServices,
        showAlert,
        setShowAlert,
        handleAlert,
        alertInfo,
        setAlertInfo,
        projects,
        setProjects,
        userInfo,
        setUserInfo,
        conversations,
        setConversations,
        isSearching,
        setIsSearching,
        users,
        setUsers,
        /*users,
        setusers,*/
        isSearchingProjects,
        setIsSearchingProjects,
        projectsSearchResults,
        setprojectsSearchResults,
        showCreateProjectModal,
        setShowCreateProjectModal,
        showNotifications,
        setShowNotifications,
        showProjectInfo,
        setShowProjectInfo,
        selectedProject,
        setSelectedProject,
        calculateProgress,
        handleFilterUsers,
        usersFilterValue,
        setUsersFilterValue,
        transactions,
        setTransactions,
        isSearchingTransactions,
        setIsSearchingTransactions,
        transactionsSearchResults,
        setTransactionsSearchResults
    }

    return <AdminContext.Provider value={values}>
        {children}
    </AdminContext.Provider>
}


export const useAdminContext = () =>{
    return useContext(AdminContext)
}