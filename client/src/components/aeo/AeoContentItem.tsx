import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AeoContentItemProps {
  question: string;
  answer: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  timestamp: Date;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: (newAnswer: string) => void;
  onPublish?: () => void;
}

export function AeoContentItem({
  question,
  answer,
  status,
  timestamp,
  onApprove,
  onReject,
  onEdit,
  onPublish
}: AeoContentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(answer);
  const [isSchemaMarkup, setIsSchemaMarkup] = useState(true);
  
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      default:
        return null;
    }
  };
  
  const handleSave = () => {
    if (onEdit) onEdit(editedAnswer);
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{question}</CardTitle>
            <CardDescription className="text-sm">
              Asked on {timestamp.toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="schema-markup"
                checked={isSchemaMarkup}
                onCheckedChange={setIsSchemaMarkup}
              />
              <Label htmlFor="schema-markup">
                Add FAQ Schema Markup (recommended for SEO)
              </Label>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-gray-800">{answer}</p>
          </div>
        )}
        
        {status === 'published' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
            <h4 className="text-sm font-medium mb-1">FAQPage Schema Markup Preview</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": {
    "@type": "Question",
    "name": "${question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "${answer.replace(/"/g, '\\"')}"
    }
  }
}
</script>`}
            </pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 justify-end space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </>
        ) : (
          <>
            {status === 'pending' && (
              <>
                <Button variant="outline" onClick={onReject}>
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button onClick={onApprove}>
                  Approve
                </Button>
              </>
            )}
            {status === 'approved' && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button onClick={onPublish} className="bg-green-600 hover:bg-green-700">
                  <i className="fas fa-globe mr-1"></i>
                  Publish to Website
                </Button>
              </>
            )}
            {status === 'rejected' && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {status === 'published' && (
              <Button variant="outline" size="sm">
                <i className="fas fa-external-link-alt mr-1"></i>
                View on Website
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}