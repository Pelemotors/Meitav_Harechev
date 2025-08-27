import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // פונקציה להמרת Markdown בסיסי ל-HTML
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    let html = text;

    // כותרות
    html = html.replace(/^### (.*$)/gim, '<h3 class="heading-3 text-slc-dark mb-2 hebrew">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="heading-2 text-slc-dark mb-3 hebrew">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="heading-1 text-slc-dark mb-4 hebrew">$1</h1>');

    // הדגשה
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slc-dark">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slc-dark">$1</em>');

    // קישורים
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-slc-bronze hover:text-slc-bronze-alt underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // רשימות
    html = html.replace(/^\* (.*$)/gim, '<li class="text-slc-dark hebrew mb-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="text-slc-dark hebrew mb-1">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 mb-4">$1</ul>');

    // רשימות ממוספרות
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="text-slc-dark hebrew mb-1">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ol class="list-decimal list-inside space-y-1 mb-4">$1</ol>');

    // קוד
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slc-light-gray px-2 py-1 rounded text-sm font-mono text-slc-dark">$1</code>');

    // ציטוטים
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-r-4 border-slc-bronze pr-4 my-4 italic text-slc-gray hebrew">$1</blockquote>');

    // קווים מפרידים
    html = html.replace(/^---$/gim, '<hr class="border-slc-light-gray my-6">');

    // פסקאות
    html = html.replace(/\n\n/g, '</p><p class="text-slc-dark hebrew leading-relaxed mb-4">');
    html = html.replace(/^([^<].*)/gim, '<p class="text-slc-dark hebrew leading-relaxed mb-4">$1</p>');

    // ניקוי תגיות ריקות
    html = html.replace(/<p class="text-slc-dark hebrew leading-relaxed mb-4"><\/p>/g, '');
    html = html.replace(/<p class="text-slc-dark hebrew leading-relaxed mb-4">\s*<\/p>/g, '');

    return html;
  };

  // פונקציה לטיפול בקליק על קישורים
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const renderedContent = parseMarkdown(content);

  return (
    <div 
      className={`prose prose-sm max-w-none hebrew ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MarkdownRenderer;
