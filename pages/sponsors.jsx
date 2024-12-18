import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import { CiEdit } from "react-icons/ci";
import { MdOutlineArrowCircleRight } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaUpload } from 'react-icons/fa';
import { useRouter } from 'next/router';

const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const DEFAULT_PAGE_SIZE = 100;
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;

const getAllSponsors = async (SearchText, page = 1) => {
  try {
    // Get the company ID
    const companyID = localStorage.getItem('company');
    // Filter by company
    let filterFormula = companyID
      ? `FIND('${companyID}', {companyID (from connect_to_companyGroups)}) > 0`
      : '';

    // Check if there is a search term
    if (SearchText) {
      const searchFilter = `SEARCH(LOWER("${SearchText}"), LOWER({sponsor_name})) > 0`;
      filterFormula = filterFormula
        ? `AND(${filterFormula}, ${searchFilter})`
        : searchFilter;
    }

    // Create the query for the filters
    const query = filterFormula
      ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
      : '';

    // Send the request to the sponsors Airtable endpoint
    const sponsorsUrl = `${API_URL}tblPw9MFhuhNzSeD1?maxRecords=${DEFAULT_PAGE_SIZE}&page=${page}${query}`;
    const sponsorsResponse = await fetch(sponsorsUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    // If the response is not successful, return an empty array
    if (!sponsorsResponse.ok) {
      return { records: [], hasMore: false };
    }

    const sponsorsData = await sponsorsResponse.json();
    if (sponsorsData.records.length === 0) {
      return { records: [], hasMore: false };
    }

    // Extract categories and users to fetch details for each sponsor
    const categoryIds = new Set();
    const userIds = new Set();

    sponsorsData.records.forEach((record) => {
      (record.fields.connect_to_sponsor_category || []).forEach((id) => categoryIds.add(id));
      (record.fields.userTable || []).forEach((id) => userIds.add(id));
    });

    // Fetch categories by IDs
    const categoryUrl = `${API_URL}tblphuX8Wz0898rjp?filterByFormula=OR(${[...categoryIds].map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const categoryResponse = await fetch(categoryUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const categoryData = await categoryResponse.json();
    const categoriesMap = Object.fromEntries(
      categoryData.records.map((record) => [
        record.id,
        { id: record.id, name: record.fields.name_category }
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
        { id: record.id, name: record.fields.userName }
      ])
    );

    // Map over the records and add categories and account manager details as objects
    const sponsors = sponsorsData.records.map((record) => {
      return {
        id: record.id,
        name: record.fields.sponsor_name,
        category: (record.fields.connect_to_sponsor_category || []).map((id) => categoriesMap[id] || { id, name: 'Unknown' }),
        accountManager: (record.fields.userTable || []).map((id) => usersMap[id] || { id, name: 'Unknown' }),
        contactPerson: record.fields.contact_person,
        logo: record.fields.sponsor_logo_url || PLACEHOLDER_IMAGE,
        assetsCreated: record.fields.number_media_assets,
        email: record.fields.contact_persons_email
      };
    });

    return { records: sponsors, hasMore: sponsorsData.records.length === DEFAULT_PAGE_SIZE };
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return { records: [], hasMore: false };
  }
};

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
    ? `&filterByFormula=${encodeURIComponent(filterFormula)}`
    : '';

  // Send the request to the sponsors Airtable endpoint
  const userUrl = `${API_URL}tblgFvFQncHu24c9m?maxRecords=${DEFAULT_PAGE_SIZE}${query}`;

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

const SponsorsPage = () => {
  const [activeTab, setActiveTab] = useState('sponsors');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openInfoIndex, setOpenInfoIndex] = useState(null); // Track which sponsor is open
  const [showModal, setShowModal] = useState(false);
  const [showSecondModal , setShowSecondModal] = useState(false);
  const [selectedPartener , setSelectedPartener] = useState(null);
  const [partnerName , setPartnerName] = useState('');
  const [contactPerson , setContactPerson] = useState('');
  const [partnerImage , setPartnerImage] = useState('');
  const [email , setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAssigns, setSelectedAssigns] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [catName, setCatName] = useState('');
  const [sponsors , setSponsors] = useState([]);
  const [filteredSponsors , setFilteredSponsors] = useState([]);
  const [categories , setCategories] = useState([]);
  const [selectedFilter , setSelectedFilter] = useState(null);
  const [assignOptions , setAssignedOption] = useState([]);
  const [companyID , setCompanyID] = useState('');
  const [sponsorID , setSponsorID] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const router = useRouter();

  const handleCategorySelect = (e) => {
    const value = e.target.value;
    const selectedCategory = categories.find((category) => category.id === value);
    
    if (selectedCategory && !selectedCategories.some(cat => cat.id === value)) {
      setSelectedCategories([...selectedCategories, selectedCategory]);
    }
    e.target.value = ''; // Reset the select dropdown
  };
  
  const handleCategoryClick = (category) => {
    if (selectedFilter == category) {
      setSelectedFilter(null);  // Deselect if the same category is clicked
      setSponsors(filteredSponsors);  // Show all sponsors
    } else {
      setSelectedFilter(category);
      if(filteredSponsors.length > 0) {
        setFilteredSponsors(filteredSponsors)
      } else {
        setFilteredSponsors(sponsors)
      }
      setSponsors(
        filteredSponsors.filter(
          (sponsor) =>
            sponsor.category && 
            sponsor.category.some((cat) => cat.name.includes(category)) // Check if any category name matches
        )
      );
    }
  };
  
  // Handle adding an assignee to the selected list
  const handleAssignSelect = (e) => {
    const value = e.target.value;
    const selectedAssign = assignOptions.find((assign) => assign.id === value);

    if (selectedAssign && !selectedAssigns.some(cat => cat.id === value)) {
      setSelectedAssigns([...selectedAssigns, selectedAssign]);
    }
    e.target.value = ''; // Reset the select dropdown
  };

  // Handle removing a category
  const handleRemoveCategory = (category) => {
    setSelectedCategories(selectedCategories.filter((cat) => cat.id !== category.id));
  };
    
  // Handle removing an assignee
  const handleRemoveAssign = (assign) => {
    setSelectedAssigns(selectedAssigns.filter((item) => item.id !== assign.id));
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const setIsOpen = () => {
    setSidebarOpen(false);
  };

  const handleCreate = () => {
    setShowModal(true)
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file) {
        setImagePreview(file.name);
      }  
      setPartnerImage(e.target.files[0]);
    } else {
      setPartnerImage(null);
      setImagePreview(null);
    }
  };

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
      } else {
        // Prepare data for sponsor details table
        const category = selectedCategories.map((cat) => { 
          return cat.id;
        })

        const user = selectedAssigns.map((assign) => { 
          return assign.id;
        })


        // Prepare data for sponsor details table
        const sponsorData = {
            fields: {
              sponsor_name: partnerName,
              sponsor_logo_url: imageUrl,
              contact_person: contactPerson,
              contact_persons_email: email,
              connect_to_sponsor_category: category,
              userTable: user,
              connect_to_companyGroups: [companyID],
             },
        };

      const sponsorUrl = `${API_URL}tblPw9MFhuhNzSeD1`
      await fetch(sponsorUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sponsorData),
        });

      }
      setPage(1);

      const getSponsors = async () => {
        const { records } = await getAllSponsors(searchTerm);
        setSponsors(records)
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
      getSponsors()
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

  const handleCatFormSubmit = async (e) => {
    setLoadingCreate(true)
    e.preventDefault();
    try {
      const categoryData = {
          fields: {
            name_category: catName,
            companyGroups: [companyID],
          },
      };

      const categoryURL = `${API_URL}tblphuX8Wz0898rjp`
      await fetch(categoryURL, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
      });
      const getSponsors = async () => {
        const { records } = await getAllSponsors(searchTerm);
        setSponsors(records)
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
      getSponsors()
      setShowSecondModal(false)
    } catch (error) {
      console.error(error)  
    } finally {
      setLoadingCreate(false);
    }
  }

  const handleDeleteSponsor = async (sponsorId) => {
    const isConfirmed = confirm('Are you sure you want to delete this sponsor?');
    if (!isConfirmed) return;
    setLoadingCreate(true);
    const sponsorUrl = `${API_URL}tblPw9MFhuhNzSeD1/${sponsorId}`
    await fetch(sponsorUrl, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const getSponsors = async () => {
      const { records } = await getAllSponsors(searchTerm);
      setSponsors(records)
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
    getSponsors()
    setLoadingCreate(false);
  }

  const handleToggleInfo = (index) => {
    setOpenInfoIndex(openInfoIndex === index ? null : index);
  };

  const handleSingle = (sponsorId) => {
    router.push({
      pathname: `/sponsor/${sponsorId}`,
    });
  };


  useEffect(() => {    
    const companyID = localStorage.getItem('company');
    setCompanyID(companyID)

    const getSponsors = async () => {
      const { records } = await getAllSponsors(searchTerm);
      setSponsors(records)
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
    getSponsors()
  }, [searchTerm ])


  return (
    <div>
      <Head>
        <title>Sponsors</title>
        <meta name="description" content="Home page showing all templates" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen">
        <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col w-[80%]">
          <Header toggleSidebar={toggleSidebar} />
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <div className={styles.loader} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-white p-6 ml-[2rem]">
              {/* Tabs */}
              <div className="flex space-x-4 mt-[1rem] border-b">
                <button
                  onClick={() => setActiveTab('sponsors')}
                  className={`${
                    activeTab === 'sponsors'
                      ? 'border-solid border-0 border-b-[1px] rounded-none border-blue-500 text-black p-2 bg-transparent'
                      : 'p-2 bg-transparent text-gray-500'
                  }`}
                >
                  Sponsor Liste
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`${
                    activeTab === 'categories'
                      ? 'border-solid border-0 border-b-[1px] rounded-none border-blue-500 text-black p-2 bg-transparent'
                      : 'p-2 bg-transparent text-gray-500'
                  }`}
                >
                  Kategorien
                </button>
              </div>

              {/* Sponsors List Tab */}
              {activeTab === 'sponsors' && (
                <div className="mt-[3rem]">
                  {/* Search Bar */}
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="text"
                      placeholder="Type here to search for a Sponsor"
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
                      + Sponsor hinzufügen
                    </button>
                  </div>





{/* Filter Categories */}
<div className="flex flex-wrap gap-2 mb-[2rem]">
  {categories.map((category) => (
    <button
      key={category.name}
      onClick={() => handleCategoryClick(category.name)}
      className={`px-3 py-2 transition-all text-gray-600 text-sm rounded-lg
        ${selectedFilter == category.name 
          ? 'bg-gray-100' 
          : 'bg-transparent hover:bg-gray-50'
        }`}
    >
      {category.name}
    </button>
  ))}
</div>





                  {/* Sponsors List */}
                  {sponsors.map((sponsor, index) => (
                    <div key={index} className="border p-[2.5rem] rounded-lg mb-[2rem] shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center w-[50%]">
                          <div className="w-[90px] h-[96px] flex items-center justify-center">
                            <img
                              src={sponsor.logo}
                              alt={sponsor.name}
                              style={{ objectPosition: 'center center' }}
                              className="object-contain"
                            />
                          </div>
                          <h2 className="text-lg ml-[2rem] text-[28px] text-[#152237] montserrat font-bold">
                            {sponsor.name}
                          </h2>
                        </div>
                        <span className="text-sm font-bold bg-white border-solid border-[1px] px-2 py-1 montserrat rounded-full">
                        {
                          sponsor.category.map((category, index) => (
                            <span key={index}>
                              {category.name}
                              {sponsor.category && index < sponsor.category.length - 1 && ', '}
                            </span>
                          ))
                        }
                        </span>






                        <div className="ml-auto flex items-center gap-3">
  {/* Edit button */}
  <button 
    onClick={() => {
      setSelectedPartener({
        name: sponsor.name,
        contactPerson: sponsor.contactPerson,
        email: sponsor.email,
        logo: sponsor.logo
      })
      setSelectedAssigns(sponsor.accountManager)
      setSelectedCategories(sponsor.category)
      setSponsorID(sponsor.id)
      setShowModal(true)
    }}
    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
  >
    <CiEdit className="text-black" size={20} />
  </button>

  {/* View button */}
  <button 
    onClick={() => handleSingle(sponsor.id)} 
    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
  >
    <MdOutlineArrowCircleRight className="text-black" size={20} />
  </button>

  {/* Delete button */}
  <button 
    onClick={() => handleDeleteSponsor(sponsor.id)} 
    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
  >
    <FaRegTrashAlt className="text-black" size={20} />
  </button>






                          <button
                            onClick={() => handleToggleInfo(index)}
                            className="p-2 text-black bg-transparent"
                          >
                            {openInfoIndex === index ? (
                              <IoIosArrowUp size={20} />
                            ) : (
                              <IoIosArrowDown size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Show details with transition */}
                      <div
                        className={`transition-max-height duration-300 ease-in-out overflow-hidden ${
                          openInfoIndex === index ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="mt-[2.5rem]  flex items-center justify-between">
                          <p className='font-light'>
                            <strong className='block font-semibold'>Contact Person:</strong> {sponsor.contactPerson || '-'}
                          </p>
                          <p className='font-light'>
                            <strong className='block font-semibold'> Number of assets created:</strong> {sponsor.assetsCreated}
                          </p>
                          <p className='font-light'>
                            <strong className='block font-semibold'>Email:</strong>{' '}
                            <a href={`mailto:${sponsor.email}`} className="text-black">
                              {sponsor.email}
                            </a>
                          </p>
                          <p className='font-light'>
                            <strong className='block font-semibold'>Account Manager:</strong> 
                            {
                              sponsor.accountManager.map((account, index) => (
                                <span key={index}>
                                  {account.name}
                                  {sponsor.accountManager && index < sponsor.accountManager.length - 1 && ', '}
                                </span>
                              ))
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div className="mt-[3rem]">
                    <div className="w-[100%] flex justify-end">
                      <button onClick={() => setShowSecondModal(true)}  className="mt-4 mb-[2rem] bg-blue-500 text-white p-3 rounded-full ">Kategorie Hinzufügen</button>
                    </div>
                      {
                        categories.map((category) => (
                          <div className='border p-[2rem] text-lg font-bold rounded-lg mb-[2rem] shadow-lg'>
                            {category.name}
                          </div>
                        ))
                      }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-1/3 h-[80%] overflow-y-scroll">
            <form onSubmit={handleFormSubmit}>
            <h2 className='text-center font-bold text-[1.75rem] mb-[1.5rem]'>{selectedPartener ? "Edit Sponsor" : "Add new Sponsor"}</h2>
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
                {imagePreview && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-green-600 mb-2">{imagePreview}</p>
                  </div>
                )}
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
                  className="bg-[#eee] text-black  w-[35%] rounded-full"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-500 text-white w-[35%] ml-2 rounded-full"
                >
                  {selectedPartener && !loadingCreate ? 'Aktualisieren' : selectedPartener && loadingCreate ? 'Aktualisierung ...' : !selectedPartener && loadingCreate ? 'Hinzufügen ...' : 'Hinzufügen'}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {showSecondModal && (
        <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-1/3 ">
            <form onSubmit={handleCatFormSubmit}>
              <h2 className='text-center font-bold text-[1.75rem] mb-[1.5rem]'>Add new Category</h2>
             <div className="mb-[1rem]">
                <label className="block mb-2 text-lg font-semibold">Kategorie Bezeichnung :</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div className=" w-[100%] flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowSecondModal(false)} 
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
  );
};

export default SponsorsPage;
