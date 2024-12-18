import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaTimes, FaUserCircle, FaTemplate, FaSignOutAlt } from 'react-icons/fa';
import { GoCommentDiscussion, GoSponsorTiers } from "react-icons/go";
import { CiUser } from "react-icons/ci";
import { AiOutlineHome, AiOutlineDatabase } from "react-icons/ai";
import { BiMoviePlay } from "react-icons/bi";
import { MdOutlineBusinessCenter } from "react-icons/md";
import { useEffect, useState } from 'react';

const Sidebar = ({setIsOpen, isOpen}) => {
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUserAvatar = localStorage.getItem('userImage');
    const storedUserName = localStorage.getItem('userName');
    setUserAvatar(storedUserAvatar === 'null' ? '' : storedUserAvatar || '');
    setUserName(storedUserName || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('company');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userImage');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  const closeSidebar = () => {
    setIsOpen();
  };

  const navigationItems = [
    { label: 'Templates', icon: AiOutlineHome, href: '/' },
    { label: 'Media', icon: BiMoviePlay, href: '/media' },
    { label: 'Datahub', icon: AiOutlineDatabase, href: '/datahub' },
    { label: 'Sponsors', icon: GoSponsorTiers, href: '/sponsors' },
    { label: 'Werberechte', icon: MdOutlineBusinessCenter, href: '/werberechte' },
    { label: 'Profile', icon: CiUser, href: '/profile' },
  ];

  console.log(userAvatar == '')
  console.log(userAvatar != '' || userAvatar != undefined || userAvatar != 'undefined')

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`bg-gradient-to-b from-[#0F172A] to-[#1E293B] shadow-xl flex flex-col fixed z-20 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          w-[280px] md:w-72 md:translate-x-0 md:relative
          h-[100dvh]`}
      >
        {/* Sidebar Header */}
        <div className="flex flex-col h-full">
          <div className='md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-700/50'>
            <Link href="/" className="flex items-center space-x-2">
              <img className="w-6 h-6" src="/favicon.ico" alt="logo" />
              <span className="text-lg font-semibold text-white">Automadic</span>
            </Link>
            <button 
              onClick={closeSidebar}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 hover:bg-gray-700/50 transition-colors"
              aria-label="Close menu"
            >
              <FaTimes className='text-white text-xl' />
            </button>
          </div>
    
          {/* Profile Section */}
          <div className='px-4 pt-4'>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 backdrop-blur-sm">
              {userAvatar != '' ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="rounded-full object-cover w-10 h-10 ring-2 ring-blue-500/50"
                />
              ) : (
                <div className="rounded-full w-10 h-10 bg-gray-700 flex items-center justify-center">
                  <FaUserCircle className="text-gray-400 w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col">
                {userName && (
                  <>
                    <span className="text-gray-200 font-medium text-sm">{userName}</span>
                    <span className="text-gray-400 text-xs">Active</span>
                  </>
                )}
              </div>
            </div>
          </div>
    
          {/* Navigation */}
          <nav className="flex-grow px-3 mt-6 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
            <div className="space-y-1">
              {navigationItems.map((item, index) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    href={item.href}
                    key={index}
                    onClick={closeSidebar}
                  >
                    <div className={`flex my-2 md:my-5 items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Logout Button for Mobile */}
            <div className="md:hidden mt-4">
              <button
                onClick={handleLogout}
                className="w-full bg-gray-800/50 backdrop-blur-sm flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white transition-all duration-200"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
  
        {/* Logout Section for Desktop */}
        <div className="p-4 border-t border-gray-700/50 hidden md:block">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-800/50 backdrop-blur-sm flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white transition-all duration-200"
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;