import { useState } from "react";
import { Link } from "wouter";
import CountdownTimer from "./CountdownTimer";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Vlog } from "@/types";

interface VideoCardProps {
  vlog: Vlog;
}

export default function VideoCard({ vlog }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [likes, setLikes] = useState(vlog.likes);
  const [comments, setComments] = useState(vlog.comments);
  const [hasLiked, setHasLiked] = useState(vlog.hasLiked);
  
  const handleLike = async () => {
    try {
      const method = hasLiked ? "DELETE" : "POST";
      await apiRequest(method, `/api/vlogs/${vlog.id}/like`, {});
      
      setLikes(prev => hasLiked ? prev - 1 : prev + 1);
      setHasLiked(!hasLiked);
      
      // Invalidate the feed cache
      queryClient.invalidateQueries({ queryKey: ["/api/vlogs/feed"] });
    } catch (error) {
      console.error("Error liking/unliking vlog:", error);
    }
  };
  
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/vlog/${vlog.id}`);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing vlog:", error);
    }
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden mb-6 shadow-lg">
      <div className="p-4 flex items-center">
        <Link href={`/profile/${vlog.user.username}`}>
          <a>
            <img 
              src={vlog.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vlog.user.displayName)}&background=random`} 
              alt={`${vlog.user.displayName} profile`} 
              className="w-10 h-10 rounded-full mr-3" 
            />
          </a>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/profile/${vlog.user.username}`}>
                <a className="hover:underline">
                  <h3 className="font-medium text-white">{vlog.user.displayName}</h3>
                </a>
              </Link>
              <p className="text-xs text-gray-400">
                @{vlog.user.username} • {formatDistanceToNow(new Date(vlog.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center">
              <CountdownTimer expiresAt={vlog.expiresAt} />
              <button className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative pt-[56.25%] bg-black">
        {isPlaying ? (
          <iframe 
            src={`https://www.youtube.com/embed/${vlog.youtubeId}?autoplay=1`}
            className="absolute inset-0 w-full h-full"
            title={vlog.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <img 
              src={vlog.thumbnailUrl} 
              alt={`${vlog.title} thumbnail`} 
              className="w-full h-full object-cover"
              onClick={togglePlay}
            />
            <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
              <div className="h-14 w-14 rounded-full bg-primary/80 flex items-center justify-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 rounded text-xs font-medium">
              {vlog.duration}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h2 className="font-medium text-lg mb-2">{vlog.title}</h2>
        <p className="text-gray-300 text-sm mb-4">{vlog.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center ${hasLiked ? 'text-secondary' : 'text-gray-300 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill={hasLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likes}</span>
            </button>
            <Link href={`/vlogs/${vlog.id}/comments`}>
              <a className="flex items-center text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{comments.length}</span>
              </a>
            </Link>
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center text-gray-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
