"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface Comment {
  id: number;
  message_id: number;
  user_id: string | null;
  user_image: string;
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
}

interface CommentItemProps {
  comment: Comment;
  user: User | null;
  adminId: string;
  onDelete: () => void;
}

export function CommentItem({ comment, user, adminId, onDelete }: CommentItemProps) {
  const canDelete = (user?.id && user.id === comment.user_id) || user?.id === adminId;

  return (
    <div className="flex items-start gap-2 pl-2 border-l-2 border-muted">
      <Image
        src={comment.user_image}
        alt={comment.user_name}
        width={32}
        height={32}
        className="rounded-full bg-muted"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm">{comment.user_name}</span>
            <span className="text-muted-foreground text-xs">
              @{comment.user_email.slice(0, 8)}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-foreground break-words text-sm mt-1">{comment.comment}</p>
      </div>
    </div>
  );
}

