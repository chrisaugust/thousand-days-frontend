import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SVG from 'react-inlinesvg';
 
export default function Dashboard() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timeframe: '',
    image_id: ''
  });

  useEffect(() => {
    async function fetchCommitments() {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch(`${API_URL}/commitments`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Failed to fetch commitments.'); 
        }
        const data = await response.json();
        setCommitments(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'An error occurred while fetching commitments.');
      } finally {
        setLoading(false);
      }
    }
    fetchCommitments();
  }, [API_URL, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCommitment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const newCommitment = {
        name: formData.name,
        description: formData.description,
        timeframe: parseInt(formData.timeframe, 10),
        image_id: formData.image_id ? parseInt(formData.image_id, 10) : null
      };

      const response = await fetch(`${API_URL}/commitments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commitment: newCommitment })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create commitment.');
      }
      const createdCommitment = await response.json();
      setCommitments([createdCommitment, ...commitments]);

    } catch (err) {
      console.error('Error creating commitment:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  // if multiple commitments, display in list
  return (
    <div>
      <h1>Your Commitments</h1>
      {commitments.length === 0 ? (
        <Link href="/commitments/new">
          Create a new commitment
       </Link>
      ) : (
        <>
          <ul>
            {commitments.map((commitment) => (
              <li 
                key={commitment.id} 
                onClick={() => router.push(`/commitments/${commitment.id}`)}
                style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
              >
                <h3>{commitment.name}</h3>
                <p>{commitment.description}</p>
                <p>Timeframe: {commitment.timeframe} days</p>
              </li>
            ))}
          </ul>

          <Link href="/commitments/new">
            Create a new commitment
          </Link>
        </>
      )}
    </div>
  );
}
