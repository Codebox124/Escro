"use client"
import React, { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconAdjustmentsHorizontal, IconSearch } from '@/components/icons'
import { useAdminContext } from '../AdminContext';
import { filterBar, inputBase, searchInput, selectTrigger } from '../ui';


function FilterOptions() {
    const {projects, setProjects, setIsSearchingProjects, setprojectsSearchResults} = useAdminContext()

        const [filterValue, setFilterValue] = useState("")
  
      function handleSearch(value:string){
          setIsSearchingProjects(true)
          let newProjects
          /*if(!isFilteringAgentsTable){
            newProjects = projects.filter((project:any)=>{
              if(project.name.toLowerCase().includes(value.toLowerCase())){
                  return project
              }
          })
        }else{
          newProjects = projectsSearchResults.filter((project:any)=>{
              if(project.name.toLowerCase().includes(value.toLowerCase())){
                  return project
              }
          })
        }*/
       newProjects = projects.filter((project:any)=>{
              if(project.name.toLowerCase().includes(value.toLowerCase())){
                  return project
              }
          })
          setprojectsSearchResults(newProjects)
  }
  
  function handleFilter(value:string){
         setIsSearchingProjects(true)
          let newProjects
         /* if(!isSearchingProjects){
            newProjects = projects.filter((project:any)=>{
              if(project.status.toLowerCase() === value.toLowerCase()){
                  return project
              }
          })
        }else{
          newProjects = projectsSearchResults.filter((project:any)=>{
              if(project.status.toLowerCase() === value.toLowerCase()){
                  return project
              }
          })
        }*/
       newProjects = projects.filter((project:any)=>{
              if(project.status.toLowerCase() === value.toLowerCase()){
                  return project
              }
          })
        setprojectsSearchResults(newProjects)
  }
  
    useEffect(()=>{
        if(filterValue==="all"){
          setIsSearchingProjects(false)
        }else if(!filterValue){
          return
        } else{
          handleFilter(filterValue)
        }
      }, [filterValue])

  return (
    <div className={filterBar}>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <Input
                type="text"
                placeholder="Search Projects..."
                onChange={e=>{handleSearch(e.target.value)}}
                className={`${searchInput} pl-10`}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {/* Status Filter */}
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select >
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

  )
}

export default FilterOptions