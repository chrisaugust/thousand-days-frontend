// pages/commitments/new.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function NewCommitment() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL; // Base API URL from env vars

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timeframe: '',
    image_id: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/commitments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commitment: {
            name: formData.name,
            description: formData.description,
            timeframe: parseInt(formData.timeframe, 10),
            image_id: formData.image_id ? parseInt(formData.image_id, 10) : null
          }
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create commitment.');
      }
      const createdCommitment = await response.json();
      // Redirect to the commitment's show page
      router.push(`/commitments/${createdCommitment.id}`);
    } catch (err) {
      console.error('Error creating commitment:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Create New Commitment</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input 
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea 
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="timeframe">Timeframe (days):</label>
          <input 
            type="number"
            id="timeframe"
            name="timeframe"
            value={formData.timeframe}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="image_id">Image ID (optional):</label>
          <input 
            type="number"
            id="image_id"
            name="image_id"
            value={formData.image_id}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Create Commitment</button>
      </form>
    </div>
  );
}
