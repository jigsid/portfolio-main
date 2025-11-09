import { createClient } from "./supabase/client";

const supabase = createClient();

const storeUser = async (userData: any) => {
  const {
    id,
    email,
    user_metadata: { name, avatar_url },
  } = userData;

  const { data, error } = await supabase
    .from("users")
    .upsert({ id: id, name: name, email: email, image: avatar_url });
  if (error) {
    console.error("Error inserting or updating user data:", error);
  } else {
    console.log("User data upserted successfully");
  }
};

const postMsg = async (
  user_image: string | null,
  user_email: string,
  user_name: string,
  msg: string,
  user_id?: string,
) => {
  // Use a default avatar if no image provided
  const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(user_name);
  
  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_image: user_image || defaultAvatar,
      user_email: user_email,
      user_name: user_name,
      msg: msg,
      user_id: user_id || null,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error inserting msg data:", error);
    return { error, data: null };
  } else {
    console.log("Message data inserted successfully");
    return { error: null, data };
  }
};

const deleteMsg = async (id: number) => {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) {
    console.error("Error deleting message:", error);
    return error;
  } else {
    console.log("Message deleted successfully");
    return true;
  }
};

// Like/Unlike a message
const toggleLike = async (messageId: number, userId: string | null, userName: string, userEmail: string) => {
  try {
    const userIdentifier = userId || `${userName}_${userEmail}`;
    
    // Check if like already exists
    const { data: existingLikes, error: checkError } = await supabase
      .from("message_likes")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_identifier", userIdentifier);

    if (checkError) throw checkError;

    const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;

    if (existingLike) {
      // Unlike - delete the like
      const { error } = await supabase
        .from("message_likes")
        .delete()
        .eq("id", existingLike.id);
      
      if (error) throw error;
      return { liked: false, error: null };
    } else {
      // Like - insert new like
      const { error } = await supabase
        .from("message_likes")
        .insert({
          message_id: messageId,
          user_identifier: userIdentifier,
          user_id: userId || null,
        });
      
      if (error) throw error;
      return { liked: true, error: null };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { liked: false, error };
  }
};

// Get likes for a message
const getLikes = async (messageId: number) => {
  const { data, error } = await supabase
    .from("message_likes")
    .select("*")
    .eq("message_id", messageId);
  
  if (error) {
    console.error("Error fetching likes:", error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
};

// Post a comment
const postComment = async (
  messageId: number,
  user_image: string | null,
  user_email: string,
  user_name: string,
  comment: string,
  user_id?: string,
) => {
  const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(user_name);
  
  const { data, error } = await supabase
    .from("message_comments")
    .insert({
      message_id: messageId,
      user_image: user_image || defaultAvatar,
      user_email: user_email,
      user_name: user_name,
      comment: comment,
      user_id: user_id || null,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error inserting comment:", error);
    return { error, data: null };
  } else {
    console.log("Comment inserted successfully");
    return { error: null, data };
  }
};

// Get comments for a message
const getComments = async (messageId: number) => {
  const { data, error } = await supabase
    .from("message_comments")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error fetching comments:", error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
};

// Delete a comment
const deleteComment = async (commentId: number) => {
  const { error } = await supabase
    .from("message_comments")
    .delete()
    .eq("id", commentId);
    
  if (error) {
    console.error("Error deleting comment:", error);
    return error;
  } else {
    console.log("Comment deleted successfully");
    return true;
  }
};

export { 
  storeUser, 
  postMsg, 
  deleteMsg, 
  toggleLike, 
  getLikes, 
  postComment, 
  getComments, 
  deleteComment 
};

