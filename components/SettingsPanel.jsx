import React, { useEffect, ChangeEvent, useCallback, useState, useRef } from 'react';
import { Preview, PreviewState } from '@creatomate/preview';
import { CreateButton } from '@/components/CreateButton';
import styles from '@/styles/Home.module.css';
import { setPropertyValue } from '@/utility/setPropertyValue';
import { ensureElementVisibility } from '@/utility/ensureElementVisibility';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// get env files
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;
const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const DEFAULT_PAGE_SIZE = 50;
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';



const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '0.75rem',
        backgroundColor: 'white',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E5E7EB',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D1D5DB',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B82F6',
            borderWidth: '2px',
        },
    },
    '& .MuiInputBase-input': {
        padding: '12px 14px',
    },
};


// get all the teams with search capability
const getAllTeam = async (teamNameStartsWith, page = 1) => {
    try {
        const companyID = localStorage.getItem('company');
        let filterFormula = companyID
            ? `SEARCH("${companyID}", ARRAYJOIN({companyID (from connect-companyGroup)})) > 0`
            : '';

        if (teamNameStartsWith) {
            filterFormula = filterFormula
                ? `AND(${filterFormula}, SEARCH(LOWER("${teamNameStartsWith}"), LOWER({TeamName})))`
                : `AND(SEARCH(LOWER("${teamNameStartsWith}"), LOWER({TeamName})))`;
        }

        // get teams by the teamname
        const pageSize = 100; // Number of records per page
        const url = `${API_URL}tblMbHeFEr9HnPWTB?maxRecords=${pageSize}&page=${page}&filterByFormula=${encodeURIComponent(filterFormula)}`;

        // response from airtable
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        // if there is no records return an empty array
        if (!response.ok) {
            return { records: [], hasMore: false };
        }

        // the data returned from airtable
        const data = await response.json();
        // if there is no records return an empty array
        if (data.records.length === 0) {
            return { records: [], hasMore: false };
        } else {
            // data array variable to map over all the records from the response data and return only the one with a logourl
            const dataArr = await Promise.all(
                data.records.map(async (record) => {
                    if (record?.fields?.logoUrl) {
                        return {
                            name: record.fields.TeamName,
                            image: record.fields.logoUrl,
                            league: record.fields.CountryAndLeagueName,
                            leagueName: record.fields.leagueName, 
                            leagueLogo: null
                        };
                    }
                    return null;
                })
            );

            return { records: dataArr.filter((item) => item !== null), hasMore: data.records.length === pageSize };
        }
    } catch (error) {
        console.error(error);
        return { records: [], hasMore: false };
    }
};

// get front picture
const getFrontPicture = async (offset = '', fpStartsWith = '', pageSize = DEFAULT_PAGE_SIZE) => {
    try {

        const companyID = localStorage.getItem('company');

        // Initialize the filter formula for the companyID and the search term
        let filterFormula = companyID
            ? `FIND('${companyID}', {companyID (from companyGroup)}) > 0`
            : '';

        if (fpStartsWith) {
            filterFormula = filterFormula
                ? `AND(${filterFormula}, SEARCH('${fpStartsWith}', fileNameClean))`
                : `SEARCH('${fpStartsWith}', fileNameClean)`;
        }

        const query = filterFormula ? `&filterByFormula=${encodeURIComponent(filterFormula)}` : '';


        // create the url with the filter formula and the offset
        const url = `${API_URL}tblRtJP6ThRNs7Hqd?pageSize=${pageSize}${offset ? `&offset=${offset}` : ''}${query}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        // if there is no records return an empty array
        if (!response.ok) {
            return { data: [], offset: null };
        }
        // the data returned from airtable
        const data = await response.json();

        // data array varibale that map the data from airtable to get the name and the image 
        const dataArr = data.records.map((record) => ({
            name: record.fields.fileNameClean,
            image: record.fields.image[0].url
        }));
        return { data: dataArr, offset: data.offset };
    } catch (error) {
        return { data: [], offset: null };
    }
};

// get all players images based on the company 
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

        const escapePlayerName = (name) => {
            return name.replace(/'/g, "\\'");
           };
    
        // images filter formula 
        const imageFilterFormula = `OR(${players
            .map((player) => `({playerFullName (from player_name_referenced)} = '${escapePlayerName(player)}')`)
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

            // Use the image URL if found
            acc[playerName] = {
                imageUrl: record.fields.FrontalVerschraenkt ? record.fields.FrontalVerschraenkt
                    : PLACEHOLDER_IMAGE, // Set to placeholder image
                recordId,
            };
            return acc;
        }, {});

        // Map players to include images from the image table, filter out those without images
        const dataArr = playerData.records.map((record) => {
            const playerName = record.fields.playerFullName;
            const positionAndNumber = record.fields.positionAndNumber;
            const playerImage = playerImagesMap[playerName];

            // Only include players with images
            if (playerImage && playerImage.imageUrl) {
                const nameParts = playerName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                return {
                    positionAndNumber: positionAndNumber,
                    name: playerName,
                    firstName: firstName,
                    lastName: lastName,
                    playerImage: playerImage.imageUrl,
                };
            }
            return null; // Return null for players without images
        }).filter(Boolean); // Filter out null values

        return { records: dataArr, hasMore: playerData.records.length === DEFAULT_PAGE_SIZE };
    } catch (error) {
        return { records: [], hasMore: false };
    }
}

