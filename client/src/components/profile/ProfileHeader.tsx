import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ProfileHeaderProps {
  user: User;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function ProfileHeader({ user, isFollowing: initialIsFollowing, isOwnProfile }: ProfileHeaderProps) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await apiRequest(method, `/api/users/${user.id}/follow`, {});
      
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.username}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vlogs/feed"] });
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
      <div className="px-6 pb-6 relative">
        <div className="-mt-12 mb-4">
          <img 
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-gray-800 object-cover" 
          />
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
            <p className="text-gray-400">@{user.username}</p>
            <p className="mt-2 text-gray-300">{user.bio || "No bio available"}</p>
            <div className="mt-3 flex space-x-4">
              <Link href={`/profile/${user.username}/following`}>
                <a className="hover:underline">
                  <span className="font-bold text-white">{user.followingCount}</span>
                  <span className="text-gray-400 text-sm"> following</span>
                </a>
              </Link>
              <Link href={`/profile/${user.username}/followers`}>
                <a className="hover:underline">
                  <span className="font-bold text-white">{followersCount}</span>
                  <span className="text-gray-400 text-sm"> followers</span>
                </a>
              </Link>
            </div>
          </div>
          {isOwnProfile ? (
            <Link href="/settings">
              <a className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Edit Profile
              </a>
            </Link>
          ) : (
            <button
              onClick={handleFollowToggle}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isFollowing
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-primary hover:bg-indigo-600 text-white"
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                isFollowing ? "Following" : "Follow"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
