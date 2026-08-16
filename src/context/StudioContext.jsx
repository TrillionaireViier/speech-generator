import React, { createContext, useState } from 'react';

export const StudioContext = createContext();

export const StudioProvider = ({ children }) => {
  const [hfToken, setHfToken] = useState('');
  const [globalGeneratedImage, setGlobalGeneratedImage] = useState(null);

  return (
    <StudioContext.Provider value={{
      hfToken, setHfToken,
      globalGeneratedImage, setGlobalGeneratedImage
    }}>
      {children}
    </StudioContext.Provider>
  );
};
