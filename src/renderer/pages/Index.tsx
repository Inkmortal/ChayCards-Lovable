import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, FileText, CheckSquare, Search, Plus, Folder, Calendar, Brain } from "lucide-react";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;

  const workspaceMethods = [
    {
      title: "Documents",
      description: "Rich text with markdown support",
      icon: FileText,
      color: "bg-blue-600"
    },
    {
      title: "Knowledge Cards", 
      description: "AI-generated from your content",
      icon: Brain,
      color: "bg-purple-600"
    },
    {
      title: "Tasks",
      description: "Extracted from documents",
      icon: CheckSquare,
      color: "bg-green-600"
    },
    {
      title: "Search",
      description: "Full-text across everything",
      icon: Search,
      color: "bg-orange-600"
    }
  ];

  const recentWorkspace = [
    { title: "Research Notes", type: "Document", modified: "2 hours ago", icon: FileText },
    { title: "Project Alpha Tasks", type: "Task List", modified: "Yesterday", icon: CheckSquare },
    { title: "Meeting Notes - Q4 Planning", type: "Document", modified: "3 days ago", icon: FileText },
    { title: "Learning: React Patterns", type: "Knowledge Cards", modified: "1 week ago", icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">ChayCards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
                {isElectron ? "Desktop App" : "Web Version"}
              </span>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Log in
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Your all-in-one digital workspace
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Combine documents, tasks, and knowledge management. ChayCards connects your ideas, 
            extracts knowledge automatically, and keeps everything searchable.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Download for {isElectron ? "Desktop" : "Windows"}
            </Button>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Try in browser
            </Button>
          </div>
        </section>

        {/* Workspace Methods */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-center">Everything works together</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workspaceMethods.map((method, index) => (
              <Card key={index} className="p-6 bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
                <div className="text-center">
                  <div className={`w-16 h-16 ${method.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {method.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {method.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Workspace */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Your workspace</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <Folder className="w-4 h-4 mr-2" />
                New folder
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                New document
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {recentWorkspace.map((item, index) => (
              <Card key={index} className="p-4 bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 text-slate-400" />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-slate-400">{item.type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    Modified {item.modified}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-xl font-semibold mb-4">Offline-first design</h3>
              <p className="text-slate-400 mb-4">
                All your data stored locally. No internet required for full functionality. 
                Your documents, tasks, and knowledge cards work everywhere.
              </p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Local file storage
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Full-text search indexing
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Plugin ecosystem
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-xl font-semibold mb-4">AI-powered knowledge extraction</h3>
              <p className="text-slate-400 mb-4">
                Write naturally in documents. ChayCards automatically extracts key concepts, 
                generates flashcards, and suggests connections between ideas.
              </p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Auto-generated flashcards
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Spaced repetition learning
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                  Smart content linking
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-center">Built for how you actually work</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h4 className="font-semibold mb-3">Students & Researchers</h4>
              <p className="text-slate-400 text-sm">
                Take notes, extract key concepts automatically, and review with spaced repetition. 
                Never lose track of important information.
              </p>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h4 className="font-semibold mb-3">Knowledge Workers</h4>
              <p className="text-slate-400 text-sm">
                Manage projects, document processes, and extract tasks automatically. 
                Everything searchable and connected.
              </p>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h4 className="font-semibold mb-3">Lifelong Learners</h4>
              <p className="text-slate-400 text-sm">
                Build your personal knowledge base. ChayCards helps you retain and 
                connect everything you learn over time.
              </p>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Everything you need to learn
                </h3>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    Write and organize documents
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    Auto-generate flashcards from content
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    Track tasks and deadlines
                  </li>
                  <li className="flex items-center">
                    <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                    Search across all your content
                  </li>
                </ul>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-slate-600 dark:text-slate-400">
                  App preview coming soon
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Get Started */}
        <section className="text-center">
          <div className="bg-blue-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-semibold mb-4">
              Ready to get started?
            </h3>
            <p className="text-blue-100 mb-6">
              Join thousands of students already using ChayCards to study smarter.
            </p>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Sign up for free
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500">
            © 2024 ChayCards. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;