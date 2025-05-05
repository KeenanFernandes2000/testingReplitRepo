import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const uploadFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long"),
  tags: z.array(z.string()),
  videoFile: z.instanceof(File).optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export default function UploadForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<string[]>(["Daily Life"]);
  const [newTag, setNewTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: tags,
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };
  
  const onSubmit = async (data: UploadFormValues) => {
    if (!selectedFile) {
      alert("Please select a video file");
      return;
    }
    
    if (!user) {
      alert("You must be logged in to upload");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // First, get a presigned URL for the file upload
      const presignedResponse = await apiRequest("POST", "/api/vlogs/presigned", {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });
      
      const { uploadUrl, fileKey } = await presignedResponse.json();
      
      // Upload the file directly to YouTube
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      // Mock progress updates
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 1000);
      
      // Upload to YouTube through our API
      const uploadResponse = await apiRequest("POST", "/api/vlogs/upload", {
        title: data.title,
        description: data.description,
        tags: tags,
        fileKey,
      });
      
      clearInterval(uploadInterval);
      setUploadProgress(100);
      
      const { vlog } = await uploadResponse.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/vlogs/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.username}/vlogs/active`] });
      
      // Redirect to the feed or vlog page
      setTimeout(() => {
        navigate("/");
      }, 1000);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <input 
          {...register("title")}
          id="title" 
          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
          placeholder="Enter a title for your vlog" 
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea 
          {...register("description")}
          id="description" 
          rows={3} 
          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
          placeholder="Add a description..."
        ></textarea>
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
              {tag}
              <button type="button" className="ml-1.5 text-white hover:text-gray-200" onClick={() => removeTag(tag)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input 
            type="text" 
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 px-4 py-2 rounded-l-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
            placeholder="Add a tag..." 
          />
          <button 
            type="button"
            onClick={addTag}
            className="px-4 py-2 rounded-r-lg bg-gray-600 text-white hover:bg-gray-500"
          >
            Add
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/mov,video/avi"
          className="hidden"
        />
        
        {!selectedFile ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-gray-500"
          >
            <div className="flex flex-col items-center justify-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-400 mb-2">Upload your video file</p>
              <p className="text-xs text-gray-500">MP4, MOV, or AVI up to 10 minutes</p>
              <button 
                type="button"
                className="mt-4 bg-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Select Video
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-2 border-gray-600 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Uploading to YouTube...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button 
          type="button"
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={isUploading || !selectedFile}
          className={`px-4 py-2 rounded-lg ${
            isUploading || !selectedFile 
              ? "bg-gray-600 text-gray-300 cursor-not-allowed" 
              : "bg-primary hover:bg-indigo-600 text-white"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload to YouTube"}
        </button>
      </div>
    </form>
  );
}
