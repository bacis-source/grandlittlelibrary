import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { DetailPage } from './pages/DetailPage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NoticingFormPage } from './pages/NoticingFormPage'
import { BulkImportPage } from './pages/BulkImportPage'
import { TrashPage } from './pages/TrashPage'

export function ProtectedRoute() { const { session, loading } = useAuth(); if (loading) return <div className="splash">Choko Studio Library</div>; return session ? <Outlet/> : <Navigate to="/login" replace/> }
export default function App() { return <Routes><Route path="/login" element={<LoginPage/>}/><Route element={<ProtectedRoute/>}><Route element={<Layout/>}><Route index element={<DashboardPage/>}/><Route path="library" element={<LibraryPage/>}/><Route path="trash" element={<TrashPage/>}/><Route path="new" element={<NoticingFormPage/>}/><Route path="import" element={<BulkImportPage/>}/><Route path="noticings/:id" element={<DetailPage/>}/><Route path="noticings/:id/edit" element={<NoticingFormPage/>}/></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes> }
