import { useRouter } from 'next/router';
import Head from 'next/head';
import { Detail } from '@/components/Detail';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

function DetailPage() {
  const router = useRouter();
  const { id } = router.query;
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
        <title>Template Editor</title>
        <meta name="description" content={`Edit template ${id}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen bg-gray-50">
        <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col md:ml-10">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-hidden pt-16 md:pt-0">
            {id ? (
              <div className="h-full">
                <Detail id={id} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// Export the component wrapped with withAuth to protect the route
export default withAuth(DetailPage);
