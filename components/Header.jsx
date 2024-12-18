import { FaBars } from 'react-icons/fa';
import Link from 'next/link';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-lg text-black px-4 py-3 flex justify-between items-center md:hidden fixed top-0 w-full z-10">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-gradient-to-r from-blue-400 to-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <FaBars className="text-xl" />
        </button>
        <Link href="/" className="flex items-center space-x-2">
          <img 
            src="/favicon.ico" 
            alt="Automadic" 
            className="w-6 h-6"
          />
          <span className="font-semibold text-lg">Automadic</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
