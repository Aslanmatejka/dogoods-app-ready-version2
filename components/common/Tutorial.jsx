import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        target: null,
        title: 'Welcome to DoGoods! 👋',
        content: 'Let\'s take a quick tour to help you get started with sharing and finding food in your community.',
        placement: 'center'
    },
    {
        id: 'share-food',
        target: '[href="/share"]',
        title: 'Share Food 🍎',
        content: 'Have extra food? Click here to share it with families and organizations in need. All donations are reviewed for safety.',
        placement: 'bottom'
    },
    {
        id: 'find-food',
        target: '[href="/find"]',
        title: 'Find Food 🔍',
        content: 'Looking for food? Browse available items by category and claim what you need.',
        placement: 'bottom'
    },
    {
        id: 'community',
        target: '[href="/community"]',
        title: 'Community 🤝',
        content: 'Connect with your local community, view impact stories, and see how we\'re making a difference together.',
        placement: 'bottom'
    },
    {
        id: 'profile',
        target: '[data-name="user-actions"]',
        title: 'Your Profile 👤',
        content: 'Access your profile, view your listings, track your impact, and manage settings here.',
        placement: 'bottom'
    },
    {
        id: 'complete',
        target: null,
        title: 'You\'re All Set! 🎉',
        content: 'You can restart this tutorial anytime from your settings. Let\'s start making a difference!',
        placement: 'center'
    }
];

function Tutorial({ isOpen, onClose, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightedElement, setHighlightedElement] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            setHighlightedElement(null);
            return;
        }

        const step = TUTORIAL_STEPS[currentStep];
        if (step.target) {
            const element = document.querySelector(step.target);
            if (element) {
                setHighlightedElement(element);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setHighlightedElement(null);
        }
    }, [currentStep, isOpen]);

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        if (onClose) onClose();
    };

    const handleComplete = () => {
        if (onComplete) onComplete();
        if (onClose) onClose();
    };

    const getTooltipPosition = () => {
        if (!highlightedElement || step.placement === 'center') {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '500px',
                width: '90%'
            };
        }

        const rect = highlightedElement.getBoundingClientRect();
        const style = {
            position: 'fixed',
            maxWidth: '400px',
            width: '90%',
            zIndex: 10001
        };

        switch (step.placement) {
            case 'bottom':
                style.top = `${rect.bottom + 20}px`;
                style.left = `${rect.left + rect.width / 2}px`;
                style.transform = 'translateX(-50%)';
                break;
            case 'top':
                style.bottom = `${window.innerHeight - rect.top + 20}px`;
                style.left = `${rect.left + rect.width / 2}px`;
                style.transform = 'translateX(-50%)';
                break;
            case 'left':
                style.top = `${rect.top + rect.height / 2}px`;
                style.right = `${window.innerWidth - rect.left + 20}px`;
                style.transform = 'translateY(-50%)';
                break;
            case 'right':
                style.top = `${rect.top + rect.height / 2}px`;
                style.left = `${rect.right + 20}px`;
                style.transform = 'translateY(-50%)';
                break;
            default:
                style.top = '50%';
                style.left = '50%';
                style.transform = 'translate(-50%, -50%)';
        }

        return style;
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]" onClick={handleSkip} />

            {/* Highlight spotlight */}
            {highlightedElement && (
                <div
                    className="fixed pointer-events-none z-[10000]"
                    style={{
                        top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
                        left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
                        width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
                        height: `${highlightedElement.getBoundingClientRect().height + 16}px`,
                        border: '3px solid #10b981',
                        borderRadius: '8px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.5)',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className="bg-white rounded-xl shadow-2xl p-6 z-[10001]"
                style={getTooltipPosition()}
            >
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                        <button
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Close tutorial"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <p className="text-gray-600">{step.content}</p>
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#2CABE3] transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                        Skip Tutorial
                    </button>
                    <div className="flex space-x-2">
                        {!isFirstStep && (
                            <button
                                onClick={handlePrevious}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Previous
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-[#2CABE3] text-white rounded-lg hover:opacity-90 font-medium"
                        >
                            {isLastStep ? 'Get Started' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </>
    );
}

Tutorial.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onComplete: PropTypes.func
};

export default Tutorial;
