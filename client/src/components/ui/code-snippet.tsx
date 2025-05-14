import { useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CodeSnippetProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeSnippet({ code, language = "javascript", className }: CodeSnippetProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className={cn("relative font-mono text-sm overflow-hidden rounded-md bg-gray-800", className)}>
      <pre className="overflow-x-auto p-4 text-white">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 text-xs text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700"
        onClick={copyToClipboard}
      >
        {isCopied ? (
          <>
            <i className="fas fa-check mr-1"></i> Copied
          </>
        ) : (
          <>
            <i className="fas fa-copy mr-1"></i> Copy
          </>
        )}
      </Button>
    </div>
  );
}
