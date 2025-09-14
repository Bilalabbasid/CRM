import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Application settings</p>
      </div>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Settings</h2></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No configurable settings in development.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
