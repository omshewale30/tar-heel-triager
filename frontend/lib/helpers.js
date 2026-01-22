import Badge from '../components/ui/Badge';



export const getStatusBadge = (status, isDark) => {
    const config = {
      approved: { variant: 'success', icon: '✓' },
      rejected: { variant: 'error', icon: '✗' },
      edited: { variant: 'warning', icon: '✎' },
    };
    const { variant, icon } = config[status] || { variant: 'default', icon: '•' };
    return (
      <Badge variant={variant} isDark={isDark}>
        <span aria-hidden="true">{icon}</span>
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

export const getRouteBadge = (route, isDark) => {
    if (route === 'AI_AGENT') {
      return (
        <Badge variant="violet" isDark={isDark}>
          <span aria-hidden="true">🤖</span>
          AI Agent
        </Badge>
      );
    }
    return (
      <Badge variant="info" isDark={isDark}>
        <span aria-hidden="true">👤</span>
        Human
      </Badge>
    );
  };
