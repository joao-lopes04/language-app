import Markdown from 'react-markdown'

type MarkdownPreviewProps = {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview space-y-2 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-sm [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown>{content}</Markdown>
    </div>
  )
}
