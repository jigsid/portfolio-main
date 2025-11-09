"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import BlurFade from "./magicui/blur-fade";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { postSchema, PostSchemaT, commentSchema, CommentSchemaT } from "@/lib/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/context/auth.context";
import { createClient } from "@/data/supabase/client";
import { 
  deleteMsg, 
  postMsg, 
  toggleLike, 
  getLikes, 
  postComment, 
  getComments, 
  deleteComment 
} from "@/data/func";
import { DATA } from "@/data/config/site.config";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

const PAGE_SIZE = 5;

interface Message {
  id: number;
  user_id: string | null;
  user_image: string;
  user_name: string;
  user_email: string;
  msg: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

interface Like {
  id: number;
  message_id: number;
  user_identifier: string;
  user_id: string | null;
  created_at: string;
}

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

export default function Guestbook() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [messageLikes, setMessageLikes] = useState<Map<number, Like[]>>(new Map());
  const [messageComments, setMessageComments] = useState<Map<number, Comment[]>>(new Map());
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set()); // messageId_userIdentifier
  const [commentForms, setCommentForms] = useState<Map<number, boolean>>(new Map());
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  const { user } = useAuth();
  const supabase = createClient();

  const form = useForm<PostSchemaT>({
    resolver: zodResolver(postSchema),
    defaultValues: { 
      name: user?.user_metadata?.name || "", 
      email: user?.email || "", 
      msgbox: "" 
    },
  });

  // Memoize the set of message IDs to prevent duplicates
  const messageIds = useMemo(
    () => new Set(messages.map((msg) => msg.id)),
    [messages],
  );

  // Load likes and comments for a message
  const loadMessageInteractions = useCallback(async (messageId: number) => {
    try {
      const [likesResult, commentsResult] = await Promise.all([
        getLikes(messageId),
        getComments(messageId),
      ]);

      if (!likesResult.error) {
        setMessageLikes((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, likesResult.data);
          return newMap;
        });
      }

      if (!commentsResult.error) {
        setMessageComments((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, commentsResult.data);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Error loading message interactions:", error);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .range(messages.length, messages.length + PAGE_SIZE - 1);

      if (error) {
        console.error("Supabase error:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
        setHasMore(false);
        return;
      }

      const typedData = (data ?? []) as Message[];

      const newMessages = typedData.filter((msg) => !messageIds.has(msg.id));

      // Only add unique messages
      if (newMessages.length > 0) {
        setMessages((prev) => {
          const updatedMessages = [...prev, ...newMessages];
          // Ensure no duplicates by creating a Set and converting back to array
          const uniqueMessages = Array.from(
            new Map(updatedMessages.map((msg) => [msg.id, msg])).values(),
          );
          return uniqueMessages;
        });

        // Load interactions for new messages
        for (const msg of newMessages) {
          await loadMessageInteractions(msg.id);
        }
      }

      setHasMore(newMessages.length === PAGE_SIZE);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      const errorMessage = error?.message || "Failed to load messages. Please check your connection.";
      toast.error(errorMessage);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [messages, supabase, messageIds, isLoading, hasMore, loadMessageInteractions]);

  useEffect(() => {
    const messageChannel = supabase
      .channel("messages-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new && "id" in payload.new) {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              const isDuplicate = prev.some((msg) => msg.id === newMessage.id);
              if (!isDuplicate) {
                return [newMessage, ...prev];
              }
              return prev;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [supabase, messageIds]);

  const fetchInitialMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        console.error("Supabase error:", error);
        // Don't throw, just log and show empty state
        console.error("Full error details:", JSON.stringify(error, null, 2));
        setMessages([]);
        setHasMore(false);
        return;
      }

      const typedData = (data ?? []) as Message[];
      setMessages(typedData);

      // Load likes and comments for all messages
      for (const msg of typedData) {
        await loadMessageInteractions(msg.id);
      }

      setHasMore(typedData.length === PAGE_SIZE);
    } catch (error: any) {
      console.error("Error loading initial messages:", error);
      const errorMessage = error?.message || "Failed to load messages. Please check your connection.";
      toast.error(errorMessage);
      setMessages([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, loadMessageInteractions]);

  // Initial load of messages
  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreMessages();
    }
  }, [inView, hasMore, isLoading, loadMoreMessages]);

  const handleSignIn = async (type: "google" | "github") => {
    try {
      const origin =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://devwtf.in";

      await supabase.auth.signInWithOAuth({
        provider: type,
        options: { redirectTo: `${origin}/api/auth/callback` },
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleDelMsg = async (id: number) => {
    try {
      const isDel = await deleteMsg(id);

      // If deletion is successful, remove the message from the local state
      if (isDel) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== id),
        );
        toast.success("Message deleted successfully");
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message. Please try again.");
    }
  };

  const handleLike = async (messageId: number) => {
    try {
      // For anonymous users, prompt for name
      let userName = user?.user_metadata?.name || "Anonymous";
      let userEmail = user?.email || "anonymous@guestbook.com";
      
      if (!user) {
        const name = prompt("Please enter your name to like this message:");
        if (!name || name.trim().length < 2) {
          toast.error("Name is required to like messages");
          return;
        }
        userName = name.trim();
        userEmail = `anonymous_${Date.now()}@guestbook.com`;
      }

      const userId = user?.id || null;
      const userIdentifier = userId || `${userName}_${userEmail}`;

      const result = await toggleLike(messageId, userId, userName, userEmail);
      
      if (result.error) {
        toast.error("Failed to like message. Please try again.");
        return;
      }

      // Reload likes for this message
      const likesResult = await getLikes(messageId);
      if (!likesResult.error) {
        setMessageLikes((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, likesResult.data);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Error liking message:", error);
      toast.error("Failed to like message. Please try again.");
    }
  };

  const handleToggleComments = (messageId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        // Load comments if not already loaded
        if (!messageComments.has(messageId)) {
          loadMessageInteractions(messageId);
        }
      }
      return newSet;
    });
  };

  const handleToggleCommentForm = (messageId: number) => {
    setCommentForms((prev) => {
      const newMap = new Map(prev);
      newMap.set(messageId, !newMap.get(messageId));
      return newMap;
    });
  };

  const onSubmit = async (data: PostSchemaT) => {
    try {
      // Validate name is provided if user is not logged in
      if (!user && (!data.name || data.name.trim().length < 2)) {
        toast.error("Please enter your name (at least 2 characters)");
        return;
      }

      const validatedData = await postSchema.parseAsync({ ...data });
      
      // Use authenticated user data if available, otherwise use form data
      const userName = user?.user_metadata?.name || validatedData.name || "Anonymous";
      const userEmail = user?.email || validatedData.email || "anonymous@guestbook.com";
      const userImage = user?.user_metadata?.avatar_url || null;
      const userId = user?.id || undefined;

      const result = await postMsg(
        userImage,
        userEmail,
        userName,
        validatedData.msgbox,
        userId,
      );
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to send message");
      }
      
      form.reset({
        name: user?.user_metadata?.name || "",
        email: user?.email || "",
        msgbox: "",
      });
      toast.success("Message sent successfully!");
      
      // Reload messages to show the new one
      setTimeout(() => {
        fetchInitialMessages();
      }, 500);
    } catch (error) {
      console.error("Submission error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to send message. Please try again.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-2 mt-5 overflow-hidden">
      {/* Message Form at the top */}
      <div className="mb-8 pb-6 border-b">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3 w-full"
          >
            {!user && (
              <div className="flex flex-col sm:flex-row gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Your email (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-2">
              <FormField
                control={form.control}
                name="msgbox"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="So, what do you think about me?..."
                        className="flex-1 min-h-[80px]"
                        {...field}
                        autoFocus={!!user}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="m-auto w-full md:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground text-center">
                You can also{" "}
                <button
                  type="button"
                  onClick={() => handleSignIn("google")}
                  className="underline hover:text-foreground"
                >
                  sign in with Google
                </button>
                {" or "}
                <button
                  type="button"
                  onClick={() => handleSignIn("github")}
                  className="underline hover:text-foreground"
                >
                  GitHub
                </button>
                {" to use your profile"}
              </p>
            )}
          </form>
        </Form>
      </div>

      <div className="space-y-4 mb-24">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No messages yet. Be the first to leave a message!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <BlurFade delay={i * 0.2} key={msg.id}>
            <div className="bg-card border rounded-xl p-4 w-full hover:bg-muted/50 transition-colors shadow-sm">
              <div className="flex items-start justify-start gap-3 w-full">
                <Image
                  src={msg.user_image}
                  alt={msg.user_name}
                  width={55}
                  height={55}
                  className="rounded-xl bg-muted"
                />
                <div className="flex-1 min-w-0 md:min-w-[450px] w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 w-full">
                      <span className="font-semibold truncate">
                        {msg.user_name}
                      </span>
                      <span className="text-muted-foreground text-sm truncate">
                        @{msg.user_email.slice(0, 8)}
                      </span>
                      <span className="hidden md:block text-muted-foreground text-sm">•</span>
                      <span className="hidden md:block text-muted-foreground text-sm">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {((user?.id && user.id === msg.user_id) ||
                      user?.id === DATA.adminUserId) && (
                      <Button
                        size={"icon"}
                        variant={"ghost"}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleDelMsg(msg.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground break-words text-sm w-full">
                    {msg.msg}
                  </p>
                  
                  {/* Like and Comment Buttons */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleLike(msg.id)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          (() => {
                            const likes = messageLikes.get(msg.id) || [];
                            if (!user) return "";
                            const userIdentifier = user.id || `${user.user_metadata?.name}_${user.email}`;
                            const isLiked = likes.some(
                              (like) => like.user_id === user.id || like.user_identifier === userIdentifier
                            );
                            return isLiked ? "fill-red-500 text-red-500" : "";
                          })()
                        }`}
                      />
                      <span className="text-sm">
                        {messageLikes.get(msg.id)?.length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        handleToggleComments(msg.id);
                        handleToggleCommentForm(msg.id);
                      }}
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">
                        {messageComments.get(msg.id)?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(msg.id) && (
                    <div className="mt-4 space-y-3">
                      {/* Comment Form */}
                      {commentForms.get(msg.id) && (
                        <CommentForm
                          messageId={msg.id}
                          user={user}
                          onSuccess={() => {
                            loadMessageInteractions(msg.id);
                            handleToggleCommentForm(msg.id);
                          }}
                        />
                      )}
                      
                      {/* Comments List */}
                      {messageComments.get(msg.id)?.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          user={user}
                          adminId={DATA.adminUserId}
                          onDelete={async () => {
                            await deleteComment(comment.id);
                            loadMessageInteractions(msg.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BlurFade>
        ))}
        {hasMore && (
          <div ref={ref} className="py-4 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading more messages...
                </p>
              </div>
            ) : null}
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No more messages to load
          </p>
        )}
      </div>
    </div>
  );
}
