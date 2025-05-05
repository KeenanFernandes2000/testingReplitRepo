import { useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title?: string;
  backButton?: boolean;
}

export default function Header({ title, backButton = false }: HeaderProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return (
    <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center justify-between">
      {backButton ? (
        <button 
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      ) : (
        <h1 className="text-xl font-bold md:hidden">
          <span className="text-primary">Vlog</span><span className="text-secondary">72</span>
        </h1>
      )}
      
      {title && <h2 className="hidden md:block text-xl font-semibold">{title}</h2>}
      
      <div className="flex items-center">
        {user && (
          <>
            <button className="p-2 rounded-full hover:bg-gray-800 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
              className="h-8 w-8 rounded-full" 
              alt="Profile" 
            />
          </>
        )}
      </div>
    </header>
  );
}
