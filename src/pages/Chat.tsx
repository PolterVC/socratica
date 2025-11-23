import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import MaterialsList from "@/components/student/MaterialsList";

interface Message {
  id: string;
  sender: string;
  text: string;
  created_at: string;
  question_number?: number | null;
  topic_tag?: string | null;
  confusion_flag?: boolean | null;
  materials_referenced?: Array<{ title: string; kind: string }>;
}

interface ConversationInfo {
  course: { code: string; title: string; id: string };
  assignment: { title: string; allow_direct_answers: boolean; id: string };
}

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionNumber, setQuestionNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // load conversation and messages when id changes
  useEffect(() => {
    if (!conversationId) return;

    const init = async () => {
      await loadConversation(conversationId);
      await loadMessages(conversationId);
    };

    init();
    const unsubscribe = subscribeToMessages(conversationId);

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async (id: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        course_id,
        assignment_id,
        courses ( code, title ),
        assignments ( title, allow_direct_answers )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      console.error("Error loading conversation:", error);
      toast.error("Could not load conversation");
      navigate("/");
      return;
    }

    setConversationInfo({
      course: { ...(data.courses as any), id: data.course_id },
      assignment: { ...(data.assignments as any), id: data.assignment_id },
    });
  };

  const loadMessages = async (id: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Could not load messages");
      return;
    }

    setMessages((data as Message[]) || []);
  };

  const subscribeToMessages = (id: string) => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // 1. store student message
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender: "student",
      text: userMessage,
      question_number: questionNumber && questionNumber !== "none" ? Number(questionNumber) : null,
    });

    if (insertError) {
      console.error(insertError);
      toast.error("Error sending message");
      setLoading(false);
      return;
    }

    // 2. call Socratic function
    try {
      const { data, error } = await supabase.functions.invoke("socratic-tutor", {
        body: {
          message: userMessage,
          conversationId,
          questionNumber: questionNumber && questionNumber !== "none" ? Number(questionNumber) : null,
          allowDirectAnswers:
            conversationInfo?.assignment?.allow_direct_answers ?? false,
        },
      });

      if (error) {
        console.error(error);
        toast.error("Tutor error");
        return;
      }

      // expect { tutor_reply, metadata: {...} }
      if (data?.tutor_reply) {
        // 3. store tutor message
        const { data: insertedMsg } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender: "tutor",
          text: data.tutor_reply,
          question_number: data.metadata?.question_number ?? null,
          topic_tag: data.metadata?.topic_tag ?? null,
          confusion_flag: data.metadata?.confusion_flag ?? false,
        }).select().single();

        // Add materials_referenced to local state (not stored in DB)
        if (insertedMsg && data.metadata?.materials_referenced) {
          setMessages((prev) => 
            prev.map((m) => 
              m.id === insertedMsg.id 
                ? { ...m, materials_referenced: data.metadata.materials_referenced }
                : m
            )
          );
        }
      } else {
        toast.error(data?.error ?? "Tutor did not respond");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with tutor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {conversationInfo && (
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">
                {conversationInfo.course.code} – {conversationInfo.assignment.title}
              </h1>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !loading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-center max-w-md">
                  Ask a question about the assignment. The tutor will guide you through thinking, not give you the answer.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${
                        message.sender === "student" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 ${
                          message.sender === "student"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        {message.sender === "tutor" && message.materials_referenced && message.materials_referenced.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <p className="text-xs font-medium mb-2 opacity-70">Referenced materials:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.materials_referenced.map((mat, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-background/60 border border-border/50"
                                >
                                  <span className="opacity-60">{mat.kind}</span>
                                  <span className="font-medium">{mat.title}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {message.sender === "student" && (
                      <p className="text-xs text-muted-foreground mt-1 text-right mr-1">
                        Logged for instructor insight
                      </p>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="shrink-0">
            <form onSubmit={sendMessage} className="flex gap-3">
              <Select value={questionNumber} onValueChange={setQuestionNumber}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue placeholder="Question" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      Q{n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {conversationInfo && (
              <div className="mt-4 pt-4 border-t">
                <MaterialsList
                  courseId={conversationInfo.course.id}
                  assignmentId={conversationInfo.assignment.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;