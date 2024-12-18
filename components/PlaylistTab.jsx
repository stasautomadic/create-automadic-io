import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const PlaylistItem = ({ video, index, moveItem, playlistId }) => {
    const [{ isDragging }, dragRef] = useDrag({
        type: 'PLAYLIST_ITEM',
        item: { 
            type: 'PLAYLIST_ITEM',
            index,
            playlistId,
            videoId: video.url,
            video: video
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver }, dropRef] = useDrop({
        accept: 'PLAYLIST_ITEM',
        hover: (draggedItem, monitor) => {
            if (!dropRef.current) return;
            
            const dragIndex = draggedItem.index;
            const hoverIndex = index;
            
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) return;
            if (draggedItem.playlistId !== playlistId) return;
            
            // Get the dragged element's bounding rectangle
            const hoverBoundingRect = dropRef.current.getBoundingClientRect();
            
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            
            // Get mouse position
            const clientOffset = monitor.getClientOffset();
            
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            
            // Only perform the move when the mouse has crossed half of the item's height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
            
            moveItem(dragIndex, hoverIndex);
            draggedItem.index = hoverIndex;
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

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

    const dragHandleRef = (node) => {
        dragRef(node);
        dropRef(node);
    };

    return (
        <div 
            ref={dragHandleRef}
            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4
                       ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                       ${isOver ? 'border-2 border-blue-500' : 'border border-transparent'}
                       transform cursor-move select-none`}
            style={{ 
                transition: 'transform 0.1s, opacity 0.1s, border-color 0.2s',
            }}
        >
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium group-hover:bg-blue-200 transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{video.templateNames}</h4>
                    <p className="text-sm text-gray-500">
                        Added {formatDate(video.created_at)}
                    </p>
                </div>
                <button
                    onClick={() => window.open(video.url, "_blank")}
                    className="flex-shrink-0 bg-white shadow-lg text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-50 transition-colors duration-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const PlaylistDropZone = ({ onDrop, children, playlistId }) => {
    const [{ isOver }, dropRef] = useDrop({
        accept: ['MEDIA_ITEM', 'PLAYLIST_ITEM'],
        drop: (item) => onDrop(item, playlistId),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={dropRef}
            className={`rounded-lg transition-colors duration-200 ${
                isOver ? 'bg-blue-50' : 'bg-transparent'
            }`}
        >
            {children}
        </div>
    );
};

const Playlist = ({ name, videos, onDrop, onDelete }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            
            // Add files to zip with numbered names
            for (let i = 0; i < videos.length; i++) {
                try {
                    const response = await fetch(videos[i].url);
                    const blob = await response.blob();
                    const extension = videos[i].url.split('.').pop();
                    zip.file(`${i + 1}.${extension}`, blob);
                } catch (error) {
                    console.error(`Error downloading file ${i + 1}:`, error);
                }
            }

            // Generate and download zip file
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${name}.zip`);
        } catch (error) {
            console.error('Error creating zip file:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{videos.length} videos</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || videos.length === 0}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white 
                                  ${isDownloading || videos.length === 0 
                                    ? 'bg-blue-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'} 
                                  rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  transition-colors duration-200`}
                    >
                        {isDownloading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </>
                        )}
                    </button>
                    {name !== "All Videos" && (
                        <button
                            onClick={onDelete}
                            className="inline-flex bg-white shadow-lg items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 
                                     focus:outline-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            
            <PlaylistDropZone onDrop={onDrop} playlistId={name}>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {videos.map((video, index) => (
                        <PlaylistItem
                            key={`${video.url}-${index}`}
                            video={video}
                            index={index}
                            moveItem={(fromIndex, toIndex) => {
                                const newVideos = [...videos];
                                const [movedVideo] = newVideos.splice(fromIndex, 1);
                                newVideos.splice(toIndex, 0, movedVideo);
                            }}
                            playlistId={name}
                        />
                    ))}
                    {videos.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            Drag and drop videos here
                        </div>
                    )}
                </div>
            </PlaylistDropZone>
        </div>
    );
};

export const PlaylistTab = ({ media }) => {
    const [playlists, setPlaylists] = useState(() => {
        const saved = localStorage.getItem('playlists');
        const savedPlaylists = saved ? JSON.parse(saved) : {};
        return {
            "All Videos": media,
            ...savedPlaylists
        };
    });
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        setPlaylists(prev => ({
            ...prev,
            "All Videos": media
        }));
    }, [media]);

    const handleDrop = (item, playlistId) => {
        if (playlistId === "All Videos" || !playlistId) return;

        const videoToAdd = item.video || {
            url: item.videoId,
            templateNames: item.templateNames,
            created_at: item.created_at
        };
        
        if (!videoToAdd || !playlistId) return;

        setPlaylists(prev => {
            const playlistVideos = prev[playlistId] || [];
            const videoExists = playlistVideos.some(v => v.url === videoToAdd.url);
            
            if (videoExists) return prev;

            const updated = {
                ...prev,
                [playlistId]: [...playlistVideos, videoToAdd]
            };
            const { ["All Videos"]: _, ...toSave } = updated;
            localStorage.setItem('playlists', JSON.stringify(toSave));
            return updated;
        });
    };

    const createPlaylist = () => {
        if (!newPlaylistName.trim() || newPlaylistName === "All Videos") return;
        
        setPlaylists(prev => {
            const updated = { ...prev, [newPlaylistName]: [] };
            const { ["All Videos"]: _, ...toSave } = updated;
            localStorage.setItem('playlists', JSON.stringify(toSave));
            return updated;
        });
        setNewPlaylistName('');
    };

    const deletePlaylist = (playlistId) => {
        // Don't allow deleting "All Videos" playlist
        if (playlistId === "All Videos") return;

        setPlaylists(prev => {
            const { [playlistId]: removed, ...rest } = prev;
            const { ["All Videos"]: _, ...toSave } = rest;
            localStorage.setItem('playlists', JSON.stringify(toSave));
            return rest;
        });
    };

    return (
        <div className="space-y-6">
            {/* Create new playlist */}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name"
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                    onClick={createPlaylist}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white 
                             bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none 
                             focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Create Playlist
                </button>
            </div>

            {/* Playlists */}
            <div className="grid gap-6">
                {Object.entries(playlists).map(([name, videos]) => (
                    <Playlist
                        key={name}
                        name={name}
                        videos={videos}
                        onDrop={handleDrop}
                        onDelete={() => name !== "All Videos" && deletePlaylist(name)}
                    />
                ))}
            </div>
        </div>
    );
};
