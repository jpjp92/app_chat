import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, onUpdateProfile, onMenuClick }) => {
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
        setTempProfile({ ...tempProfile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="relative z-40 sticky top-0 w-full transition-all">
      {/* Background with Glass Effect - Separated to avoid clipping fixed children */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 glass-effect border-b border-slate-200 dark:border-slate-800 -z-10"></div>
      
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuClick}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
          <div className="flex items-center group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-primary-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-xl shadow-primary-500/20 group-hover:rotate-12 transition-all duration-500 ring-2 ring-white/20">
              <i className="fa-solid fa-wand-magic-sparkles text-white text-lg"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-xl tracking-tighter leading-none bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent whitespace-nowrap">Chat with Gemini</h1>
              <p className="text-[9px] font-black text-primary-500 tracking-[0.2em] uppercase mt-0.5">Next-Gen Intelligence</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 active:scale-90"
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          
          <div 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-3 cursor-pointer pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">{userProfile.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settings</p>
            </div>
            <img 
              src={userProfile.avatarUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userProfile.name);
              }}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center pb-32 sm:pb-48 px-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Card - Positioned slightly higher using pb-32/sm:pb-48 */}
          <div className="relative w-full max-w-sm animate-in slide-in-from-bottom-12 duration-500 ease-out">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 overflow-hidden">
              
              <div className="p-6 space-y-6">
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
                      className="w-24 h-24 rounded-full border-4 border-primary-500/20 shadow-lg object-cover transition-all group-hover:brightness-75"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(tempProfile.name);
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-camera text-white text-xl"></i>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm">
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
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Square image, max 2MB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold text-slate-800 dark:text-white"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg active:scale-95 transition-all"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;