import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: string;
  text: string;
  created_at: string;
}

interface ConversationInfo {
  course: { code: string; title: string };
  assignment: { title: string; allow_direct_answers: boolean };
}

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionNumber, setQuestionNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        courses(code, title),
        assignments(title, allow_direct_answers)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error loading conversation:', error);
      navigate('/');
    } else {
      setConversationInfo({
        course: data.courses as any,
        assignment: data.assignments as any
      });
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Insert student message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'student',
        text: userMessage
      });

    if (insertError) {
      toast.error('Error sending message');
      setLoading(false);
      return;
    }

    // Call Socratic tutor
    try {
      const { data, error } = await supabase.functions.invoke('socratic-tutor', {
        body: {
          message: userMessage,
          conversationId,
          questionNumber: questionNumber ? parseInt(questionNumber) : null,
          allowDirectAnswers: conversationInfo?.assignment.allow_direct_answers || false
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('402')) {
          toast.error('AI usage limit reached. Please contact your instructor.');
        } else {
          toast.error('Error getting tutor response');
        }
        setLoading(false);
        return;
      }

      // Insert tutor response
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender: 'tutor',
          text: data.tutor_reply,
          question_number: data.metadata.question_number,
          topic_tag: data.metadata.topic_tag,
          confusion_flag: data.metadata.confusion_flag
        });

    } catch (error: any) {
      toast.error('Error communicating with tutor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {conversationInfo && (
            <div className="ml-4">
              <h1 className="text-lg font-semibold">
                {conversationInfo.course.code} - {conversationInfo.assignment.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Chat with Socratica • Logged for instructor insight
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 overflow-hidden flex">
        <div className="flex-1 flex flex-col mr-4">
          <Card className="flex-1 overflow-y-auto p-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'student'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
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
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                <SelectItem value="">None</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <SelectItem key={n} value={n.toString()}>Q{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the assignment. The tutor will guide you, not solve it."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <Card className="w-72 p-4 hidden lg:block">
          <h3 className="font-semibold mb-2">Your Progress</h3>
          <p className="text-sm text-muted-foreground">
            Keep track of your reasoning steps as you work through the assignment.
          </p>
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Break down complex problems</li>
              <li>• Ask clarifying questions</li>
              <li>• Show your work step by step</li>
              <li>• Review tutor feedback carefully</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;