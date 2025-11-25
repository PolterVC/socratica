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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Send, ArrowLeft, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{ id: string; title: string; url: string; kind: string }>>([]);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  // scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user role for navigation
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setUserRole(data?.role || "student");
      }
    };
    fetchRole();
  }, []);

  // load conversation and messages when id changes
  useEffect(() => {
    if (!conversationId) return;

    const init = async () => {
      await loadConversation(conversationId);
      await loadMessages(conversationId);
      await loadAssignmentPdf(conversationId);
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
        navigate("/app/student");
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

  const loadAssignmentPdf = async (id: string) => {
    setLoadingPdf(true);
    try {
      const { data: convo } = await supabase
        .from("conversations")
        .select("assignment_id, course_id")
        .eq("id", id)
        .single();

      if (!convo) return;

      // Fetch ALL materials for this assignment, excluding answer keys for students
      let query = supabase
        .from("materials")
        .select("id, storage_path, kind, title")
        .eq("assignment_id", convo.assignment_id);

      // Filter out answer keys for students (only teachers can see them)
      if (userRole === "student") {
        query = query.neq("kind", "answers");
      }

      const { data: materials } = await query.order("kind", { ascending: true });

      if (materials && materials.length > 0) {
        // Generate signed URLs for all materials
        const pdfsWithUrls = await Promise.all(
          materials.map(async (material) => {
            const { data: signedUrl } = await supabase.storage
              .from("materials")
              .createSignedUrl(material.storage_path, 3600);

            return {
              id: material.id,
              title: material.title,
              url: signedUrl?.signedUrl || "",
              kind: material.kind,
            };
          })
        );

        const validPdfs = pdfsWithUrls.filter(pdf => pdf.url);
        setAvailablePdfs(validPdfs);

        // Set default PDF (prioritize questions type)
        if (validPdfs.length > 0) {
          const questionPdf = validPdfs.find(p => p.kind === "questions" || p.kind === "questions_with_answers");
          const defaultIndex = questionPdf ? validPdfs.indexOf(questionPdf) : 0;
          setSelectedPdfIndex(defaultIndex);
          setPdfUrl(validPdfs[defaultIndex].url);
        }
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
    } finally {
      setLoadingPdf(false);
    }
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
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border/10 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(userRole === "teacher" ? "/app/teacher" : "/app/student")} 
            className="shrink-0 hover:bg-muted/50" 
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {conversationInfo && (
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground truncate font-sans tracking-tight">
                {conversationInfo.course.code} – {conversationInfo.assignment.title}
              </h1>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {isMobile ? (
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-6 pt-4">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
              <div className="h-full flex flex-col px-6 py-6">
                <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                  {messages.length === 0 && !loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-lg space-y-2">
                        <p className="text-foreground/60 text-base leading-relaxed">
                          Ask a question about the assignment.
                        </p>
                        <p className="text-foreground/40 text-sm">
                          The tutor will guide you through thinking, not give you the answer.
                        </p>
                      </div>
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
                              className={`max-w-[75%] rounded-xl px-5 py-4 ${
                                message.sender === "student"
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/50 border border-border/20"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.text}</p>
                              {message.sender === "tutor" && message.materials_referenced && message.materials_referenced.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/20">
                                  <p className="text-xs font-medium mb-2.5 text-foreground/50 uppercase tracking-wide">Referenced materials</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.materials_referenced.map((mat, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-background border border-border/30"
                                      >
                                        <span className="text-foreground/40 font-medium">{mat.kind}</span>
                                        <span className="text-foreground/70">{mat.title}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {message.sender === "student" && (
                            <p className="text-[11px] text-foreground/30 mt-2 text-right mr-1 uppercase tracking-wider">
                              Logged for instructor insight
                            </p>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-muted/50 border border-border/20 rounded-xl px-5 py-4">
                            <div className="flex space-x-1.5">
                              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                                style={{ animationDelay: "0.15s" }}
                              />
                              <div
                                className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
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

                <div className="shrink-0 bg-background pt-6 border-t border-border/10">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <Select value={questionNumber} onValueChange={setQuestionNumber}>
                      <SelectTrigger className="w-32 shrink-0 bg-white border-border/20 font-medium">
                        <SelectValue placeholder="Question" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General</SelectItem>
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
                      className="flex-1 bg-white border-border/20 h-11 text-[15px]"
                      disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 h-11 px-5">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="assignment" className="flex-1 overflow-hidden mt-0">
              <div className="h-full p-6 flex flex-col">
                {availablePdfs.length > 1 && (
                  <Select 
                    value={selectedPdfIndex.toString()} 
                    onValueChange={(val) => {
                      const idx = parseInt(val);
                      setSelectedPdfIndex(idx);
                      setPdfUrl(availablePdfs[idx].url);
                    }}
                    disabled={loadingPdf}
                  >
                    <SelectTrigger className="w-full mb-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePdfs.map((pdf, idx) => (
                        <SelectItem key={pdf.id} value={idx.toString()}>
                          {pdf.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {loadingPdf ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading assignment PDF...</p>
                  </div>
                ) : pdfUrl ? (
                  <iframe src={pdfUrl} className="flex-1 w-full border rounded-lg" title="Assignment PDF" />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
                      <p className="text-muted-foreground">No assignment PDF available</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/10 bg-white">
                  <h2 className="text-lg font-semibold">Assignment</h2>
                  {availablePdfs.length > 1 && (
                    <Select 
                      value={selectedPdfIndex.toString()} 
                      onValueChange={(val) => {
                        const idx = parseInt(val);
                        setSelectedPdfIndex(idx);
                        setPdfUrl(availablePdfs[idx].url);
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePdfs.map((pdf, idx) => (
                          <SelectItem key={pdf.id} value={idx.toString()}>
                            {pdf.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {loadingPdf ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                ) : pdfUrl ? (
                  <iframe src={pdfUrl} className="flex-1 w-full" title="Assignment PDF" />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
                      <p className="text-muted-foreground">No assignment PDF available</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col px-6 py-6">
                <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                  {messages.length === 0 && !loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-lg space-y-2">
                        <p className="text-foreground/60 text-base leading-relaxed">
                          Ask a question about the assignment.
                        </p>
                        <p className="text-foreground/40 text-sm">
                          The tutor will guide you through thinking, not give you the answer.
                        </p>
                      </div>
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
                              className={`max-w-[75%] rounded-xl px-5 py-4 ${
                                message.sender === "student"
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/50 border border-border/20"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.text}</p>
                              {message.sender === "tutor" && message.materials_referenced && message.materials_referenced.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/20">
                                  <p className="text-xs font-medium mb-2.5 text-foreground/50 uppercase tracking-wide">Referenced materials</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.materials_referenced.map((mat, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-background border border-border/30"
                                      >
                                        <span className="text-foreground/40 font-medium">{mat.kind}</span>
                                        <span className="text-foreground/70">{mat.title}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {message.sender === "student" && (
                            <p className="text-[11px] text-foreground/30 mt-2 text-right mr-1 uppercase tracking-wider">
                              Logged for instructor insight
                            </p>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-muted/50 border border-border/20 rounded-xl px-5 py-4">
                            <div className="flex space-x-1.5">
                              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                                style={{ animationDelay: "0.15s" }}
                              />
                              <div
                                className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
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

                <div className="shrink-0 bg-background pt-6 border-t border-border/10">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <Select value={questionNumber} onValueChange={setQuestionNumber}>
                      <SelectTrigger className="w-32 shrink-0 bg-white border-border/20 font-medium">
                        <SelectValue placeholder="Question" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General</SelectItem>
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
                      className="flex-1 bg-white border-border/20 h-11 text-[15px]"
                      disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 h-11 px-5">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default Chat;