import { z } from "zod";
import { Profanity } from "profanity-validator";

const profanity = new Profanity({
  heat: 0.5, // lower heat for more profanity detection. Wanna know more? https://profanity.devwtf.in/
});

const profanityCheck = async (value: string) => {
  const result = await profanity.validateField(value);
  return result.isValid;
};

export const postSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
      message: "Please enter a valid email address",
    }),
  msgbox: z
    .string()
    .min(1, "Message cannot be empty")
    .refine(async (val) => await profanityCheck(val), {
      message: "Fuck, You can't just hate me here darling!",
    }),
});

export const commentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
      message: "Please enter a valid email address",
    }),
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .refine(async (val) => await profanityCheck(val), {
      message: "Fuck, You can't just hate me here darling!",
    }),
});

export type PostSchemaT = z.infer<typeof postSchema>;
export type CommentSchemaT = z.infer<typeof commentSchema>;
