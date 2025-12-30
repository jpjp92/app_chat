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
        setTempProfile({ ...tempProfile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 glass-effect border-b border-slate-200 dark:border-slate-800 z-40 sticky top-0 transition-all">
      <div className="flex items-center space-x-4">
        <div className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
          <i className="fa-solid fa-bars-staggered"></i>
        </div>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account</p>
          </div>
          <img 
            src={userProfile.avatarUrl} 
            alt="Profile" 
            className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 shadow-md object-cover transition-transform"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[36px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-8 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Identity</h2>
                <p className="text-xs text-slate-400 font-medium">How Gemini sees you</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <div className="flex flex-col items-center">
                <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-violet-600 rounded-[44px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <img src={tempProfile.avatarUrl} alt="Preview" className="relative w-32 h-32 rounded-[40px] border-4 border-white dark:border-slate-800 shadow-2xl object-cover transition-all group-hover:brightness-75" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-3xl"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Name</label>
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-semibold"
                    placeholder="Who are you?"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex space-x-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-lg transition-all active:scale-[0.98]">Update Profile</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;