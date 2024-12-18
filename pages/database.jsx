import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/Home.module.css'; // Import your styles for the loader
import { FaUpload } from 'react-icons/fa';

const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;
const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';

const Database = () => {
    const [teams, setTeams] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [genderFilter, setGenderFilter] = useState(''); // State for gender filter
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [loading, setLoading] = useState(false); // Loading state
    const [showModal , setShowModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamName, setTeamName] = useState("");
    const [teamContinent,setTeamContinent] = useState('');
    const [teamLeague,setTeamLeague] = useState('');
    const [teamCountry,setTeamCountry] = useState('');
    const [teamImage, setTeamImage] = useState(null);
    const [loadingCreate, setLoadingCreate] = useState(false);


  // handle image upload
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTeamImage(e.target.files[0]);
    } else {
      setTeamImage(null); // Reset if no file selected
    }
  };

    const handleFormSubmit = async (e) => {
      setLoadingCreate(true)
      e.preventDefault();
      try {
        // set a default image url
        let imageUrl = PLACEHOLDER_IMAGE;
  
        // If there's a new image to upload, upload it first
        if (teamImage) {
          const formData = new FormData();
          formData.append('file', teamImage);
      
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

  
        // check if there is a selected team so we can know if the request is Update or Create
        if(selectedTeam) {
          // Prepare data for team details table
          const teamData = {
              fields: {
                  TeamName: teamName == '' ? selectedTeam.name : teamName,
                  Continent: teamContinent == ''? selectedTeam.Continent : teamContinent,
                  leagueName: teamLeague == ''? selectedTeam.league : teamLeague,
                  Country: teamCountry == ''? selectedTeam.Country : teamCountry,
                  logoUrl: [{ url: imageUrl }],
              },
          };
  
          const TeamUrl = `${API_URL}tblMbHeFEr9HnPWTB/${selectedTeam.id}`
          await fetch(TeamUrl, {
              method: 'PATCH',
              headers: {
                  Authorization: `Bearer ${API_KEY}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(teamData),
          });
        } else {
          // Prepare data for player details table
          const teamData = {
              fields: {
                  TeamName: teamName,
                  Continent: teamContinent,
                  leagueName: teamLeague,
                  Country: teamCountry,
                  logoUrl: [{ url: imageUrl }],
              },
          };

          const TeamUrl = `${API_URL}tblMbHeFEr9HnPWTB`
          await fetch(TeamUrl, {
              method: 'POST',
              headers: {
                  Authorization: `Bearer ${API_KEY}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(teamData),
          });
        }

        setTeamName('');
        setTeamContinent('');
        setTeamLeague('');
        setTeamCountry('');
        setShowModal(false);
        setTeamImage(null);
        setSelectedTeam(null);
        setPage(1);
      } catch (error) {
          console.error('Error saving player:', error);
      }
      finally {
        setLoadingCreate(false);
      }
    }

    const getAllTeam = async (page = 1) => {
        try {
            const pageSize = 30; // Number of records per page

            const companyID = localStorage.getItem('company');
            let filterFormula = companyID
            ? `SEARCH("${companyID}", ARRAYJOIN({companyID (from connect-companyGroup)})) > 0`
            : '';
          
            if (genderFilter && searchTerm) {
                filterFormula = filterFormula
                    ? `AND(${filterFormula}, Gender = "${genderFilter}", SEARCH(LOWER("${searchTerm}"), LOWER({TeamName})))`
                    : `AND(Gender = "${genderFilter}", SEARCH(LOWER("${searchTerm}"), LOWER({TeamName})))`;
            } else if (genderFilter) {
                filterFormula = filterFormula
                    ? `AND(${filterFormula}, Gender = "${genderFilter}")`
                    : `AND(Gender = "${genderFilter}")`;
            } else if (searchTerm) {
                filterFormula = filterFormula
                    ? `AND(${filterFormula}, SEARCH(LOWER("${searchTerm}"), LOWER({TeamName})))`
                    : `AND(SEARCH(LOWER("${searchTerm}"), LOWER({TeamName})))`;
            }

            const url = `${API_URL}tblMbHeFEr9HnPWTB?maxRecords=${pageSize}&page=${page}&filterByFormula=${encodeURIComponent(filterFormula)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            });

            if (!response.ok) {
                console.log('No records found');
                return { records: [], hasMore: false };
            }

            const data = await response.json();
            const dataArr = data.records
            .map((record) => {
                return {
                    id: record.id,
                    name: record.fields.TeamName,
                    image: record.fields.logoUrl,
                    Continent: record.fields.Continent,
                    Country: record.fields.Country,
                    league: record.fields.leagueName,
                    Gender: record.fields.Gender,
                };
            })
            .filter((item) => item !== null);
        
            return { records: dataArr, hasMore: data.records.length === pageSize };
        } catch (error) {
            console.error('Error fetching team data:', error);
            return { records: [], hasMore: false };
        }
    };


    const fetchTeams = async () => {
        setLoading(true); // Set loading to true
        const { records, hasMore } = await getAllTeam(page);
        if (page === 1) {
            setTeams(records);
        } else {
            setTeams((prevTeams) => [...prevTeams, ...records]);
        }
        setHasMore(hasMore);
        setLoading(false); // Set loading to false
    };

    useEffect(() => {
        fetchTeams(); // Fetch teams when filters or search term change
    }, [genderFilter, searchTerm, page]);

    const loadMore = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setSidebarOpen(!isSidebarOpen);
    };
  
    const setIsOpen = () => {
      setSidebarOpen(false)
    }
  

    return (
        <div className="flex h-screen">
        <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
          <div className="flex-1 flex flex-col w-[80%]">
            <Header toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
                    <Head>
                        <title>Database</title>
                        <meta name="description" content="Home page showing all teams" />
                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>

                    <div className="filters w-full flex flex-col items-center gap-4 my-4">
                        <input
                            type="text"
                            placeholder="Type team name here"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-2xl px-4 py-2 border rounded-full outline-none focus:ring-2 focus:ring-gray-300 text-gray-700 placeholder-gray-500"
                        />
                        <div className="gender-buttons flex gap-2">
                            {/* Gender Buttons */}
                            {['Men', 'Women', 'Men/Women'].map((gender) => (
                                <button
                                    key={gender}
                                    onClick={() => setGenderFilter(genderFilter === gender ? '' : gender)}
                                    className={`px-4 py-2 border rounded-full transition duration-200 ${
                                        genderFilter === gender ? 'bg-gray-300 text-white' : 'bg-white text-gray-700 border-gray-300'
                                    }`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowModal(true)}  className="btnblack mb-4 rounded-full bg-[#0088ff] w-[150px] ">+ Add Team</button>
                      </div>

                    {loading ? ( // Show loader when loading
                        <div className="flex justify-center items-center h-screen">
                            <div className={styles.loader} />
                        </div>
                    ) : (
                        <ul className='mt-5'>
                            {teams.map((team, index) => (
                                <li key={index} className='bg-white relative mb-10'>
                                    <div className="flex items-center justify-between">
                                        <div className='left-flex mb-7'>
                                            <img src={team.image} alt={team.name} />
                                            <h2 className='ml-5'>{team.name}</h2>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedTeam({
                                                    id: team.id,
                                                    name: team.name,
                                                    image: team.image,
                                                    league: team.league,
                                                    Continent: team.Continent,
                                                    Country: team.Country,
                                                    Gender: team.Gender,
                                                });
                                                setShowModal(true);
                                            }}
                                            style={{background:'none'}}
                                            className="bg-none-blue absolute top-[20px] right-[10px]"
                                            >
                                            <img src='/Edit-icon-images.svg' alt="Edit Icon" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                                        </button>
                                    </div>
                                    <hr />
                                    <div className='gridfour'>
                                        <div>
                                            <p className='gridhead text-black'>Continent</p>
                                            <p className='gridvalue'>{team.Continent}</p>
                                        </div>
                                        <div>
                                            <p className='gridhead text-black'>Country</p>
                                            <p className='gridvalue'>{team.Country}</p>
                                        </div>
                                        <div>
                                            <p className='gridhead text-black'>League Name</p>
                                            <p className='gridvalue'>{team.league}</p>
                                        </div>
                                        <div>
                                            <p className='gridhead text-black'>Gender</p>
                                            <p className='gridvaluebtn'>{team.Gender}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className='center'>
                        {hasMore && page != 1 && !loading && <button className='btnblack' onClick={loadMore}>Load More</button>}
                    </div>
                </main>
            </div>
            {showModal && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
                <div className="bg-white rounded-lg p-8 w-1/3">
                  <form onSubmit={handleFormSubmit}>
                    <div className="mb-[1rem]">
                      <label className="block mb-2 text-lg font-semibold">Team Name:</label>
                      <input
                        type="text"
                        value={selectedTeam && teamName == '' ? selectedTeam.name : teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="border p-2 w-full"
                        required
                      />
                    </div>
                    <div className="mb-[1rem]">
                      <label className="block mb-2 text-lg font-semibold">Continent:</label>
                      <input
                        type="text"
                        value={selectedTeam && teamContinent == '' ? selectedTeam.Continent : teamContinent}
                        onChange={(e) => setTeamContinent(e.target.value)}
                        className="border p-2 w-full"
                        required
                      />
                    </div>
                    <div className="mb-[1rem]">
                      <label className="block mb-2 text-lg font-semibold">Continent:</label>
                      <input
                        type="text"
                        value={selectedTeam && teamCountry == '' ? selectedTeam.Country : teamCountry}
                        onChange={(e) => setTeamCountry(e.target.value)}
                        className="border p-2 w-full"
                        required
                      />
                    </div>
                    <div className="mb-[1rem]">
                      <label className="block mb-2 text-lg font-semibold">League:</label>
                      <input
                        type="text"
                        value={selectedTeam && teamLeague == '' ? selectedTeam.league : teamLeague}
                        onChange={(e) => setTeamLeague(e.target.value)}
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
                        {selectedTeam && !loadingCreate ? 'Update' : selectedTeam && loadingCreate ? 'Updating ...' : !selectedTeam && !loadingCreate ? 'Create' : 'Creating ...'}
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

        </div>
    );
};

export default withAuth(Database);
