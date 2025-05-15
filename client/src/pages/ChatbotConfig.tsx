import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatbotPreview } from "@/components/chatbot/ChatbotPreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChatbotConfig() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    industry: "Technology",
    targetAudience: "",
    brandVoice: "Professional, friendly, and helpful",
    services: "",
    valueProposition: "",
    companyGuidelines: "",
  });
  
  const [chatbotSettings, setChatbotSettings] = useState({
    primaryColor: "#4f46e5",
    position: "bottom-right",
    initialMessage: "",
    collectEmail: true,
    responseTime: "instant",
  });
  
  // Fetch the latest website data
  const websitesQuery = useQuery<any[]>({
    queryKey: ["/api/websites"]
  });

  // Fetch company profile data (if it exists)
  const companyProfileQuery = useQuery<any>({
    queryKey: ["/api/company/profile"]
  });

  // Effect to handle website data
  useEffect(() => {
    if (websitesQuery.data && websitesQuery.data.length > 0) {
      const website = websitesQuery.data[0];
      
      // Set company name from website
      if (website.name) {
        setCompanyInfo(prev => ({
          ...prev,
          companyName: website.name
        }));
        
        // Update chatbot initial message with company name
        setChatbotSettings(prev => ({
          ...prev,
          initialMessage: `Hello! I'm the ${website.name} AI assistant. How can I help you today?`
        }));
      }
    }
  }, [websitesQuery.data]);

  // Effect to handle company profile data
  useEffect(() => {
    if (companyProfileQuery.data) {
      const data = companyProfileQuery.data;
      setCompanyInfo({
        companyName: data.companyName || companyInfo.companyName,
        industry: data.industry || companyInfo.industry,
        targetAudience: data.targetAudience || companyInfo.targetAudience,
        brandVoice: data.brandVoice || companyInfo.brandVoice,
        services: data.services || companyInfo.services,
        valueProposition: data.valueProposition || companyInfo.valueProposition,
        companyGuidelines: data.additionalInfo || companyInfo.companyGuidelines,
      });
      
      // Update chatbot initial message with company name
      setChatbotSettings(prev => ({
        ...prev,
        initialMessage: `Hello! I'm the ${data.companyName} AI assistant. How can I help you today?`
      }));
    }
    
    // Set loading state based on both queries
    if (!websitesQuery.isLoading && !companyProfileQuery.isLoading) {
      setIsLoading(false);
    }
  }, [companyProfileQuery.data, websitesQuery.isLoading, companyProfileQuery.isLoading]);
  
  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Update chatbot message when company name changes
    if (name === 'companyName') {
      setChatbotSettings(prev => ({
        ...prev,
        initialMessage: `Hello! I'm the ${value} AI assistant. How can I help you today?`
      }));
    }
  };
  
  const handleSettingChange = (name: string, value: string | boolean) => {
    setChatbotSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Query existing chatbots
  const chatbotsQuery = useQuery({
    queryKey: ["/api/chatbots"]
  });
  
  // Find any pending chatbots
  const pendingChatbots = chatbotsQuery.data 
    ? (chatbotsQuery.data as any[]).filter(chatbot => chatbot.status === 'pending') 
    : [];
    
  // Get the first pending chatbot if there is one
  const pendingChatbot = pendingChatbots.length > 0 ? pendingChatbots[0] : null;
  
  // Mutations
  const createChatbotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/chatbots", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chatbot Configuration Submitted",
        description: "Your chatbot configuration is pending approval.",
      });
      
      setTimeout(() => {
        setLocation("/dashboard?status=pending-approval");
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chatbot. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to approve a chatbot
  const approveChatbotMutation = useMutation({
    mutationFn: async (chatbotId: number) => {
      const response = await apiRequest("POST", `/api/chatbots/${chatbotId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chatbot Approved",
        description: "Your chatbot is now active and ready for deployment.",
      });
      // Invalidate chatbots query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      // Show success alert
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        setLocation("/dashboard?success=chatbot-approved");
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve chatbot. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleApprove = () => {
    // Save company profile first
    saveCompanyProfileMutation.mutate({
      companyName: companyInfo.companyName,
      industry: companyInfo.industry,
      targetAudience: companyInfo.targetAudience,
      brandVoice: companyInfo.brandVoice,
      services: companyInfo.services,
      valueProposition: companyInfo.valueProposition,
      additionalInfo: companyInfo.companyGuidelines // Store guidelines in additionalInfo field
    });
    
    // Then create/update chatbot
    if (websitesQuery.data && Array.isArray(websitesQuery.data) && websitesQuery.data.length > 0) {
      const website = websitesQuery.data[0];
      createChatbotMutation.mutate({
        websiteId: website.id,
        name: `${companyInfo.companyName} Assistant`,
        primaryColor: chatbotSettings.primaryColor,
        position: chatbotSettings.position,
        initialMessage: chatbotSettings.initialMessage,
        collectEmail: chatbotSettings.collectEmail,
        configuration: JSON.stringify({
          companyGuidelines: companyInfo.companyGuidelines
        })
      });
    } else {
      toast({
        title: "No website found",
        description: "Please go back and add a website first.",
        variant: "destructive"
      });
    }
  };
  
  // Mutation to save company profile
  const saveCompanyProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check if we have an existing profile
      if (companyProfileQuery.data) {
        const response = await apiRequest("PUT", "/api/company/profile", data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/company/profile", data);
        return response.json();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save company profile. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleEdit = () => {
    setActiveTab("basic");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  
  // Variable to check if we have pending chatbots
  const hasPendingChatbots = pendingChatbots.length > 0;
  
  // Handle approving a chatbot
  const handleApprovePendingChatbot = () => {
    if (pendingChatbot) {
      approveChatbotMutation.mutate(pendingChatbot.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Success Alert */}
        {showSuccessAlert && (
          <Alert className="bg-green-50 border-green-100">
            <CheckCircle className="h-4 w-4 text-green-800" />
            <AlertTitle className="text-green-800">Chatbot Approved</AlertTitle>
            <AlertDescription className="text-green-700">
              Your chatbot has been approved and is now active. You can now install the chatbot on your website.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Pending Chatbot Approval Section - only show if we have a pending chatbot */}
        {hasPendingChatbots && (
          <Alert className="bg-blue-50 border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
              <div className="flex-1">
                <AlertTitle className="text-blue-800">Chatbot Pending Approval</AlertTitle>
                <AlertDescription className="text-blue-700">
                  You have a chatbot configuration waiting for your approval. Review it in the preview below and approve it to make it active.
                </AlertDescription>
              </div>
              <Button 
                className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700" 
                onClick={handleApprovePendingChatbot}
                disabled={approveChatbotMutation.isPending}
              >
                {approveChatbotMutation.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Approving...
                  </>
                ) : (
                  <>Approve Chatbot</>
                )}
              </Button>
            </div>
          </Alert>
        )}
      
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chatbot Configuration</h1>
            <p className="text-muted-foreground">
              Create and customize your website chatbot
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  This information helps your chatbot provide accurate responses about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading company information from your website...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input 
                          id="companyName" 
                          name="companyName" 
                          value={companyInfo.companyName} 
                          onChange={handleCompanyInfoChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select 
                          value={companyInfo.industry}
                          onValueChange={(value) => setCompanyInfo({...companyInfo, industry: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Textarea 
                        id="targetAudience" 
                        name="targetAudience" 
                        value={companyInfo.targetAudience} 
                        onChange={handleCompanyInfoChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="brandVoice">Brand Voice</Label>
                      <Textarea 
                        id="brandVoice" 
                        name="brandVoice" 
                        value={companyInfo.brandVoice} 
                        onChange={handleCompanyInfoChange}
                        placeholder="Describe how your brand communicates (e.g., friendly, professional, casual)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="services">Services/Products</Label>
                      <Textarea 
                        id="services" 
                        name="services" 
                        value={companyInfo.services} 
                        onChange={handleCompanyInfoChange}
                        placeholder="Describe what your company offers to customers"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valueProposition">Value Proposition</Label>
                      <Textarea 
                        id="valueProposition" 
                        name="valueProposition" 
                        value={companyInfo.valueProposition} 
                        onChange={handleCompanyInfoChange}
                        placeholder="What makes your company unique and why should customers choose you?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyGuidelines">Company Guidelines/Additional Information</Label>
                      <Textarea 
                        id="companyGuidelines" 
                        name="companyGuidelines" 
                        rows={5}
                        placeholder="Add any additional information, guidelines, or specific details about your company that the chatbot should know. This will improve the accuracy of responses."
                        onChange={(e) => setCompanyInfo({...companyInfo, companyGuidelines: e.target.value})}
                        value={companyInfo.companyGuidelines || ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        This information will be used to train the AI about your company. Be as detailed as possible.
                      </p>
                    </div>
                    
                    <Button onClick={() => setActiveTab("appearance")} className="w-full md:w-auto">
                      Continue to Appearance
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Appearance</CardTitle>
                <CardDescription>
                  Customize how your chatbot looks and behaves on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="primaryColor" 
                        type="color" 
                        value={chatbotSettings.primaryColor} 
                        onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input 
                        value={chatbotSettings.primaryColor} 
                        onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Position on Website</Label>
                    <Select 
                      defaultValue={chatbotSettings.position}
                      onValueChange={(value) => handleSettingChange("position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="initialMessage">Initial Message</Label>
                  <Textarea 
                    id="initialMessage" 
                    value={chatbotSettings.initialMessage} 
                    onChange={(e) => handleSettingChange("initialMessage", e.target.value)}
                    placeholder="This is the first message visitors will see when the chatbot opens"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="collectEmail" 
                    checked={chatbotSettings.collectEmail} 
                    onCheckedChange={(checked) => handleSettingChange("collectEmail", checked)}
                  />
                  <Label htmlFor="collectEmail">
                    Ask for visitor's email before starting chat
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responseTime">Response Time</Label>
                  <Select 
                    defaultValue={chatbotSettings.responseTime}
                    onValueChange={(value) => handleSettingChange("responseTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="fast">Fast (500-1000ms)</SelectItem>
                      <SelectItem value="moderate">Moderate (1-2s)</SelectItem>
                      <SelectItem value="realistic">Realistic (2-3s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("basic")}>
                    Back to Basic
                  </Button>
                  <Button onClick={() => setActiveTab("preview")}>
                    Continue to Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview Your Chatbot</CardTitle>
                <CardDescription>
                  See how your chatbot will appear on your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-2/3">
                    <ChatbotPreview 
                      companyName={companyInfo.companyName}
                      companyInfo={companyInfo}
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                    />
                  </div>
                  
                  <div className="lg:w-1/3 space-y-4">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">What Happens Next?</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>
                          Review your chatbot to ensure it represents your brand correctly
                        </li>
                        <li>
                          Approve and deploy the chatbot to your website
                        </li>
                        <li>
                          Your chatbot will begin collecting questions from visitors
                        </li>
                        <li>
                          Questions and answers will be added to the AEO Management section for your review
                        </li>
                        <li>
                          Approve content to publish it to your website with SEO optimization
                        </li>
                      </ol>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">Important Note</h3>
                      <p className="text-sm text-yellow-700">
                        All chatbot answers and content will require your approval before being published to your website. You maintain full control over what appears on your site.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}