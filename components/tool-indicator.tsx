type ToolName = 'fetch_file_context' | 'list_directory'

const LABELS: Record<ToolName, string> = {
  fetch_file_context: 'Reading file…',
  list_directory: 'Exploring directory…',
}

interface ToolIndicatorProps {
  toolName: string
}

export default function ToolIndicator({ toolName }: ToolIndicatorProps) {
  const label = LABELS[toolName as ToolName] ?? 'Using tool…'
  return (
    <span className="tool-indicator">
      <span className="tool-dot" />
      {label}
    </span>
  )
}
