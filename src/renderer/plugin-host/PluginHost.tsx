/**
 * PluginHost - Renders plugin components by name with error boundaries
 * This component resolves and renders components from the plugin registry
 */

import React from 'react';
import { PluginManager } from '../../shared/plugin-system';

interface PluginHostProps {
  componentName: string;
  props?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PluginHostErrorBoundary extends React.Component<
  React.PropsWithChildren<{ componentName: string }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ componentName: string }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Plugin component ${this.props.componentName} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
          <h3 className="text-sm font-medium text-destructive mb-2">
            Plugin Error: {this.props.componentName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message || 'Component failed to render'}
          </p>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

export const PluginHost: React.FC<PluginHostProps> = ({ componentName, props = {} }) => {
  const pluginManager = PluginManager.getInstance();
  const Component = pluginManager.getComponent(componentName);

  if (!Component) {
    console.warn(`Plugin component not found: ${componentName}`);
    return (
      <div className="p-2 text-xs text-muted-foreground border border-dashed border-muted rounded">
        Component not found: {componentName}
      </div>
    );
  }

  return (
    <PluginHostErrorBoundary componentName={componentName}>
      <Component {...props} />
    </PluginHostErrorBoundary>
  );
};

export default PluginHost;