import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/shared/Sidebar";
import MobileNavBar from "@/components/shared/MobileNavBar";
import Header from "@/components/shared/Header";
import ProfileHeader from "@/components/profile/ProfileHeader";
import VlogGrid from "@/components/profile/VlogGrid";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  
  // If no username provided, use the current user's profile
  useEffect(() => {
    if (!username && currentUser) {
      navigate(`/profile/${currentUser.username}`);
    }
  }, [username, currentUser, navigate]);

  const profileUsername = username || (currentUser?.username || "");
  const isOwnProfile = currentUser?.username === profileUsername;

  const { data: profileData, isLoading } = useQuery<{ user: User, isFollowing: boolean }>({ 
    queryKey: [`/api/users/${profileUsername}`],
    enabled: !!profileUsername,
  });

  const { data: activeVlogs, isLoading: activeVlogsLoading } = useQuery({
    queryKey: [`/api/users/${profileUsername}/vlogs/active`],
    enabled: !!profileUsername,
  });

  const { data: expiredVlogs, isLoading: expiredVlogsLoading } = useQuery({
    queryKey: [`/api/users/${profileUsername}/vlogs/expired`],
    enabled: !!profileUsername && isOwnProfile,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
        <Link href="/">
          <a className="bg-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
            Go back home
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Header 
          backButton={true} 
          title={`${profileData?.user.displayName}'s Profile`}
        />
        
        <div className="max-w-5xl mx-auto px-4 py-6">
          {profileData && (
            <ProfileHeader 
              user={profileData.user} 
              isFollowing={profileData.isFollowing} 
              isOwnProfile={isOwnProfile}
            />
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Active Vlogs</h2>
            {activeVlogsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <VlogGrid vlogs={activeVlogs?.vlogs || []} />
            )}
          </div>
          
          {isOwnProfile && (
            <div>
              <h2 className="text-xl font-bold mb-4">Expired Vlogs</h2>
              {expiredVlogsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : expiredVlogs?.vlogs && expiredVlogs.vlogs.length > 0 ? (
                <>
                  {expiredVlogs.vlogs.slice(0, 3).map((vlog) => (
                    <div key={vlog.id} className="bg-gray-800 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden mr-3">
                            <img 
                              src={vlog.thumbnailUrl} 
                              alt={vlog.title} 
                              className="w-full h-full object-cover grayscale opacity-50"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{vlog.title}</h3>
                            <p className="text-xs text-gray-400">
                              {new Date(vlog.createdAt).toLocaleDateString()} • {vlog.duration}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            // Re-upload functionality would be implemented here
                            navigate('/upload', { replace: true, state: { vlogToReupload: vlog } });
                          }}
                          className="text-primary hover:text-indigo-400 text-sm font-medium"
                        >
                          Re-upload
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {expiredVlogs.vlogs.length > 3 && (
                    <div className="text-center">
                      <button 
                        onClick={() => {
                          // View more expired vlogs functionality
                          // Would implement a modal or expanded view
                        }}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        View More Expired Vlogs
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-center py-4">No expired vlogs found.</p>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileNavBar />
    </div>
  );
}
