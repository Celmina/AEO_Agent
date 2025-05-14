import { useState } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeSnippet } from "@/components/ui/code-snippet";
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
  const [siteId, setSiteId] = useState("");
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
      setSiteId(data.id.toString());
      toast({
        title: "Website registered",
        description: "Your website has been registered. Now add the code snippet to complete the connection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error connecting your website.",
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

  const jsSnippet = `<script 
  src="${window.location.origin}/chatbot-v2.js" 
  id="${siteId || 'YOUR_SITE_ID'}"
  data-position="bottom-right"
  data-color="#4f46e5"
  data-title="Chat with our AI Assistant"
></script>`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Connect Your Website</CardTitle>
              <CardDescription className="mt-1">
                Add AI-powered chatbot to your website and capture visitor questions for AEO
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold">
                1
              </div>
              <p className="text-sm text-gray-500">Step 1 of 2</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="javascript">AI Chatbot Setup</TabsTrigger>
              <TabsTrigger value="cms">CMS Integrations</TabsTrigger>
            </TabsList>
            <TabsContent value="javascript" className="space-y-4 mt-4">
              <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
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
                  Our AI chatbot will automatically learn about your website content and provide accurate answers to your visitors using OpenAI's GPT-4o. 
                  Questions asked to the chatbot will be used to create AEO content for your website, which you'll be able to review and approve.
                </p>
              </div>
                
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || createWebsiteMutation.isPending}>
                    {isLoading || createWebsiteMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting Website...
                      </span>
                    ) : (
                      "Connect Website"
                    )}
                  </Button>
                </form>
              </Form>

              {siteId && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-blue-800">Website Registered Successfully!</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-blue-700">
                      <strong>Important:</strong> Your website is registered but not yet connected. To complete the connection, add the AI chatbot 
                      code below to your website by pasting it right before the closing <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag.
                    </p>
                    <CodeSnippet code={jsSnippet} language="html" className="mt-3" />
                  </div>
                  
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-medium text-amber-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Connection Process & Next Steps
                    </h3>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        <span><strong>Add the code</strong> to your website to complete the actual connection</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Once added, the AI chatbot will appear on your website and use OpenAI's GPT-4o to answer questions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span>Visitor questions will be stored and converted to AEO content suggestions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">4.</span>
                        <span>You'll review and approve content before it's added to your website with SEO schema markup</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="cms" className="mt-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
                <h3 className="text-sm font-medium text-amber-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Coming Soon
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  Our CMS integrations are currently in development and will be available soon. For now, please use the JavaScript integration method to add the chatbot to your website.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                      WordPress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Install our WordPress plugin to easily add the AI chatbot to your site.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      Shopify
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Add our AI chatbot to your Shopify store with our app.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                      Wix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Connect your Wix site with our AI chatbot integration.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                      Squarespace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Add our AI chatbot to your Squarespace site.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Skip for now</Link>
          </Button>
          <Button onClick={() => setLocation("/chatbot-config")} disabled={!siteId && !isLoading}>
            Continue to Chatbot Setup
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
