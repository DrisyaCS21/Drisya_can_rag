import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitch }) {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✳</div>

        <h1>DocuMind</h1>
        <p className="auth-subtitle">
          AI DOCUMENT ASSISTANT
        </p>

        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>Start having conversations with your documents.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="At least 10 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={10}
            maxLength={72}
            required
          />

          <label>Confirm password</label>
          <input
            type="password"
            placeholder="Enter your password again"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={10}
            maxLength={72}
            required
          />

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={onSwitch}>
            Sign in
          </button>
        </p>

        <p className="auth-footer">
          Your personal knowledge assistant.
        </p>
      </div>
    </div>
  );
}
