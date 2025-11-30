import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) {
    console.log('No session, redirecting to login');
    redirect('/login');
  }
  
  // Per ora permettiamo l'accesso se c'è una session
  // TODO: Verifica il ruolo admin quando implementiamo Firebase Admin
  return sessionCookie;
}
