import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";
import { WebsiteConnection } from "@/components/website/WebsiteConnection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChatbotPreview } from "@/components/chatbot/ChatbotPreview";
import { AeoContentItem } from "@/components/aeo/AeoContentItem";

// Sample AEO data
const pendingAeoItems = [
  {
    id: 'p1',
    question: "What services do you offer for e-commerce businesses?",
    answer: "We offer comprehensive e-commerce solutions including website development, payment integration, inventory management systems, and marketing strategies tailored specifically for online retail businesses.",
    status: 'pending' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState("site_1a2b3c4d5e");
  
  const handleApproveAeo = () => {
    // In a real app, this would update the status in the backend
    console.log("AEO content approved");
  };
  
  const handleRejectAeo = () => {
    // In a real app, this would update the status in the backend
    console.log("AEO content rejected");
  };
  
  const handleEditAeo = (newAnswer: string) => {
    // In a real app, this would update the content in the backend
    console.log("AEO content edited:", newAnswer);
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
            title="Chatbot Interactions"
            value="1,248"
            change={12.5}
          />
          <DashboardStatsCard
            icon="fas fa-search"
            iconColor="secondary"
            title="AEO Content"
            value="24"
            change={8.3}
          />
          <DashboardStatsCard
            icon="fas fa-question"
            iconColor="accent"
            title="Unique Questions"
            value="87"
            change={15.2}
          />
          <DashboardStatsCard
            icon="fas fa-chart-line"
            iconColor="success"
            title="Search Traffic"
            value="32.8%"
            change={6.4}
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
              <WebsiteConnection
                domain="yourwebsite.com"
                siteId={siteId}
                isActive={true}
                onEditClick={() => {}}
                onSettingsClick={() => {}}
              />
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
                companyName="Your Company"
                companyInfo={{
                  industry: "Technology",
                  targetAudience: "Website visitors",
                  brandVoice: "Professional and friendly",
                  services: "AI chatbot and AEO content optimization",
                  valueProposition: "Improve website engagement and SEO with AI"
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
              {pendingAeoItems.length > 0 ? (
                <div className="space-y-4">
                  {pendingAeoItems.map((item) => (
                    <AeoContentItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      status={item.status}
                      timestamp={item.timestamp}
                      onApprove={handleApproveAeo}
                      onReject={handleRejectAeo}
                      onEdit={handleEditAeo}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending content to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
