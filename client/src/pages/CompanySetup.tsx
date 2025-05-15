import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const companySchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  industry: z.string().min(1, { message: "Industry is required" }),
  targetAudience: z.string().min(1, { message: "Target audience is required" }),
  brandVoice: z.string().min(1, { message: "Brand voice is required" }),
  services: z.string().min(1, { message: "Core products/services are required" }),
  valueProposition: z.string().min(1, { message: "Value proposition is required" }),
  additionalInfo: z.string().optional()
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanySetup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [scrapedData, setScrapedData] = useState<any>(null);
  
  // Fetch websites to get the scraped content
  const { data: websites, isLoading: isWebsitesLoading } = useQuery({
    queryKey: ['/api/websites'],
    retry: 3,
  });
  
  // Fetch company profile
  const { data: profile } = useQuery({
    queryKey: ['/api/company/profile'],
    retry: 1,
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      industry: "",
      targetAudience: "",
      brandVoice: "",
      services: "",
      valueProposition: "",
      additionalInfo: ""
    },
  });
  
  // When websites data is loaded, extract the scraped content
  useEffect(() => {
    if (websites && Array.isArray(websites) && websites.length > 0) {
      const website = websites[0]; // Get first website
      if (website && website.scrapedContent) {
        try {
          let parsedContent: Record<string, any> = {};
          
          // Handle different data types
          if (typeof website.scrapedContent === 'string') {
            parsedContent = JSON.parse(website.scrapedContent);
          } else if (typeof website.scrapedContent === 'object') {
            parsedContent = website.scrapedContent as Record<string, any>;
          }
          
          if (Object.keys(parsedContent).length > 0) {
            setScrapedData(parsedContent);
            
            // Prefill form with scraped data if no profile exists
            if (!profile) {
              form.setValue("companyName", website.name || "");
              
              // Map industry from scraped data
              if (parsedContent.industry) {
                const industryMap: Record<string, string> = {
                  "ecommerce": "ecommerce",
                  "e-commerce": "ecommerce",
                  "software": "saas",
                  "saas": "saas",
                  "healthcare": "healthcare",
                  "finance": "finance",
                  "education": "education",
                  "retail": "retail",
                  "manufacturing": "manufacturing"
                };
                
                // Try to find matching industry or default to "other"
                const lowercaseIndustry = String(parsedContent.industry).toLowerCase();
                for (const [key, value] of Object.entries(industryMap)) {
                  if (lowercaseIndustry.includes(key)) {
                    form.setValue("industry", value);
                    break;
                  }
                }
              }
              
              // Set other values if they exist
              if (parsedContent.targetAudience) form.setValue("targetAudience", String(parsedContent.targetAudience));
              if (parsedContent.brandVoice) form.setValue("brandVoice", String(parsedContent.brandVoice));
              if (parsedContent.services) form.setValue("services", String(parsedContent.services));
              if (parsedContent.valueProposition) form.setValue("valueProposition", String(parsedContent.valueProposition));
            }
          }
        } catch (error) {
          console.error("Error parsing scraped content:", error);
        }
      }
    }
  }, [websites, profile, form]);
  
  // When profile data is loaded, populate the form
  useEffect(() => {
    if (profile && typeof profile === 'object') {
      const companyName = 'companyName' in profile ? String(profile.companyName || "") : "";
      const industry = 'industry' in profile ? String(profile.industry || "") : "";
      const targetAudience = 'targetAudience' in profile ? String(profile.targetAudience || "") : "";
      const brandVoice = 'brandVoice' in profile ? String(profile.brandVoice || "") : "";
      const services = 'services' in profile ? String(profile.services || "") : "";
      const valueProposition = 'valueProposition' in profile ? String(profile.valueProposition || "") : "";
      const additionalInfo = 'additionalInfo' in profile ? String(profile.additionalInfo || "") : "";
      
      form.reset({
        companyName,
        industry,
        targetAudience,
        brandVoice,
        services,
        valueProposition,
        additionalInfo
      });
    }
  }, [profile, form]);

  async function onSubmit(values: CompanyFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/company/profile', {
        method: profile ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save company profile');
      }
      
      toast({
        title: "Company profile saved",
        description: "Your company profile has been saved successfully.",
      });
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your company profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Company Profile Setup</CardTitle>
              <CardDescription className="mt-1">
                Tell us about your company to help us customize your experience
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold">
                3
              </div>
              <p className="text-sm text-gray-500">Step 3 of 3</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show scraped data alert */}
          {scrapedData && (
            <Alert className="mb-6 border-green-500/50 bg-green-50">
              <i className="fas fa-magic mr-2 text-green-500"></i>
              <AlertTitle className="text-green-600">We've analyzed your website</AlertTitle>
              <AlertDescription className="text-green-700">
                We've analyzed your website content and pre-filled some of the information below.
                Please review and adjust as needed.
              </AlertDescription>
              
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="scraped-data">
                  <AccordionTrigger className="text-sm">View Scraped Website Data</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded border border-gray-100 max-h-[300px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(scrapedData, null, 2)}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Alert>
          )}
          
          {isWebsitesLoading && !scrapedData && (
            <Alert className="mb-6 border-blue-500/50 bg-blue-50">
              <i className="fas fa-spinner fa-spin mr-2 text-blue-500"></i>
              <AlertTitle className="text-blue-600">Analyzing your website...</AlertTitle>
              <AlertDescription className="text-blue-700">
                We're analyzing your website to extract relevant information for your profile.
                This may take a moment.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your target audience (age range, interests, demographics, etc.)" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="brandVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Voice</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your brand voice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional & Formal</SelectItem>
                        <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                        <SelectItem value="authoritative">Authoritative & Expert</SelectItem>
                        <SelectItem value="casual">Casual & Conversational</SelectItem>
                        <SelectItem value="playful">Playful & Fun</SelectItem>
                        <SelectItem value="innovative">Innovative & Cutting-edge</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Core Products/Services</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List your main products or services" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="valueProposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Value Proposition</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What makes your business stand out from the competition?" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Guidelines & Additional Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any company guidelines, documentation, or details that will help the AI chatbot provide more accurate responses (FAQs, product specifications, policies, etc.)" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be used to train your AI chatbot to provide better answers specific to your business.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2 flex justify-between">
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Skip for now</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
