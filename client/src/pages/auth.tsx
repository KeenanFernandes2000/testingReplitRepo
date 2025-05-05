import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Auth() {
  const { signInWithGoogle, login, register, isAuthenticated, isLoading, authError } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  
  // Setup login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  // Setup registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: ""
    }
  });
  
  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
      toast({
        title: "Login successful",
        description: "Welcome back to Vlog72!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive"
      });
    }
  };
  
  // Handle registration form submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      // Remove confirmPassword as it's not needed in the API call
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      toast({
        title: "Registration successful",
        description: "Welcome to Vlog72!",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  return (
    <div className="min-h-screen flex md:flex-row flex-col bg-gray-900">
      {/* Left side - Authentication forms */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary">Vlog</span>
              <span className="text-secondary">72</span>
            </h1>
            <p className="text-gray-300 text-sm">Your moments, for 72 hours</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Your password" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 
                        "Sign In"
                      }
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="username" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Only lowercase letters, numbers, and underscores
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your Name" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 
                        "Create Account"
                      }
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
              
              <button
                onClick={signInWithGoogle}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </button>
            </div>
            
            <p className="mt-6 text-xs text-gray-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
            
            {/* Bypass Authentication Button */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <Button 
                variant="link" 
                className="w-full text-gray-400 hover:text-white"
                onClick={() => navigate("/")}
              >
                Skip Authentication (Development Only)
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Hero/Promo area */}
      <div className="md:w-1/2 w-full bg-gradient-to-br from-gray-800 to-gray-900 p-6 flex flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            Share your moments with the world
          </h2>
          <p className="text-gray-300 mb-6">
            Vlog72 is a time-limited video sharing platform where your vlogs expire after 72 hours. 
            Create authentic content without worrying about your digital footprint.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="rounded-full bg-primary/20 p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-left">Content disappears after 72 hours</p>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-secondary/20 p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-left">Follow creators you love</p>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-primary/20 p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-300 text-left">Share videos directly from YouTube</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
