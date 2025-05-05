import { Link } from "wouter";
import { Vlog } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface VlogGridProps {
  vlogs: Vlog[];
}

export default function VlogGrid({ vlogs }: VlogGridProps) {
  if (vlogs.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">No vlogs found.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vlogs.map((vlog) => {
        // Calculate time left
        const now = new Date();
        const expiration = new Date(vlog.expiresAt);
        const diffMs = expiration.getTime() - now.getTime();
        const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        
        return (
          <Link key={vlog.id} href={`/vlogs/${vlog.id}`}>
            <a className="bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="relative pt-[56.25%]">
                <img 
                  src={vlog.thumbnailUrl} 
                  alt={vlog.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <span>{hoursLeft}h left</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-medium">
                  {vlog.duration}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white truncate">{vlog.title}</h3>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-400">
                    {formatDistanceToNow(new Date(vlog.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{vlog.likes}</span>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
