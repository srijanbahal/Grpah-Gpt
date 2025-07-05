import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar({
  sessions,
  selectedSession,
  onNewSession,
  onSwitchSession,
  onDeleteSession,
}: {
  sessions: { id: string; title?: string }[];
  selectedSession: string | null;
  onNewSession: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border relative w-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-lg font-semibold">GraphGPT</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSession}
          title="New Session"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-2 text-xs text-muted-foreground font-semibold px-2">Sessions</div>
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-4">No sessions yet.</div>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center group rounded-lg px-2 py-2 mb-1 cursor-pointer transition-colors",
                selectedSession === session.id ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => onSwitchSession(session.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="truncate flex-1 text-sm">
                {session.title || session.id.slice(0, 8)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
                title="Delete session"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}