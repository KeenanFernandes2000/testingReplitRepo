import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNavBar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") {
      return true;
    }
    if (path !== "/" && location.startsWith(path)) {
      return true;
    }
    return false;
  };
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-10">
      <div className="flex justify-around items-center h-16">
        <Link href="/">
          <a className={`flex flex-col items-center justify-center ${isActive("/") ? "text-primary" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        
        <Link href="/discover">
          <a className={`flex flex-col items-center justify-center ${isActive("/discover") ? "text-primary" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-1">Discover</span>
          </a>
        </Link>
        
        <Link href="/upload">
          <a className="flex flex-col items-center justify-center">
            <div className="bg-gradient-to-r from-primary to-secondary h-12 w-12 rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </a>
        </Link>
        
        <Link href={user ? `/profile/${user.username}` : "/auth"}>
          <a className={`flex flex-col items-center justify-center ${isActive("/profile") ? "text-primary" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
