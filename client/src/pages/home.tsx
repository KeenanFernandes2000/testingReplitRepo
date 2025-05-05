import { useState } from "react";
import { useVlogs } from "@/hooks/use-vlogs";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import MobileNavBar from "@/components/shared/MobileNavBar";
import VideoCard from "@/components/feed/VideoCard";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "friends", label: "Friends" },
  { id: "travel", label: "Travel" },
  { id: "creative", label: "Creative" },
  { id: "daily", label: "Daily Life" },
];

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const { vlogs, isLoading } = useVlogs(activeFilter);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-primary">Vlog</span>
            <span className="text-secondary">72</span>
          </h1>
          <p className="text-gray-300 max-w-md">
            Share 72-hour vlogs with your followers. Authentic moments that disappear after 3 days.
          </p>
        </div>
        
        <Link href="/auth" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white py-3 px-8 rounded-lg font-medium inline-block">
          Log in with Google
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Header title="Following Feed" />
        
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Feed Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 ${
                  activeFilter === filter.id
                    ? "bg-primary text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                } rounded-full text-sm font-medium whitespace-nowrap`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Vlogs Feed */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : vlogs && vlogs.length > 0 ? (
            vlogs.map((vlog) => <VideoCard key={vlog.id} vlog={vlog} />)
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No vlogs found in your feed.</p>
              {activeFilter !== "all" ? (
                <button 
                  onClick={() => setActiveFilter("all")}
                  className="text-primary hover:text-indigo-400"
                >
                  View all vlogs
                </button>
              ) : (
                <Link href="/discover" className="text-primary hover:text-indigo-400 inline-block">
                  Discover new creators
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileNavBar />
    </div>
  );
}
