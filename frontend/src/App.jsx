import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import EmailMonitor from './pages/EmailMonitor'
import AnalyzeInteraction from './pages/AnalyzeInteraction'
import CustomerHistory from './pages/CustomerHistory'
import RecommendationView from './pages/RecommendationView'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/emails" element={<EmailMonitor />} />
              <Route path="/analyze" element={<AnalyzeInteraction />} />
              <Route path="/customers/:id" element={<CustomerHistory />} />
              <Route path="/interactions/:id" element={<RecommendationView />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}