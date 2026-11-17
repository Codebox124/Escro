"use client"
import React, { useState } from 'react'
import { CiSearch } from '@/components/icons'
import { LuUserRoundSearch } from "@/components/icons";
import { IoPersonOutline } from '@/components/icons';
import { useAdminContext } from '../AdminContext';

function SearchBar({setConversation, setSelectedSomeone}:any) {
  const {users, setUsers, isSearching, setIsSearching, conversations, userInfo} = useAdminContext()
  const [searchResults, setSearchResults] = useState("")

  function handleSearch(value: string){
    if(value){
      setIsSearching(true)
      const newResults = users.filter((item:any)=>{
        return (item.name.toLowerCase().includes(value.toLowerCase()) || item.userName.toLowerCase().includes(value.toLowerCase())) && item.userName != userInfo.userName
      }) //looks for a matching name or username while also automatically removing the currrent user from the search

      if(newResults.length===0){ //if a match cant be found in users, check the conversations
        const newResultsGottenFromConversations = conversations.filter((item:any)=>{
          return item.name.toLowerCase().includes(value.toLowerCase())
        })
        //console.log(newResultsGottenFromConversations)
        setSearchResults(newResultsGottenFromConversations)
        return
      }


      setSearchResults(newResults)
    }else{
      setIsSearching(false)
    }
  }

  return (
    <div className='relative flex w-full flex-col'>
      <div className='flex h-11 w-full items-center gap-2 rounded-full bg-white px-4 text-black/40 ring-1 ring-black/10 transition focus-within:ring-2 focus-within:ring-ink'>
        <label htmlFor="search"><CiSearch className='text-lg' /></label>
        <input placeholder='Search by name or username...' onChange={e=>{handleSearch(e.target.value)}} id='search' type="text" className='h-full w-full min-w-0 border-none bg-transparent text-sm text-ink outline-none placeholder:text-black/40'  />
        <label htmlFor="search"><LuUserRoundSearch /></label>
    </div>
    {isSearching && <SearchResults setConversation={setConversation} setSelectedSomeone={setSelectedSomeone} results={searchResults} />}
    </div>
  )
}

export default SearchBar



function SearchResults({results, setConversation, setSelectedSomeone}:any) {
  const {setIsSearching, conversations} = useAdminContext()
  function handleSelectConversation(item:any){
    const existingConversation = conversations.find((conv:any)=>conv.id===item.id) //checks if an existing conversation exists
    if(existingConversation){
      setConversation(existingConversation) //sets the conversation to the existing one if it exists
    }else{
      setConversation({...item, messages:[]}) //if not , creates a new conversation object and sets it
    }
}

  return <div className='absolute top-14 z-20 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-3xl bg-white p-2 shadow-[0_30px_60px_-20px_rgba(12,17,14,0.35)] ring-1 ring-black/5'>
    {results.length!=0 ? results.map((item:any, index:any)=>{
      return <div onClick={()=>{setSelectedSomeone(true); handleSelectConversation(item); setIsSearching(false)}} key={item.id} className='flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-cream/60'>
        {
          item.pfp ? <img className='h-10 w-10 shrink-0 rounded-full object-cover' src={item.pfp} alt={item.name} />:
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-lime' >
          <IoPersonOutline />
          </span>
        }
        <div className='flex min-w-0 flex-col'>
          <span className='truncate text-sm font-semibold text-ink'>{item.name}</span>
          <span className='truncate text-xs text-black/55'>{!item.type?`@${item.userName}`:"Group"}</span>
        </div>
        <button className='ml-auto shrink-0 cursor-pointer rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-lime transition-colors hover:bg-ink-soft'>Message</button>
      </div>
    }):
    <div className='flex w-full flex-col items-center justify-center py-8 text-center text-sm text-black/55'>
      <p>No results found</p>
    </div>}
  </div>
}
