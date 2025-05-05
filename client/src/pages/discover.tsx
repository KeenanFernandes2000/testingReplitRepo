import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/shared/Sidebar";
import MobileNavBar from "@/components/shared/MobileNavBar";
import Header from "@/components/shared/Header";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Discover() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: users, isLoading } = useQuery<{ users: User[] }>({
    queryKey: [`/api/users/discover${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`],
    enabled: isAuthenticated,
  });
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    // Redirect to auth if not authenticated
    navigate("/auth");
    return null;
  }

  const handleFollow = async (userId: number) => {
    try {
      await apiRequest("POST", `/api/users/${userId}/follow`, {});
      // Invalidate user cache
      // queryClient.invalidateQueries([`/api/users/discover`]);
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Header title="Discover Creators" />
        
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* User Grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : users && users.users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.users.map((user) => (
                <div key={user.id} className="bg-gray-800 rounded-xl p-4 shadow-md">
                  <div className="flex items-start">
                    <Link href={`/profile/${user.username}`}>
                      <a className="flex-shrink-0">
                        <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
                          alt={user.displayName} 
                          className="w-14 h-14 rounded-full object-cover" 
                        />
                      </a>
                    </Link>
                    
                    <div className="ml-3 flex-1">
                      <Link href={`/profile/${user.username}`}>
                        <a className="hover:underline">
                          <h3 className="font-semibold text-white">{user.displayName}</h3>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                        </a>
                      </Link>
                      
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                        {user.bio || "No bio available"}
                      </p>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-400">
                          <span className="font-semibold text-white">{user.followersCount}</span> followers
                        </div>
                        
                        <button
                          onClick={() => handleFollow(user.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isFollowing
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-primary text-white hover:bg-indigo-600"
                          }`}
                        >
                          {user.isFollowing ? "Following" : "Follow"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <p className="text-gray-400">No users found matching "{searchQuery}"</p>
              ) : (
                <p className="text-gray-400">No users found. Try different search terms.</p>
              )}
            </div>
          )}
        </div>
      </main>
      
      <MobileNavBar />
    </div>
  );
}
