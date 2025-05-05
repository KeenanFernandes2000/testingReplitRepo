import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vlog } from "@/types";
import { useAuth } from "./use-auth";

export function useVlogs(filter: string = "all") {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error } = useQuery<{ vlogs: Vlog[] }>({
    queryKey: [`/api/vlogs/feed${filter !== "all" ? `?filter=${filter}` : ""}`],
    enabled: isAuthenticated,
  });
  
  // Return the vlogs and loading state
  return {
    vlogs: data?.vlogs || [],
    isLoading,
    error,
  };
}

export function useVlog(vlogId: string | number) {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error } = useQuery<{ vlog: Vlog }>({
    queryKey: [`/api/vlogs/${vlogId}`],
    enabled: isAuthenticated && !!vlogId,
  });
  
  return {
    vlog: data?.vlog,
    isLoading,
    error,
  };
}
