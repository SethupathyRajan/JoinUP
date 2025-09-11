import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { FacultyDashboard } from './FacultyDashboard';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return currentUser.isAdmin ? <FacultyDashboard /> : <StudentDashboard />;
};