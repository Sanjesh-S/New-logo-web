import PickupAgentGuard from '@/components/pickup-agent/PickupAgentGuard'

export default function PickupAgentLayout({ children }: { children: React.ReactNode }) {
  return <PickupAgentGuard>{children}</PickupAgentGuard>
}
