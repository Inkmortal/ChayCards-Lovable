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
      <header className="border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-accent rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">ChayCards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                Log in
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <h2 className="text-7xl font-bold text-foreground leading-tight">
                  Your
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent block">digital brain</span>
                  for everything
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  ChayCards transforms how you work with knowledge. Write documents, 
                  create flashcards, manage tasks - all connected by AI in one beautiful workspace.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl px-8 py-6 text-lg transform hover:scale-105 transition-all duration-200"
                >
                  Start building
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-border/50 text-foreground hover:bg-muted/50 px-8 py-6 text-lg backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch demo
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-md">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center mx-auto border border-green-500/20">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Free forever</span>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mx-auto border border-blue-500/20">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Works offline</span>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto border border-purple-500/20">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Privacy first</span>
                </div>
              </div>
            </div>

            {/* Right Floating Elements */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-96 lg:h-[500px]">
                {/* Floating 3D cards */}
                <div className="absolute top-8 left-8 w-24 h-32 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl border border-primary/30 backdrop-blur-sm transform -rotate-12 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                
                <div className="absolute top-16 right-12 w-28 h-20 bg-gradient-to-br from-accent/30 to-accent/10 rounded-2xl border border-accent/30 backdrop-blur-sm transform rotate-12 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-accent" />
                </div>
                
                <div className="absolute bottom-20 left-4 w-32 h-24 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl border border-secondary/30 backdrop-blur-sm transform rotate-6 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <Search className="w-8 h-8 text-secondary-foreground" />
                </div>
                
                <div className="absolute bottom-8 right-8 w-20 h-28 bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl border border-border/30 backdrop-blur-sm transform -rotate-6 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                
                {/* Center main card */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-primary via-accent to-primary rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 border border-primary/20">
                  <div className="w-20 h-20 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <BookOpen className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>
                
                {/* Floating particles */}
                <div className="absolute top-4 left-1/2 w-2 h-2 bg-primary/40 rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 left-1/4 w-1 h-1 bg-accent/40 rounded-full animate-pulse delay-150"></div>
                <div className="absolute top-1/3 right-4 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background"></div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-left mb-16">
            <h3 className="text-5xl font-bold text-foreground mb-6">
              Everything works
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> together</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Stop switching between apps. ChayCards brings documents, tasks, and learning into one unified workspace that grows with you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="bg-gradient-to-br from-card/50 to-card/30 rounded-3xl p-8 border border-border/20 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-2xl font-semibold text-foreground mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-lg">
                    {feature.description}
                  </p>
                </div>
                
                {/* Floating gradient orb */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-card/50 to-card/30 rounded-3xl p-12 border border-border/20 backdrop-blur-sm text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-8 transform hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <h3 className="text-5xl font-bold text-foreground mb-6">
              Ready to build your
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">digital workspace?</span>
            </h3>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of knowledge workers who've already transformed how they learn, organize, and create with ChayCards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl px-10 py-6 text-lg transform hover:scale-105 transition-all duration-200"
              >
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-border/50 text-foreground hover:bg-muted/50 px-10 py-6 text-lg backdrop-blur-sm"
              >
                Download for {isElectron ? "Desktop" : "Windows"}
              </Button>
            </div>
          </div>
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