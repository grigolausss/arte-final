"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const Header = () => {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const email = localStorage.getItem('employeeEmail');
        setUserEmail(email || '');
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('employeeAuthToken');
        localStorage.removeItem('employeeEmail');
        router.push('/admin/login');
    };

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <Link href="/admin/dashboard">
                    <h1 className="text-2xl font-bold text-blue-900 cursor-pointer">Pannello ADA</h1>
                </Link>
                <nav className="space-x-4">
                    <Link href="/admin/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</Link>
                    <Link href="/admin/immobili" className="text-gray-600 hover:text-blue-700">Immobili</Link>
                    <Link href="/admin/utenti" className="text-gray-600 hover:text-blue-700">Utenti</Link>
                    <Link href="/admin/logs" className="text-gray-600 hover:text-blue-700">Log Attività</Link>
                    <Link href="/admin/archivio" className="text-gray-600 hover:text-blue-700">Archivio</Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {userEmail && <span className="text-sm text-gray-500">Loggato come: {userEmail}</span>}
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Logout
                </button>
            </div>
        </header>
    );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Paths where the header should NOT be displayed
  const noHeaderPaths = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

  const showHeader = !noHeaderPaths.some(path => pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-100">
      {showHeader && <Header />}
      <main className={showHeader ? "p-4 sm:p-8" : ""}>
        {children}
      </main>
    </div>
  );
}
