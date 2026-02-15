/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CreateProfile from './pages/CreateProfile';
import EditProfile from './pages/EditProfile';
import Friends from './pages/Friends';
import Home from './pages/Home';
import LogSession from './pages/LogSession';
import Profile from './pages/Profile';
import SeasonSetup from './pages/SeasonSetup';
import SessionDetail from './pages/SessionDetail';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateProfile": CreateProfile,
    "EditProfile": EditProfile,
    "Friends": Friends,
    "Home": Home,
    "LogSession": LogSession,
    "Profile": Profile,
    "SeasonSetup": SeasonSetup,
    "SessionDetail": SessionDetail,
    "Settings": Settings,
    "Stats": Stats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};