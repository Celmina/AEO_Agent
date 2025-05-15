import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";
import { WebsiteConnection } from "@/components/website/WebsiteConnection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChatbotPreview } from "@/components/chatbot/ChatbotPreview";
import { AeoContentItem } from "@/components/aeo/AeoContentItem";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();
  const [pendingAeoItems, setPendingAeoItems] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    status: 'pending' | 'approved' | 'rejected' | 'published';
    timestamp: Date;
  }>>([]);
  const [siteId, setSiteId] = useState("");
  const [websiteData, setWebsiteData] = useState<{domain: string, isActive: boolean} | null>(null);
  const [statsData, setStatsData] = useState({
    chatbotInteractions: 0,
    aeoContent: 0,
    uniqueQuestions: 0,
    searchTraffic: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Use React Query to fetch real data
  const websitesQuery = useQuery({
    queryKey: ["/api/websites"]
  });

  // Fetch AEO content
  const aeoContentQuery = useQuery({
    queryKey: ["/api/aeo-content"]
  });

  // Process website data
  useEffect(() => {
    if (websitesQuery.data) {
      const data = websitesQuery.data as any[];
      if (data && data.length > 0) {
        const website = data[0];
        setSiteId(website.id.toString());
        setWebsiteData({
          domain: website.domain,
          isActive: true
        });
      }
    }
  }, [websitesQuery.data]);

  // Fetch chat messages count for the statistics
  const chatStatsQuery = useQuery({
    queryKey: ["/api/stats/chat-usage"]
  });

  // Process AEO content data
  useEffect(() => {
    if (aeoContentQuery.data) {
      const data = aeoContentQuery.data as any[];
      if (data && data.length > 0) {
        // Filter to only show pending items
        const pendingItems = data
          .filter((item: any) => item.status === 'pending')
          .map((item: any) => ({
            id: item.id.toString(),
            question: item.question,
            answer: item.answer,
            status: item.status as 'pending' | 'approved' | 'rejected' | 'published',
            timestamp: new Date(item.updatedAt || item.createdAt)
          }));
        
        setPendingAeoItems(pendingItems);
        
        // Update AEO content stats based on real data
        const approvedContent = data.filter((item: any) => 
          item.status === 'approved' || item.status === 'published').length;
        
        const uniqueQuestionsCount = new Set(data.map((item: any) => item.question)).size;
        
        // Get chat interactions from stats endpoint if available, otherwise show 0
        const chatInteractions = chatStatsQuery.data ? 
          (chatStatsQuery.data as any).totalMessages || 0 : 0;
        
        setStatsData({
          chatbotInteractions: chatInteractions,
          aeoContent: approvedContent,
          uniqueQuestions: uniqueQuestionsCount,
          searchTraffic: data.filter((item: any) => item.status === 'published').length
        });
      } else {
        // No data available, set all values to 0
        setStatsData({
          chatbotInteractions: 0,
          aeoContent: 0,
          uniqueQuestions: 0,
          searchTraffic: 0
        });
      }
    }
    
    setIsLoading(websitesQuery.isLoading || aeoContentQuery.isLoading || chatStatsQuery.isLoading);
  }, [aeoContentQuery.data, websitesQuery.isLoading, aeoContentQuery.isLoading, chatStatsQuery.data, chatStatsQuery.isLoading]);
  
  const handleApproveAeo = async (id: string) => {
    try {
      await apiRequest("POST", `/api/aeo-content/${id}/approve`);
      setPendingAeoItems(pendingAeoItems.filter(item => item.id !== id));
      // Update the stats
      setStatsData(prev => ({
        ...prev,
        aeoContent: prev.aeoContent
      }));
    } catch (error) {
      console.error("Error approving AEO content:", error);
    }
  };
  
  const handleRejectAeo = async (id: string) => {
    try {
      await apiRequest("POST", `/api/aeo-content/${id}/reject`);
      setPendingAeoItems(pendingAeoItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error rejecting AEO content:", error);
    }
  };
  
  const handleEditAeo = async (id: string, newAnswer: string) => {
    try {
      await apiRequest("PUT", `/api/aeo-content/${id}`, {
        answer: newAnswer
      });
      
      // Update the local state
      setPendingAeoItems(pendingAeoItems.map(item => 
        item.id === id ? { ...item, answer: newAnswer } : item
      ));
    } catch (error) {
      console.error("Error editing AEO content:", error);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your chatbot and AEO performance.
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatsCard
            icon="fas fa-robot"
            iconColor="primary"
            title="Total Chat Messages"
            value={isLoading ? "Loading..." : statsData.chatbotInteractions.toString()}
            change={0}
          />
          <DashboardStatsCard
            icon="fas fa-search"
            iconColor="secondary"
            title="Approved AEO Content"
            value={isLoading ? "Loading..." : statsData.aeoContent.toString()}
            change={0}
          />
          <DashboardStatsCard
            icon="fas fa-question"
            iconColor="accent"
            title="Unique Questions"
            value={isLoading ? "Loading..." : statsData.uniqueQuestions.toString()}
            change={0}
          />
          <DashboardStatsCard
            icon="fas fa-chart-line"
            iconColor="success"
            title="Published AEO Content"
            value={isLoading ? "Loading..." : statsData.searchTraffic.toString()}
            change={0}
          />
        </div>
        
        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Website */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Connected Website</CardTitle>
              <CardDescription>Your website integration status</CardDescription>
            </CardHeader>
            <CardContent>
              {websiteData ? (
                <WebsiteConnection
                  domain={websiteData.domain}
                  siteId={siteId}
                  isActive={websiteData.isActive}
                  onEditClick={() => {}}
                  onSettingsClick={() => {}}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No website connected yet</p>
                  <Link href="/connect-website">
                    <Button>
                      <i className="fas fa-plus mr-2"></i>
                      Connect Website
                    </Button>
                  </Link>
                </div>
              )}
              <div className="mt-4">
                <Link href="/chatbot-config">
                  <Button className="w-full">
                    <i className="fas fa-robot mr-2"></i>
                    Configure Chatbot
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Chatbot Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chatbot Preview</CardTitle>
              <CardDescription>See how your chatbot appears to visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatbotPreview 
                companyName={(user?.firstName && user?.lastName) ? 
                  `${user.firstName} ${user.lastName}'s Company` : 
                  (user?.email?.split('@')[0] || "Your") + " Company"}
                companyInfo={{
                  industry: "Technology",
                  targetAudience: "Website visitors seeking information",
                  brandVoice: "Professional, friendly, and helpful",
                  services: "AI-powered chatbot with GPT-4o and Answer Engine Optimization",
                  valueProposition: "Improve website engagement and SEO with AI-driven conversations"
                }}
              />
            </CardContent>
          </Card>
          
          {/* Pending AEO Content */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending AEO Content</CardTitle>
                <CardDescription>
                  Review and approve content generated from chatbot interactions
                </CardDescription>
              </div>
              <Link href="/aeo-management">
                <Button variant="outline">
                  <i className="fas fa-cog mr-2"></i>
                  Manage All Content
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : pendingAeoItems.length > 0 ? (
                <div className="space-y-4">
                  {pendingAeoItems.map((item) => (
                    <AeoContentItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      status={item.status}
                      timestamp={item.timestamp}
                      onApprove={() => handleApproveAeo(item.id)}
                      onReject={() => handleRejectAeo(item.id)}
                      onEdit={(newAnswer) => handleEditAeo(item.id, newAnswer)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending content to review</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Content will appear here once visitors start interacting with your chatbot
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
