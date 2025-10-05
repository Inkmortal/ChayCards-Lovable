/**
 * FormSection Component - Group related form fields with header
 * Provides consistent form organization across plugins
 */

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form Section component for grouping related fields
 *
 * @example
 * ```tsx
 * <FormSection
 *   title="Account Settings"
 *   description="Manage your account preferences"
 * >
 *   <FormField label="Email" name="email" value={email} onChange={setEmail} />
 *   <FormField label="Name" name="name" value={name} onChange={setName} />
 * </FormSection>
 * ```
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
