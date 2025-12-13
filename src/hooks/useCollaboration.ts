import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";

interface CollaborationProps {
  formId: string | null;
  enabled: boolean;
  onUpdate: (data: any) => void;
  user: { id: string } | null;
}

export function useCollaboration({
  formId,
  enabled,
  onUpdate,
  user,
}: CollaborationProps) {
  useEffect(() => {
    if (!enabled || !formId || !pusherClient || !user) return;

    const channelName = `form-${formId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("form-update", (data: any) => {
      // Ignore updates from self
      if (data.updatedBy === user.id) return;

      onUpdate(data);
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [formId, enabled, user?.id, onUpdate]);
}

