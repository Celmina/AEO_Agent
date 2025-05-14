import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AeoContentItem } from "@/components/aeo/AeoContentItem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AeoContent } from "@shared/schema";

// Interface for transformed AEO content items for display
interface AeoItem {
  id: string;
  question: string;
  answer: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  timestamp: Date;
}

export default function AeoManagement() {
  const [pending, setPending] = useState<AeoItem[]>([]);
  const [approved, setApproved] = useState<AeoItem[]>([]);
  const [published, setPublished] = useState<AeoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch AEO content
  const aeoContentQuery = useQuery({
    queryKey: ["/api/aeo-content"],
  });
  
  // Process AEO content data
  useEffect(() => {
    if (aeoContentQuery.data) {
      const aeoItems = aeoContentQuery.data as AeoContent[];
      
      // Transform and filter data for each category
      const pendingItems = aeoItems
        .filter(item => item.status === 'pending')
        .map(item => ({
          id: item.id.toString(),
          question: item.question,
          answer: item.answer,
          status: item.status as 'pending' | 'approved' | 'rejected' | 'published',
          timestamp: new Date(String(item.updatedAt || item.createdAt || Date.now()))
        }));
      
      const approvedItems = aeoItems
        .filter(item => item.status === 'approved')
        .map(item => ({
          id: item.id.toString(),
          question: item.question,
          answer: item.answer,
          status: item.status as 'pending' | 'approved' | 'rejected' | 'published',
          timestamp: new Date(String(item.updatedAt || item.createdAt || Date.now()))
        }));
      
      const publishedItems = aeoItems
        .filter(item => item.status === 'published')
        .map(item => ({
          id: item.id.toString(),
          question: item.question,
          answer: item.answer,
          status: item.status as 'pending' | 'approved' | 'rejected' | 'published',
          timestamp: new Date(String(item.updatedAt || item.createdAt || Date.now()))
        }));
      
      setPending(pendingItems);
      setApproved(approvedItems);
      setPublished(publishedItems);
      setIsLoading(false);
    }
  }, [aeoContentQuery.data]);
  
  // Mutations for approving, rejecting, editing, and publishing content
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/aeo-content/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aeo-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/aeo"] });
      toast({
        title: "Content approved",
        description: "The content has been moved to the approved list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve the content. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to approve content:", error);
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/aeo-content/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aeo-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/aeo"] });
      toast({
        title: "Content rejected",
        description: "The content has been rejected and will not be published.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject the content. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to reject content:", error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string, answer: string }) => {
      return await apiRequest("PUT", `/api/aeo-content/${id}`, { answer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aeo-content"] });
      toast({
        title: "Content updated",
        description: "The content has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the content. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update content:", error);
    }
  });
  
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/aeo-content/${id}/publish`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/aeo-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/aeo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "Content published",
        description: "The content has been published to your website with SEO schema markup.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to publish the content. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to publish content:", error);
    }
  });
  
  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };
  
  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };
  
  const handleEdit = (id: string, newAnswer: string) => {
    updateMutation.mutate({ id, answer: newAnswer });
  };
  
  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AEO Management</h1>
            <p className="text-muted-foreground">
              Approve and manage content for Answer Engine Optimization
            </p>
          </div>
          <Button>
            <i className="fas fa-cog mr-2"></i>
            Settings
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>How AEO Works</CardTitle>
            <CardDescription>
              Answer Engine Optimization turns chatbot questions into valuable SEO content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Collect Questions</h3>
                <p className="text-sm text-gray-600">
                  Real questions from website visitors are captured through the chatbot.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Review & Approve</h3>
                <p className="text-sm text-gray-600">
                  You review, edit, and approve the answers before they go live.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Publish & Optimize</h3>
                <p className="text-sm text-gray-600">
                  Approved content is published to your website with SEO schema markup.
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                All content requires your approval before being published to your website. You maintain full control over what appears on your site.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {isLoading || aeoContentQuery.isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Loading AEO content...</span>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending">
                Pending Review ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger value="published">
                Published ({published.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              {pending.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                    <i className="fas fa-inbox text-xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-1">No pending content</h3>
                  <p className="text-muted-foreground">
                    When your chatbot collects questions, they'll appear here for review.
                  </p>
                </div>
              ) : (
                pending.map(item => (
                  <AeoContentItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    status={item.status}
                    timestamp={item.timestamp}
                    onApprove={() => handleApprove(item.id)}
                    onReject={() => handleReject(item.id)}
                    onEdit={(newAnswer) => handleEdit(item.id, newAnswer)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-4">
              {approved.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                    <i className="fas fa-check text-xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-1">No approved content yet</h3>
                  <p className="text-muted-foreground">
                    Content you approve will be ready for publishing to your website.
                  </p>
                </div>
              ) : (
                approved.map(item => (
                  <AeoContentItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    status={item.status}
                    timestamp={item.timestamp}
                    onEdit={(newAnswer) => handleEdit(item.id, newAnswer)}
                    onPublish={() => handlePublish(item.id)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="published" className="space-y-4">
              {published.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                    <i className="fas fa-globe text-xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-1">No published content yet</h3>
                  <p className="text-muted-foreground">
                    Once content is approved, it can be published to your website.
                  </p>
                </div>
              ) : (
                published.map(item => (
                  <AeoContentItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    status={item.status}
                    timestamp={item.timestamp}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}