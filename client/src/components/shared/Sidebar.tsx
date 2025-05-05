import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 p-4 h-screen sticky top-0">
      <div className="flex items-center mb-8">
        <Link href="/" className="text-2xl font-bold text-white flex items-center">
          <span className="text-primary">Vlog</span>
          <span className="text-secondary">72</span>
        </Link>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link href="/" className={`flex items-center p-2 rounded-lg ${isActive("/") ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
          </li>
          <li>
            <Link href="/discover" className={`flex items-center p-2 rounded-lg ${isActive("/discover") ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Discover
            </Link>
          </li>
          <li>
            <Link href="/upload" className={`flex items-center p-2 rounded-lg ${isActive("/upload") ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </Link>
          </li>
          <li>
            <Link href={user ? `/profile/${user.username}` : "/auth"} className={`flex items-center p-2 rounded-lg ${location.startsWith("/profile") ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">72-hour videos are a great way to share authentic moments!</p>
          <Link href="/upload" className="block w-full bg-primary hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium text-center">
            Upload New Vlog
          </Link>
        </div>
        
        {user && (
          <Link href={`/profile/${user.username}`} className="flex items-center mt-4 p-2 rounded-lg hover:bg-gray-700">
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
              className="h-8 w-8 rounded-full mr-2" 
              alt="Profile" 
            />
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
