import { useState } from 'react';
import { useRouter } from 'next/router';
import form from '@/app/ui/form.module.css';
 
export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('https://thousand.day/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed.');
      } else {
        // login was successful
        const data = await response.json();
        const token = data.token;
        const userId = data.user_id
        const commitmentTarget = data.user_target
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userId', userId)
        localStorage.setItem('commitmentTarget', commitmentTarget)
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error: ', err);
      setError('An error occurred during login.');
    }
  };

  return (
    <div className={form.login}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
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
          <div className={form.spacer}></div>
          <button type="submit">Login</button>
          <div className={form.spacer}></div>
        </div>
      </form>
    </div>
  )
}
