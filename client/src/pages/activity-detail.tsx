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
import { useT } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Send, Star,
  Car, UtensilsCrossed, Mountain, BedDouble, LogOut, UserPlus, Copy, ArrowRight,
  Trash2, Share2,
} from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";
import type { Activity, PilgrimProfile, ChatMessage, Rating } from "@shared/schema";

const typeIcons: Record<string, typeof Car> = {
  transport: Car,
  meal: UtensilsCrossed,
  hike: Mountain,
  lodging: BedDouble,
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
  const { t } = useT();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const typeLabels: Record<string, string> = {
    transport: t("type_transport"),
    meal: t("type_meal"),
    hike: t("type_hike"),
    lodging: t("type_lodging"),
  };

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
      toast({ title: t("toast_joined") });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => toast({ title: t("toast_join_error"), variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/activities/${id}/leave`),
    onSuccess: () => {
      toast({ title: t("toast_left") });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => toast({ title: t("toast_leave_error"), variant: "destructive" }),
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
      toast({ title: t("toast_rating_sent") });
      setRatingScore(0);
      setRatingComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/activities", id, "ratings"] });
    },
    onError: () => toast({ title: t("toast_rating_error"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${id}`),
    onSuccess: () => {
      toast({ title: t("delete_success") });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setLocation("/activities");
    },
    onError: () => toast({ title: t("delete_error"), variant: "destructive" }),
  });

  const activityUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = (a: ActivityDetail) => {
    return t("share_activity_text", { title: a.title, city: a.city, date: a.date });
  };

  const shareWhatsApp = () => {
    if (!activity) return;
    const text = encodeURIComponent(`${shareText(activity)}\n${activityUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(activityUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const shareTwitter = () => {
    if (!activity) return;
    const text = encodeURIComponent(shareText(activity));
    const url = encodeURIComponent(activityUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(activityUrl);
    toast({ title: t("activity_link_copied") });
  };

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
        <p className="text-muted-foreground">{t("activity_not_found")}</p>
        <Link href="/activities"><Button variant="ghost" className="mt-2">{t("activity_back")}</Button></Link>
      </div>
    );
  }

  const TypeIcon = typeIcons[activity.type] || typeIcons.hike;
  const typeLabel = typeLabels[activity.type] || typeLabels.hike;
  const spotsLeft = (activity.spots || 4) - activity.participantCount;
  const canJoin = !activity.isParticipant && !activity.isCreator && spotsLeft > 0;
  const isMember = activity.isParticipant || activity.isCreator;
  const spotsText = spotsLeft === 1 ? t("spots_one", { count: spotsLeft }) : t("spots_other", { count: spotsLeft });

  return (
    <div className="pb-20 max-w-lg mx-auto">
      <div className="flex items-center gap-2 p-4">
        <Link href="/activities">
          <Button variant="ghost" size="icon" data-testid="button-back-detail">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-serif text-lg font-bold truncate flex-1" data-testid="text-activity-title">
          {activity.title}
        </h1>
        <Button variant="ghost" size="icon" onClick={copyLink} data-testid="button-copy-link">
          <Copy className="w-4 h-4" />
        </Button>
        {activity.isCreator && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-delete-activity">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delete_confirm_title")}</AlertDialogTitle>
                <AlertDialogDescription>{t("delete_confirm_desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">{t("delete_cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground border-destructive"
                  data-testid="button-confirm-delete"
                >
                  {deleteMutation.isPending ? t("delete_deleting") : t("delete_confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="px-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary">
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">{t("by_creator", { name: activity.creatorName })}</span>
          </div>

          {activity.type === "transport" && activity.transportFrom && activity.transportTo && (
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary" data-testid="text-transport-route">
              <MapPin className="w-4 h-4" />
              {activity.transportFrom}
              <ArrowRight className="w-4 h-4" />
              {activity.transportTo}
            </div>
          )}

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
                {spotsText}
              </span>
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            {canJoin && (
              <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="flex-1" data-testid="button-join">
                <UserPlus className="w-4 h-4 mr-1" />
                {joinMutation.isPending ? t("activity_joining") : t("activity_join")}
              </Button>
            )}
            {activity.isParticipant && (
              <Button variant="outline" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} data-testid="button-leave">
                <LogOut className="w-4 h-4 mr-1" />
                {t("activity_leave")}
              </Button>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              {t("share_activity")}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={shareWhatsApp} data-testid="button-share-whatsapp">
                <SiWhatsapp className="w-4 h-4 mr-1.5" />
                {t("share_whatsapp")}
              </Button>
              <Button variant="outline" size="sm" onClick={shareFacebook} data-testid="button-share-facebook">
                <SiFacebook className="w-4 h-4 mr-1.5" />
                {t("share_facebook")}
              </Button>
              <Button variant="outline" size="sm" onClick={shareTwitter} data-testid="button-share-twitter">
                <SiX className="w-4 h-4 mr-1.5" />
                {t("share_twitter")}
              </Button>
              <Button variant="outline" size="sm" onClick={copyLink} data-testid="button-share-copy">
                <Copy className="w-4 h-4 mr-1.5" />
                {t("share_copy")}
              </Button>
            </div>
          </div>
        </Card>

        {activity.participants && activity.participants.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">{t("activity_participants", { count: activity.participantCount })}</h3>
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
            <h3 className="font-semibold text-sm mb-3">{t("activity_chat")}</h3>
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
                  {t("activity_no_messages")}
                </p>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("activity_message_placeholder")}
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
          <h3 className="font-semibold text-sm mb-3">{t("activity_ratings")}</h3>
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
            <p className="text-xs text-muted-foreground mb-4">{t("activity_no_ratings")}</p>
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
                placeholder={t("activity_rating_placeholder")}
                className="text-sm mb-2"
                data-testid="input-rating-comment"
              />
              <Button
                size="sm"
                disabled={ratingScore === 0 || ratingMutation.isPending}
                onClick={() => ratingMutation.mutate({ score: ratingScore, comment: ratingComment })}
                data-testid="button-submit-rating"
              >
                {t("activity_submit_rating")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
