// pages/profile.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { FaUpload, FaUser } from 'react-icons/fa';
import { Switch, FormControlLabel } from '@mui/material';

const Profile = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [notifyOnFileReady, setNotifyOnFileReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();
      console.log(data)
      setUser(data.user);
      setName(data.user.userName);
      setEmail(data.user.Email);
      setNotifyOnFileReady(data.user.email_notification_status === 'yes' || false);
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleImageUpload = async () => {
    if (!newImage) return;

    const formData = new FormData();
    formData.append('file', newImage);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.log(response)
    }

    const data = await response.json();
    return data.image_url; // Return the uploaded image URL
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    setLoading(true)
    e.preventDefault();
    let imageUrl;

    try {
      // Handle image upload if a new image is provided
      if (newImage) {
        imageUrl = await handleImageUpload();
      } else {
        imageUrl = user?.userAvatar?.[0]?.url; // Keep the old image if no new one is uploaded
      }

      const updatedUser = {
        userId,
        userName: name,
        email,
        userAvatar: [{ url: imageUrl }],
        notifyOnFileReady,
        ...(password && { password }), 
      };

      // Send updated user info to your API
      const response = await fetch(`/api/updateProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const updateAirtableNotificationStatus = async (status) => {
    try {
      const response = await fetch('/api/update-notification-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: userId,
          status: status ? 'yes' : 'no',
          tableId: 'tblgFvFQncHu24c9m',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification status');
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
      // Revert the switch if the update fails
      setNotifyOnFileReady(!status);
    }
  };

  const handleNotificationChange = (e) => {
    const newStatus = e.target.checked;
    setNotifyOnFileReady(newStatus);
    updateAirtableNotificationStatus(newStatus);
  };

  return (
    <>
      <Head>
        <title>Profile</title>
        <meta name="description" content="User profile page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex h-screen bg-gray-50">
        <Sidebar setIsOpen={() => setSidebarOpen(false)} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
          <main className="mt-[3rem] md:mt-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                      {(previewImage || user?.userAvatar?.[0]?.url) ? (
                        <img
                          src={previewImage || user?.userAvatar?.[0]?.url}
                          alt="Profile"
                          className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUser className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <label
                        htmlFor="image-upload"
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <FaUpload className="h-8 w-8 text-white" />
                      </label>
                      <input
                        type="file"
                        id="image-upload"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Click to upload new profile picture</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-200">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifyOnFileReady}
                          onChange={handleNotificationChange}
                          color="primary"
                        />
                      }
                      label={
                        <div className="flex flex-col ml-2">
                          <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                          <span className="text-sm text-gray-500">Get notified when files are ready to download</span>
                        </div>
                      }
                      className="m-0"
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
                        loading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </span>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Profile;
