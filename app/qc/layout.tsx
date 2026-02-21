import QCGuard from '@/components/qc/QCGuard'

export default function QCLayout({ children }: { children: React.ReactNode }) {
  return <QCGuard>{children}</QCGuard>
}
