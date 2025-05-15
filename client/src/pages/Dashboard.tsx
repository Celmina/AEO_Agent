import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";
import { WebsiteConnection } from "@/components/website/WebsiteConnection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChatbotPreview } from "@/components/chatbot/ChatbotPreview";
import { AeoContentItem } from "@/components/aeo/AeoContentItem";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [pendingAeoItems, setPendingAeoItems] = useState<
    Array<{
      id: string;
      question: string;
      answer: string;
      status: "pending" | "approved" | "rejected" | "published";
      timestamp: Date;
    }>
  >([]);
  const [siteId, setSiteId] = useState("");
  const [websiteData, setWebsiteData] = useState<{
    domain: string;
    isActive: boolean;
  } | null>(null);
  const [statsData, setStatsData] = useState({
    chatbotInteractions: 0,
    aeoContent: 0,
    uniqueQuestions: 0,
    searchTraffic: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showPendingAlert, setShowPendingAlert] = useState(false);

  // Use React Query to fetch real data
  const websitesQuery = useQuery({
    queryKey: ["/api/websites"],
  });

  // Fetch chatbots
  const chatbotsQuery = useQuery({
    queryKey: ["/api/chatbots"],
  });

  // Fetch AEO content
  const aeoContentQuery = useQuery({
    queryKey: ["/api/aeo-content"],
  });

  // Check URL parameters for status messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "pending-approval") {
      setShowPendingAlert(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setShowPendingAlert(false), 5000);
    }
    if (params.get("success") === "chatbot-approved") {
      setShowSuccessAlert(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, []);

  // Mutation to approve a chatbot
  const approveChatbotMutation = useMutation({
    mutationFn: async (chatbotId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/chatbots/${chatbotId}/approve`,
      );
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
      setTimeout(() => setShowSuccessAlert(false), 5000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve chatbot. Please try again.",
        variant: "destructive",
      });
    },
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
          isActive: true,
        });
      }
    }
  }, [websitesQuery.data]);

  // Fetch chat messages count for the statistics
  const chatStatsQuery = useQuery({
    queryKey: ["/api/stats/chat-usage"],
  });

  // Process AEO content data
  useEffect(() => {
    if (aeoContentQuery.data) {
      const data = aeoContentQuery.data as any[];
      if (data && data.length > 0) {
        // Filter to only show pending items
        const pendingItems = data
          .filter((item: any) => item.status === "pending")
          .map((item: any) => ({
            id: item.id.toString(),
            question: item.question,
            answer: item.answer,
            status: item.status as
              | "pending"
              | "approved"
              | "rejected"
              | "published",
            timestamp: new Date(item.updatedAt || item.createdAt),
          }));

        setPendingAeoItems(pendingItems);

        // Update AEO content stats based on real data
        const approvedContent = data.filter(
          (item: any) =>
            item.status === "approved" || item.status === "published",
        ).length;

        const uniqueQuestionsCount = new Set(
          data.map((item: any) => item.question),
        ).size;

        // Get chat interactions from stats endpoint if available, otherwise show 0
        const chatInteractions = chatStatsQuery.data
          ? (chatStatsQuery.data as any).totalMessages || 0
          : 0;

        setStatsData({
          chatbotInteractions: chatInteractions,
          aeoContent: approvedContent,
          uniqueQuestions: uniqueQuestionsCount,
          searchTraffic: data.filter((item: any) => item.status === "published")
            .length,
        });
      } else {
        // No data available, set all values to 0
        setStatsData({
          chatbotInteractions: 0,
          aeoContent: 0,
          uniqueQuestions: 0,
          searchTraffic: 0,
        });
      }
    }

    setIsLoading(
      websitesQuery.isLoading ||
        aeoContentQuery.isLoading ||
        chatStatsQuery.isLoading,
    );
  }, [
    aeoContentQuery.data,
    websitesQuery.isLoading,
    aeoContentQuery.isLoading,
    chatStatsQuery.data,
    chatStatsQuery.isLoading,
  ]);

  const handleApproveAeo = async (id: string) => {
    try {
      await apiRequest("POST", `/api/aeo-content/${id}/approve`);
      setPendingAeoItems(pendingAeoItems.filter((item) => item.id !== id));
      // Update the stats
      setStatsData((prev) => ({
        ...prev,
        aeoContent: prev.aeoContent,
      }));
    } catch (error) {
      console.error("Error approving AEO content:", error);
    }
  };

  const handleRejectAeo = async (id: string) => {
    try {
      await apiRequest("POST", `/api/aeo-content/${id}/reject`);
      setPendingAeoItems(pendingAeoItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error rejecting AEO content:", error);
    }
  };

  const handleEditAeo = async (id: string, newAnswer: string) => {
    try {
      await apiRequest("PUT", `/api/aeo-content/${id}`, {
        answer: newAnswer,
      });

      // Update the local state
      setPendingAeoItems(
        pendingAeoItems.map((item) =>
          item.id === id ? { ...item, answer: newAnswer } : item,
        ),
      );
    } catch (error) {
      console.error("Error editing AEO content:", error);
    }
  };

  // Find any pending chatbots
  const pendingChatbots = chatbotsQuery.data
    ? (chatbotsQuery.data as any[]).filter(
        (chatbot) => chatbot.status === "pending",
      )
    : [];

  const hasPendingChatbots = pendingChatbots.length > 0;

  // Handle chatbot approval
  const handleApproveChatbot = (chatbotId: number) => {
    approveChatbotMutation.mutate(chatbotId);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Status Alerts */}
        {showPendingAlert && (
          <Alert className="bg-yellow-50 border-yellow-100">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertTitle className="text-yellow-800">
              Chatbot Configuration Submitted
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Your chatbot configuration has been submitted and is pending
              approval.
            </AlertDescription>
          </Alert>
        )}

        {showSuccessAlert && (
          <Alert className="bg-green-50 border-green-100">
            <CheckCircle className="h-4 w-4 text-green-800" />
            <AlertTitle className="text-green-800">Chatbot Approved</AlertTitle>
            <AlertDescription className="text-green-700">
              Your chatbot has been approved and is now active. You can now
              install the chatbot on your website.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Chatbot Approval Section */}
        {hasPendingChatbots && (
          <Alert className="bg-blue-50 border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
              <div className="flex-1">
                <AlertTitle className="text-blue-800">
                  Chatbot Pending Approval
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  You have a chatbot configuration waiting for your approval.
                  Review and approve it to make it active.
                </AlertDescription>
              </div>
              <Button
                className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  pendingChatbots[0] &&
                  handleApproveChatbot(pendingChatbots[0].id)
                }
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
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your chatbot and AEO
              performance.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatsCard
            icon="fas fa-robot"
            iconColor="primary"
            title="Total Chat Messages"
            value={
              isLoading
                ? "Loading..."
                : statsData.chatbotInteractions.toString()
            }
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
            value={
              isLoading ? "Loading..." : statsData.uniqueQuestions.toString()
            }
            change={0}
          />
          <DashboardStatsCard
            icon="fas fa-chart-line"
            iconColor="success"
            title="Published AEO Content"
            value={
              isLoading ? "Loading..." : statsData.searchTraffic.toString()
            }
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
                  <p className="text-muted-foreground mb-4">
                    No website connected yet
                  </p>
                  <Link href="/connect-website">
                    <Button>
                      <i className="fas fa-plus mr-2"></i>
                      XX
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
              <CardDescription>
                See how your chatbot appears to visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatbotPreview
                companyName={
                  user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}'s Company`
                    : (user?.email?.split("@")[0] || "Your") + " Company"
                }
                companyInfo={{
                  industry: "Technology",
                  targetAudience: "Website visitors seeking information",
                  brandVoice: "Professional, friendly, and helpful",
                  services:
                    "AI-powered chatbot with GPT-4o and Answer Engine Optimization",
                  valueProposition:
                    "Improve website engagement and SEO with AI-driven conversations",
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
                  <p className="text-muted-foreground">
                    No pending content to review
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Content will appear here once visitors start interacting
                    with your chatbot
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
