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
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender: "tutor",
          text: data.tutor_reply,
          question_number: data.metadata?.question_number ?? null,
          topic_tag: data.metadata?.topic_tag ?? null,
          confusion_flag: data.metadata?.confusion_flag ?? false,
        });
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {conversationInfo && (
            <div className="ml-4">
              <h1 className="text-lg font-semibold">
                {conversationInfo.course.code}{" "}
                {conversationInfo.course.title
                  ? `- ${conversationInfo.course.title}`
                  : ""}
              </h1>
              <p className="text-sm text-muted-foreground">
                {conversationInfo.assignment.title}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto flex-1 py-6 flex gap-6">
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 && !loading ? (
              <p className="text-muted-foreground">
                Start the conversation by asking about the assignment.
              </p>
            ) : null}
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "student"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender === "student"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          <form onSubmit={sendMessage} className="flex gap-2">
            <Select value={questionNumber} onValueChange={setQuestionNumber}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Q#" />
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
              placeholder="Ask about the assignment. The tutor will guide you, not solve it."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </form>
        </div>

        <div className="w-80 space-y-4">
          {conversationInfo && (
            <MaterialsList
              courseId={conversationInfo.course.id}
              assignmentId={conversationInfo.assignment.id}
            />
          )}
          
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Tutor rules</h2>
            <p className="text-sm text-muted-foreground mb-2">
              This tutor will not give you the full graded answer. It will ask
              you to show your thinking and will give hints.
            </p>
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Break down complex problems</li>
              <li>• Ask clarifying questions</li>
              <li>• Show your work step by step</li>
              <li>• Review tutor feedback carefully</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;