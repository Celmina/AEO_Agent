import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface SimpleChatbotPreviewProps {
  websiteId: number;
  primaryColor: string;
  initialMessage: string;
  position: 'left' | 'right';
}

export function SimpleChatbotPreview({
  websiteId,
  primaryColor = '#2563eb',
  initialMessage = 'Hello! How can I help you today?',
  position = 'right'
}: SimpleChatbotPreviewProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [uniqueId] = useState(`iframe-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Clean up preview when component unmounts
    return () => {
      setPreviewVisible(false);
    };
  }, []);

  const showPreview = () => {
    setPreviewVisible(true);
    setIframeLoaded(false);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  const getPreviewHtml = () => {
    // Create a simple preview HTML page with the chatbot script embedded
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #f9fafb;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #111827;
            font-size: 1.5rem;
          }
          p {
            color: #374151;
            line-height: 1.6;
          }
        </style>
        <script>
          // This script will be replaced by the actual chatbot script
          window.onload = function() {
            window.parent.document.getElementById('${uniqueId}').dispatchEvent(new Event('load'));
            
            // Set dynamic configurations
            window.setTimeout(function() {
              // Assuming the chatbot script already creates these variables
              if (window.ecomChatbotConfig) {
                window.ecomChatbotConfig.primaryColor = "${primaryColor}";
                window.ecomChatbotConfig.position = "${position}";
                window.ecomChatbotConfig.initialMessage = "${initialMessage}";
                window.ecomChatbotConfig.websiteId = "${websiteId}";
              }
            }, 100);
          };
        </script>
        
        <!-- Include the chatbot script with a fixed base URL for preview purposes -->
        <script>
          // Configuration that would normally be filled in by server
          const config = {
            apiUrl: window.location.origin,
            websiteId: "${websiteId}",
            primaryColor: "${primaryColor}",
            position: "${position}",
            initialMessage: "${initialMessage}"
          };
          
          // Make this config available globally for the chatbot script
          window.ecomChatbotConfig = config;
        </script>
        <script src="/simple-chatbot.js"></script>
      </head>
      <body>
        <div class="container">
          <h1>Chatbot Preview</h1>
          <p>
            This is a preview of how your chatbot will appear on your website. 
            Click the chat button in the bottom ${position} corner to start a conversation.
          </p>
          <p>
            Your chatbot is configured with the following settings:
          </p>
          <ul>
            <li><strong>Color:</strong> ${primaryColor}</li>
            <li><strong>Position:</strong> ${position}</li>
            <li><strong>Initial Message:</strong> "${initialMessage}"</li>
          </ul>
          <p>
            The chatbot will use your company information to respond to customer inquiries.
            Test it by asking some common questions your customers might have.
          </p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Chatbot Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              See how your chatbot will appear and function on your website
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" style={{ backgroundColor: primaryColor, color: 'white' }}>
                Color: {primaryColor}
              </Badge>
              <Badge variant="outline">Position: {position}</Badge>
              <Badge variant="outline">Initial Message: {initialMessage.substring(0, 20)}{initialMessage.length > 20 ? '...' : ''}</Badge>
            </div>
            
            <Button onClick={showPreview} className="mb-4">
              {previewVisible ? 'Refresh Preview' : 'Show Preview'}
            </Button>
            
            {previewVisible && (
              <Button 
                onClick={hidePreview} 
                variant="outline" 
                className="mb-4 ml-2"
              >
                Hide Preview
              </Button>
            )}
          </div>
          
          <Separator />
          
          {previewVisible && (
            <div className="mt-4 relative overflow-hidden rounded-lg border border-border" style={{ height: '400px' }}>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              )}
              <iframe
                id={uniqueId}
                srcDoc={getPreviewHtml()}
                className="w-full h-full"
                onLoad={() => setIframeLoaded(true)}
                title="Chatbot Preview"
              />
            </div>
          )}
          
          {!previewVisible && (
            <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg border border-dashed border-muted">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click "Show Preview" to see how your chatbot will look
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}