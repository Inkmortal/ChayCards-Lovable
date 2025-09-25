import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, FileText, CheckSquare, Search, ArrowRight, Play } from "lucide-react";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;
  
  // Set dark mode by default
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

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
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ChayCards</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm" className="shadow-md">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-6xl font-bold text-foreground">
            Your digital brain for everything
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ChayCards transforms how you work with knowledge. Write documents, 
            create flashcards, manage tasks - all connected by AI in one beautiful workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-3 shadow-lg">
              Start building
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3">
              <Play className="w-5 h-5 mr-2" />
              Watch demo
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mt-12">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center mx-auto border shadow-sm">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
              <span className="text-sm text-muted-foreground">Free forever</span>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center mx-auto border shadow-sm">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
              </div>
              <span className="text-sm text-muted-foreground">Works offline</span>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center mx-auto border shadow-sm">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
              </div>
              <span className="text-sm text-muted-foreground">Privacy first</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Everything works together
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop switching between apps. ChayCards brings documents, tasks, and learning into one unified workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
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
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center border-2 shadow-lg">
            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Ready to build your digital workspace?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of knowledge workers who've already transformed how they learn, organize, and create.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-3 shadow-lg">
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                Download for {isElectron ? "Desktop" : "Windows"}
              </Button>
            </div>
          </Card>
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