import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, FileText, CheckSquare, Search, ArrowRight, Play } from "lucide-react";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;

  const features = [
    {
      title: "Write & organize",
      description: "Rich documents with markdown support",
      icon: FileText,
    },
    {
      title: "Learn & remember", 
      description: "AI-generated flashcards from your content",
      icon: BookOpen,
    },
    {
      title: "Track & complete",
      description: "Tasks extracted automatically from documents",
      icon: CheckSquare,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">ChayCards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {isElectron ? "Desktop" : "Web"}
              </span>
              <Button variant="ghost" size="sm">
                Log in
              </Button>
              <Button size="sm">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Illustration placeholder */}
            <div className="order-2 lg:order-1">
              <div className="bg-muted rounded-2xl p-12 text-center aspect-square flex items-center justify-center">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted-foreground/20 rounded w-32 mx-auto"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-24 mx-auto"></div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Your workspace visualization
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="space-y-6">
                <h2 className="text-5xl font-bold text-foreground leading-tight">
                  The smart way to 
                  <span className="text-primary"> organize knowledge</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  ChayCards connects your documents, tasks, and learning in one place. 
                  Write naturally, learn automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  See how it works
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                ✨ Free to use • 📱 Works offline • 🔒 Your data stays local
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything works together
            </h3>
            <p className="text-lg text-muted-foreground">
              Stop switching between apps. ChayCards brings it all together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-8">
            How ChayCards works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <Card className="p-6 border-2 border-primary/20">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 text-sm font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Write documents</h4>
              <p className="text-sm text-muted-foreground">
                Create notes, research, or any content using our markdown editor.
              </p>
            </Card>
            
            <Card className="p-6 border-2 border-primary/20">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 text-sm font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">AI extracts knowledge</h4>
              <p className="text-sm text-muted-foreground">
                Key concepts become flashcards. Tasks are identified automatically.
              </p>
            </Card>
            
            <Card className="p-6 border-2 border-primary/20">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 text-sm font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Learn & stay organized</h4>
              <p className="text-sm text-muted-foreground">
                Review with spaced repetition. Track tasks. Search everything.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to organize your knowledge?
          </h3>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Download ChayCards and start building your digital workspace today.
          </p>
          <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Download for {isElectron ? "Desktop" : "Windows"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2024 ChayCards. Made for knowledge workers and lifelong learners.
        </div>
      </footer>
    </div>
  );
};

export default Index;