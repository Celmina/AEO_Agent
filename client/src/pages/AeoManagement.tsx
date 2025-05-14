import React, { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AeoContentItem } from "@/components/aeo/AeoContentItem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

// Mock data for demonstration
const pendingItems = [
  {
    id: 'p1',
    question: "What services do you offer for e-commerce businesses?",
    answer: "We offer comprehensive e-commerce solutions including website development, payment integration, inventory management systems, and marketing strategies tailored specifically for online retail businesses.",
    status: 'pending' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'p2',
    question: "How do I integrate your chatbot with my Shopify store?",
    answer: "Integrating our chatbot with your Shopify store is simple. You'll need to add our custom script to your theme.liquid file, or use our Shopify app for a no-code installation. The process takes less than 5 minutes and our support team is available to help.",
    status: 'pending' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
];

const approvedItems = [
  {
    id: 'a1',
    question: "What is the pricing for your premium plan?",
    answer: "Our premium plan is priced at $49/month and includes unlimited chatbot interactions, advanced analytics, priority support, and integration with up to 5 websites. We also offer a 14-day free trial with no credit card required.",
    status: 'approved' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

const publishedItems = [
  {
    id: 'pub1',
    question: "Do you provide custom chatbot training?",
    answer: "Yes, we provide custom chatbot training services. Our team can help you train your chatbot with industry-specific knowledge and your company's unique voice. This service is included in our Enterprise plan or available as an add-on for other plans.",
    status: 'published' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  },
  {
    id: 'pub2',
    question: "How does the chatbot help with SEO?",
    answer: "Our chatbot helps with SEO through Answer Engine Optimization (AEO). It captures real questions from your visitors and generates SEO-optimized content with proper schema markup. This helps your website rank for specific questions in search engines and appear in featured snippets.",
    status: 'published' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
  },
];

export default function AeoManagement() {
  const [pending, setPending] = useState(pendingItems);
  const [approved, setApproved] = useState(approvedItems);
  const [published, setPublished] = useState(publishedItems);
  
  const handleApprove = (id: string) => {
    const item = pending.find(item => item.id === id);
    if (item) {
      const newItem = { ...item, status: 'approved' as const };
      setApproved([newItem, ...approved]);
      setPending(pending.filter(item => item.id !== id));
    }
  };
  
  const handleReject = (id: string) => {
    setPending(pending.filter(item => item.id !== id));
  };
  
  const handleEdit = (id: string, newAnswer: string) => {
    // Logic to update the answer for the specified item
    // This would typically involve an API call in a real application
    console.log(`Edited item ${id} with new answer: ${newAnswer}`);
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending content to review</p>
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">No approved content yet</p>
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
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="published" className="space-y-4">
            {published.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No published content yet</p>
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
      </div>
    </DashboardLayout>
  );
}