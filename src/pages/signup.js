import { useState } from 'react';
import { useRouter } from 'next/router';
import form from '@/app/ui/form.module.css';
 
export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    commitment_target: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('https://thousand.day/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: formData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Signup failed.');
      } else {
        // signup was successful
        alert("Signup was successful!");
        router.push('/login');
      }
    } catch (err) {
      console.error('Signup error: ', err);
      setError('An error occurred during signup.');
    }
  };

  return (
    <div className={form.signup}>
      <h1>Sign Up</h1>
      <h2>Track your progress towards completing 1000 Days</h2> 
      <form onSubmit={handleSubmit}>
        <div className={form.group}>
        <label htmlFor="username">Username: </label>
        <input
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        </div>

        <div className={form.group}>
        <label htmlFor="email">Email: </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        </div>

        <div className={form.group}>
        <label htmlFor="password">Password: </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        </div>

        <div className={form.group}>
        <label htmlFor="commitment_target">Commitment Target: </label>
        <input
          type="text"
          name="commitment_target"
          id="commitment_target"
          value={formData.commitment_target}
          onChange={handleChange}
          required 
          className={form.large} 
        />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  )
}
