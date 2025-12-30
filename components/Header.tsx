import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, onUpdateProfile }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    setTempProfile(userProfile);
  }, [userProfile]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSave = () => {
    onUpdateProfile(tempProfile);
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({
          ...tempProfile,
          avatarUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
        
        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1"></div>
        
        <div 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center ml-2 space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-xl transition-colors group"
        >
          <img 
            src={userProfile.avatarUrl} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userProfile.name);
            }}
          />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold leading-none">{userProfile.name}</p>
            <p className="text-[10px] text-gray-400">Settings</p>
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Profile Settings</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="flex flex-col items-center space-y-4">
                <div 
                  onClick={triggerFileInput}
                  className="relative group cursor-pointer"
                >
                  <img 
                    src={tempProfile.avatarUrl} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full border-4 border-primary-500/20 shadow-lg object-cover transition-filter group-hover:brightness-75"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(tempProfile.name);
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-xl"></i>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm">
                    <i className="fa-solid fa-pen text-[10px]"></i>
                  </div>
                </div>
                <div className="text-center">
                  <button 
                    onClick={triggerFileInput}
                    className="text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline"
                  >
                    Change Photo
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: Square image, max 2MB</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors shadow-md shadow-primary-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;