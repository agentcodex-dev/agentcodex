import type { Metadata } from 'next'
import AdminLoginForm from '@/components/AdminLoginForm'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: 'Admin Login | AgentCodex',
}

export default function AdminPage() {
  return <AdminLoginForm />
}