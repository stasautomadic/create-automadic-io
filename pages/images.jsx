// imports
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import { FaUpload } from 'react-icons/fa';

// Airtable configuration
const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const DEFAULT_PAGE_SIZE = 100;
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;


// get all the player images 
const getAllPlayerImages = async (fpSearchText, page = 1) => {
  try {
      // get the company id 
      const companyID = localStorage.getItem('company');
      // filter by company
      let filterFormula = companyID
          ? `FIND('${companyID}', {companyID (from Company)}) > 0`
          : '';
      
      // check if there is a search term
      if (fpSearchText) {
        const searchFilter = `SEARCH(LOWER("${fpSearchText}"), LOWER({playerFullName})) > 0`;
        filterFormula = filterFormula
              ? `AND(${filterFormula}, ${searchFilter})`
              : searchFilter;
      }

      // create the query for the filters
      const query = filterFormula
          ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
          : '';

      // send the request to the player airtable endpoint 
      const playerUrl = `${API_URL}tbl18T2ANqmt11hez?maxRecords=${DEFAULT_PAGE_SIZE}&page=${page}${query}`;

      // get the player response from the server
      const playerResponse = await fetch(playerUrl, {
          headers: {
              Authorization: `Bearer ${API_KEY}`,
          },
      });

      // if the response is not successful, return an empty array
      if (!playerResponse.ok) {
          return { records: [], hasMore: false };
      }

      // if the response is successful then return the records
      const playerData = await playerResponse.json();

      if (playerData.records.length === 0) {
          return { records: [], hasMore: false };
      }

     // map over the records and return the player full name 
     const players = playerData.records.map((record) => record.fields.playerFullName);

     // images filter formula 
     const imageFilterFormula = `OR(${players
        .map((player) => `({playerFullName (from player_name_referenced)} = '${player}')`)
        .join(',')})`;
      

      // image endpoints 
      const imageUrl = `${API_URL}tblRtJP6ThRNs7Hqd?filterByFormula=${encodeURIComponent(imageFilterFormula)}&maxRecords=${DEFAULT_PAGE_SIZE}`;
      
      // image response
      const imageResponse = await fetch(imageUrl, {
          headers: {
              Authorization: `Bearer ${API_KEY}`,
          },
      });

      // if the response is not successful, return an empty array
      if (!imageResponse.ok) {
          return { records: [], hasMore: false };
      }

      // if the response is successful then return the records
      const imageData = await imageResponse.json();
      
      // Map the player names with their corresponding images
      const playerImagesMap = imageData.records.reduce((acc, record) => {
          const playerName = record.fields['playerFullName (from player_name_referenced)'];
          const recordId = record.fields['recordid'];

          // Use the image URL or placeholder if no image found
          acc[playerName] = {
            imageUrl: record.fields.FrontalVerschraenkt ? record.fields.FrontalVerschraenkt
                : PLACEHOLDER_IMAGE, // Set to placeholder image
            recordId, 
        };
        return acc;
    }, {});

      // Map players to include images from the image table
      const dataArr = playerData.records.map((record) => {
        const playerName = record.fields.playerFullName;
        const playerImage = playerImagesMap[playerName] || { imageUrl: PLACEHOLDER_IMAGE, recordId: null };
    
        return {
            id: playerImage.recordId, // Use the image record ID
            name: playerName,
            image: playerImage.imageUrl, // Use the image URL
        };
    });
    
      return { records: dataArr, hasMore: playerData.records.length === DEFAULT_PAGE_SIZE };
  } catch (error) {
      return { records: [], hasMore: false };
  }
};


