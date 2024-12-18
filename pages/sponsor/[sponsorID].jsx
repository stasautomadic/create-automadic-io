import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import { FaRegTrashAlt } from "react-icons/fa";

const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const DEFAULT_PAGE_SIZE = 100;
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;

const getCategories = async (page = 1) => {
  const companyID = localStorage.getItem('company');
  // Filter by company
  let filterFormula = companyID
    ? `FIND('${companyID}', {companyID (from companyGroups)}) > 0`
    : '';

  // Create the query for the filters
  const query = filterFormula
        ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
        : '';
  
      // Send the request to the sponsors Airtable endpoint
  const categoriesUrl = `${API_URL}tblphuX8Wz0898rjp?maxRecords=${DEFAULT_PAGE_SIZE}&page=${page}${query}`;
      const categoriesResponse = await fetch(categoriesUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
  
      // If the response is not successful, return an empty array
      if (!categoriesResponse.ok) {
        return { records: [], hasMore: false };
      }
  
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.records.length === 0) {
        return { records: [], hasMore: false };
      }

      const categories = categoriesData.records.map((record) => {
        return {
          id: record.id,
          name: record.fields.name_category,
        };
      });
  
      return { records: categories , hasMore: categoriesData.records.length === DEFAULT_PAGE_SIZE}
  
}


