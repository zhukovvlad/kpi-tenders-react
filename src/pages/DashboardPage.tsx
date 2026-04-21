import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileText, Upload, LogOut, Bell, User } from "lucide-react"
import { GlassCard } from "@/components/GlassCard"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface Document {
  id: string
  name: string
  size: string
  uploadedAt: string
  status: "processing" | "ready" | "error"
}

const STUB_DOCUMENTS: Document[] = [
  { id: "1", name: "tender-2024-q1.pdf", size: "2.4 MB", uploadedAt: "2026-04-10", status: "ready" },
  { id: "2", name: "specification-lot3.docx", size: "840 KB", uploadedAt: "2026-04-12", status: "ready" },
  { id: "3", name: "contract-draft.pdf", size: "1.1 MB", uploadedAt: "2026-04-14", status: "processing" },
]

const STATUS_STYLES: Record<Document["status"], string> = {
  ready: "bg-emerald-500/20 text-emerald-400",
  processing: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
}

export default function DashboardPage() {
  const { logout } = useAuth()
  const [documents, setDocuments] = useState<Document[]>(STUB_DOCUMENTS)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocs: Document[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "processing",
    }))
    setDocuments((prev) => [...newDocs, ...prev])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  })

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Ambient spheres */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-100 w-100 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-75 w-75 rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium">Tender Analysis</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-white">Documents</h1>

        {/* Drop zone */}
        <GlassCard className="mb-8">
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl p-10 transition-colors ${
              isDragActive ? "border-2 border-dashed border-indigo-500 bg-indigo-500/10" : "border-2 border-dashed border-white/10 hover:border-white/20"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-white/30" />
            {isDragActive ? (
              <p className="text-sm text-indigo-400">Drop files here…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-white/70">Drag & drop files here, or click to select</p>
                <p className="text-xs text-white/30">Supported: PDF, DOC, DOCX</p>
              </>
            )}
          </div>
        </GlassCard>

        {/* Documents table */}
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="flex items-center gap-3 px-6 py-4 text-white/80">
                      <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-white/50">{doc.size}</td>
                    <td className="px-6 py-4 text-white/50">{doc.uploadedAt}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}
