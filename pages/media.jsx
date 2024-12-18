import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { PlaylistTab } from '@/components/PlaylistTab';

const MediaItem = ({ medi, index, moveItem, onDelete }) => {
    const [{ isDragging }, dragRef] = useDrag({
        type: 'MEDIA_ITEM',
        item: { 
            type: 'MEDIA_ITEM',
            index, 
            videoId: medi.url,
            templateNames: medi.templateNames,
            created_at: medi.created_at,
            url: medi.url,
            video: medi
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, dropRef] = useDrop({
        accept: 'MEDIA_ITEM',
        hover: (draggedItem) => {
            if (draggedItem.type === 'MEDIA_ITEM' && draggedItem.index !== index) {
                moveItem(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    const dragHandleRef = (node) => {
        dragRef(node);
        dropRef(node);
    };

    // Add device detection
    const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    const handleDownload = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                // Try Web Share API first for iOS
                if (navigator.share) {
                    const file = new File([blob], `${medi.templateNames || 'video'}.mp4`, { type: blob.type });
                    try {
                        await navigator.share({
                            files: [file],
                            title: medi.templateNames,
                        });
                        return;
                    } catch (error) {
                        console.error('Share failed:', error);
                    }
                }
                
                // Fallback for iOS if share fails - use native video player
                const blobUrl = URL.createObjectURL(blob);
                const videoElement = document.createElement('video');
                videoElement.style.display = 'none';
                videoElement.controls = true;
                videoElement.playsInline = true;
                videoElement.src = blobUrl;
                document.body.appendChild(videoElement);
                videoElement.play();
                
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(videoElement);
                }, 1000);
            } else {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `${medi.templateNames || 'video'}-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    // Format date safely
    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        try {
            if (typeof date === 'string') {
                return new Date(date).toLocaleDateString();
            }
            return date.toLocaleDateString();
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <div 
            ref={dropRef}
            className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 
                       ${isDragging ? 'opacity-50 scale-[1.02] shadow-lg' : 'opacity-100 scale-100'}
                       hover:bg-gray-50 mb-2`}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4">
                <div 
                    ref={dragHandleRef}
                    className="invisible group-hover:visible cursor-move text-gray-400 
                             hover:text-gray-600 transition-all duration-200 transform hover:scale-110"
                    aria-label="Drag to reorder"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        className="w-5 h-5"
                    >
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                </div>

                <div className="flex-grow">
                    <div className="text-sm font-medium text-gray-900">
                        <span className="break-all">
                            {medi.templateNames || 'Untitled Video'}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-0">
                        <span className="whitespace-nowrap">Created {formatDate(medi.created_at)}</span>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span className="whitespace-nowrap">By {localStorage.getItem('userName')}</span>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => window.open(medi.url, '_blank')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium 
                                text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                transition-colors duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Preview
                    </button>
                    <button
                        onClick={() => handleDownload(medi.url)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium 
                                text-blue-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isMobileDevice() ? 'Share' : 'Download'}
                    </button>
                    <button
                        onClick={() => onDelete(medi.url)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium 
                                text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                                transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white'
        }`}
    >
        {children}
    </button>
);

const Media = () => {
    const [media, setMedia] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [userID, setUserID] = useState(null);  
    const [loading, setLoading] = useState(false);
    const [mediaOrder, setMediaOrder] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('library');

    const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/`;
    const API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            setUserID(storedUserId);
            const savedOrder = localStorage.getItem(`mediaOrder-${storedUserId}`);
            if (savedOrder) {
                setMediaOrder(JSON.parse(savedOrder));
            }
        }
    }, []);

    useEffect(() => {
        if (userID) {
            fetchMedia();
        }
    }, [userID, page]);

    const getAllMedia = async (page) => {
        setLoading(true);
        try {
            const pageSize = 30;

            if (!userID) {
                throw new Error('User ID not found in localStorage');
            }

            const filterFormula = encodeURIComponent(`{userID (from userID)} = '${userID}'`);
            const offset = page > 1 ? `&offset=${(page - 1) * pageSize}` : '';
            
            const url = `${API_URL}tblWEuXbE96RagR0E?maxRecords=${pageSize}${offset}&filterByFormula=${filterFormula}&sort[0][field]=createdTime&sort[0][direction]=desc`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch media');
            }

            const data = await response.json();
            const dataArr = data.records
                .map((record) => {
                    if (record?.fields?.finished_URL_AWS) {
                        return {
                            url: record.fields.finished_URL_AWS,
                            templateNames: record.fields.templateName,
                            created_at: new Date(record.fields.createdTime),
                        };
                    }
                    return null;
                })
                .filter((item) => item !== null);

            return { records: dataArr, hasMore: data.records.length === pageSize };
        } catch (error) {
            console.error('Error fetching media data:', error);
            return { records: [], hasMore: false };
        } finally {
            setLoading(false);
        }
    };

    const fetchMedia = async () => {
        if (userID) {
            const { records, hasMore } = await getAllMedia(page);
            let orderedRecords = [...records];
            
            if (mediaOrder.length > 0) {
                const recordMap = new Map(records.map(record => [record.url, record]));
                orderedRecords = mediaOrder
                    .map(url => recordMap.get(url))
                    .filter(record => record);
                
                records.forEach(record => {
                    if (!mediaOrder.includes(record.url)) {
                        orderedRecords.push(record);
                    }
                });
            }
            
            setMedia((prevMedia) => [...prevMedia, ...orderedRecords]);
            setHasMore(hasMore);
        }
    };

    const moveItem = (fromIndex, toIndex) => {
        requestAnimationFrame(() => {
            setMedia((prevMedia) => {
                const updatedMedia = [...prevMedia];
                const [movedItem] = updatedMedia.splice(fromIndex, 1);
                updatedMedia.splice(toIndex, 0, movedItem);
                
                // Update order in localStorage
                const newOrder = updatedMedia.map(item => item.url);
                if (userID) {
                    localStorage.setItem(`mediaOrder-${userID}`, JSON.stringify(newOrder));
                    setMediaOrder(newOrder);
                }
                
                return updatedMedia;
            });
        });
    };

    const handleDelete = async (url) => {
        if (!confirm('Are you sure you want to delete this video?')) {
            return;
        }

        try {
            // Find the record ID by URL
            const filterFormula = encodeURIComponent(`AND({userID (from userID)} = '${userID}', {finished_URL_AWS} = '${url}')`);
            const searchUrl = `${API_URL}tblWEuXbE96RagR0E?filterByFormula=${filterFormula}`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to find record');
            }

            const data = await response.json();
            if (data.records.length > 0) {
                const recordId = data.records[0].id;
                
                // Delete the record
                const deleteUrl = `${API_URL}tblWEuXbE96RagR0E/${recordId}`;
                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                    },
                });

                if (!deleteResponse.ok) {
                    throw new Error('Failed to delete record');
                }

                // Update local state
                setMedia(prevMedia => prevMedia.filter(item => item.url !== url));
                
                // Update media order
                const newOrder = mediaOrder.filter(item => item !== url);
                setMediaOrder(newOrder);
                localStorage.setItem(`mediaOrder-${userID}`, JSON.stringify(newOrder));
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Failed to delete the video. Please try again.');
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'playlists':
                return <PlaylistTab media={media} />;
            default:
                return (
                    <div className="space-y-4">
                        {media.map((medi, index) => (
                            <MediaItem
                                key={`${medi.url}-${index}`}
                                medi={medi}
                                index={index}
                                moveItem={moveItem}
                                onDelete={handleDelete}
                            />
                        ))}

                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        )}

                        {!loading && !hasMore && media.length > 0 && (
                            <p className="text-center text-gray-500 py-8">
                                You've reached the end of your media library
                            </p>
                        )}

                        {!loading && media.length === 0 && (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating a new video template
                                </p>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div>
                <Head>
                    <title>Media Library - Automadic</title>
                    <meta name="description" content="View and manage your media files" />
                </Head>

                <div className="flex h-screen bg-gray-50">
                    <Sidebar setIsOpen={setIsSidebarOpen} isOpen={isSidebarOpen} />
                    
                    <div className="flex-1 flex flex-col md:ml-10">
                        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                        
                        <main 
                            className="flex-1 overflow-y-auto pt-16 md:pt-0 px-4 sm:px-6 lg:px-8"
                            onScroll={handleScroll}
                        >
                            <div className="max-w-7xl mx-auto py-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Manage and preview your video templates
                                        </p>
                                    </div>
                                </div>

                                <div className="flex space-x-4 mb-6">
                                    <TabButton 
                                        active={activeTab === 'library'} 
                                        onClick={() => setActiveTab('library')}
                                    >
                                        Library
                                    </TabButton>
                                    <TabButton 
                                        active={activeTab === 'playlists'} 
                                        onClick={() => setActiveTab('playlists')}
                                    >
                                        Playlists
                                    </TabButton>
                                </div>

                                {renderContent()}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default withAuth(Media);