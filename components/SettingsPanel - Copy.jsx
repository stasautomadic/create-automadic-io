// imports
import React, { useEffect, ChangeEvent, useCallback, useState } from 'react';
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

// get env files
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;
const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const DEFAULT_PAGE_SIZE = 50;
const PLACEHOLDER_IMAGE = 'https://placehold.jp/150x150.png';


// get all the teams with search capability
const getAllTeam = async (teamNameStartsWith, page = 1) => {
    try {
        const companyID = localStorage.getItem('company');

        // Initialize the filter formula for the companyID and the search term
        let filterFormula = companyID
            ? `FIND('${companyID}', {companyID (from connect-companyGroup)}) > 0`
            : '';

        if (teamNameStartsWith) {
            filterFormula = filterFormula
                ? `AND(${filterFormula}, SEARCH(LOWER("${teamNameStartsWith}"), LOWER({TeamName}))`
                : `SEARCH(LOWER("${teamNameStartsWith}"), LOWER({TeamName})`;
        }

        // get teams by the teamname
        const query = filterFormula ? `&filterByFormula=${encodeURIComponent(filterFormula)}` : '';
        const pageSize = 100; // Number of records per page
        const url = `${API_URL}tblMbHeFEr9HnPWTB?maxRecords=${pageSize}&page=${page}${query}`;

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
            const dataArr = data.records
            .map((record) => {
                if (record?.fields?.logoUrl) {
                    return {
                        name: record.fields.TeamName,
                        image: record.fields.logoUrl,
                        league: record.fields.leagueName,
                    };
                }
                return null;
            })
            .filter((item) => item !== null);
        
            return { records: dataArr, hasMore: data.records.length === pageSize };
        }
    } catch (error) {
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
                return {
                    positionAndNumber: positionAndNumber,
                    name: playerName,
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

    // handle file upload
    const handleFileChange = (sourceName) => async (e) => {
        setLoadingStates(prev => ({ ...prev, [sourceName]: true }));
        const selectedFile = e.target.files ? e.target.files[0] : null;
        if (!selectedFile) return;

        setPreviews(prevPreviews => ({ ...prevPreviews, [sourceName]: selectedFile ? URL.createObjectURL(selectedFile) : null }));

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('https://rss-scraper.automadic.io/api/upload-image', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const resData = await res.json();
                if (resData.image_url) {
                    try {
                        await ensureElementVisibility(props.preview, sourceName, 1.5);
                        await setPropertyValue(props.preview, sourceName, resData.image_url, modificationsRef.current);
                    } catch (err) {
                        console.error('Error:', err);
                    } finally {
                        setLoadingStates(prev => ({ ...prev, [sourceName]: false }));
                    }
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

    // fetch Teams
    const fetchTeams = React.useCallback(async () => {
        setLoadingMore(true);
        const { records, hasMore } = await getAllTeam(searchText, page);
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

    // handle front image select for players
    const handleFrontImage = async (event) => {
        setFrontImg(event.target.src);
        setFrontImgPopupOpen(false);
        try {
            await ensureElementVisibility(props.preview, 'Front Image', 1.5);
            await setPropertyValue(props.preview, 'Front Image', event.target.src, modificationsRef.current);
        } catch (err) {
            console.error('Error :', err);
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
            await ensureElementVisibility(props.preview, 'teamLogoLeft', 1.5);
            await setPropertyValue(props.preview, 'teamLogoLeft', event.image, modificationsRef.current);

            await ensureElementVisibility(props.preview, 'LeagueName', 1.5);
            await setPropertyValue(props.preview, 'LeagueName', event.league, modificationsRef.current);
        } catch (err) {
            console.error('Error :', err);
        }
    };

    // handle team logo right changes for teams
    const handleTeamLogoRight = async (event) => {
        if (!event?.image) {
            setTeamLogoUrlRight('');
            console.error('No image provided');
            return;
        }
        setTeamLogoUrlRight(event.image);
        try {
            await ensureElementVisibility(props.preview, 'teamLogoRight', 1.5);
            await setPropertyValue(props.preview, 'teamLogoRight', event.image, modificationsRef.current);
        } catch (err) {
            console.error('Error :', err);
        }
    };

    const handleSponsors = async (event) => {
        if (!event?.image) {
            setSponsorLogo('');
            console.error('No image provided');
            return;
        }
        setSponsorLogo(event.image);
        try {
            await ensureElementVisibility(props.preview, 'Sponsor Logo', 1.5);
            await setPropertyValue(props.preview, 'Sponsor Logo', event.image, modificationsRef.current);
        } catch (err) {
            console.error('Error :', err);
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

    // Function to handle text changes and reset if input is cleared
    const handleTextChange = (sourceName) => (e) => {
        const newValue = e.target.value;
        setTextValues((prevValues) => {
            const updatedValues = { ...prevValues, [sourceName]: newValue };
            setPropertyValue(props.preview, sourceName, newValue, modificationsRef.current);
            return updatedValues;
        });
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
            await setPropertyValue(props.preview, `playerImage${number}`, event.playerImage, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playerNumber${number}`, 1.5);
            await setPropertyValue(props.preview, `playerNumber${number}`, event.positionAndNumber, modificationsRef.current);
            await ensureElementVisibility(props.preview, `playername${number}`, 1.5);
            await setPropertyValue(props.preview, `playername${number}`, event.name, modificationsRef.current);
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
                            autoComplete: 'new-password', // disable autocomplete and autofill
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

    return (
        <div>
            <CreateButton templateNames={templateNames} preview={props.preview} />
            <div className={styles.group}>

                {props.preview.state?.elements?.map((element) => {
                    if (!element.source.name) return null;
                    const playerImageMatch = element.source.name && element.source.name.match(/^playerImage(\d+)$/);

                    switch (element.source.type) {
                        case 'text':
                            return (
                                <div key={element.source.id} >
                                    <label className={styles.formLabel}>{element.source.name}</label>
                                    <TextField
                                        style={{ width: '100%' }}
                                        value={textValues[element.source.name] || ''}
                                        onFocus={async () => {
                                            await ensureElementVisibility(props.preview, element.source.name, 1.5);
                                        }}
                                        onChange={handleTextChange(element.source.name)}
                                        multiline
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
                                            id={`sponsor-image`}
                                            sx={{ marginTop: '20px' }}
                                            options={sponsors}
                                            autoHighlight
                                            getOptionLabel={(option) => option.name}
                                            onChange={(event, newValue) => {
                                                handleSponsors(newValue ? newValue : '');
                                            }}
                                            onKeyUp={(event) => {
                                                handleSearchSponsor(event);
                                            }}
                                            renderOption={(props, option, { index }) => {
                                                return (
                                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <img loading="lazy" width="20" srcSet={option.image} src={option.image} alt="" />
                                                        {option.name}
                                                    </Box>
                                                );
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={`Select Sponsor Logo`}
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'new-password', // disable autocomplete and autofill
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
                                                        autoComplete: 'new-password', // disable autocomplete and autofill
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
                                                handleTeamLogoRight(newValue ? newValue.image : '');
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
                                                        autoComplete: '', // disable autocomplete and autofill
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
                                        <input type="file" onChange={handleFileChange(element.source.name)} />
                                        {(previews[element.source.name] ?? "") && <img src={previews[element.source.name] ?? ""} alt="Preview" width={100} />}
                                    </>
                                );
                            }
                        case "composition":
                            return (
                                <div key={element.source.id}>
                                    {element?.elements?.map((el) => {
                                        if (!el.source.name) return null;
                                        const playeImageMatch = el.source.name && el.source.name.match(/^playerImage(\d+)$/);
                                        switch (el.source.type) {
                                            case 'text':
                                                return (
                                                    <div key={el.source.id}>
                                                        <label className={styles.formLabel}>{el.source.name}</label>
                                                        <textarea
                                                            value={el.source.text}
                                                            onFocus={async () => {
                                                                await ensureElementVisibility(props.preview, el.source.name, 1.5);
                                                            }}
                                                            onChange={async (e) => {
                                                                await setPropertyValue(props.preview, el.source.name, e.target.value, modificationsRef.current);
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            case 'image':
                                            case 'video':
                                                if (el.source.name === "Front Image") {
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
                                                } else if (el.source.name === "teamLogoLeft") {
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
                                                                            autoComplete: 'new-password', // disable autocomplete and autofill
                                                                        }}
                                                                    />
                                                                )}
                                                            />

                                                            {
                                                                (teamLogoUrlLeft) ? <img src={teamLogoUrlLeft} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                                            }

                                                        </>
                                                    )
                                                } else if (el.source.name === "teamLogoRight") {
                                                    return (
                                                        <>
                                                            <Autocomplete
                                                                id="team-logo-right"
                                                                sx={{ marginTop: "20px" }}
                                                                options={teamLogos}
                                                                autoHighlight
                                                                getOptionLabel={(option) => option.name}
                                                                onChange={(event, newValue) => {
                                                                    handleTeamLogoRight(newValue ? newValue.image : '');
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
                                                                            autoComplete: '', // disable autocomplete and autofill
                                                                        }}
                                                                    />
                                                                )}
                                                            />
                                                            {
                                                                (teamLogoUrlRight) ? <img src={teamLogoUrlRight} onError={(e) => e.target.src = 'https://placehold.co/416x277.png?text=No%20image'} className='img-preview' /> : ''
                                                            }
                                                        </>
                                                    )
                                                } else {
                                                    return (
                                                        <>
                                                            <label className={`${styles.formLabel}`}>{el.source.name}</label>
                                                            {loadingStates[el.source.name] && <CircularProgress size={24} />}
                                                            <input type="file" onChange={handleFileChange(el.source.name)} />
                                                            {(previews[el.source.name] ?? "") && <img src={previews[el.source.name] ?? ""} alt="Preview" width={100} />}
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
                            <TextField id="search-box-input" value={fpSearchText} onChange={(e) => { setFpSearchText(e.target.value) }} label="Search" variant="standard" sx={{ width: "50%", minWidth: "350px" }} />
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
