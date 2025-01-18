import React, { useState } from 'react';
import { useAuth } from '../contexts/userAuth';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';

const LoginSignup = () => {
  const { user, signUp, signIn, signOut, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <Container>
        <Row>
          <Col className="d-flex justify-content-end">
            <Button variant="danger" onClick={signOut}>
              Log out
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <h2 className="text-center">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email">
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" block>
              {isSignUp ? 'Sign Up' : 'Log In'}
            </Button>
          </Form>
          {error && <div className="text-danger text-center mt-2">{error}</div>}
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} block>
            {isSignUp ? 'Already have an account? Log In' : 'Don\'t have an account? Sign Up'}
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginSignup;
