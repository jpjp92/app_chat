
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
      <div className="flex items-center space-x-3">
        <div className="md:hidden p-2 text-gray-500">
          <i className="fa-solid fa-bars text-xl"></i>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
            <i className="fa-solid fa-bolt text-white text-sm"></i>
          </div>
          <h1 className="font-bold text-lg tracking-tight hidden sm:block">Gemini Messenger</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={toggleDarkMode}
          className="p-2 w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          title="Toggle Dark Mode"
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button className="p-2 w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
          <i className="fa-solid fa-gear"></i>
        </button>
        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1"></div>
        <div className="flex items-center ml-2 space-x-2">
          <img src="https://picsum.photos/32/32" alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
          <span className="text-sm font-medium hidden sm:block">Developer</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
