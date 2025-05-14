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

const siteSchema = z.object({
  domain: z.string().url({ message: "Please enter a valid URL" }),
});

type SiteFormValues = z.infer<typeof siteSchema>;

export default function ConnectWebsite() {
  const [isLoading, setIsLoading] = useState(false);
  const [siteId, setSiteId] = useState("");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      domain: "",
    },
  });

  async function onSubmit(values: SiteFormValues) {
    setIsLoading(true);
    try {
      // In a real implementation, this would make an API call to register the domain
      // For the demo, we'll just generate a fake site ID
      const generatedSiteId = "site_" + Math.random().toString(36).substring(2, 15);
      setSiteId(generatedSiteId);
      
      toast({
        title: "Website connected",
        description: "Your website has been connected successfully.",
      });
      
      // Don't automatically redirect - let the user click to continue
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error connecting your website.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const jsSnippet = `<script src="https://api.marksync.io/js/widget.js?id=${siteId || 'YOUR_SITE_ID'}"></script>`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Connect Your Website</CardTitle>
              <CardDescription className="mt-1">
                Let's connect MarkSync to your website to start collecting data
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold">
                2
              </div>
              <p className="text-sm text-gray-500">Step 2 of 3</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="javascript">JavaScript Snippet</TabsTrigger>
              <TabsTrigger value="cms">CMS Plugins</TabsTrigger>
            </TabsList>
            <TabsContent value="javascript" className="space-y-4 mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Connecting...
                      </>
                    ) : (
                      "Connect Website"
                    )}
                  </Button>
                </form>
              </Form>

              {siteId && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-md bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Add this code to your website</h3>
                      <p className="text-xs text-green-600 font-medium">Website Connected!</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Copy and paste this code into the <code className="bg-gray-100 p-1 rounded text-xs">&lt;head&gt;</code> of your website.
                    </p>
                    <CodeSnippet code={jsSnippet} language="html" className="mt-3" />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="cms" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">WordPress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Install our WordPress plugin to easily connect your site.
                    </p>
                    <Button className="mt-4 w-full" variant="outline">
                      <i className="fab fa-wordpress mr-2"></i>
                      Download Plugin
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Shopify</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Add MarkSync to your Shopify store with our app.
                    </p>
                    <Button className="mt-4 w-full" variant="outline">
                      <i className="fab fa-shopify mr-2"></i>
                      Install App
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Wix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Connect your Wix site with our integration.
                    </p>
                    <Button className="mt-4 w-full" variant="outline">
                      <i className="fas fa-plug mr-2"></i>
                      Add to Wix
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Squarespace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Add MarkSync to your Squarespace site.
                    </p>
                    <Button className="mt-4 w-full" variant="outline">
                      <i className="fas fa-puzzle-piece mr-2"></i>
                      Install Extension
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
          <Button onClick={() => setLocation("/company-setup")} disabled={!siteId && !isLoading}>
            Continue to Company Setup
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
