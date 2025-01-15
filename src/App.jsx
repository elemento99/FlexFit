import React from 'react';
import { AuthProvider } from './contexts/userAuth';
import LoginSignup from './components/LoginSignup';
import GoalsCrud from './components/GoalsCrud';
import RandomExercise from './components/RandomExercise';
import { GoalsProvider } from './contexts/GoalsContext';
import 'bootstrap/dist/css/bootstrap.min.css';




const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <LoginSignup />
        <GoalsProvider>
    <GoalsCrud />
    <RandomExercise/>
  </GoalsProvider>
        
      </div>
    </AuthProvider>
  );
};

export default App;
