import React from 'react';
import Head from 'next/head';
import withAuth from '@/components/withAuth';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

const Werberechte = () => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const setIsOpen = () => {
        setSidebarOpen(false);
    };

    return (
        <div>
            <Head>
                <title>Werberechte</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex h-screen">
                <Sidebar setIsOpen={setIsOpen} isOpen={isSidebarOpen} />
                <div className="flex-1 flex flex-col w-[80%]">
                    <Header toggleSidebar={toggleSidebar} />
                    <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
                        <h1 className="text-2xl font-bold mb-6">Werberechte</h1>
                        {/* Add your content here */}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default withAuth(Werberechte); 