// Function to fetch league logo
const fetchLeagueLogo = async (leagueName) => {
    if (!leagueName) return null;
    
    try {
        const leagueUrl = `${API_URL}tblQ6T2kkI21Q6PmO?filterByFormula=${encodeURIComponent(`{ligaLogoName} = "${leagueName}"`)}`;
        const leagueResponse = await fetch(leagueUrl, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        if (leagueResponse.ok) {
            const leagueData = await leagueResponse.json();
            console.log(leagueData)
            if (leagueData.records.length > 0) {
                return leagueData.records[0].fields.AWSfilepath;
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching league logo:', error);
        return null;
    }
};

// get template name
const getTemplateName = async (id) => {
    try {
        // Initialize the filter formula for the companyID and the search term
        const filterFormula = `{creatomateTemplateID} = '${id}'`;
        const query = filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : '';

        // Create the URL with the filter formula
        const url = `${API_URL}tblvFE80QgILfVR5n${query}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        // Check if response is not ok
        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            return { data: [], offset: null };
        }

        // Parse the response data
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            return data.records[0].fields.templateNames;
        }
    } catch (error) {
        return { data: [], offset: null };
    }
};

const getSponsors = async (fpSearchText, page = 1) => {
    try {
        // Get the company ID
        const companyID = localStorage.getItem('company');
        // Filter by company
        let filterFormula = companyID
            ? `FIND('${companyID}', {companyID (from connect_to_companyGroups)}) > 0`
            : '';

        // Check if there is a search term
        if (fpSearchText) {
            const searchFilter = `SEARCH(LOWER("${fpSearchText}"), LOWER({sponsor_name})) > 0`;
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
        const categoryUrl = `${API_URL}tblphuX8Wz0898rjp?filterByFormula=OR(${Array.from(categoryIds).map(id => `RECORD_ID()='${id}'`).join(',')})`;
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
        const userUrl = `${API_URL}tblgFvFQncHu24c9m?filterByFormula=OR(${Array.from(userIds).map(id => `RECORD_ID()='${id}'`).join(',')})`;
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
                image: record.fields.sponsor_logo_url || PLACEHOLDER_IMAGE,
                assetsCreated: record.fields.number_media_assets,
                email: record.fields.contact_persons_email,
            };
        });

        return { records: sponsors, hasMore: sponsorsData.records.length === DEFAULT_PAGE_SIZE };
    } catch (error) {
        console.error("Error fetching sponsors:", error);
        return { records: [], hasMore: false };
    }
}


export const SettingsPanel = (props) => {
    // managing states
    const [frontPicture, setFrontPicture] = useState([]);
    const [fpIsLoadMore, setFpIsLoadMore] = useState(false);
    const [fpIsSearching, setFpIsSearching] = useState(false);
    const [fpSearchText, setFpSearchText] = useState('');
    const [fpOffset, setFpOffset] = useState('');
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const [frontImgPopupOpen, setFrontImgPopupOpen] = useState(false);
    const [frontImg, setFrontImg] = useState('');
    const [loadingStates, setLoadingStates] = useState({});

    const [previews, setPreviews] = useState({});
    const [teamLogos, setTeamLogos] = useState([]);
    const [teamLogoUrlLeft, setTeamLogoUrlLeft] = useState('');
    const [playerImages, setPlayerImages] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [playerImageUrls, setPlayerImageUrls] = useState({});
    const [teamLogoUrlRight, setTeamLogoUrlRight] = useState('');
    const [sponsorLogo, setSponsorLogo] = useState('');
    const [previousSponsorLogo, setPreviousSponsorLogo] = useState(null);
    const [isSponsorActive, setIsSponsorActive] = useState(true);
    const [searchText, setSearchText] = useState('');
    const modificationsRef = useRef({});
    const [textValues, setTextValues] = useState({});
    const [searchPlayeText, setSearchPlayeText] = useState('');
    const [searchSponsorText, setSearchSponsorText] = useState('');
    const [page, setPage] = useState(1);
    const [pageP, setPageP] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [hasMoreP, setHasMoreP] = useState(true);
    const [hasMoreS, setHasMoreS] = useState(true);
    const [templateNames, setTemplateNames] = useState('')
    const [selectedTemplates, setSelectedTemplates] = useState(() => {
        // Initialize all templates to true (ON) by default
        const templates = {};
        if (props.additionalPreviewRefs?.current) {
            Object.keys(props.additionalPreviewRefs.current).forEach(key => {
                templates[key] = true;
            });
        }
        return templates;
    });
    const updateTimeoutRef = useRef(null);

    const handleSponsorToggle = async (event) => {
        const checked = event.target.checked;
        setIsSponsorActive(checked);

        if (!checked) {
            setPreviousSponsorLogo(sponsorLogo);
            try {
                // Fill the sponsor logo with null in all previews
                await ensureElementVisibility(props.preview, 'Sponsor Logo', 1.5);
                await setPropertyValue(props.preview, 'Sponsor Logo', 'nu', modificationsRef.current);

                const { additionalPreviewRefs } = props;
                if (additionalPreviewRefs?.current) {
                    await Promise.all(
                        Object.keys(additionalPreviewRefs.current).map(async (key) => {
                            const preview = additionalPreviewRefs.current[key];
                            if (preview && typeof preview.loadTemplate === 'function') {
                                try {
                                    await ensureElementVisibility(preview, 'Sponsor Logo', 1.5);
                                    await setPropertyValue(preview, 'Sponsor Logo', 'nu', modificationsRef.current);
                                } catch (previewErr) {
                                    console.error('Error updating additional preview:', previewErr);
                                }
                            }
                        })
                    );
                }
            } catch (err) {
                console.error('Error deactivating sponsor logo:', err);
            }
        } else {
            // Restore the previous sponsor logo
            if (previousSponsorLogo) {
                setSponsorLogo(previousSponsorLogo);

                try {
                    await ensureElementVisibility(props.preview, 'Sponsor Logo', 1.5);
                    await setPropertyValue(props.preview, 'Sponsor Logo', previousSponsorLogo, modificationsRef.current);

                    const { additionalPreviewRefs } = props;
                    if (additionalPreviewRefs?.current) {
                        await Promise.all(
                            Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                const preview = additionalPreviewRefs.current[key];
                                if (preview && typeof preview.loadTemplate === 'function') {
                                    try {
                                        await ensureElementVisibility(preview, 'Sponsor Logo', 1.5);
                                        await setPropertyValue(preview, 'Sponsor Logo', previousSponsorLogo, modificationsRef.current);
                                    } catch (previewErr) {
                                        console.error('Error restoring sponsor logo in additional preview:', previewErr);
                                    }
                                }
                            })
                        );
                    }
                } catch (err) {
                    console.error('Error restoring sponsor logo:', err);
                }
            }
        }
    };

    // fetch Teams
    const fetchTeams = React.useCallback(async () => {
        setLoadingMore(true);
        const { records, hasMore } = await getAllTeam(searchText, page);
        console.log(records)
        setHasMore(hasMore)
        setTeamLogos(prev => [...prev, ...records]);
        setLoadingMore(false);
    }, [searchText, page]);

    // fetch player images
    const fetchPlayerImages = React.useCallback(async () => {
        setLoadingMore(true);
        const { records, hasMore } = await getAllPlayerImages(searchPlayeText, pageP);
        setHasMoreP(hasMore)
        setPlayerImages(prev => [...prev, ...records]);
        setLoadingMore(false);
    }, [searchPlayeText, pageP]);

    // fetch player images
    const fetchSponsorImages = React.useCallback(async () => {
        setLoadingMore(true);
        const { records, hasMore } = await getSponsors(searchSponsorText, pageP);
        setHasMoreS(hasMore)
        setSponsors(prev => [...prev, ...records]);
        setLoadingMore(false);
    }, [searchSponsorText, pageP]);

    // handle search for teams
    const handleSearchTeamLogo = async (event) => {
        setSearchText(event.target.value);
        setTeamLogos([]);
        setPage(1);
        await fetchTeams();
    };

    // handle search for player images
    const handleSearchPlayer = async (event) => {
        setSearchPlayeText(event.target.value);
        setPlayerImages([]);
        setPageP(1);
        await fetchPlayerImages();
    };

    // handle search sponsor
    const handleSearchSponsor = async (event) => {
        setSearchSponsorText(event.target.value)
        setSponsors([])
        setPageP(1)
        await fetchSponsorImages();
    }

        // Safari detection
        const isSafari = () => {
            const ua = navigator.userAgent.toLowerCase();
            return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
        };
    

    // handle front image select for players
    const handleFrontImage = async (event) => {
        setFrontImg(event.target.src);
        setFrontImgPopupOpen(false);
        try {
            // Handle main preview
            await ensureElementVisibility(props.preview, 'Front Image', 1.5);
            const imageUrl = isSafari() 
                ? `${event.target.src}${event.target.src.includes('?') ? '&' : '?'}cache=${Date.now()}`
                : event.target.src;
            await setPropertyValue(props.preview, 'Front Image', imageUrl, modificationsRef.current);

            // Handle all additional previews
            const { additionalPreviewRefs } = props;
            if (additionalPreviewRefs?.current) {
                // Process all previews in parallel
                await Promise.all(
                    Object.keys(additionalPreviewRefs.current).map(async (key) => {
                        const preview = additionalPreviewRefs.current[key];
                        if (preview && typeof preview.loadTemplate === 'function') {
                            try {
                                await ensureElementVisibility(preview, 'Front Image', 1.5);
                                await setPropertyValue(preview, 'Front Image', imageUrl, modificationsRef.current);
                            } catch (previewErr) {
                                console.error('Error updating additional preview:', previewErr);
                            }
                        }
                    })
                );
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // handle team logo left changes for teams
    const handleTeamLogoLeft = async (event) => {
        if (!event?.image) {
            setTeamLogoUrlLeft('');
            console.error('No image provided');
            return;
        }
        setTeamLogoUrlLeft(event.image);
        try {
            // Fetch league logo after team selection
            const leagueLogo = await fetchLeagueLogo(event.leagueName);
            
            await ensureElementVisibility(props.preview, 'teamLogoLeft', 1.5);
            
            const imageUrl = isSafari() 
                ? `${event.image}${event.image.includes('?') ? '&' : '?'}cache=${Date.now()}`
                : event.image;

            await setPropertyValue(props.preview, 'teamLogoLeft', imageUrl, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'LeagueName', 1.5);
            await setPropertyValue(props.preview, 'LeagueName', event.league, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'teamName1', 1.5);
            await setPropertyValue(props.preview, 'teamName1', event.name, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'LeagueLogo', 1.5);
            await setPropertyValue(props.preview, 'LeagueLogo', leagueLogo, modificationsRef.current);

            // Handle all additional previews
            const { additionalPreviewRefs } = props;
            if (additionalPreviewRefs?.current) {
                // Process all previews in parallel
                await Promise.all(
                    Object.keys(additionalPreviewRefs.current).map(async (key) => {
                        const preview = additionalPreviewRefs.current[key];
                        if (preview && typeof preview.loadTemplate === 'function') {
                            try {
                                await ensureElementVisibility(preview, 'teamLogoLeft', 1.5);
                                await setPropertyValue(preview, 'teamLogoLeft', imageUrl, modificationsRef.current);
                                await ensureElementVisibility(preview, 'teamName1', 1.5);
                                await setPropertyValue(preview, 'teamName1', event.name, modificationsRef.current);                    
                                await ensureElementVisibility(preview, 'LeagueName', 1.5);
                                await setPropertyValue(preview, 'LeagueName', event.league, modificationsRef.current);
                                await ensureElementVisibility(preview, 'LeagueLogo', 1.5);
                                await setPropertyValue(preview, 'LeagueLogo', leagueLogo, modificationsRef.current);
                            } catch (previewErr) {
                                console.error('Error updating additional preview:', previewErr);
                            }
                        }
                    })
                );
            }
        } catch (err) {
            console.error('Error :', err);
        }
    };

    // handle team logo right changes for teams
    const handleTeamLogoRight = async (event) => {
        try {
            if (!event?.image) {
                setTeamLogoUrlRight('');
                return;
            }

            setTeamLogoUrlRight(event.image);
            
            // Fetch league logo after team selection
            const leagueLogo = await fetchLeagueLogo(event.leagueName);
            console.log(leagueLogo)
            await ensureElementVisibility(props.preview, 'teamLogoRight', 1.5);
            
            const imageUrl = isSafari() 
                ? `${event.image}${event.image.includes('?') ? '&' : '?'}cache=${Date.now()}`
                : event.image;
            
            await setPropertyValue(props.preview, 'teamLogoRight', imageUrl, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'LeagueName', 1.5);
            await setPropertyValue(props.preview, 'LeagueName', event.league, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'teamName1', 1.5);
            await setPropertyValue(props.preview, 'teamName1', event.name, modificationsRef.current);
            await ensureElementVisibility(props.preview, 'LeagueLogo', 1.5);
            await setPropertyValue(props.preview, 'LeagueLogo', leagueLogo, modificationsRef.current);

            const { additionalPreviewRefs } = props;
            if (additionalPreviewRefs?.current) {
                await Promise.all(
                    Object.keys(additionalPreviewRefs.current).map(async (key) => {
                        const preview = additionalPreviewRefs.current[key];
                        if (preview && typeof preview.loadTemplate === 'function') {
                            try {
                                await ensureElementVisibility(preview, 'teamLogoRight', 1.5);
                                await setPropertyValue(preview, 'teamLogoRight', imageUrl, modificationsRef.current);
                                await ensureElementVisibility(props.preview, 'LeagueName', 1.5);
                                await setPropertyValue(props.preview, 'LeagueName', event.league, modificationsRef.current);
                                await ensureElementVisibility(props.preview, 'teamName1', 1.5);
                                await setPropertyValue(props.preview, 'teamName1', event.name, modificationsRef.current);
                                await ensureElementVisibility(preview, 'LeagueLogo', 1.5);
                                await setPropertyValue(preview, 'LeagueLogo', leagueLogo, modificationsRef.current);
                            } catch (previewErr) {
                                console.error('Error updating additional preview:', previewErr);
                            }
                        }
                    })
                );
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // handle file upload
    const handleFileChange = (sourceName) => async (e) => {
        setLoadingStates(prev => ({ ...prev, [sourceName]: true }));
        const selectedFile = e.target.files ? e.target.files[0] : null;
        if (!selectedFile) return;

        setPreviews(prevPreviews => ({ ...prevPreviews, [sourceName]: selectedFile ? URL.createObjectURL(selectedFile) : null }));

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            console.log(res)
            if (res.ok) {
                const resData = await res.json();
                    try {
                        const proxyUrl = `https://rss-scraper.automadic.io/api/proxy-image?url=${encodeURIComponent(resData.image_url)}`;
                        await ensureElementVisibility(props.preview, sourceName, 1.5);
                        await setPropertyValue(props.preview, sourceName, proxyUrl, modificationsRef.current);
                        const { additionalPreviewRefs } = props;
                        if (additionalPreviewRefs?.current) {
                            // Process all previews in parallel
                            await Promise.all(
                                Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                    const preview = additionalPreviewRefs.current[key];
                                    if (preview && typeof preview.loadTemplate === 'function') {
                                        try {
                                            await ensureElementVisibility(preview, sourceName, 1.5);
                                            await setPropertyValue(preview, sourceName, proxyUrl, modificationsRef.current);
                                        } catch (previewErr) {
                                            console.error('Error updating additional preview:', previewErr);
                                        }
                                    }
                                })
                            );
                        }

                    } catch (err) {
                        console.error('Error:', err);
                    } finally {
                        setLoadingStates(prev => ({ ...prev, [sourceName]: false }));
                    }
            } else {
                alert('File upload failed');
                setLoadingStates(prev => ({ ...prev, [sourceName]: false }));
            }
        } catch (error) {
            console.error('Error:', error);
            setLoadingStates(prev => ({ ...prev, [sourceName]: false }));
        }
    };


    const handleSponsors = async (event, n) => {
        if (!n?.image) {
            setSponsorLogo('');
            console.error('No image provided');
            return;
        }

        setSponsorLogo(n.image);

        try {
            // Download the image file
            const imageResponse = await fetch(n.image);
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch image');
            }

            const imageBlob = await imageResponse.blob();
            const imageFile = new File([imageBlob], 'sponsor-logo.png', { type: 'image/png' });

            // Create FormData and append the file
            const formData = new FormData();
            formData.append('file', imageFile);

            // Show loading state while uploading
            setLoadingStates(prev => ({ ...prev, ['Sponsor Logo']: true }));

            // Upload the image
            const uploadRes = await fetch('https://rss-scraper.automadic.io/api/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (uploadRes.ok) {
                const resData = await uploadRes.json();
                if (resData.image_url) {
                    // Once uploaded, set the image URL to the preview
                    await ensureElementVisibility(props.preview, 'Sponsor Logo', 1.5);
                    
                    const imageUrl = isSafari() 
                        ? `${resData.image_url}${resData.image_url.includes('?') ? '&' : '?'}cache=${Date.now()}`
                        : resData.image_url;

                    await setPropertyValue(props.preview, 'Sponsor Logo', imageUrl, modificationsRef.current);
                    
                    const { additionalPreviewRefs } = props;
                    if (additionalPreviewRefs?.current) {
                        // Process all previews in parallel
                        await Promise.all(
                            Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                const preview = additionalPreviewRefs.current[key];
                                if (preview && typeof preview.loadTemplate === 'function') {
                                    try {
                                        await ensureElementVisibility(preview, 'Sponsor Logo', 1.5);
                                        await setPropertyValue(preview, 'Sponsor Logo', imageUrl, modificationsRef.current);
                                    } catch (previewErr) {
                                        console.error('Error updating additional preview:', previewErr);
                                    }
                                }
                            })
                        );
                    }
                }
            } else {
                alert('File upload failed');
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoadingStates(prev => ({ ...prev, ['Sponsor Logo']: false }));
        }
    };

    // fetch player pictures from airtable
    const fetchPictures = async (isSearch = false, resetSearch = false) => {
        setFpIsLoadMore(true);
        let offset = fpOffset;
        if (isSearch && fpOffset) {
            offset = '';
        }

        let searchTxt = fpSearchText;
        if (resetSearch) {
            searchTxt = '';
        }
        const { data, offset: newOffset } = await getFrontPicture(offset, searchTxt, pageSize);
        setFpOffset(newOffset);
        setFrontPicture((prev) => [...prev, ...data]);
        setFpIsSearching(false);
        setFpIsLoadMore(false);
    };

    // handle search for player images
    const handleFpSearch = async () => {
        setFpOffset('');
        setFrontPicture([]);
        setFpIsSearching(true);
        fetchPictures(true, false);
    };

    // Reset the search for player images
    const handleResetFpSearch = async () => {
        setFpOffset('');
        setFpSearchText('');
        setFrontPicture([]);
        setFpIsSearching(true);
        fetchPictures(true, true);
    };

    // Initialize state for text values
    const setInitialValues = useCallback(() => {
        if (props.currentState?.elements) {
            const initialValues = {};
            props.currentState.elements.forEach((element) => {
                if (element.source.type === 'text') {
                    initialValues[element.source.name] = element.source.text;
                }
            });
            setTextValues(initialValues);
        }
    }, [props.currentState]);

    useEffect(() => {
        setInitialValues();
    }, [setInitialValues]);

    useEffect(() => {
        // Initialize selectedTemplates with all templates set to true
        if (props.additionalPreviewRefs?.current) {
            const initialSelectedState = {};
            Object.keys(props.additionalPreviewRefs.current).forEach(key => {
                initialSelectedState[key] = true;
            });
            setSelectedTemplates(initialSelectedState);
        }
    }, [props.additionalPreviewRefs]);

    const handleTemplateToggle = (templateKey) => {
        setSelectedTemplates(prev => ({
            ...prev,
            [templateKey]: !prev[templateKey]
        }));
    };

    const getSelectedPreviewRefs = () => {
        const selected = {};
        Object.keys(selectedTemplates).forEach(key => {
            if (selectedTemplates[key]) {
                selected[key] = props.additionalPreviewRefs.current[key];
            }
        });
        return { current: selected };
    };

    // Function to handle text changes and reset if input is cleared
    const handleTextChange = (name) => (event) => {
        const value = event.target.value;
        setTextValues((prev) => ({ ...prev, [name]: value }));
        
        // Debounce the preview update to prevent rapid re-renders
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                await ensureElementVisibility(props.preview, name, 1.5);
                await setPropertyValue(props.preview, name, value, modificationsRef.current);
                
                const { additionalPreviewRefs } = props;
                if (additionalPreviewRefs?.current) {
                    await Promise.all(
                        Object.keys(additionalPreviewRefs.current).map(async (key) => {
                            const preview = additionalPreviewRefs.current[key];
                            if (preview && typeof preview.loadTemplate === 'function') {
                                try {
                                    await ensureElementVisibility(preview, name, 1.5);
                                    await setPropertyValue(preview, name, value, modificationsRef.current);
                                } catch (previewErr) {
                                    console.error('Error updating additional preview:', previewErr);
                                }
                            }
                        })
                    );
                }
            } catch (err) {
                console.error('Error updating text:', err);
            }
        }, 300); // 300ms debounce delay
    };

    // get teams and player images as well as the front pictures at the first load 
    useEffect(() => {
        getAllTeam('').then((resp) => {
            setTeamLogos(resp.records);
        });
        getAllPlayerImages('').then((resp) => {
            setPlayerImages(resp.records);
        });
        getSponsors('').then((resp) => {
            setSponsors(resp.records);
        });
        fetchPictures();
        getTemplateName(props.id).then((resp) => {
            setTemplateNames(resp)
        });
    }, []);

    const handleLoadMoreP = () => {
        setPageP(prev => prev + 1);
    }

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    }

    const handlePlayerImage = async (number, event) => {

        if (!event?.playerImage) {
            setPlayerImageUrls(prev => ({ ...prev, [number]: '' }));
            console.error('No image provided');
            return;
        }

        setPlayerImageUrls(prev => ({ ...prev, [number]: event.playerImage }));
        try {
            await ensureElementVisibility(props.preview, `playerImage${number}`, 1.5);
            const imageUrl = isSafari() 
                ? `${event.playerImage}${event.playerImage.includes('?') ? '&' : '?'}cache=${Date.now()}`
                : event.playerImage;
            await setPropertyValue(props.preview, `playerImage${number}`, imageUrl, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playerNumber${number}`, 1.5);
            await setPropertyValue(props.preview, `playerNumber${number}`, event.positionAndNumber, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playername${number}`, 1.5);
            await setPropertyValue(props.preview, `playername${number}`, event.name, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playerfirstname${number}`, 1.5);
            await setPropertyValue(props.preview, `playerfirstname${number}`, event.firstName, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playerlastname${number}`, 1.5);
            await setPropertyValue(props.preview, `playerlastname${number}`, event.lastName, modificationsRef.current);

            const { additionalPreviewRefs } = props;
            if (additionalPreviewRefs?.current) {
                // Process all previews in parallel
                await Promise.all(
                    Object.keys(additionalPreviewRefs.current).map(async (key) => {
                        const preview = additionalPreviewRefs.current[key];
                        if (preview && typeof preview.loadTemplate === 'function') {
                            try {
                                await ensureElementVisibility(preview, `playerImage${number}`, 1.5);
                                await setPropertyValue(preview, `playerImage${number}`, imageUrl, modificationsRef.current);
                                await ensureElementVisibility(preview, `playerNumber${number}`, 1.5);
                                await setPropertyValue(preview, `playerNumber${number}`, event.positionAndNumber, modificationsRef.current);
                                await ensureElementVisibility(preview, `playername${number}`, 1.5);
                                await setPropertyValue(preview, `playername${number}`, event.name, modificationsRef.current);
                                await ensureElementVisibility(preview, `playerfirstname${number}`, 1.5);
                                await setPropertyValue(preview, `playerfirstname${number}`, event.firstName, modificationsRef.current);
                                await ensureElementVisibility(preview, `playerlastname${number}`, 1.5);
                                await setPropertyValue(preview, `playerlastname${number}`, event.lastName, modificationsRef.current);                    
                            } catch (previewErr) {
                                console.error('Error updating additional preview:', previewErr);
                            }
                        }
                    })
                );
            }

        } catch (err) {
            console.error('Error:', err);
        }
    };

    const PlayerImageComponent = ({ number }) => (
        <div>
            <Autocomplete
                id={`player-image-${number}`}
                sx={{ marginTop: '20px' }}
                options={playerImages}
                autoHighlight
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                    handlePlayerImage(number, newValue ? newValue : '');
                }}
                onKeyUp={(event) => {
                    handleSearchPlayer(event);
                }}
                renderOption={(props, option, { index }) => {
                    if (index === playerImages.length) {
                        // Render Load More button as the last option
                        return (
                            <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    onClick={handleLoadMoreP}
                                    disabled={loadingMore}
                                    style={{ width: '100%' }}
                                >
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </Button>
                            </Box>
                        );
                    }

                    return (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                            <img loading="lazy" width="20" srcSet={option.playerImage} src={option.playerImage} alt="" />
                            {option.name}
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={`Select Player Image ${number}`}
                        inputProps={{
                            ...params.inputProps,
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: 'false'
                        }}
                    />
                )}
            />
            {playerImageUrls[number] && (
                <img
                    src={playerImageUrls[number] ?? 'https://placehold.co/416x277.png?text=No%20image'}
                    className="img-preview"
                />
            )}
        </div>
    );

    const renderedElements = new Set();
    let elements;
    if (props.preview.state?.elements.length > 1) {
        elements = props.preview.state.elements;
    } else if (props.preview.state.elements[0].elements.length > 0) {
        elements = props.preview.state.elements[0].elements;
    }

    console.log(elements);

    return (
        <div>
            <CreateButton
                templateNames={templateNames}
                additionalPreviewRefs={getSelectedPreviewRefs()}
                preview={props.preview}
            />
            <div className={styles.group}>
                {elements.map((element) => {
                    if (!element.source.name) return null;
                    const playerImageMatch = element.source.name && element.source.name.match(/^playerImage(\d+)$/);

                    switch (element.source.type) {
                        case 'text':
                            return (
                                <div key={element.source.id}>
                                    <label className={styles.formLabel}>{element.source.name}</label>
                                    <TextField
                                        style={{ width: '100%' }}
                                        value={textValues[element.source.name] || ''}
                                        onFocus={async () => {
                                            await ensureElementVisibility(props.preview, element.source.name, 1.5);
                                            const { additionalPreviewRefs } = props;
                                            if (additionalPreviewRefs?.current) {
                                                // Process all previews in parallel
                                                await Promise.all(
                                                    Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                                        const preview = additionalPreviewRefs.current[key];
                                                        if (preview && typeof preview.loadTemplate === 'function') {
                                                            try {
                                                                await ensureElementVisibility(preview, element.source.name, 1.5);
                                                            } catch (previewErr) {
                                                                console.error('Error updating additional preview:', previewErr);
                                                            }
                                                        }
                                                    })
                                                );
                                            }
                                        }}
                                        onChange={handleTextChange(element.source.name)}
                                        multiline
                                        sx={textFieldStyle}  // Add this line
                                        placeholder={element.source.name}
                                    />
                                </div>
                            );
                        case 'image':
                        case 'video':
                            if (element.source.name == "Front Image") {
                                return (
                                    <>
                                        <label className={styles.formLabel}>Front Image</label>
                                        <Button variant="outlined" onClick={() => setFrontImgPopupOpen(true)} sx={{ display: "block" }}>Select Image</Button>
                                        {
                                            (frontImg) ? <img src={frontImg} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                        }
                                    </>
                                )
                            }
                            else if (element.source.name === 'Sponsor Logo' && !renderedElements.has('Sponsor Logo')) {
                                // Add 'Sponsor Logo' to the Set after rendering
                                renderedElements.add('Sponsor Logo');

                                return (
                                    <>
                                        <Autocomplete
                                            id="sponsor-image"
                                            sx={{
                                                marginTop: '20px',
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '2px 4px',
                                                    borderRadius: '0.75rem',
                                                    backgroundColor: 'white',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#E5E7EB',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#D1D5DB',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#3B82F6',
                                                        borderWidth: '2px',
                                                    },
                                                },
                                                '& .MuiAutocomplete-option': {  
                                                    '&:hover': {
                                                        backgroundColor: '#3B82F6 !important', 
                                                        color: 'white !important',
                                                    },
                                                    '&[aria-selected="true"]': {
                                                        backgroundColor: '#3B82F6 !important',
                                                        color: 'white !important',
                                                    },
                                                },
                                            }}
                                            options={sponsors}
                                            autoHighlight
                                            getOptionLabel={(option) => option.name}
                                            onChange={(event, newValue) => {
                                                handleSponsors(event, newValue ? newValue : '');
                                            }}
                                            renderOption={(props, option) => (
                                                <Box
                                                    component="li"
                                                    {...props}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        padding: '8px 16px',
                                                    }}
                                                >
                                                    <img
                                                        loading="lazy"
                                                        width="24"
                                                        height="24"
                                                        src={option.image}
                                                        alt=""
                                                        style={{ objectFit: 'contain' }}
                                                    />
                                                    {option.name}
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select a sponsor logo"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                        autoCorrect: 'off',
                                                        autoCapitalize: 'off',
                                                        spellCheck: 'false'
                                                    }}
                                                />
                                            )}
                                        />
                                        {sponsorLogo && (
                                            <img
                                                src={sponsorLogo ?? 'https://placehold.co/416x277.png?text=No%20image'}
                                                className="img-preview"
                                            />
                                        )}
                                    <div style={{ marginTop: '10px' }}>
                                         <label style={{display: "flex", alignItems: "center"}}>
                                            <input
                                                style={{margin: '0 12px 0 0', width: 'fit-content'}}
                                                type="checkbox"
                                                checked={isSponsorActive}
                                                onChange={handleSponsorToggle}
                                            />
                                            Show Sponsor Logo
                                        </label>
                                    </div>
                                    </>
                                )
                            }

                            else if (element.source.name == "teamLogoLeft") {
                                return (
                                    <>
                                        <Autocomplete
                                            id="team-logo-left"
                                            sx={{ marginTop: "20px" }}
                                            options={teamLogos}
                                            autoHighlight
                                            getOptionLabel={(option) => option.name}
                                            onChange={(event, newValue) => {
                                                handleTeamLogoLeft(newValue ? newValue : '');
                                            }}
                                            onKeyUp={(event) => {
                                                handleSearchTeamLogo(event);
                                            }}
                                            renderOption={(props, option, { index }) => {
                                                if (index === teamLogos.length) {
                                                    // Render Load More button as the last option
                                                    return (
                                                        <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                            <Button
                                                                onClick={handleLoadMore}
                                                                disabled={loadingMore}
                                                                style={{ width: '100%' }}
                                                            >
                                                                {loadingMore ? 'Loading...' : 'Load More'}
                                                            </Button>
                                                        </Box>
                                                    );
                                                }

                                                return (
                                                    <Box
                                                        component="li"
                                                        sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                                        {...props}
                                                    >
                                                        <img
                                                            loading="lazy"
                                                            width="20"
                                                            srcSet={option.image}
                                                            src={option.image}
                                                            alt=""
                                                        />
                                                        {option.name}
                                                    </Box>
                                                );
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Select Team Logo Left"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                        autoCorrect: 'off',
                                                        autoCapitalize: 'off',
                                                        spellCheck: 'false'
                                                    }}
                                                />
                                            )}
                                        />

















                                        {teamLogoUrlLeft && <img src={teamLogoUrlLeft} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' />}
                                    </>
                                )
                            } else if (element.source.name == "teamLogoRight") {
                                return (
                                    <>
                                        <Autocomplete
                                            id="team-logo-right"
                                            sx={{ marginTop: "20px" }}
                                            options={teamLogos}
                                            autoHighlight
                                            getOptionLabel={(option) => option.name}
                                            onChange={(event, newValue) => {
                                                handleTeamLogoRight(newValue ? newValue : '');
                                            }}
                                            onKeyUp={(event) => {
                                                handleSearchTeamLogo(event)
                                            }}
                                            renderOption={(props, option, { index }) => {
                                                if (index === teamLogos.length) {
                                                    // Render Load More button as the last option
                                                    return (
                                                        <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                            <Button
                                                                onClick={handleLoadMore}
                                                                disabled={loadingMore}
                                                                style={{ width: '100%' }}
                                                            >
                                                                {loadingMore ? 'Loading...' : 'Load More'}
                                                            </Button>
                                                        </Box>
                                                    );
                                                }

                                                return (
                                                    <Box
                                                        component="li"
                                                        sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                                        {...props}
                                                    >
                                                        <img
                                                            loading="lazy"
                                                            width="20"
                                                            srcSet={option.image}
                                                            src={option.image}
                                                            alt=""
                                                        />
                                                        {option.name}
                                                    </Box>
                                                );
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Select Team Logo Right"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                        autoCorrect: 'off',
                                                        autoCapitalize: 'off',
                                                        spellCheck: 'false'
                                                    }}
                                                />
                                            )}
                                        />
                                        {teamLogoUrlRight && <img src={teamLogoUrlRight} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' />}
                                    </>
                                )
                            }
                            else if (playerImageMatch) {
                                const number = playerImageMatch[1]; // Extract the number from playerImage
                                return (
                                    <PlayerImageComponent
                                        number={number}
                                    />
                                );
                            }





                            else {
                                return (
                                    <>
                                        <label className={`${styles.formLabel}`}>{element.source.name}</label>
                                        {loadingStates[element.source.name] && <CircularProgress size={24} />}
                                        <TextField
                                            type="file"
                                            fullWidth
                                            variant="outlined"
                                            onChange={handleFileChange(element.source.name)}
                                            sx={textFieldStyle}
                                            InputProps={{
                                                startAdornment: (
                                                    <input
                                                        type="file"
                                                        style={{ display: 'none' }}
                                                        id={`file-input-${element.source.name}`}
                                                        onChange={handleFileChange(element.source.name)}
                                                    />
                                                ),
                                            }}
                                        />
                                        {(previews[element.source.name] ?? "") &&
                                            <img src={previews[element.source.name] ?? ""} alt="Preview" width={100} />
                                        }
                                    </>
                                );
                            }




                        case "composition":
                            return (
                                <div key={element.source.id}>
                                    {element?.elements?.map((el) => {
                                        if (!element.source.name) return null;
                                        const playeImageMatch = element.source.name && element.source.name.match(/^playerImage(\d+)$/);
                                        switch (element.source.type) {
                                            case 'text':
                                                return (
                                                    <div key={element.source.id}>
                                                        <label className={styles.formLabel}>{element.source.name}</label>
                                                        <textarea
                                                            value={element.source.text}
                                                            onFocus={async () => {
                                                                const { additionalPreviewRefs } = props;
                                                                if (additionalPreviewRefs?.current) {
                                                                    // Process all previews in parallel
                                                                    await Promise.all(
                                                                        Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                                                            const preview = additionalPreviewRefs.current[key];
                                                                            if (preview && typeof preview.loadTemplate === 'function') {
                                                                                try {
                                                                                    await ensureElementVisibility(preview, element.source.name, 1.5);
                                                                                } catch (previewErr) {
                                                                                    console.error('Error updating additional preview:', previewErr);
                                                                                }
                                                                            }
                                                                        })
                                                                    );
                                                                }
                                                                await ensureElementVisibility(props.preview, element.source.name, 1.5);
                                                            }}
                                                            onChange={async (e) => {
                                                                const { additionalPreviewRefs } = props;
                                                                if (additionalPreviewRefs?.current) {
                                                                    // Process all previews in parallel
                                                                    await Promise.all(
                                                                        Object.keys(additionalPreviewRefs.current).map(async (key) => {
                                                                            const preview = additionalPreviewRefs.current[key];
                                                                            if (preview && typeof preview.loadTemplate === 'function') {
                                                                                try {
                                                                                    await setPropertyValue(preview, element.source.name, e.target.value, modificationsRef.current);
                                                                                } catch (previewErr) {
                                                                                    console.error('Error updating additional preview:', previewErr);
                                                                                }
                                                                            }
                                                                        })
                                                                    );
                                                                }
                                                                await setPropertyValue(props.preview, element.source.name, e.target.value, modificationsRef.current);
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            case 'image':
                                            case 'video':
                                                if (element.source.name === "Front Image") {
                                                    return (
                                                        <>
                                                            <label className={styles.formLabel}>Front Image</label>
                                                            <Button variant="outlined" onClick={() => setFrontImgPopupOpen(true)} sx={{ display: "block" }}>Select Image</Button>
                                                            {
                                                                (frontImg) ? <img src={frontImg} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                                            }
                                                        </>
                                                    )

                                                } else if (playeImageMatch) {
                                                    const number = playeImageMatch[1];
                                                    return (
                                                        <PlayerImageComponent
                                                            number={number}
                                                        />
                                                    );
                                                } else if (element.source.name === "teamLogoLeft") {
                                                    return (
                                                        <>
                                                            <Autocomplete
                                                                id="team-logo-left"
                                                                sx={{ marginTop: "20px" }}
                                                                options={teamLogos}
                                                                autoHighlight
                                                                getOptionLabel={(option) => option.name}
                                                                onChange={(event, newValue) => {
                                                                    handleTeamLogoLeft(newValue)
                                                                }}
                                                                onKeyUp={(event) => {
                                                                    handleSearchTeamLogo(event)
                                                                }}
                                                                renderOption={(props, option) => (
                                                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <img loading="lazy" width="20" srcSet={option.image} src={option.image} alt="" />
                                                                        {option.name}
                                                                    </Box>
                                                                )}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label="Select Team Logo Left"
                                                                        inputProps={{
                                                                            ...params.inputProps,
                                                                            autoComplete: 'off',
                                                                            autoCorrect: 'off',
                                                                            autoCapitalize: 'off',
                                                                            spellCheck: 'false'
                                                                        }}
                                                                    />
                                                                )}
                                                            />

                                                            {
                                                                (teamLogoUrlLeft) ? <img src={teamLogoUrlLeft} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                                            }

                                                        </>
                                                    )
                                                } else if (element.source.name === "teamLogoRight") {
                                                    return (
                                                        <>
                                                            <Autocomplete
                                                                id="team-logo-right"
                                                                sx={{ marginTop: "20px" }}
                                                                options={teamLogos}
                                                                autoHighlight
                                                                getOptionLabel={(option) => option.name}
                                                                onChange={(event, newValue) => {
                                                                    handleTeamLogoRight(newValue);
                                                                }}
                                                                onKeyUp={(event) => {
                                                                    handleSearchTeamLogo(event)
                                                                }}
                                                                renderOption={(props, option) => (
                                                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <img loading="lazy" width="20" srcSet={option.image} src={option.image} alt="" />
                                                                        {option.name}
                                                                    </Box>
                                                                )}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label="Select Team Logo Right"
                                                                        inputProps={{
                                                                            ...params.inputProps,
                                                                            autoComplete: 'off',
                                                                            autoCorrect: 'off',
                                                                            autoCapitalize: 'off',
                                                                            spellCheck: 'false'
                                                                        }}
                                                                    />
                                                                )}
                                                            />
                                                            {
                                                                (teamLogoUrlRight) ? <img src={teamLogoUrlRight} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                                            }
                                                        </>
                                                    )

                                                }







                                                else {
                                                    return (
                                                        <>
                                                            <label className={`${styles.formLabel}`}>{element.source.name}</label>
                                                            {loadingStates[element.source.name] && <CircularProgress size={24} />}
                                                            <div style={{ position: 'relative' }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    component="label"
                                                                    sx={{
                                                                        borderRadius: '4px 0 0 4px',
                                                                        borderRight: 'none',
                                                                        backgroundColor: '#fff',
                                                                        color: '#000',
                                                                        '&:hover': {
                                                                            backgroundColor: '#f5f5f5',
                                                                            borderRight: 'none'
                                                                        }
                                                                    }}
                                                                >
                                                                    Choose file
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        onChange={handleFileChange(element.source.name)}
                                                                    />
                                                                </Button>
                                                                <TextField
                                                                    disabled
                                                                    variant="outlined"
                                                                    value={previews[element.source.name] ? element.source.name : "No file chosen"}
                                                                    sx={{
                                                                        display: 'inline-block',
                                                                        width: 'calc(100% - 107px)',
                                                                        '& .MuiOutlinedInput-root': {
                                                                            borderRadius: '0 4px 4px 0',
                                                                            backgroundColor: '#fff',
                                                                        },
                                                                        '& .MuiInputBase-input': {
                                                                            padding: '8.5px 14px',
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {(previews[element.source.name] ?? "") &&
                                                                <img src={previews[element.source.name] ?? ""} alt="Preview" width={100} />
                                                            }
                                                        </>
                                                    );
                                                }













                                            default:
                                                return null;
                                        }
                                    })}
                                </div>
                            );
                        default:
                            return null;
                    }
                })}
            {props.additionalPreviewRefs?.current && (
                <div className={styles.templateSelectionContainer}>
                {
                    props.additionalPreviewRefs.current.length > 0 && (
                        <Typography variant="h6" gutterBottom>
                            Select Additional Templates to Render
                        </Typography>
                    )
                }
                    <div className={styles.templateSwitches}>
                        {Object.keys(props.additionalPreviewRefs.current).map((key) => (
                            <FormControlLabel
                                key={key}
                                control={
                                    <Switch
                                        checked={selectedTemplates[key] || false}
                                        onChange={() => handleTemplateToggle(key)}
                                        name={key}
                                    />
                                }
                                label={`Template ${key.split('_')[1]}`}
                            />
                        ))}
                    </div>
                </div>
            )}
                <Dialog
                    open={frontImgPopupOpen}
                    onClose={() => setFrontImgPopupOpen(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    fullWidth={true}
                    maxWidth='md'
                >
                    <DialogTitle id="alert-dialog-title">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <p>Select Front Image</p>
                            <div>
                                <CloseIcon onClick={() => setFrontImgPopupOpen(false)} sx={{ marginTop: "10px", padding: "0", cursor: "pointer", color: "#1976d2" }} />
                            </div>
                        </div>
                        <Divider />
                        <Box
                            component="form"
                            sx={{
                                '& > :not(style)': {},
                            }}
                            noValidate
                            autoComplete="off"
                        >
                            <TextField id="search-box-input" value={fpSearchText} onChange={(e) => { setFpSearchText(e.target.value) }} label="Search" variant="outlined" sx={{
                                width: "50%",
                                minWidth: "350px",
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#E5E7EB',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#D1D5DB',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3B82F6',
                                        borderWidth: '2px',
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    padding: '12px 14px',
                                },
                            }} />
                            {
                                (fpIsSearching) ? <Button variant="text"><CircularProgress /></Button> :
                                    <><Button variant="text" onClick={() => { handleFpSearch() }} sx={{ marginTop: "13px" }}><SearchIcon /></Button>
                                        <Button variant="text" title='Reset' onClick={() => { handleResetFpSearch() }} sx={{ marginTop: "13px" }}><RestartAltIcon /></Button></>
                            }


                        </Box>
                    </DialogTitle>
                    <DialogContent dividers style={{ minHeight: "700px" }}>

                        {(frontPicture.length) ?
                            frontPicture.map((fps, j) => {
                                return (
                                    <div key={j + 'span'} className='img-container'>
                                        <img key={j + 'fp'} title={fps.name} src={fps.image} className='img-preview' onClick={(e) => handleFrontImage(e)} />
                                        <p title={fps.name}>{fps.name}</p>
                                    </div>
                                )
                            })
                            : null
                        }
                        {fpOffset && (
                            <>
                                <Divider />
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "15px" }}>
                                    {(fpIsLoadMore) ?
                                        <CircularProgress /> :
                                        <button onClick={() => { fetchPictures(false) }}>Load More</button>
                                    }
                                </div>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFrontImgPopupOpen(false)} autoFocus>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
};