const FrontPicturePage = () => {
  // app state
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerImage, setPlayerImage] = useState(null);
  const [companyID, setCompanyID] = useState(null);

  // set the company id from localstorage
  useEffect(() => {
    const id = localStorage.getItem('company');
    setCompanyID(id);
  }, []);

  // handle image upload
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPlayerImage(e.target.files[0]);
    } else {
      setPlayerImage(null); // Reset if no file selected
    }
  };

  // handle submit
  const handleFormSubmit = async (e) => {
    setLoadingCreate(true)
    e.preventDefault();
    try {
      // set a default image url
      let imageUrl = PLACEHOLDER_IMAGE;

      // If there's a new image to upload, upload it first
      if (playerImage) {
        const formData = new FormData();
        formData.append('file', playerImage);
    
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
    
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
        }
    
        const data = await uploadResponse.json();
        imageUrl = data.image_url;
      }

      // check if there is a selected player so we can know if the request is Update or Create
      if(selectedPlayer) {
        // Fetch existing player records matching the playerFullName
        const playerFetchUrl = `${API_URL}tbl18T2ANqmt11hez?filterByFormula={playerFullName}="${selectedPlayer.name}"`;
        const playerResponse = await fetch(playerFetchUrl, {
          method: 'GET',
          headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
        });

        if (!playerResponse.ok) {
          throw new Error('Failed to fetch player records');
        }
        
        // decrypt the json data for the player
        const playerDatar = await playerResponse.json();

        // Prepare data for image table
        const imageTableData = {
          fields: {
            fileNameClean: playerName == '' ? selectedPlayer.name : playerName,
            Image: [{ url: imageUrl }],
            companyGroup: [companyID],
          },
        };

        const imageUrlR = `${API_URL}tblRtJP6ThRNs7Hqd/${selectedPlayer.id}`
       // Send data to the image table PATCH for update
       await fetch(imageUrlR, {
          method: 'PATCH' ,
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageTableData),
       });

        // Prepare data for player details table
        const playerData = {
            fields: {
                playerFullName: playerName,
                Company: [companyID],
            },
        };

        const playerUrl = `${API_URL}tbl18T2ANqmt11hez/${playerDatar.records[0].id}`
        await fetch(playerUrl, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playerData),
        });
      } else {
        const imageTableData = {
          fields: {
            fileNameClean: playerName,
            Image: [{ url: imageUrl }],
            companyGroup: [companyID],
          },
        };

        const imageUrlR = `${API_URL}tblRtJP6ThRNs7Hqd`;
        // Send data to the image table POST for create
        await fetch(imageUrlR, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(imageTableData),
        });

        // Prepare data for player details table
        const playerData = {
            fields: {
                playerFullName: playerName,
                Company: [companyID],
            },
        };

        const playerUrl = `${API_URL}tbl18T2ANqmt11hez`;
        await fetch(playerUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playerData),
        });

      }

      setPlayerName('');
      setShowModal(false);
      setPlayerImage(null);
      setSelectedPlayer(null);
      setPage(1);
    } catch (error) {
        console.error('Error saving player:', error);
    } finally {
      setLoadingCreate(false)
    }
};
      
  useEffect(() => {
    const fetchPictures = async () => {
      setLoading(true);
      const { records, hasMore } = await getAllPlayerImages(searchTerm, page);
      console.log(records)
      setPlayers((prev) => (page === 1 ? records : [...prev, ...records]));
      setHasMore(hasMore);
      setLoading(false);
    };
    fetchPictures();
  }, [searchTerm, page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const setIsOpen = () => {
    setSidebarOpen(false);
  }

  return (
    <>
      <Head>
        <title>Automadic</title>
        <meta name="description" content="Home page showing all templates" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen">
        <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col w-[80%]">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto bg-white p-6">
            <div className="container mx-auto px-4">
              <input
                type="text"
                placeholder="Type here to search for player"
                className="border p-2 w-[40%] mt-4 mb-[2rem]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset page when search term changes
                }}
              />
              <div className="w-[100%] flex justify-end">
                <button onClick={() => setShowModal(true)}  className="btnblack mb-4 rounded-full bg-[#0088ff] w-[150px] ">+ Add Player</button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-screen">
                  <div className={styles.loader} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 mt-4 ">
                    {players.sort((a, b) => {
                      const aIsEmpty = (a.image === "EMPTY RECORD" || a.image === "https://placehold.jp/150x150.png") ? 1 : 0;
                      const bIsEmpty = (b.image === "EMPTY RECORD" || b.image === "https://placehold.jp/150x150.png") ? 1 : 0;
                      return aIsEmpty - bIsEmpty;
                    }).map((player, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-100 relative">
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-full h-80 object-cover"
                      />
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg mt-2">{player.name}</h2>
                        <button 
                          onClick={() => {
                            setSelectedPlayer({
                              id: player.id,   // Ensure id is included
                              name: player.name,
                              image: player.image
                            }); // Set player to be edited
                            setShowModal(true);
                          }}
                          style={{background:'none'}}
                          className="bg-none-blue absolute top-[20px] right-[10px]"
                        >
                          <img src='/Edit-icon-images.svg' alt="Edit Icon" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>

                  {hasMore && !loading && (
                    <div className="flex justify-center mt-[2rem]">
                      <button className="btnblack" onClick={loadMore}>Load More</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-1/3">
            <form onSubmit={handleFormSubmit}>
              <div className="mb-[1rem]">
                <label className="block mb-2 text-lg font-semibold">Player Name:</label>
                <input
                  type="text"
                  value={selectedPlayer && playerName == '' ? selectedPlayer.name : playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div className="mb-[1.5rem]">
                <label className="block mb-2 text-lg font-semibold">Upload Image:</label>
                <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors duration-300 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="hidden" // Hide the default input
                    id="image-upload" // Associate label with input
                  />
                  <label htmlFor="image-upload" className="flex flex-col items-center cursor-pointer">
                    <FaUpload className="text-3xl text-gray-500 mb-2" /> {/* Upload icon */}
                    <span className="text-gray-600">Drag & Drop your image here</span>
                    <span className="text-gray-400 text-sm">or click to browse</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button 
                  type="submit" 
                  className="bg-black text-white mb-[1rem] w-[75%]"
                >
                  {selectedPlayer && !loadingCreate ? 'Update' : selectedPlayer && loadingCreate ? 'updating ...' : !selectedPlayer && loadingCreate ? 'Creating ...' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="bg-[#ff3b30] text-white mb-[1rem] w-[75%]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default FrontPicturePage;
