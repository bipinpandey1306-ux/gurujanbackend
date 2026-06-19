import { useEffect } from "react";
import { useTrackPageView } from "@workspace/api-client-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Sparkles, HeartHandshake, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const track = useTrackPageView();

  useEffect(() => {
    track.mutate({ data: { path: "/about" } });
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/10">
            <span className="text-primary font-serif font-bold text-2xl">GJ</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4 text-gradient">
            About Gurujan
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            Gurujan is a collaborative social media and publishing portal designed for thinkers, educators, writers, and seekers to share deep insights on what truly matters.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="glass-card border border-border/50 shadow-sm hover-lift">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/5">
                <BookOpen size={18} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-bold text-base text-foreground">Education (शिक्षा)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fostering discussions on modern pedagogy, holistic learning models, values, and the critical adjustments needed in today's educational landscapes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border border-border/50 shadow-sm hover-lift">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/5">
                <Users size={18} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-bold text-base text-foreground">Society (सामाजिक)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Exploring social shifts, cultural values, community-driven progress, and bridging gaps to foster a more compassionate and understanding society.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border border-border/50 shadow-sm hover-lift">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/5">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-bold text-base text-foreground">Spirituality (अध्यात्म)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Delving into inner exploration, consciousness, mindfulness, and spiritual frameworks that help discover the true purpose of life and living.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border border-border/50 shadow-sm hover-lift">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/5">
                <HeartHandshake size={18} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-bold text-base text-foreground">Mental Health (मानसिक स्वास्थ्य)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Advocating for emotional well-being, mindfulness practices, digital wellness, and creating healthy mental boundaries in the modern digital age.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The Platform Concept */}
        <div className="p-8 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-sm mb-16 space-y-6 text-center max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-foreground">A Unified Workspace for Authors</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gurujan provides each registered author with a completely isolated publishing workspace. In your dashboard, you can draft articles, define personalized category lists, build photo galleries, manage comments, and track traffic analytics. There is zero overlap: your private creative space is fully separated from other registered users.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once you hit publish, your words are shared to the global public feed, connecting you directly with readers and fellow thinkers across the platform.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <h3 className="font-serif text-xl font-bold text-foreground">Ready to Share Your Wisdom?</h3>
          <div className="flex justify-center gap-3">
            <Link href="/blog">
              <Button size="lg" variant="outline" className="h-11 px-6 rounded-xl font-semibold">
                Explore Feed
              </Button>
            </Link>
            <Link href="/portal">
              <Button size="lg" className="h-11 px-6 shadow-lg shadow-primary/15 hover-lift rounded-xl font-semibold gap-1.5">
                Start Publishing <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
