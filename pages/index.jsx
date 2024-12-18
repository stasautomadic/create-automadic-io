import Head from 'next/head';
import Main from '@/components/Main';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const HomePage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const setIsOpen = () => {
    setSidebarOpen(false)
  }

  return (
    <>
      <Head>
        <title>Automadic</title>
        <meta name="description" content="Home page showing all templates" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen bg-gray-50">
        <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col md:ml-10">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
            <Main />
          </main>
        </div>
      </div>
    </>
  );
};

export default withAuth(HomePage);
