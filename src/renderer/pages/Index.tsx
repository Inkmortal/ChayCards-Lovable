import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, FileText, CheckSquare, Search, Plus } from "lucide-react";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;

  const studyMethods = [
    {
      title: "Flashcards",
      description: "Review with spaced repetition",
      icon: BookOpen,
      color: "bg-blue-500"
    },
    {
      title: "Documents",
      description: "Write and organize notes",
      icon: FileText,
      color: "bg-green-500"
    },
    {
      title: "Tasks",
      description: "Track your progress",
      icon: CheckSquare,
      color: "bg-purple-500"
    },
    {
      title: "Search",
      description: "Find anything instantly",
      icon: Search,
      color: "bg-orange-500"
    }
  ];

  const recentSets = [
    { title: "Biology Chapter 12", cards: 45, lastStudied: "2 hours ago" },
    { title: "Spanish Vocabulary", cards: 67, lastStudied: "Yesterday" },
    { title: "History Timeline", cards: 23, lastStudied: "3 days ago" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                ChayCards
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">
                {isElectron ? "Desktop" : "Web"}
              </span>
              <Button variant="outline" size="sm">
                Log in
              </Button>
              <Button size="sm">
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
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How do you want to study?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Master whatever you're learning with ChayCards' documents, flashcards, and task management.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Sign up for free
          </Button>
        </section>

        {/* Study Methods */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studyMethods.map((method, index) => (
              <Card key={index} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className={`w-16 h-16 ${method.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {method.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Study Sets */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Recent study sets
            </h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create set
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSets.map((set, index) => (
              <Card key={index} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {set.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {set.cards} cards
                </p>
                <p className="text-xs text-slate-500">
                  Studied {set.lastStudied}
                </p>
              </Card>
            ))}
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