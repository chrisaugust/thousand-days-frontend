import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import SVG from 'react-inlinesvg';

export default function CommitmentShow() {
  const router = useRouter();
  const { id } = router.query;
  const commitment_id = id;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Commitment, Progress Entry, and Image data
  const [commitment, setCommitment] = useState(null);
  const [progressEntries, setProgressEntries] = useState([]);
  const [imageData, setImageData] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  // For handling SVG
  const svgRef = useRef(null);

  useEffect(() => {
    const lastCompletionDate = localStorage.getItem('lastCompletionDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastCompletionDate === today) {
      setHasCompletedToday(true);
    }
  }, []);

  // Fetch Commitment details and associated Progress Entries
  useEffect(() => {
    if (!commitment_id) return;
    async function fetchData() {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          router.push('/login');
          return;
        }
        // Fetch the commitment data using the id from the URL
        const commitmentResponse = await fetch(`${API_URL}/commitments/${commitment_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!commitmentResponse.ok) {
          throw new Error('Failed to fetch commitment details.');
        }
        const commitmentData = await commitmentResponse.json();
        setCommitment(commitmentData);

        // Fetch associated Progress Entries
        const progressResponse = await fetch(`${API_URL}/commitments/${commitment_id}/progress_entries`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!progressResponse.ok) {
          throw new Error('Failed to fetch progress entries.');
        }
        const progressData = await progressResponse.json();
        setProgressEntries(progressData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [commitment_id, API_URL, router]);

  // Load image data if needed (for example, if the commitment includes an image_id)
  const handleLoadImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Adjust the endpoint as needed; here we assume the commitment has an image_id property.
      const imageId = commitment?.image_id || 2;
      const imageResponse = await fetch(`${API_URL}/images/${imageId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        throw new Error(errText || 'Failed to fetch image data.');
      }
      const imageJson = await imageResponse.json();
      setImageData(imageJson);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading the image.');
    } finally {
      setLoading(false);
    }
  };

  // Once the SVG loads, update regions based on progress entries
  const handleSVGLoad = () => {
    const svgElement = svgRef.current;
    if (!svgElement || !imageData) return;
    const { regionColorMapping } = imageData;
    const completedRegions = new Set(progressEntries.map(entry => String(entry.region_id)));
    Object.keys(regionColorMapping).forEach(regionId => {
      const regionElement = svgElement.getElementById(`region-${regionId}`);
      if (regionElement) {
        if (completedRegions.has(regionId)) {
          regionElement.style.fill = regionColorMapping[regionId];
          regionElement.style.stroke = regionColorMapping[regionId];
        } else {
          regionElement.style.fill = '#000';
          regionElement.style.stroke = '#CCC';
        }
      }
    });
    setImageLoaded(true);
  };

  // Handle completing a day's task (i.e. posting a new progress entry)
  const handleDayComplete = async () => {
    // if (hasCompletedToday) {
    //   alert("You've already completed today's task. Come back tomorrow!");
    //   return;
    // }
    const svgElement = svgRef.current;
    if (!imageData || !svgElement) {
      alert('Image data is not loaded yet.');
      return;
    }
    const allRegions = Object.keys(imageData.regionColorMapping);
    const completedRegions = new Set(progressEntries.map(entry => String(entry.region_id)));
    const uncompletedRegions = allRegions.filter(x => !completedRegions.has(x));

    const isFirstEntry = progressEntries.length === 0;
    // Use values from progress entries or defaults if none exist.
    const { commitment_id, image_id, day } = isFirstEntry
      ? {
          commitment_id: id,
          image_id: imageData.id,
          day: 0
        }
      : progressEntries[progressEntries.length - 1];

  
    const dailyRegionsToFill = allRegions.length % commitment.timeframe === 0 
      ? allRegions.length / commitment.timeframe 
      : Math.floor(allRegions.length / commitment.timeframe);
    const remainderRegions = allRegions.length % commitment.timeframe !== 0
        ? allRegions.length % commitment.timeframe
        : 0;


    const entries = [];
    let numRegionsToFill;

    if (uncompletedRegions.length === 0) {
      alert("All regions have been completed!");
      setIsComplete(true);
      return;
    } else {
      if (isFirstEntry) {
        numRegionsToFill = dailyRegionsToFill;
        numRegionsToFill += remainderRegions;
        console.log('numRegionsToFill for first day', numRegionsToFill);
      } else {
        numRegionsToFill = dailyRegionsToFill;
        console.log('dividing remaining uncompleted regions by remaining days ', numRegionsToFill);
      }
    }

    for (let i = 0; i < numRegionsToFill; i++) {
      let entryCreated = false;
      let randomIdx;
      let chosenRegion;
      let color;
      let regionElement;
      let newProgressEntryData;
      while (!entryCreated) {
        randomIdx = Math.floor(Math.random() * uncompletedRegions.length);
        chosenRegion = uncompletedRegions[randomIdx];
        color = imageData.regionColorMapping[chosenRegion];
        // Update the SVG region immediately for visual feedback
        regionElement = svgElement.getElementById(`region-${chosenRegion}`);
        if (regionElement) {
          regionElement.style.fill = color;
          regionElement.style.stroke = color;
        }
        newProgressEntryData = {
          commitment_id,
          image_id,
          day: day + 1,
          region_id: parseInt(chosenRegion, 10),
          color
        };
        if (entries.filter(e => e.region_id === newProgressEntryData.region_id).length === 0) {
          entries.push(newProgressEntryData);
          entryCreated = true;
        }
      }
    }
    console.log('num entries:', entries.length);

    try {
      const token = localStorage.getItem('jwtToken');
      let jsonBody;
      if (progressEntries.length === 1) {
        jsonBody = JSON.stringify({ progress_entry: entries[0] });
      } else {
        jsonBody = JSON.stringify({ progress_entries: entries });
      }
      console.log('jsonBody: ', jsonBody);
      const response = await fetch(`${API_URL}/commitments/${id}/progress_entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: jsonBody
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error posting progress entry.');
      }
      const responseData = await response.json();
      setProgressEntries(prev => [...prev, responseData]);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastCompletionDate', today);
      setHasCompletedToday(true);
    } catch (err) {
      console.error('Error posting progress entry:', err);
      setError(err.message);
    }
  };

  if (loading) return <p>Loading commitment...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!commitment) return <p>No commitment found.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>{commitment.name}</h1>
      <p>{commitment.description}</p>
      <p>Timeframe: {commitment.timeframe} days</p>

      {progressEntries.length === 0 ? (
        <p>Day 1</p>
      ) : (
        <p>Day {progressEntries[progressEntries.length - 1].day + 1}</p>
      )}

      {/* Button to load image if not already loaded */}
      {!imageLoaded && (
        <button onClick={handleLoadImage} type="button">
          Load Image
        </button>
      )}

      {/* Button to complete the day's task */}
      {/* !hasCompletedToday temporarily replaced with true to make button available */} 
      {true && (
        <button onClick={handleDayComplete} type="button">
          Complete Task for the Day
        </button>
      )}

      {/* Display the image using an inline SVG if available */}
      {imageData && imageData.url && (
        <div
          style={{
            width: '90vw',
            height: '80vh',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <SVG
            src={imageData.url}
            ref={svgRef}
            onLoad={handleSVGLoad}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {/* Display progress entries if any */}
      <h2>Progress Entries</h2>
      {progressEntries.length === 0 ? (
        <p>No progress entries yet.</p>
      ) : (
        <ul>
          {progressEntries.map((entry) => (
            <li key={entry.id}>
              Day {entry.day}: {entry.region_id} - Color {entry.color}
            </li>
          ))}
        </ul>
      )}

      {hasCompletedToday && (
        <p style={{ color: 'green' }}>
          You've completed today's task! Come back tomorrow.
        </p>
      )}
    </div>
  );
}
