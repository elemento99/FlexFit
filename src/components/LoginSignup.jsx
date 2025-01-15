import React, { useState } from 'react';
import { useAuth } from '../contexts/userAuth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginSignup = () => {
  const { user, signUp, signIn, signOut, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const openModal = () => {
    if (!user) setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  
  React.useEffect(() => {
    if (user) {
      toast.success(`Welcome, ${user.email}!`);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <button onClick={signOut}>Log out</button>
      </div>
    );
  }

  return (
    <>
      <button onClick={openModal}>Log In / Sign Up</button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">{isSignUp ? 'Sign Up' : 'Log In'}</button>
            </form>
            {error && <div>{error}</div>}
            <button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Already have an account? Log In' : 'Don\'t have an account? Sign Up'}
            </button>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginSignup;
