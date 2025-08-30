import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PollsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
