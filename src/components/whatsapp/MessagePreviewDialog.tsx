import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Check, Send, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { buildWaLink, sendWhatsAppMessage, markStatus, sendViaProvider, type WhatsAppType } from "@/lib/whatsapp";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phone: string;
  message: string;
  type: WhatsAppType;
  userId?: string | null;
  templateId?: string | null;
  context?: Record<string, unknown> | null;
  onSent?: () => void;
}

const MessagePreviewDialog = ({
  open, onOpenChange, phone, message, type, userId, templateId, context, onSent,
}: Props) => {
  const [phoneVal, setPhoneVal] = useState(phone);
  const [body, setBody] = useState(message);
  const [logId, setLogId] = useState<string | null>(null);
  const link = buildWaLink(phoneVal, body);

  const queue = async () => {
    try {
      const res = await sendWhatsAppMessage({
        userId, phone: phoneVal, type, body, templateId, context,
      });
      setLogId(res.id);
      toast({ title: "Queued", description: "Message saved as Pending. Open WhatsApp to send." });
      onSent?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openWa = async () => {
    if (!logId) await queue();
    window.open(link, "_blank");
    if (logId) {
      await markStatus(logId, "manual_sent");
      toast({ title: "Marked as sent" });
      onSent?.();
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    toast({ title: "Copied to clipboard" });
  };

  const markSent = async () => {
    if (!logId) await queue();
    if (logId) await markStatus(logId, "sent");
    toast({ title: "Marked as sent" });
    onSent?.();
    onOpenChange(false);
  };

  const sendApi = async () => {
    let id = logId;
    if (!id) {
      const res = await sendWhatsAppMessage({ userId, phone: phoneVal, type, body, templateId, context });
      id = res.id;
      setLogId(id);
    }
    const r = await sendViaProvider({ logId: id, phone: phoneVal, message: body });
    if (r.success) {
      toast({ title: "Sent via WhatsApp API" });
      onSent?.();
      onOpenChange(false);
    } else {
      toast({ title: "Send failed", description: r.error || "Provider error", variant: "destructive" });
      onSent?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview WhatsApp Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Phone</Label>
            <Input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} placeholder="0728028444 or 94728028444" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="font-mono text-sm" />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={copy}><Copy className="w-4 h-4 mr-2" />Copy</Button>
          <Button variant="outline" onClick={queue}><Send className="w-4 h-4 mr-2" />Queue (Pending)</Button>
          <Button variant="outline" onClick={markSent}><Check className="w-4 h-4 mr-2" />Mark Sent</Button>
          <Button variant="outline" onClick={openWa}><ExternalLink className="w-4 h-4 mr-2" />Open WhatsApp</Button>
          <Button onClick={sendApi}><Zap className="w-4 h-4 mr-2" />Send via WhatsApp API</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessagePreviewDialog;
