import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function updateChatHistory(
  annotationId: string,
  newMessage: ChatMessage
) {
  const supabase = createClient();

  // First get the current chat history
  const { data: annotation, error: fetchError } = await supabase
    .from("annotations")
    .select("chat_history")
    .eq("id", annotationId)
    .single();

  if (fetchError) {
    console.error("Error fetching chat history:", fetchError);
    throw fetchError;
  }

  // Append the new message to the existing chat history
  const currentHistory = annotation?.chat_history || [];
  const updatedHistory = [...currentHistory, newMessage];

  // Update the annotation with the new chat history
  const { error: updateError } = await supabase
    .from("annotations")
    .update({ chat_history: updatedHistory })
    .eq("id", annotationId);

  if (updateError) {
    console.error("Error updating chat history:", updateError);
    throw updateError;
  }

  return updatedHistory;
}

export async function getChatHistory(annotationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("annotations")
    .select("chat_history")
    .eq("id", annotationId)
    .single();

  if (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }

  return data?.chat_history || [];
} 