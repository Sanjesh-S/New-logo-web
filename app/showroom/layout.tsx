import ShowroomGuard from '@/components/showroom/ShowroomGuard'

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return <ShowroomGuard>{children}</ShowroomGuard>
}
