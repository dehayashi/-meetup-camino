import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Send, Star,
  Car, UtensilsCrossed, Mountain, BedDouble, LogOut, UserPlus,
} from "lucide-react";
import type { Activity, PilgrimProfile, ChatMessage, Rating } from "@shared/schema";

const typeConfig: Record<string, { icon: typeof Car; label: string }> = {
  transport: { icon: Car, label: "Transporte" },
  meal: { icon: UtensilsCrossed, label: "Refei\u00e7\u00e3o" },
  hike: { icon: Mountain, label: "Passeio" },
  lodging: { icon: BedDouble, label: "Hospedagem" },
};

interface ActivityDetail extends Activity {
  participantCount: number;
  creatorName: string;
  isParticipant: boolean;
  isCreator: boolean;
  participants: (PilgrimProfile & { profileImageUrl?: string })[];
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: activity, isLoading } = useQuery<ActivityDetail>({
    queryKey: ["/api/activities", id],
  });

  const { data: messages } = useQuery<(ChatMessage & { displayName?: string; photoUrl?: string })[]>({
    queryKey: ["/api/activities", id, "messages"],
    refetchInterval: 3000,
    enabled: !!activity?.isParticipant || !!activity?.isCreator,
  });

  const { data: ratings } = useQuery<(Rating & { displayName?: string })[]>({
    queryKey: ["/api/activities", id, "ratings"],
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/activities/${id}/join`),
    onSuccess: () => {
      toast({ title: "Entrou no grupo!" });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => toast({ title: "Erro ao entrar", variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/activities/${id}/leave`),
    onSuccess: () => {
      toast({ title: "Voc\u00ea saiu do grupo." });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => toast({ title: "Erro ao sair", variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", `/api/activities/${id}/messages`, { content }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id, "messages"] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: (data: { score: number; comment: string }) =>
      apiRequest("POST", `/api/activities/${id}/ratings`, data),
    onSuccess: () => {
      toast({ title: "Avalia\u00e7\u00e3o enviada!" });
      setRatingScore(0);
      setRatingComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id, "ratings"] });
    },
    onError: () => toast({ title: "Erro ao avaliar", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-4 pb-20 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-60 w-full rounded-md" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-4 pb-20 text-center">
        <p className="text-muted-foreground">Atividade n\u00e3o encontrada.</p>
        <Link href="/activities"><Button variant="ghost" className="mt-2">Voltar</Button></Link>
      </div>
    );
  }

  const config = typeConfig[activity.type] || typeConfig.hike;
  const TypeIcon = config.icon;
  const spotsLeft = (activity.spots || 4) - activity.participantCount;
  const canJoin = !activity.isParticipant && !activity.isCreator && spotsLeft > 0;
  const isMember = activity.isParticipant || activity.isCreator;

  return (
    <div className="pb-20 max-w-lg mx-auto">
      <div className="flex items-center gap-2 p-4">
        <Link href="/activities">
          <Button variant="ghost" size="icon" data-testid="button-back-detail">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-serif text-lg font-bold truncate" data-testid="text-activity-title">
          {activity.title}
        </h1>
      </div>

      <div className="px-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary">
              <TypeIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">por {activity.creatorName}</span>
          </div>

          {activity.description && (
            <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" /> {activity.city}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" /> {activity.date}
            </span>
            {activity.time && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" /> {activity.time}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={spotsLeft <= 1 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {spotsLeft} vaga{spotsLeft !== 1 ? "s" : ""}
              </span>
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            {canJoin && (
              <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="flex-1" data-testid="button-join">
                <UserPlus className="w-4 h-4 mr-1" />
                {joinMutation.isPending ? "Entrando..." : "Entrar no Grupo"}
              </Button>
            )}
            {activity.isParticipant && (
              <Button variant="outline" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} data-testid="button-leave">
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            )}
          </div>
        </Card>

        {activity.participants && activity.participants.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Participantes ({activity.participantCount})</h3>
            <div className="flex flex-wrap gap-2">
              {activity.participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-2 bg-secondary/50 rounded-md px-2 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={p.photoUrl || p.profileImageUrl || ""} />
                    <AvatarFallback className="text-[10px]">{p.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{p.displayName}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {isMember && (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Chat</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
              {messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.userId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-md px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {!isMe && (
                          <span className="text-[10px] font-medium block mb-0.5 opacity-70">
                            {msg.displayName || "Peregrino"}
                          </span>
                        )}
                        <p className="text-sm" data-testid={`chat-message-${msg.id}`}>{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma mensagem ainda. Diga ol\u00e1!
                </p>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva uma mensagem..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    sendMessageMutation.mutate(message.trim());
                  }
                }}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={() => message.trim() && sendMessageMutation.mutate(message.trim())}
                disabled={!message.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Avalia\u00e7\u00f5es</h3>
          {ratings && ratings.length > 0 ? (
            <div className="space-y-3 mb-4">
              {ratings.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= r.score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium">{r.displayName || "Peregrino"}</span>
                    {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Nenhuma avalia\u00e7\u00e3o ainda.</p>
          )}

          {isMember && (
            <div className="border-t border-border pt-3">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingScore(s)}
                    data-testid={`star-${s}`}
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${s <= ratingScore ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Coment\u00e1rio (opcional)..."
                className="text-sm mb-2"
                data-testid="input-rating-comment"
              />
              <Button
                size="sm"
                disabled={ratingScore === 0 || ratingMutation.isPending}
                onClick={() => ratingMutation.mutate({ score: ratingScore, comment: ratingComment })}
                data-testid="button-submit-rating"
              >
                Enviar Avalia\u00e7\u00e3o
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
