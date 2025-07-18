// DeploymentStatus.jsx - Status messages and alerts
import React from 'react';

const DeploymentStatus = ({ status }) => (
  <div>
    <strong>{status.message}</strong>
    {status.deployment && <div>Service: {status.deployment.name}</div>}
  </div>
);

export default DeploymentStatus;
