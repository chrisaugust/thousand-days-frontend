import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import SVG from 'react-inlinesvg';
 
export default function Dashboard() {
  const router = useRouter();
  const [commitmentTarget, setCommitmentTarget] = useState(null);
  const [progressEntries, setProgressEntries] = useState([]);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  const [coloredRegionSVG, setColoredRegionSVG] = useState(null);
  const [coloredRegionViewBox, setColoredRegionViewBox] = useState(null);

  const svgRef = useRef(null);

  useEffect(() => {
    const lastCompletionDate = localStorage.getItem('lastCompletionDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastCompletionDate === today) {
      setHasCompletedToday(true);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get JWT token for logged in user, redirect to /login if not found
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          router.push('/login');
          return;
        }

        setCommitmentTarget(localStorage.getItem('commitmentTarget'));

        // Fetch progress entries for logged in user
        const progressResponse = await fetch('https://thousand.day/progress_entries', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!progressResponse.ok) {
          const errText = await progressResponse.text();
          throw new Error(errText || 'Failed to fetch progress entries.');
        }
        const progressData = await progressResponse.json();
        setProgressEntries(progressData);

      } catch (err) {
        console.error('Dashboard fetch error: ', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleLoadImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const imageResponse = await fetch('https://thousand.day/images/2', {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        throw new Error(errText || 'Failed to fetch image data.');
      }

      const imageJson = await imageResponse.json();
      setImageData(imageJson);
    } catch (err) {
      console.error('Dashboard fetch error: ', err);
      setError(err.message || 'An error occurred while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Once the SVG is loaded, update its regions based on progressEntries.
  const handleSVGLoad = () => {
    const svgElement = svgRef.current;
    if (!svgElement || !imageData) return;
    const { region_color_mapping: regionColorMapping } = imageData;
    console.log('regionColorMapping', regionColorMapping);
    const completedRegions = new Set(progressEntries.map(entry => String(entry.region_id)));

    console.log('completedRegions Set: ', completedRegions);

    // Iterate over each region and update its fill and stroke.
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

  const handleDayComplete = async () => {
    if (hasCompletedToday) {
      alert("You've followed through on your commitment for today. Come back again tomorrow!");
      return;
    }
    const svgElement = svgRef.current;
    const allRegions = Object.keys(imageData.region_color_mapping);
    const completedRegions = new Set(progressEntries.map(entry => String(entry.region_id)));
    const uncompletedRegions = allRegions.filter(x => !completedRegions.has(x));

    const isFirstEntry = progressEntries.length === 0;

    const { user_id, image_id, day } = isFirstEntry
      ? {
          user_id: localStorage.getItem('userId'),
          image_id: imageData.id,
          day: 0
        }
      : progressEntries[progressEntries.length - 1];

    const newProgressEntryData = { user_id, image_id, day: day + 1 };

    if (uncompletedRegions.length > 0) {
      const randomIdx = Math.floor(Math.random() * uncompletedRegions.length);
      const chosenRegion = uncompletedRegions[randomIdx];
      const color = imageData.region_color_mapping[chosenRegion];

      if (color) {
        const regionElement = svgElement.getElementById(`region-${chosenRegion}`);
        regionElement.style.fill = color;
        regionElement.style.stroke = color;        
        const bbox = regionElement.getBBox();
        setColoredRegionSVG(regionElement.outerHTML);
        setColoredRegionViewBox(`${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }

      newProgressEntryData['region_id'] = parseInt(chosenRegion, 10);
      newProgressEntryData['color'] = color;

      console.log('newProgressEntryData', newProgressEntryData);
      
      try {
        const token = localStorage.getItem('jwtToken');
        const progressEntryResponse = await fetch('https://thousand.day/progress_entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 'progress_entry': newProgressEntryData })
        });

        if (!progressEntryResponse.ok) {
          const errText = await progressEntryResponse.text();
          throw new Error(errText || 'Error posting progress entry.');
        }
        const progressEntryResponseData = await progressEntryResponse.json();
        console.log(progressEntryResponseData);

        // update local state
        setProgressEntries(prevEntries => [...prevEntries, progressEntryResponseData]);

        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastCompletionDate', today);
        setHasCompletedToday(true);

      } catch (err) {
        console.error('Error posting progress entry');
      }
        
    } else {
      alert("You've completed 1000 Days... That shows some real grit and perseverance. Congratulations!")
      setIsComplete(true);
    }
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>1000 Day Commitment: {commitmentTarget}</h1>

      {!imageLoaded && (
        <button onClick={handleLoadImage} type="button">Load image</button>
      )}

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

      {imageLoaded && !isComplete && !hasCompletedToday && (
        <button onClick={handleDayComplete} type="button">Complete Task for the Day</button>
      )}

      {hasCompletedToday && (
        <p style={{ color: 'green' }}>You've followed through on your commitment for today! Come back tomorrow and keep it up!</p>
      )}

      {coloredRegionSVG && coloredRegionViewBox && (
        <div style={{ marginTop: '20px' }}>
          <h3>Region colored in today: </h3>
          <svg
            width={parseFloat(coloredRegionViewBox.split(' ')[2])}
            height={parseFloat(coloredRegionViewBox.split(' ')[3])}
            viewBox={coloredRegionViewBox}
            style={{ border: '1px solid #ccc' }}
          >
            {/* Render the colored region's markup */}
            <g dangerouslySetInnerHTML={{ __html: coloredRegionSVG }} />
          </svg>
        </div>
      )}

    </div>
  )
};
