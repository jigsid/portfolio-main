"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema, CommentSchemaT } from "@/lib/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { postComment } from "@/data/func";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface CommentFormProps {
  messageId: number;
  user: User | null;
  onSuccess: () => void;
}

export function CommentForm({ messageId, user, onSuccess }: CommentFormProps) {
  const form = useForm<CommentSchemaT>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      comment: "",
    },
  });

  const onSubmit = async (data: CommentSchemaT) => {
    try {
      if (!user && (!data.name || data.name.trim().length < 2)) {
        toast.error("Please enter your name (at least 2 characters)");
        return;
      }

      const validatedData = await commentSchema.parseAsync({ ...data });

      const userName = user?.user_metadata?.name || validatedData.name || "Anonymous";
      const userEmail = user?.email || validatedData.email || "anonymous@guestbook.com";
      const userImage = user?.user_metadata?.avatar_url || null;
      const userId = user?.id || undefined;

      const result = await postComment(
        messageId,
        userImage,
        userEmail,
        userName,
        validatedData.comment,
        userId,
      );

      if (result.error) {
        throw new Error(result.error.message || "Failed to post comment");
      }

      form.reset({
        name: user?.user_metadata?.name || "",
        email: user?.email || "",
        comment: "",
      });
      toast.success("Comment posted!");
      onSuccess();
    } catch (error) {
      console.error("Error posting comment:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to post comment. Please try again.");
      } else {
        toast.error("Failed to post comment. Please try again.");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        {!user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                    <Input type="email" placeholder="Your email (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

