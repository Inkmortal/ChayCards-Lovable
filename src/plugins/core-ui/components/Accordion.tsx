/**
 * Accordion Component - Collapsible content sections
 * Provides consistent accordions across plugins
 */

import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/renderer/components/ui/accordion';

// Re-export primitives for advanced usage
export { AccordionContent, AccordionItem, AccordionTrigger };

export interface AccordionSection {
  value: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  sections: AccordionSection[];
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  collapsible?: boolean;
  className?: string;
}

/**
 * Accordion component for collapsible content sections
 *
 * @example Simple accordion (single open at a time)
 * ```tsx
 * <Accordion
 *   sections={[
 *     { value: 'item-1', title: 'Account Settings', content: <AccountForm /> },
 *     { value: 'item-2', title: 'Privacy', content: <PrivacySettings /> },
 *     { value: 'item-3', title: 'Notifications', content: <NotificationSettings /> }
 *   ]}
 *   defaultValue="item-1"
 * />
 * ```
 *
 * @example Multiple sections open
 * ```tsx
 * <Accordion
 *   type="multiple"
 *   sections={[
 *     { value: 'faq-1', title: 'How do I...?', content: 'Answer here...' },
 *     { value: 'faq-2', title: 'What is...?', content: 'Explanation here...' }
 *   ]}
 *   defaultValue={['faq-1', 'faq-2']}
 * />
 * ```
 */
export const Accordion: React.FC<AccordionProps> = ({
  sections,
  type = 'single',
  defaultValue,
  collapsible = true,
  className,
}) => {
  return (
    <ShadcnAccordion
      type={type as any}
      defaultValue={defaultValue as any}
      collapsible={type === 'single' ? collapsible : undefined}
      className={className}
    >
      {sections.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger>{section.title}</AccordionTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  );
};
