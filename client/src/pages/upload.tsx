import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/shared/Sidebar";
import MobileNavBar from "@/components/shared/MobileNavBar";
import Header from "@/components/shared/Header";
import UploadForm from "@/components/upload/UploadForm";
import { useAuth } from "@/hooks/use-auth";

export default function Upload() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to auth if not authenticated
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Header title="Upload New Vlog" />
        
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h1 className="text-xl font-bold mb-6">Upload New Vlog</h1>
            
            <div className="mb-6">
              <p className="text-gray-300 text-sm">
                Share your moments with followers! Your vlog will be uploaded to your YouTube account as an unlisted video
                and will be visible to your followers for 72 hours.
              </p>
            </div>
            
            <UploadForm />
          </div>
        </div>
      </main>
      
      <MobileNavBar />
    </div>
  );
}
