import { memo } from 'react';
import { Navigate } from 'react-router-dom';

const AgentOnboardingRoute = memo(() => {
  return <Navigate replace to="/" />;
});

AgentOnboardingRoute.displayName = 'AgentOnboardingRoute';

export default AgentOnboardingRoute;
