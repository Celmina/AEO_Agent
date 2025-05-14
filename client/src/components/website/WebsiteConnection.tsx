import { CodeSnippet } from "@/components/ui/code-snippet";
import { Button } from "@/components/ui/button";

interface WebsiteConnectionProps {
  domain?: string;
  siteId: string;
  isActive: boolean;
  onEditClick: () => void;
  onSettingsClick: () => void;
}

export function WebsiteConnection({ 
  domain = "yourwebsite.com", 
  siteId, 
  isActive, 
  onEditClick, 
  onSettingsClick 
}: WebsiteConnectionProps) {
  const jsSnippet = `<script src="https://api.marksync.io/js/widget.js?id=${siteId}"></script>`;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Website Integration</h2>
        {isActive ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Not Connected
          </span>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="font-mono text-sm text-gray-600 overflow-x-auto">
          <CodeSnippet code={jsSnippet} language="html" />
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">Connected Domain</h4>
          <p className="text-gray-600">{domain}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onEditClick}>
            Edit
          </Button>
          <Button size="sm" onClick={onSettingsClick}>
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
