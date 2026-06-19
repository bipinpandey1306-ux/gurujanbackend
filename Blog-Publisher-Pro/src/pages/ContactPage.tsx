import { useEffect } from "react";
import { useSubmitContact, useTrackPageView } from "@workspace/api-client-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const track = useTrackPageView();
  const submit = useSubmitContact();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();

  useEffect(() => {
    track.mutate({ data: { path: "/contact" } });
  }, []);

  const onSubmit = (data: ContactForm) => {
    submit.mutate({ data }, { onSuccess: () => reset() });
  };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-10">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Mail size={22} className="text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground leading-relaxed">
            Whether you have a question, feedback, or simply wish to connect — 
            the Gurujan team is here to listen and respond to your messages.
          </p>
        </div>

        {submit.isSuccess ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
            <CheckCircle size={40} className="text-primary mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Message received</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Thank you for writing. We will be in touch soon.
            </p>
            <Button variant="outline" onClick={() => submit.reset()}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card border border-border rounded-xl p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What is this regarding?"
                {...register("subject")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Your message..."
                rows={6}
                {...register("message", { required: "Message is required", minLength: { value: 20, message: "Please write at least 20 characters" } })}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submit.isPending}>
              {submit.isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
