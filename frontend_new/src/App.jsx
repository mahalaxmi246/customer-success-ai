import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import EmailMonitor from './pages/EmailMonitor'
import AnalyzeInteraction from './pages/AnalyzeInteraction'
import CustomerHistory from './pages/CustomerHistory'
import RecommendationView from './pages/RecommendationView'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />

        {/* App routes (require auth) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/emails" element={<EmailMonitor />} />
          <Route path="/analyze" element={<AnalyzeInteraction />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/customers/:id" element={<CustomerHistory />} />
          <Route path="/interactions/:id" element={<RecommendationView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
