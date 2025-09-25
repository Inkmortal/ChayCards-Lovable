import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, Target, Brain, Search, Zap, Users, Star, TrendingUp } from "lucide-react";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;

  const features = [
    {
      icon: BookOpen,
      title: "Smart Documents",
      description: "Create, edit, and organize documents with AI-powered insights and automatic linking.",
      color: "text-blue-500"
    },
    {
      icon: Brain,
      title: "Knowledge Cards",
      description: "Auto-generated flashcards from your documents with spaced repetition learning.",
      color: "text-purple-500"
    },
    {
      icon: Target,
      title: "Task Management",
      description: "Extract tasks from documents and track progress with intelligent prioritization.",
      color: "text-green-500"
    },
    {
      icon: Search,
      title: "Universal Search",
      description: "Find anything across all your content with semantic AI-powered search.",
      color: "text-orange-500"
    }
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Active Learners" },
    { icon: BookOpen, value: "500K+", label: "Documents Created" },
    { icon: Brain, value: "2M+", label: "Cards Generated" },
    { icon: Star, value: "4.9", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChayCards
            </h1>
          </div>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {isElectron ? "Desktop App" : "Web Version"}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Your All-in-One
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
              Digital Workspace
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Combine documents, tasks, and knowledge management in one intelligent platform. 
            Learn smarter with AI-powered flashcards and never lose track of your ideas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8">
              <Zap className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
              <stat.icon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need to Learn & Create
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Powerful features that work together to boost your productivity and learning efficiency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 border-0 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200 group">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Content Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Popular Study Sets
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Get started with these community-created flashcard sets
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "JavaScript Fundamentals", cards: 45, author: "DevMaster", color: "from-yellow-400 to-orange-500" },
            { title: "World History Timeline", cards: 89, author: "HistoryBuff", color: "from-green-400 to-blue-500" },
            { title: "Biology Cell Structure", cards: 67, author: "ScienceTeacher", color: "from-purple-400 to-pink-500" },
          ].map((set, index) => (
            <Card key={index} className="p-6 border-0 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200 group cursor-pointer">
              <div className={`w-full h-32 bg-gradient-to-br ${set.color} rounded-lg mb-4 flex items-center justify-center`}>
                <BookOpen className="w-12 h-12 text-white opacity-80" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {set.title}
              </h4>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>{set.cards} cards</span>
                <span>by {set.author}</span>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">Trending</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <Card className="p-12 text-center border-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who use ChayCards to organize their knowledge and accelerate their learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
              Start Learning Today
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 px-8">
              Explore Features
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2024 ChayCards. Built for learners, by learners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;