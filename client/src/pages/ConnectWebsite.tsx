import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const siteSchema = z.object({
  domain: z.string().url({ message: "Please enter a valid URL" }),
  name: z.string().min(1, { message: "Please enter a website name" }),
});

type SiteFormValues = z.infer<typeof siteSchema>;

export default function ConnectWebsite() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      domain: "",
      name: "",
    },
  });

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: SiteFormValues) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      
      // Redirect to chatbot setup page after successful registration
      setLocation("/chatbot-config");
      
      toast({
        title: "Website Registered Successfully!",
        description: "Your website has been registered. Now let's configure your chatbot.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error registering your website.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(values: SiteFormValues) {
    setIsLoading(true);
    try {
      await createWebsiteMutation.mutateAsync(values);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle className="text-2xl font-bold">Register Your Website</CardTitle>
            <CardDescription className="mt-1">
              Add your website details to get started with our AI chatbot
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/20">
            <h3 className="font-medium text-primary mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 mr-2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              ecom.ai Intelligent Chatbot
            </h3>
            <p className="text-sm text-gray-600">
              Our AI chatbot will automatically learn about your website content and provide accurate answers 
              to your visitors using OpenAI's GPT-4o.
            </p>
          </div>
              
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Website" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || createWebsiteMutation.isPending}>
                {isLoading || createWebsiteMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Continue to Chatbot Setup"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}