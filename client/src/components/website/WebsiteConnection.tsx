import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Copy, Info, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface WebsiteConnectionProps {
  domain: string;
  siteId: string;
  isActive: boolean;
  onEditClick: () => void;
  onSettingsClick: () => void;
}

export function WebsiteConnection({
  domain,
  siteId,
  isActive,
  onEditClick,
  onSettingsClick
}: WebsiteConnectionProps) {
  const { toast } = useToast();
  
  // Query chatbot data to know if one exists and is active
  const chatbotQuery = useQuery<any[]>({
    queryKey: ["/api/chatbots"]
  });
  
  const chatbot = chatbotQuery.data && Array.isArray(chatbotQuery.data) && chatbotQuery.data.length > 0 
    ? chatbotQuery.data[0] 
    : null;
  const hasChatbot = !!chatbot;
  const isChatbotActive = hasChatbot && chatbot.status === 'active';
  
  const snippetCode = `<script 
  src="${window.location.origin}/chatbot-v2.js" 
  id="${siteId}"
  data-position="${hasChatbot ? chatbot.position : 'bottom-right'}"
  data-color="${hasChatbot ? chatbot.primaryColor : '#4f46e5'}"
  data-title="Chat with our AI Assistant"
></script>`;
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(snippetCode).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Installation code copied to clipboard!",
      });
    }).catch((error) => {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the code manually.",
        variant: "destructive",
      });
    });
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">
            {domain}
            <Badge className={isActive ? "bg-green-100 text-green-800 ml-2" : "bg-yellow-100 text-yellow-800 ml-2"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>Site ID: {siteId}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onEditClick}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onSettingsClick}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isActive ? (
            <div className="flex items-start p-3 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Website Registered</h4>
                <p className="text-sm text-green-700">
                  Your website is registered. {hasChatbot 
                    ? "Add the code snippet below to your site to enable the chatbot." 
                    : "Configure your chatbot to get an installation code."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start p-3 bg-yellow-50 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Website Registration Pending</h4>
                <p className="text-sm text-yellow-700">
                  Click "Edit" to register your website.
                </p>
              </div>
            </div>
          )}
          
          {hasChatbot ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Code
              </label>
              <div className="relative">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm overflow-x-auto">
                  {snippetCode}
                </div>
                <Button
                  className="absolute right-2 top-2"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyClick}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Add this code right before the closing &lt;/body&gt; tag of your website.
              </p>
            </div>
          ) : (
            <div className="flex items-start p-3 bg-blue-50 rounded-md">
              <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Chatbot Not Configured</h4>
                <p className="text-sm text-blue-700">
                  You need to configure and approve your chatbot before getting the installation code.
                </p>
                <Link href="/chatbot-config">
                  <Button className="mt-2" size="sm" variant="outline">
                    Configure Chatbot
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}