import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotPreviewProps {
  companyName?: string;
  companyInfo?: {
    industry: string;
    targetAudience: string;
    brandVoice: string;
    services: string;
    valueProposition: string;
  };
  onApprove?: () => void;
  onEdit?: () => void;
}

export function ChatbotPreview({ 
  companyName = "Your Company", 
  companyInfo,
  onApprove,
  onEdit
}: ChatbotPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm the ${companyName} AI assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Get sample answers based on company info
  const getSampleAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('services') || lowerQuestion.includes('offer') || lowerQuestion.includes('products')) {
      return companyInfo?.services || `We offer a range of services designed to meet your needs. Please visit our services page for more information or ask me about specific services.`;
    }
    
    if (lowerQuestion.includes('about') || lowerQuestion.includes('company')) {
      return companyInfo?.valueProposition || `We're a company dedicated to providing quality service and meeting your needs.`;
    }
    
    if (lowerQuestion.includes('contact') || lowerQuestion.includes('reach')) {
      return `You can contact our team through the contact form on our website, or by emailing info@${companyName.toLowerCase().replace(/\s+/g, '')}.com.`;
    }
    
    if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('pricing')) {
      return `Our pricing varies depending on your specific needs. I'd be happy to connect you with our sales team who can provide a customized quote.`;
    }
    
    // Default response
    return `Thank you for your question. We aim to provide the best possible service to our ${companyInfo?.targetAudience || 'customers'}. How else can I assist you today?`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSampleAnswer(inputValue),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <Badge className="bg-primary">Preview</Badge>
          <h3 className="font-medium">{companyName} AI Assistant</h3>
        </div>
        {onApprove && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Configuration
            </Button>
            <Button size="sm" onClick={onApprove}>
              <i className="fas fa-check mr-2"></i>
              Approve & Deploy
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 mt-1 bg-primary/10">
                    <AvatarFallback className="text-primary">
                      <i className="fas fa-robot"></i>
                    </AvatarFallback>
                  </Avatar>
                )}
                <div 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gray-300">
                      <i className="fas fa-user"></i>
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Avatar className="w-8 h-8 bg-primary/10">
                <AvatarFallback className="text-primary">
                  <i className="fas fa-robot"></i>
                </AvatarFallback>
              </Avatar>
              <div className="flex space-x-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type your question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!inputValue.trim() || isTyping}>
          <i className="fas fa-paper-plane"></i>
        </Button>
      </form>
    </div>
  );
}