import { createContext, useState, useContext, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';

interface ThemeContextProps {
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f50b5',
    },
    secondary: {
      main: '#f44336',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f50b5',
    },
    secondary: {
      main: '#f44336',
    },
  },
});

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme.palette.mode === 'light' ? darkTheme : lightTheme));
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, theme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};