const getUsers = async () => {
  const companyID = localStorage.getItem('company');
  // Filter by company
  let filterFormula = companyID
    ? `FIND('${companyID}', {companyID (from companyGroups)}) > 0`
    : '';

  const query = filterFormula
    ? `filterByFormula=${encodeURIComponent(filterFormula)}`
    : '';

  // Send the request to the sponsors Airtable endpoint
  const userUrl = `${API_URL}tblgFvFQncHu24c9m?${query}`;

  // Fetch users by ID
  const userResponse = await fetch(userUrl, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  // If the response is not successful, return an empty array
  if (!userResponse.ok) {
    return { records: [], hasMore: false };
  }

  const userData = await userResponse.json();
  if (userData.records.length === 0) {
    return { records: [], hasMore: false };
  }

  const users = userData.records.map((record) => {
    return {
      id: record.id,
      name: record.fields.userName,
    };
  });

  return { records: users , hasMore: userData.records.length === DEFAULT_PAGE_SIZE}
}


const getMedia = async (fpSearchText , sponsorId , page = 1) => {
  const companyID = localStorage.getItem('company');
  // Filter by company
  let filterFormula = companyID
    ? `FIND('${companyID}', {companyID (from companyGroups)}) > 0`
    : '';

  if (fpSearchText) {
    const searchFilter = `SEARCH(LOWER("${fpSearchText}"), LOWER({assets_name})) > 0`;
    filterFormula = filterFormula
        ? `AND(${filterFormula}, ${searchFilter})`
        : searchFilter;
  }

  if (sponsorId) {
    const sponsorFilter = `FIND('${sponsorId}', {recordid (from sponsor_list)}) > 0`;
    filterFormula = filterFormula
        ? `AND(${filterFormula}, ${sponsorFilter})`
        : sponsorFilter;
  }

  const query = filterFormula
  ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
  : '';

  // send the request to the media airtable endpoint 
  const mediaUrl = `${API_URL}tblRjjlFjG8g81QZH?maxRecords=${DEFAULT_PAGE_SIZE}&page=${page}${query}`;
  
  // get the media response from the server
  const mediaResponse = await fetch(mediaUrl, {
      headers: {
          Authorization: `Bearer ${API_KEY}`,
      },
  });

    // If the response is not successful, return an empty array
    if (!mediaResponse.ok) {
      return { records: [], hasMore: false };
    }
  
    const mediaData = await mediaResponse.json();
    if (mediaData.records.length === 0) {
      return { records: [], hasMore: false };
    }
  
    const medias = mediaData.records.map((record) => {
      return {
        id: record.id,
        name: record.fields.assets_name,
        file: record.fields.asset_file_upload,
      };
    });
  
    return { records: medias , hasMore: mediaData.records.length === DEFAULT_PAGE_SIZE}
}

const getComunication = async (fpSearchText , sponsorId , page = 1) => {
  const companyID = localStorage.getItem('company');
  // Filter by company
  let filterFormula = companyID
    ? `FIND('${companyID}', {companyID (from companyGroups)}) > 0`
    : '';

  if (fpSearchText) {
    const searchFilter = `SEARCH(LOWER("${fpSearchText}"), LOWER({Kommunikation})) > 0`;
    filterFormula = filterFormula
        ? `AND(${filterFormula}, ${searchFilter})`
        : searchFilter;
  }

  if (sponsorId) {
    const sponsorFilter = `FIND('${sponsorId}', {recordid (from sponsor_list)}) > 0`;
    filterFormula = filterFormula
        ? `AND(${filterFormula}, ${sponsorFilter})`
        : sponsorFilter;
  }

  const query = filterFormula
  ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
  : '';

  // send the request to the comminucation airtable endpoint 
  const comminucationUrl = `${API_URL}tblCIyM5kDNPjdUwm?maxRecords=${DEFAULT_PAGE_SIZE}&page=${page}${query}`;
  
  // get the comminucation response from the server
  const comminucationResponse = await fetch(comminucationUrl, {
      headers: {
          Authorization: `Bearer ${API_KEY}`,
      },
  });

    // If the response is not successful, return an empty array
    if (!comminucationResponse.ok) {
      return { records: [], hasMore: false };
    }
  
    const comminucationData = await comminucationResponse.json();
    if (comminucationData.records.length === 0) {
      return { records: [], hasMore: false };
    }

    const userIds = new Set();

    comminucationData.records.forEach((record) => {
      (record.fields.account_manager || []).forEach((id) => userIds.add(id));
    });



    const userUrl = `${API_URL}tblgFvFQncHu24c9m?filterByFormula=OR(${[...userIds].map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const userResponse = await fetch(userUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const userData = await userResponse.json();
    const usersMap = Object.fromEntries(
      userData.records.map((record) => [
        record.id,
        {  name: record.fields.userName }
      ])
    );

    
    const comminucations = comminucationData.records.map((record) => {
      return {
        id: record.id,
        communication: record.fields.Kommunikation,
        time: record.fields.createdTime,
        writer: (record.fields.account_manager || []).map((id) => usersMap[id] || { id, name: 'Unknown' }),
      };
    });
  
    return { records: comminucations , hasMore: comminucationData.records.length === DEFAULT_PAGE_SIZE}
}


const Detail = () => {
 const [isSidebarOpen, setSidebarOpen] = useState(false);
 const [activeTab, setActiveTab] = useState('Allgemein');
 const [sponsor , setSponsor] = useState(null);
 const [showModal, setShowModal] = useState(false);
 const [showSecondModal, setShowSecondModal] = useState(false);
 const [selectedPartener,setSelectedPartener] = useState(null);
 const [partnerName, setPartnerName] = useState('');
 const [contactPerson, setContactPerson] = useState('');
 const [partnerImage, setPartnerImage] = useState('');
 const [email, setEmail] = useState('');
 const [selectedCategories, setSelectedCategories] = useState([]);
 const [selectedAssigns, setSelectedAssigns] = useState([]);
 const [categories , setCategories] = useState([]);
 const [assignOptions , setAssignedOption] = useState([]);
 const [loadingCreate, setLoadingCreate] = useState(false);
 const [companyID , setCompanyID] = useState('');
 const [searchTerm , setSearchTerm] = useState('');
 const [page, setPage] = useState(1);
 const [media, setMedia] = useState([]);
 const [communications, setCommunications] = useState([]);
 const [fileName , setFileName] = useState('');
 const [mediaImage , setMediaImage] = useState('');
 const [noteSearchTerm , setNoteSearchTerm] = useState('');
 const [note , setNote] = useState('');
 const [showThirdModal , setShowThirdModal] = useState(false);
 const [userID , setUserID] = useState('');
 const [selectedCommunication, setSelectedCommunication] = useState(null);

 const router = useRouter();
 const { sponsorID } = router.query;
 
 const toggleSidebar = () => {
   setSidebarOpen(!isSidebarOpen);
 };

 const setIsOpen = () => {
   setSidebarOpen(false)
 }

 useEffect(() => {
    const getAllMedia = async () => {
      const { records } = await getMedia(searchTerm, sponsorID, page);
      setMedia(records);
    }

    getAllMedia();
 }, [searchTerm ])


 useEffect(() => {
  const getAllCommunications = async () => {
    const { records } = await getComunication(noteSearchTerm, sponsorID, page);
    setCommunications(records);
    setSelectedCommunication(records[0]);
  }

  getAllCommunications();
}, [noteSearchTerm ])

 const fetchSingle = async () => {
  try {
    const sponsorSingleUrl = `${API_URL}tblPw9MFhuhNzSeD1/${sponsorID}`;
    const sponsorsResponse = await fetch(sponsorSingleUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    // If the response is not successful, return an empty array
    if (!sponsorsResponse.ok) {
      setSponsor(null);
      return;
    }

    const sponsorsData = await sponsorsResponse.json();

    if (!sponsorsData || Object.keys(sponsorsData).length === 0) {
      setSponsor(null);
      return;
    }

    // Extract categories and users to fetch details for each sponsor
    const categoryIds = new Set(sponsorsData.fields.connect_to_sponsor_category || []);
    const userIds = new Set(sponsorsData.fields.userTable || []);

    // Fetch categories by IDs
    const categoryUrl = `${API_URL}tblphuX8Wz0898rjp?filterByFormula=OR(${[...categoryIds].map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const categoryResponse = await fetch(categoryUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const categoryData = await categoryResponse.json();
    const categoriesMap = Object.fromEntries(
      categoryData.records.map((record) => [
        record.id,
        { id: record.id, name: record.fields.name_category },
      ])
    );

    // Fetch users by IDs
    const userUrl = `${API_URL}tblgFvFQncHu24c9m?filterByFormula=OR(${[...userIds].map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const userResponse = await fetch(userUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const userData = await userResponse.json();
    const usersMap = Object.fromEntries(
      userData.records.map((record) => [
        record.id,
        { id: record.id, name: record.fields.userName },
      ])
    );

    // Map the data to include categories and account manager details
    const sponsorData = {
      id: sponsorsData.id,
      name: sponsorsData.fields.sponsor_name,
      category: (sponsorsData.fields.connect_to_sponsor_category || []).map((id) => categoriesMap[id] || { id, name: 'Unknown' }),
      accountManager: (sponsorsData.fields.userTable || []).map((id) => usersMap[id] || { id, name: 'Unknown' }),
      contactPerson: sponsorsData.fields.contact_person,
      logo: sponsorsData.fields.sponsor_logo_url || PLACEHOLDER_IMAGE,
      assetsCreated: sponsorsData.fields.number_media_assets,
      email: sponsorsData.fields.contact_persons_email,
    };

    setSponsor(sponsorData);
  } catch (error) {
    console.log("Error fetching sponsor:", error);
    setSponsor(null);
  }
};

 useEffect(() => {
  const companyID = localStorage.getItem('company');
  const userId = localStorage.getItem('userId');
  setCompanyID(companyID)
  setUserID(userId);

  if (sponsorID) {
    fetchSingle();
  }

  const getCat = async () => {
    const { records } = await getCategories();
    setCategories(records)
  }

  const getCompanyUsers = async () => {
    const { records } = await getUsers();
    setAssignedOption(records)
  }

  getCompanyUsers()
  getCat()
}, [sponsorID]);

 const handleEdit = () => {
  setShowModal(true);
  setSelectedPartener({
    name: sponsor.name,
    contactPerson: sponsor.contactPerson,
    email: sponsor.email,
    logo: sponsor.logo
  })
  setSelectedAssigns(sponsor.accountManager)
  setSelectedCategories(sponsor.category)
 }

 const handleFormSubmit = async (e) => {
  setLoadingCreate(true)
  e.preventDefault();
  try {
    // set a default image url
    let imageUrl = PLACEHOLDER_IMAGE;

    // If there's a new image to upload, upload it first
    if (partnerImage) {
      const formData = new FormData();
      formData.append('file', partnerImage);
  
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

    // check if there is a selected sponsors so we can know if the request is Update or Create
    if(selectedPartener) {
      const category = selectedCategories.map((cat) => { 
        return cat.id;
      })

      const user = selectedAssigns.map((assign) => { 
        return assign.id;
      })


      // Prepare data for sponsor details table
      const sponsorData = {
          fields: {
            sponsor_name: partnerName ? partnerName : selectedPartener.name,
            sponsor_logo_url: imageUrl ? imageUrl : selectedPartener.logo,
            contact_person: contactPerson ? contactPerson : selectedPartener.contactPerson,
            contact_persons_email: email ? email : selectedPartener.email,
            connect_to_sponsor_category: category,
            userTable: user,
            connect_to_companyGroups: [companyID],
           },
      };

      const sponsorUrl = `${API_URL}tblPw9MFhuhNzSeD1/${sponsorID}`
      await fetch(sponsorUrl, {
          method: 'PATCH',
          headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(sponsorData),
      });
    } 

    fetchSingle()
    setPartnerName('');
    setShowModal(false);
    setPartnerImage(null);
    setSelectedPartener(null);
  } catch (error) {
    console.error('Error saving player:', error);
  } finally {
    setLoadingCreate(false)
  }
};

const handleImageUpload = (e) => {
  if (e.target.files && e.target.files[0]) {
    setPartnerImage(e.target.files[0]);
  } else {
    setPartnerImage(null);
  }
};

const handleSecondImageUpload = (e) => {
  if (e.target.files && e.target.files[0]) {
    setMediaImage(e.target.files[0]);
  } else {
    setMediaImage(null);
  }
}

const handleAssignSelect = (e) => {
  const value = e.target.value;
  const selectedAssign = assignOptions.find((assign) => assign.id === value);

  if (selectedAssign && !selectedAssigns.some(cat => cat.id === value)) {
    setSelectedAssigns([...selectedAssigns, selectedAssign]);
  }
  e.target.value = ''; // Reset the select dropdown
};

const handleCategorySelect = (e) => {
  const value = e.target.value;
  const selectedCategory = categories.find((category) => category.id === value);
  
  if (selectedCategory && !selectedCategories.some(cat => cat.id === value)) {
    setSelectedCategories([...selectedCategories, selectedCategory]);
  }
  e.target.value = ''; 
};

  // Handle removing a category
  const handleRemoveCategory = (category) => {
    setSelectedCategories(selectedCategories.filter((cat) => cat.id !== category.id));
  };
    
  // Handle removing an assignee
  const handleRemoveAssign = (assign) => {
    setSelectedAssigns(selectedAssigns.filter((item) => item.id !== assign.id));
  };


  const handleCreate = () => {
    setShowSecondModal(true);
  }

  const handleMediaFormSubmit = async (e) => {
    setLoadingCreate(true)
    e.preventDefault();
    try {
      // set a default image url
      let imageUrl = PLACEHOLDER_IMAGE;
  
      // If there's a new image to upload, upload it first
      if (mediaImage) {
        const formData = new FormData();
        formData.append('file', mediaImage);
    
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
  
        // Prepare data for media details table
        const mediaData = {
            fields: {
              assets_name: fileName,
              asset_file_upload: [{ url: imageUrl }],
              sponsor_list: [sponsorID],
              companyGroups: [companyID],
             },
        };
  
        const mediaUrl = `${API_URL}tblRjjlFjG8g81QZH`
        await fetch(mediaUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaData),
        });
  
      const { records } = await getMedia(searchTerm, sponsorID, page);
      setMedia(records);
      setFileName('');
      setShowSecondModal(false);
      setMediaImage(null);
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setLoadingCreate(false)
    }
  }


  const handleCreateNote = async (e) => {
    e.preventDefault();
    setLoadingCreate(true)
    try {

      const users = sponsor.accountManager.map((user) => { 
        return user.id;
      })

      const user = users.find(user => user.id == userID)

      const noteData = {
        fields: {
          Kommunikation: note,
          sponsor_list: [sponsorID],
          companyGroups: [companyID],
        },
      };

      const noteURL = `${API_URL}tblCIyM5kDNPjdUwm`
      await fetch(noteURL, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
      });

      setShowThirdModal(false)
      setNote('')
    } catch (e) {
      console.log(e)
    } finally {
      setLoadingCreate(false)
    }
  }

  const handleSelectCommunication = (communication) => {
    setSelectedCommunication(communication);
  };

  const handleDeleteCom = async (communication) => {
    const isConfirmed = confirm('Are you sure you want to delete this communication?');
    if (!isConfirmed) return;
    setLoadingCreate(true);
    const sponsorUrl = `${API_URL}tblCIyM5kDNPjdUwm/${communication}`
    await fetch(sponsorUrl, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const getAllCommunications = async () => {
      const { records } = await getComunication(noteSearchTerm, sponsorID, page);
      setCommunications(records);
      setSelectedCommunication(records[0]);
    }
  
    getAllCommunications();
    setLoadingCreate(false)
  }

 return (
   <>
   <Head>
    <title>Sponsors Detail</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.ico" />
  </Head>
  <div className="flex h-screen">
  <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
   <div className="flex-1 flex flex-col w-[80%]">
    <Header toggleSidebar={toggleSidebar} />
     <main className="flex-1 overflow-y-auto bg- p-6 ml-[2rem]">
        {
          sponsorID ?
            <>
               {/* Tabs */}
              <div className="flex space-x-4 mt-[1rem] border-b">
                <button
                  onClick={() => setActiveTab('Allgemein')}
                  className={`${
                    activeTab === 'Allgemein'
                      ? 'border-solid border-0 border-b-[1px] rounded-none border-blue-500 text-black p-2 bg-transparent'
                      : 'p-2 bg-transparent text-gray-500'
                  }`}
                >
                  Allgemein
                </button>
                <button
                  onClick={() => setActiveTab('Medien')}
                  className={`${
                    activeTab === 'Medien'
                      ? 'border-solid border-0 border-b-[1px] rounded-none border-blue-500 text-black p-2 bg-transparent'
                      : 'p-2 bg-transparent text-gray-500'
                  }`}
                >
                  Medien
                </button>
                <button
                  onClick={() => setActiveTab('Kommunikation')}
                  className={`${
                    activeTab === 'Kommunikation'
                      ? 'border-solid border-0 border-b-[1px] rounded-none border-blue-500 text-black p-2 bg-transparent'
                      : 'p-2 bg-transparent text-gray-500'
                  }`}
                >
                  Kommunikation
                </button>
              </div>
              {
                activeTab === 'Allgemein' && (
                  <>
                  <div className="border p-[2.5rem] rounded-lg mt-[2rem] shadow-lg bg-white">
                    <div className="flex items-center gap-[1rem]">
                      <div className="w-[150px] h-[160px] flex items-center justify-center">
                        <img style={{ objectPosition: 'center center' }} className="object-contain" src={sponsor?.logo} alt={sponsor?.name} />
                      </div>
                      <div className='ml-[2rem]'>
                            <h1 className="text-lg mb-[1rem] text-4xl text-[#152237] montserrat font-bold">{sponsor?.name}</h1>
                            <span className="text-sm font-bold bg-white border-solid border-[1px] px-2 py-1 montserrat rounded-full">
                                  {
                                    sponsor?.category.map((category, index) => (
                                      <span key={index}>
                                        {category.name}
                                        {sponsor.category && index < sponsor.category.length - 1 && ', '}
                                      </span>
                                    ))
                                  }
                            </span>
                      </div>
                    </div>
                  </div>
                  <div className='border p-[2.5rem] rounded-lg mt-[2rem] shadow-lg bg-white'>
                    <div className="mt-[2.5rem]  flex items-center justify-between">
                              <p className='font-light'>
                                <strong className='block font-semibold'>Contact Person:</strong> {sponsor?.contactPerson || '-'}
                              </p>
                              <p className='font-light'>
                                <strong className='block font-semibold'> Number of assets created:</strong> {sponsor?.assetsCreated}
                              </p>
                              <p className='font-light'>
                                <strong className='block font-semibold'>Email:</strong>{' '}
                                <a href={`mailto:${sponsor?.email}`} className="text-black">
                                  {sponsor?.email}
                                </a>
                              </p>
                              <p className='font-light'>
                                <strong className='block font-semibold'>Account Manager:</strong> 
                                {
                                  sponsor?.accountManager.map((account, index) => (
                                    <span key={index}>
                                      {account.name}
                                      {sponsor.accountManager && index < sponsor.accountManager.length - 1 && ', '}
                                    </span>
                                  ))
                                }
                              </p>
                            </div>
  
                  </div>
                  <button onClick={handleEdit} className=" mt-[2rem] w-[80px] bg-blue-500 text-white p-3 rounded-full">
                          Edit
                  </button>
                  {showModal && (
                    <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
                      <div className="bg-white rounded-lg p-8 w-1/3 h-[80%] overflow-y-scroll">
                        <form onSubmit={handleFormSubmit}>
                        <h2 className='text-center font-bold text-[1.75rem] mb-[1.5rem]'>Edit Sponsor</h2>
                          <div className="mb-[1rem]">
                            <label className="block mb-2 text-lg font-semibold">Sponsor Name:</label>
                            <input
                              type="text"
                              value={selectedPartener && partnerName == '' ? selectedPartener.name : partnerName}
                              onChange={(e) => setPartnerName(e.target.value)}
                              className="border p-2 w-full"
                              required
                            />
                          </div>
                          <div className="mb-[1.5rem]">
                            <label className="block mb-2 text-lg font-semibold">Unternehmenslogo:</label>
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
                          <div className="mb-[1rem]">
                            <label className="block mb-2 text-lg font-semibold">Ansprechpartner :</label>
                            <input
                              type="text"
                              value={selectedPartener && contactPerson == '' ? selectedPartener.contactPerson : contactPerson}
                              onChange={(e) => setContactPerson(e.target.value)}
                              className="border p-2 w-full"
                              required
                            />
                          </div>
                          <div className="mb-[1rem]">
                            <label className="block mb-2 text-lg font-semibold">Email :</label>
                            <input
                              type="text"
                              value={selectedPartener && email == '' ? selectedPartener.email : email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="border p-2 w-full"
                              required
                            />
                          </div>
                          <div className="mb-[1rem]">
                            <label className="block mb-2 text-lg font-semibold">Kategorie:</label>
                            <select onChange={handleCategorySelect} className="border p-2 w-full">
                              <option value="">Select a category</option>
                              {categories.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
  
                            {/* Display selected categories as tags */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedCategories.map((category) => (
                                <div
                                  key={category.id}
                                  className="flex items-center bg-gray-200 border-solid border-gray-200 text-black px-2 py-0 rounded-full"
                                >
                                  {category.name}
                                  <button
                                    onClick={() => handleRemoveCategory(category)}
                                    className="ml-2 text-black bg-transparent"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
  
                          {/* Assigned Dropdown with Multiple Selection */}
                          <div className="mb-[1rem]">
                            <label className="block mb-2 text-lg font-semibold">Assigned:</label>
                            <select onChange={handleAssignSelect} className="border p-2 w-full">
                              <option value="">Select an assignee</option>
                              {assignOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
  
                            {/* Display selected assigns as tags */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedAssigns.map((assign) => (
                                <div
                                  key={assign.id}
                                  className="flex items-center bg-gray-200 border-solid border-gray-200 text-black px-2 py-0 rounded-full"
                                >
                                  {assign.name}
                                  <button
                                    onClick={() => handleRemoveAssign(assign)}
                                    className="ml-2 text-black bg-transparent"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                            <div className=" w-[100%] flex justify-end">
                            <button 
                              type="button" 
                              onClick={() => {
                                setSelectedPartener(null)
                                setSelectedAssigns([])
                                setSelectedCategories([])
                                setShowModal(false)}} 
                              className="bg-[#eee] text-black  w-[25%] rounded-full"
                            >
                              Abbrechen
                            </button>
                            <button 
                              type="submit" 
                              className="bg-blue-500 text-white w-[25%] ml-2 rounded-full"
                            >
                              {selectedPartener && !loadingCreate ? 'Aktualisieren' : selectedPartener && loadingCreate ? 'Aktualisierung ...' : !selectedPartener && loadingCreate ? 'Hinzufügen ...' : 'Hinzufügen'}
                            </button>
  
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  </>
                )
              }
              {
                activeTab === 'Medien' && (
                  <>
                    <div className="mt-[3rem]">
                      {/* Search Bar */}
                      <div className="flex items-center space-x-4 mb-4">
                        <input
                          type="text"
                          placeholder="Type here to search for Media"
                          className="border rounded-full p-3 w-[80%] mt-4 mb-[2rem]"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1);
                          }}
                        />
                        <button
                          onClick={handleCreate}
                          className="mt-4 mb-[2rem] bg-blue-500 text-white p-3 rounded-full"
                        >
                          Add Media
                        </button>
                      </div>
                      {
                        media.map(med => {
                          return (
                            <div key={med.id} className='flex items-center border p-[2rem] text-lg font-bold rounded-lg mb-[2rem] shadow-lg'>
                              <div  className="w-[50%] ">
                                {med.name}
                              </div>
                              <a className='text-sm hover:underline font-bold bg-white border-solid border-[1px] px-2 py-1 montserrat rounded-full' 
                              href={`/api/download?url=${encodeURIComponent(med.file[0].url)}&filename=${encodeURIComponent(med.file[0].filename)}`} download>
                                {med.file[0].filename}
                              </a>
                            </div>
                          )
                        })
                      }
                    </div>
                    {showSecondModal && (
                      <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
                        <div className="bg-white rounded-lg p-8 w-1/3 ">
                          <form onSubmit={handleMediaFormSubmit}>
                            <h2 className='text-center font-bold text-[1.75rem] mb-[1.5rem]'>Add new Media</h2>
                            <div className="mb-[1rem]">
                              <label className="block mb-2 text-lg font-semibold">file name :</label>
                              <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="border p-2 w-full"
                                required
                              />
                            </div>
                            <div className="mb-[1.5rem]">
                              <label className="block mb-2 text-lg font-semibold">Upload File:</label>
                              <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors duration-300 cursor-pointer">
                                <input
                                  type="file"
                                  onChange={handleSecondImageUpload}
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

                            <div className=" w-[100%] flex justify-end">
                              <button 
                                type="button" 
                                onClick={() => setShowSecondModal(false)} 
                                className="bg-[#eee] text-black  w-[25%] rounded-full"
                              >
                                cancel
                              </button>
                              <button 
                                type="submit" 
                                className="bg-blue-500 text-white w-[25%] ml-2 rounded-full"
                              >
                                {loadingCreate ? 'Adding ...' : 'Add'}
                              </button>

                            </div>

                          </form>
                        </div>
                      </div>
                    )}

                  </>
                )
              }
             {
                activeTab === 'Kommunikation' && (
                  <>
                    <div className="mt-[3rem]">
                      {/* Search Bar */}
                      <div className="flex items-center space-x-4 mb-4">
                        <input
                          type="text"
                          placeholder="Type here to search for Media"
                          className="border rounded-full p-3 w-[80%] mt-4 mb-[2rem]"
                          value={noteSearchTerm}
                          onChange={(e) => {
                            setNoteSearchTerm(e.target.value)
                            setPage(1);
                          }}
                        />

                        {
                            <button
                              onClick={() => setShowThirdModal(true)}
                              className="mt-4 mb-[2rem] bg-blue-500 text-white p-3 rounded-full"
                            >
                              Neue Notiz
                            </button>
                        }
                      </div>
                      <div className="flex">
                      {/* Sidebar */}
                      <div className="w-1/4 h-screen overflow-y-auto border-r p-4">
                        {communications.map(comm => (
                          <div
                            key={comm.id}
                            className={`cursor-pointer p-4 hover:bg-gray-200 ${comm == selectedCommunication && 'bg-gray-200'}`}
                            onClick={() => handleSelectCommunication(comm)}
                          >
                            <p className="font-bold">{comm.communication}</p>
                            <button onClick={() => {
                            handleDeleteCom(comm.id)
                          }} className="p-2 text-black bg-[#fff] border-solid border-[1px] border-[#aaa] rounded-full">
                            <FaRegTrashAlt size={20} />
                          </button>

                          </div>
                        ))}
                      </div>

                      {/* Main Content Area */}
                      <div className="w-3/4 p-4">
                        {selectedCommunication ? (
                          <div>
                            <h2 className="text-2xl font-bold">{selectedCommunication.communication}</h2>
                            <p className="text-gray-600">{new Date(selectedCommunication.time).toLocaleString()}</p>
                            <p className="mt-2">{selectedCommunication.writer[0]?.name}</p>
                          </div>
                        ) : (
                          <p>Select a communication to view details</p>
                        )}
                      </div>
                    </div>

                      {showThirdModal && (
                        <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
                          <div className="bg-white rounded-lg p-8 w-1/3 ">
                            <form onSubmit={handleCreateNote}>
                              <h2 className='text-center font-bold text-[1.75rem] mb-[1.5rem]'>Add new record</h2>
                            <div className="mb-[1rem]">
                                <label className="block mb-2 text-lg font-semibold">Deine Notiz *</label>
                                <textarea
                                  type="text"
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  className="border p-2 w-full"
                                  rows='8'
                                  required
                                />
                              </div>
                              <div className=" w-[100%] flex justify-end">
                                <button 
                                  type="button" 
                                  onClick={() => setShowThirdModal(false)} 
                                  className="bg-[#eee] text-black  w-[25%] rounded-full"
                                >
                                  Abbrechen
                                </button>
                                <button 
                                  type="submit" 
                                  className="bg-blue-500 text-white w-[25%] ml-2 rounded-full"
                                >
                                  {loadingCreate ? 'Hinzufügen ...' : 'Hinzufügen'}
                                </button>

                              </div>

                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )
              }

            </> 
            : <p>Loading...</p>
        }
      </main>
    </div>
  </div>
</>
)
}

export default withAuth(Detail);