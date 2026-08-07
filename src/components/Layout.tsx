import { BookOpen, Grid2X2, House, LogOut, Plus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Layout() {
  return <div className="shell">
    <header className="topbar"><NavLink to="/" className="brand"><span className="brand-mark">C</span><span>Choko Studio<br/><small>Library</small></span></NavLink><button className="icon-button" aria-label="Log out" onClick={() => supabase.auth.signOut()}><LogOut size={19}/></button></header>
    <main><Outlet /></main>
    <nav className="bottom-nav" aria-label="Primary navigation">
      <NavLink to="/"><House/><span>Home</span></NavLink><NavLink to="/library"><Grid2X2/><span>Library</span></NavLink><NavLink to="/new" className="add"><Plus/><span>New</span></NavLink><NavLink to="/library?filter=favorite"><BookOpen/><span>Favorites</span></NavLink>
    </nav>
  </div>
}
