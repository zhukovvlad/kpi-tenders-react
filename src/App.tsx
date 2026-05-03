import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"
import { useAuth } from "@/hooks/useAuth"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import DashboardPage from "@/pages/DashboardPage"
import SitesNewPage from "@/pages/SitesNewPage"
import SitePage from "@/pages/SitePage"
import SiteEditPage from "@/pages/SiteEditPage"
import ContractPage from "@/pages/ContractPage"
import ExtractionRequestPage from "@/pages/ExtractionRequestPage"
import ComparePage from "@/pages/ComparePage"
import KeysPage from "@/pages/KeysPage"
import SettingsPage from "@/pages/SettingsPage"
import ProfilePage from "@/pages/ProfilePage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-[1.5px] border-border-default border-t-accent" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Публичные роуты */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Приватная зона: общий каркас + защита */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sites/new" element={<SitesNewPage />} />
        <Route path="/sites/:siteId" element={<SitePage />} />
        <Route path="/sites/:siteId/edit" element={<SiteEditPage />} />
        <Route
          path="/sites/:siteId/documents/:docId"
          element={<ContractPage />}
        />
        <Route
          path="/sites/:siteId/documents/:docId/extractions/:requestId"
          element={<ExtractionRequestPage />}
        />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/keys" element={<KeysPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
