import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TutorialContext = createContext({});

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};

export const TutorialProvider = ({ children }) => {
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

    useEffect(() => {
        // Check if user has seen tutorial before
        const tutorialCompleted = localStorage.getItem('dogoods_tutorial_completed');
        if (tutorialCompleted === 'true') {
            setHasSeenTutorial(true);
        }
        // Auto-start is now handled by HomePage component
    }, []);

    const startTutorial = () => {
        setIsTutorialOpen(true);
    };

    const closeTutorial = () => {
        setHasSeenTutorial(true);
        localStorage.setItem('dogoods_tutorial_completed', 'true');
        setIsTutorialOpen(false);
    };

    const completeTutorial = () => {
        setHasSeenTutorial(true);
        localStorage.setItem('dogoods_tutorial_completed', 'true');
        setIsTutorialOpen(false);
    };

    const resetTutorial = () => {
        setHasSeenTutorial(false);
        localStorage.removeItem('dogoods_tutorial_completed');
        setIsTutorialOpen(true);
    };

    const value = {
        isTutorialOpen,
        hasSeenTutorial,
        startTutorial,
        closeTutorial,
        completeTutorial,
        resetTutorial
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
};

TutorialProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default TutorialContext;
