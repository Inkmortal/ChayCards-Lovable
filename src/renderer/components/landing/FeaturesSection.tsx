/**
 * FeaturesSection - Landing page features grid with "Everything works together" section
 */

import { Card } from "@/renderer/components/ui/card";
import { FileText, BookOpen, CheckSquare } from "lucide-react";

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

export const FeaturesSection: React.FC = () => {
  return (
    <>
      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6" style={{ color: 'hsl(var(--foreground))', textShadow: '0 2px 4px hsl(var(--foreground) / 0.1)' }}>
              Everything works together
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop switching between apps. ChayCards brings documents, tasks, and learning into one unified workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const colorClasses = [
                { bg: 'bg-accent/10', border: 'border-accent/30', iconBg: 'bg-accent/10', icon: 'text-accent' },
                { bg: 'bg-info/10', border: 'border-info/30', iconBg: 'bg-info/10', icon: 'text-info' },
                { bg: 'bg-tertiary/10', border: 'border-tertiary/30', iconBg: 'bg-tertiary/10', icon: 'text-tertiary' }
              ];
              const colorClass = colorClasses[index];

              return (
                <Card
                  key={index}
                  className={`p-8 border-2 hover:shadow-xl hover:translate-y-[-4px] duration-300 rounded-3xl transition-all ${colorClass.bg} ${colorClass.border}`}
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border-2 ${colorClass.iconBg} ${colorClass.border}`}>
                    <feature.icon className={`w-8 h-8 ${colorClass.icon}`} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-2xl font-bold mb-4 text-foreground">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold text-foreground mb-12 text-center">
            How ChayCards works
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Write documents", desc: "Create notes, research, or any content using our markdown editor.", colorClass: 'primary' },
              { step: 2, title: "AI extracts knowledge", desc: "Key concepts become flashcards. Tasks are identified automatically.", colorClass: 'secondary' },
              { step: 3, title: "Learn & stay organized", desc: "Review with spaced repetition. Track tasks. Search everything.", colorClass: 'success' }
            ].map((item, index) => (
              <Card key={index} className="p-6 border-2 border-transparent hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 font-bold text-lg bg-${item.colorClass} text-${item.colorClass}-foreground border-2 border-${item.colorClass}/40`}
                >
                  {item.step}
                </div>
                <h4 className="font-bold text-xl mb-3 text-foreground">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
