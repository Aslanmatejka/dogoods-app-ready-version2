import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

// EditableText component for proper contentEditable handling
const EditableText = ({ content, onEdit, isEditable, className, tag: Tag = 'div' }) => {
    const elementRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (elementRef.current && !isEditing) {
            elementRef.current.textContent = content;
        }
    }, [content, isEditing]);

    const handleBlur = () => {
        if (elementRef.current && isEditable) {
            onEdit(elementRef.current.textContent);
            setIsEditing(false);
        }
    };

    const handleFocus = () => {
        if (isEditable) {
            setIsEditing(true);
        }
    };

    return (
        <Tag
            ref={elementRef}
            className={className}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onFocus={handleFocus}
        >
            {content}
        </Tag>
    );
};

function ImpactStory() {
    const { isAdmin } = useAuthContext();
    const navigate = useNavigate();
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [newsletterError, setNewsletterError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Default content structure with all editable fields
    const defaultContent = {
        heroTitle: 'Our Impact Story',
        heroSubtitle: 'Transforming food waste into community nourishment through AI-powered logistics and compassionate connections',
        featuredImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
        featuredTitle: 'Bridging the Gap Between Surplus and Need',
        featuredP1: 'Every day, restaurants, grocery stores, and food producers have perfectly good food that goes to waste, while families in our communities struggle with food insecurity. DoGoods uses AI-powered logistics to bridge this gap in real-time.',
        featuredP2: 'Our platform connects donors with recipients within minutes, ensuring fresh food reaches those who need it most. Through intelligent routing and automated coordination, we\'ve created a seamless network that turns potential waste into community nourishment.',
        featuredButtonText: 'Join Our Network →',
        sarahImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop',
        sarahTitle: 'Sarah\'s Story: From Volunteer to Champion',
        sarahQuote: '"I started as a volunteer driver, picking up surplus food from local restaurants. Now I coordinate our entire network in the Bay Area. Seeing families receive fresh, nutritious meals—food that would have been wasted—gives me purpose every single day. We\'re not just feeding people; we\'re building a community that cares."',
        sarahAttribution: '— Sarah Martinez, Community Coordinator, Alameda',
        michaelImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop',
        michaelTitle: 'Restaurant Partnership: A Win-Win Solution',
        michaelQuote: '"As a restaurant owner, I used to feel terrible about food waste at the end of each day. DoGoods transformed that guilt into impact. Now, instead of throwing away perfectly good food, I know it\'s helping families in our neighborhood. The platform makes it effortless—I post what I have, and within an hour, it\'s picked up and distributed."',
        michaelAttribution: '— Michael Chen, Owner, Golden Wok Restaurant',
        newsImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop',
        newsQuote: '"DoGoods helped us feed over 500 families during the holidays. The AI routing meant we could distribute fresh food within 2 hours of donation—something that was impossible before."',
        newsAttribution: 'Director of Community Services',
        newsOrg: 'Alameda County Food Bank',
        newsStats: "Thanks to our network of 150+ partners, we've prevented over 2 million pounds of food waste while providing nutritious meals to families who need them most.",
        newsButtonText: 'Support Our Mission',
        gallery1Image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop',
        gallery1Title: 'Community Centers',
        gallery1Desc: 'Partnering with 45+ community centers across the Bay Area to provide fresh meals and groceries to families in need, serving over 10,000 people monthly.',
        gallery2Image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop',
        gallery2Title: 'Restaurant Partners',
        gallery2Desc: 'Working with 200+ restaurants and grocers to rescue surplus food daily. Our AI routing ensures food reaches recipients within 60 minutes of donation.',
        gallery3Image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop',
        gallery3Title: 'Environmental Impact',
        gallery3Desc: 'By preventing food waste, we\'ve reduced over 1,200 tons of CO2 emissions and conserved resources equivalent to 30 million gallons of water.',
        galleryButtonText: 'View All Stories',
        ctaTitle: 'Be Part of Our Story',
        ctaSubtitle: 'Every meal shared, every pound of food saved, every life touched—it all starts with you.',
        ctaButton1Text: 'Join the Platform',
        ctaButton2Text: 'Support Our Mission',
        newsletterTitle: 'Stay Updated on Our Impact',
        newsletterDesc: 'Subscribe to our newsletter for inspiring stories, impact updates, and ways to get involved in fighting food waste.',
        newsletterFirstNameLabel: 'First Name *',
        newsletterLastNameLabel: 'Last Name *',
        newsletterEmailLabel: 'Email Address *',
        newsletterConsent: 'I agree to receive updates and newsletters from DoGoods. You can unsubscribe at any time.',
        newsletterButtonText: 'Subscribe to Newsletter',
        newsletterButtonSubmitting: 'Subscribing...'
    };
    
    const [editableContent, setEditableContent] = useState(defaultContent);
    const [originalContent, setOriginalContent] = useState(defaultContent);

    // Load saved content on mount
    useEffect(() => {
        const loadSavedContent = async () => {
            try {
                // Try loading from Supabase first
                const { data, error } = await supabase
                    .from('page_content')
                    .select('content')
                    .eq('page_name', 'impact-story')
                    .maybeSingle();

                if (data && !error && data.content) {
                    // Merge saved content with defaults to ensure all fields exist
                    setEditableContent({ ...defaultContent, ...data.content });
                } else {
                    // Fallback to localStorage
                    const saved = localStorage.getItem('impactStoryContent');
                    if (saved) {
                        const parsedContent = JSON.parse(saved);
                        setEditableContent({ ...defaultContent, ...parsedContent });
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
                const saved = localStorage.getItem('impactStoryContent');
                if (saved) {
                    try {
                        const parsedContent = JSON.parse(saved);
                        setEditableContent({ ...defaultContent, ...parsedContent });
                    } catch (parseError) {
                        console.error('Error parsing saved content:', parseError);
                    }
                }
            }
        };

        loadSavedContent();
    }, []);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setNewsletterError('');
        setNewsletterSuccess(false);
        
        const formData = new FormData(e.target);
        const data = {
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            email: formData.get('email'),
            consent: formData.get('consent') === 'on',
            source: 'impact-story-page'
        };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            setNewsletterError('Please enter a valid email address.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if already subscribed
            const { data: existing, error: checkError } = await supabase
                .from('newsletter_subscriptions')
                .select('email, is_active')
                .eq('email', data.email)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking subscription:', checkError);
            }

            if (existing) {
                if (existing.is_active) {
                    setNewsletterError('This email is already subscribed!');
                    setIsSubmitting(false);
                    return;
                } else {
                    // Reactivate subscription
                    const { error: updateError } = await supabase
                        .from('newsletter_subscriptions')
                        .update({ 
                            is_active: true, 
                            subscribed_at: new Date().toISOString(),
                            first_name: data.first_name,
                            last_name: data.last_name,
                            consent: data.consent 
                        })
                        .eq('email', data.email);

                    if (updateError) {
                        throw updateError;
                    }
                }
            } else {
                // New subscription
                const { error: insertError } = await supabase
                    .from('newsletter_subscriptions')
                    .insert([data]);

                if (insertError) {
                    throw insertError;
                }
            }

            setNewsletterSuccess(true);
            setTimeout(() => setNewsletterSuccess(false), 5000);
            e.target.reset();
            
            console.log('Newsletter subscription successful:', data.email);
        } catch (error) {
            console.error('Error submitting newsletter:', error);
            reportError(error, { context: 'Newsletter subscription' });
            
            // Fallback to localStorage
            try {
                const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions') || '[]');
                const alreadySubscribed = subscriptions.some(sub => sub.email === data.email);
                
                if (!alreadySubscribed) {
                    subscriptions.push({ ...data, timestamp: new Date().toISOString() });
                    localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));
                    setNewsletterSuccess(true);
                    setTimeout(() => setNewsletterSuccess(false), 5000);
                    e.target.reset();
                } else {
                    setNewsletterError('This email is already subscribed!');
                }
            } catch (localError) {
                setNewsletterError('Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Admin edit functions
    const toggleEditMode = () => {
        if (!isAdmin) return;
        
        if (!isEditMode) {
            // Entering edit mode - save original content
            setOriginalContent({ ...editableContent });
        }
        setIsEditMode(!isEditMode);
    };

    const handleContentEdit = (key, value) => {
        console.log(`Editing ${key}:`, value);
        setEditableContent(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleImageEdit = (key, currentUrl) => {
        if (!isEditMode) return;
        
        const newUrl = prompt('Enter new image URL:', currentUrl);
        if (newUrl && newUrl !== currentUrl) {
            console.log(`Updating image ${key}:`, newUrl);
            setEditableContent(prev => ({
                ...prev,
                [key]: newUrl
            }));
        }
    };

    const saveChanges = async () => {
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        try {
            // Verify user is authenticated and admin
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert('⚠️ You must be logged in to save changes.');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = '💾 Save Changes';
                }
                return;
            }

            console.log('Current user:', user.id);
            console.log('Saving content:', editableContent);
            
            // Check if user is admin in database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_admin, email')
                .eq('id', user.id)
                .single();

            if (userError) {
                console.error('Error checking admin status:', userError);
                alert(`⚠️ Could not verify admin status: ${userError.message}`);
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = '💾 Save Changes';
                }
                return;
            }

            if (!userData?.is_admin) {
                alert('⚠️ Only administrators can save changes to this page.');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = '💾 Save Changes';
                }
                return;
            }

            console.log('Admin verified:', userData.email);
            
            // Save to Supabase
            const { data, error } = await supabase
                .from('page_content')
                .upsert({
                    page_name: 'impact-story',
                    content: editableContent,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'page_name'
                })
                .select();

            if (error) {
                console.error('Supabase save error:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                alert(`❌ Failed to save changes to the server:\n\n${error.message}\n\nError code: ${error.code}\n\nChanges will only be saved locally.`);
                // Fallback to localStorage
                localStorage.setItem('impactStoryContent', JSON.stringify(editableContent));
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = '💾 Save Changes';
                }
            } else {
                console.log('✅ Successfully saved to Supabase:', data);
                // Also save to localStorage as backup
                localStorage.setItem('impactStoryContent', JSON.stringify(editableContent));
                // Update original content to the newly saved content
                setOriginalContent({ ...editableContent });
                alert('✅ Changes saved successfully to database!');
                setIsEditMode(false);
                // Re-enable button in case user wants to edit again
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = '💾 Save Changes';
                }
            }
        } catch (error) {
            console.error('Unexpected error saving changes:', error);
            reportError(error, { context: 'Impact story edit' });
            alert(`❌ An unexpected error occurred:\n\n${error.message}\n\nChanges will only be saved locally.`);
            // Still save to localStorage
            localStorage.setItem('impactStoryContent', JSON.stringify(editableContent));
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = '💾 Save Changes';
            }
        }
    };

    const cancelEdit = () => {
        setEditableContent({ ...originalContent });
        setIsEditMode(false);
    };

    const getContent = (key, defaultValue) => {
        return editableContent[key] || defaultValue;
    };

    return (
        <div className="bg-gray-50 -mx-6 md:-mx-10 -my-6 md:-my-10">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.8s ease-out forwards; }
                .stat-card { transition: transform 0.3s ease; }
                .stat-card:hover { transform: translateY(-5px); }
                
                .editable {
                    position: relative;
                }
                
                .edit-mode .editable {
                    outline: 2px dashed #3b82f6;
                    outline-offset: 4px;
                    cursor: text;
                    min-height: 30px;
                    padding: 4px;
                }
                
                .edit-mode .editable:hover {
                    outline-color: #1d4ed8;
                    background: rgba(59, 130, 246, 0.05);
                }
                
                .edit-mode .editable:focus {
                    outline-color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }
                
                .admin-edit-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    z-index: 1000;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.5);
                    transition: all 0.3s ease;
                }
                
                .admin-edit-btn:hover {
                    transform: scale(1.1) rotate(90deg);
                    box-shadow: 0 15px 35px rgba(59, 130, 246, 0.7);
                }
                
                .admin-edit-btn.editing {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }
                
                .edit-toolbar {
                    position: fixed;
                    top: 100px;
                    right: 2rem;
                    z-index: 1000;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    padding: 1rem;
                    display: none;
                }
                
                .edit-mode .edit-toolbar {
                    display: block;
                }
                
                .editable-image {
                    position: relative;
                    cursor: pointer;
                }
                
                .edit-mode .editable-image::after {
                    content: '📷 Click to edit image URL';
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .edit-mode .editable-image:hover::after {
                    opacity: 1;
                }
                
                .edit-mode .editable-image img {
                    outline: 2px dashed #3b82f6;
                    outline-offset: 4px;
                }
                
                .edit-mode .editable-image:hover img {
                    outline-color: #1d4ed8;
                    opacity: 0.8;
                }

                .edit-mode-banner {
                    animation: slideUp 0.5s ease-out;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .save-btn:disabled {
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.8; }
                }
            `}</style>

            {/* Admin Edit Button */}
            {isAdmin && (
                <>
                    <button
                        onClick={toggleEditMode}
                        className={`admin-edit-btn ${isEditMode ? 'editing' : ''}`}
                        title="Admin Edit Mode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>

                    {isEditMode && (
                        <div className="edit-toolbar">
                            <h3 className="font-bold text-gray-900 mb-3">Edit Mode Active</h3>
                            <p className="text-sm text-gray-600 mb-4">Click on any section to edit</p>
                            <button
                                onClick={saveChanges}
                                className="save-btn w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                💾 Save Changes
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    )}
                </>
            )}

            <div className={isEditMode ? 'edit-mode' : ''}>
            {/* Floating Save Bar for Edit Mode */}
            {isEditMode && (
                <div className="edit-mode-banner fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 shadow-2xl">
                    <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-lg font-bold">✏️ Edit Mode Active</p>
                            <p className="text-sm text-green-100">Click on any text or image to edit. Changes will be saved to the database.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={saveChanges}
                                className="save-btn bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                💾 Save Changes
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all transform hover:scale-105"
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Hero Section */}
            <section className="bg-[#D9E1F1] py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <EditableText
                        tag="h1"
                        content={getContent('heroTitle', 'Our Impact Story')}
                        onEdit={(value) => handleContentEdit('heroTitle', value)}
                        isEditable={isEditMode}
                        className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 fade-in editable"
                    />
                    <EditableText
                        tag="p"
                        content={getContent('heroSubtitle', 'Transforming food waste into community nourishment through AI-powered logistics and compassionate connections')}
                        onEdit={(value) => handleContentEdit('heroSubtitle', value)}
                        isEditable={isEditMode}
                        className="text-xl text-gray-700 max-w-3xl mx-auto fade-in mb-8 editable"
                    />
                    <div className="flex justify-center gap-8 mt-8">
                        <a href="#featured" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            Featured
                        </a>
                        <a href="#news" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            News
                        </a>
                        <a href="#stories" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            Stories
                        </a>
                    </div>
                </div>
            </section>

            {/* Featured Section */}
            <section id="featured" className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div 
                            className="editable-image"
                            onClick={() => handleImageEdit('featuredImage', getContent('featuredImage', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop'))}
                        >
                            <img 
                                src={getContent('featuredImage', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop')}
                                alt="Food Distribution" 
                                className="rounded-2xl shadow-2xl w-full h-auto" 
                            />
                        </div>
                        <div>
                            <h1 
                                className="text-4xl font-bold text-gray-900 mb-6 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('featuredTitle', e.target.textContent)}
                            >
                                {getContent('featuredTitle', 'Bridging the Gap Between Surplus and Need')}
                            </h1>
                            <p 
                                className="text-lg text-gray-600 leading-relaxed mb-6 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('featuredP1', e.target.textContent)}
                            >
                                {getContent('featuredP1', 'Every day, restaurants, grocery stores, and food producers have perfectly good food that goes to waste, while families in our communities struggle with food insecurity. DoGoods uses AI-powered logistics to bridge this gap in real-time.')}
                            </p>
                            <p 
                                className="text-lg text-gray-600 leading-relaxed mb-6 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('featuredP2', e.target.textContent)}
                            >
                                {getContent('featuredP2', 'Our platform connects donors with recipients within minutes, ensuring fresh food reaches those who need it most. Through intelligent routing and automated coordination, we\'ve created a seamless network that turns potential waste into community nourishment.')} 
                            </p>
                            {/* TEMPORARILY DISABLED
                            <button onClick={() => window.location.href='/share'} 
                                className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2">
                                <span 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('featuredButtonText', e.target.textContent)}
                                >
                                    {getContent('featuredButtonText', 'Join Our Network →')}
                                </span>
                            </button>
                            */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stories Section */}
            <section id="stories" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <div 
                                className="editable-image"
                                onClick={() => handleImageEdit('sarahImage', getContent('sarahImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('sarahImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop')}
                                    alt="Community Impact" 
                                    className="rounded-2xl shadow-2xl w-full h-auto mb-6" 
                                />
                            </div>
                            <h1 
                                className="text-3xl font-bold text-gray-900 mb-4 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('sarahTitle', e.target.textContent)}
                            >
                                {getContent('sarahTitle', 'Sarah\'s Story: From Volunteer to Champion')}
                            </h1>
                            <p 
                                className="text-gray-600 leading-relaxed editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('sarahQuote', e.target.textContent)}
                            >
                                {getContent('sarahQuote', '"I started as a volunteer driver, picking up surplus food from local restaurants. Now I coordinate our entire network in the Bay Area. Seeing families receive fresh, nutritious meals—food that would have been wasted—gives me purpose every single day. We\'re not just feeding people; we\'re building a community that cares."')}
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                <strong 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('sarahAttribution', e.target.textContent)}
                                >
                                    {getContent('sarahAttribution', '— Sarah Martinez, Community Coordinator, Alameda')}
                                </strong>
                            </p>
                        </div>

                        <div>
                            <div 
                                className="editable-image"
                                onClick={() => handleImageEdit('michaelImage', getContent('michaelImage', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('michaelImage', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop')}
                                    alt="Food Distribution" 
                                    className="rounded-2xl shadow-2xl w-full h-auto mb-6" 
                                />
                            </div>
                            <h1 
                                className="text-3xl font-bold text-gray-900 mb-4 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('michaelTitle', e.target.textContent)}
                            >
                                {getContent('michaelTitle', 'Restaurant Partnership: A Win-Win Solution')}
                            </h1>
                            <p 
                                className="text-gray-600 leading-relaxed editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('michaelQuote', e.target.textContent)}
                            >
                                {getContent('michaelQuote', '"As a restaurant owner, I used to feel terrible about food waste at the end of each day. DoGoods transformed that guilt into impact. Now, instead of throwing away perfectly good food, I know it\'s helping families in our neighborhood. The platform makes it effortless—I post what I have, and within an hour, it\'s picked up and distributed."')}
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                <strong 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('michaelAttribution', e.target.textContent)}
                                >
                                    {getContent('michaelAttribution', '— Michael Chen, Owner, Golden Wok Restaurant')}
                                </strong>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section id="news" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex items-center">
                        <div 
                            className="editable-image w-full"
                            onClick={() => handleImageEdit('newsImage', getContent('newsImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop'))}
                        >
                            <img 
                                src={getContent('newsImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop')}
                                alt="Impact Story" 
                                className="w-full h-[400px] object-cover rounded-2xl" 
                            />
                        </div>
                        
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-full md:w-1/2 bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl">
                            <blockquote 
                                className="text-xl font-bold text-gray-900 mb-6 italic editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('newsQuote', e.target.textContent)}
                            >
                                {getContent('newsQuote', '"DoGoods helped us feed over 500 families during the holidays. The AI routing meant we could distribute fresh food within 2 hours of donation—something that was impossible before."')}
                            </blockquote>
                            <p className="text-gray-600 mb-4">
                                <strong 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('newsAttribution', e.target.textContent)}
                                >
                                    {getContent('newsAttribution', 'Director of Community Services')}
                                </strong><br />
                                <span 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('newsOrg', e.target.textContent)}
                                >
                                    {getContent('newsOrg', 'Alameda County Food Bank')}
                                </span>
                            </p>
                            <p 
                                className="text-sm text-gray-500 mb-6 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('newsStats', e.target.textContent)}
                            >
                                {getContent('newsStats', "Thanks to our network of 150+ partners, we've prevented over 2 million pounds of food waste while providing nutritious meals to families who need them most.")}
                            </p>
                            <a href="https://allgoodlivingfoundation.org/donate/" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                                <span 
                                    className="editable"
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('newsButtonText', e.target.textContent)}
                                >
                                    {getContent('newsButtonText', 'Support Our Mission')}
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <div 
                                className="editable-image"
                                onClick={() => handleImageEdit('gallery1Image', getContent('gallery1Image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('gallery1Image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop')}
                                    alt="Community" 
                                    className="rounded-2xl shadow-lg w-full h-64 object-cover mb-4" 
                                />
                            </div>
                            <h3 
                                className="text-xl font-bold text-gray-900 mb-2 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery1Title', e.target.textContent)}
                            >
                                {getContent('gallery1Title', 'Community Centers')}
                            </h3>
                            <p 
                                className="text-gray-600 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery1Desc', e.target.textContent)}
                            >
                                {getContent('gallery1Desc', 'Partnering with 45+ community centers across the Bay Area to provide fresh meals and groceries to families in need, serving over 10,000 people monthly.')}
                            </p>
                        </div>

                        <div>
                            <div 
                                className="editable-image"
                                onClick={() => handleImageEdit('gallery2Image', getContent('gallery2Image', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('gallery2Image', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop')}
                                    alt="Food Distribution" 
                                    className="rounded-2xl shadow-lg w-full h-64 object-cover mb-4" 
                                />
                            </div>
                            <h3 
                                className="text-xl font-bold text-gray-900 mb-2 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery2Title', e.target.textContent)}
                            >
                                {getContent('gallery2Title', 'Restaurant Partners')}
                            </h3>
                            <p 
                                className="text-gray-600 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery2Desc', e.target.textContent)}
                            >
                                {getContent('gallery2Desc', 'Working with 200+ restaurants and grocers to rescue surplus food daily. Our AI routing ensures food reaches recipients within 60 minutes of donation.')}
                            </p>
                        </div>

                        <div>
                            <div 
                                className="editable-image"
                                onClick={() => handleImageEdit('gallery3Image', getContent('gallery3Image', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('gallery3Image', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop')}
                                    alt="Impact" 
                                    className="rounded-2xl shadow-lg w-full h-64 object-cover mb-4" 
                                />
                            </div>
                            <h3 
                                className="text-xl font-bold text-gray-900 mb-2 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery3Title', e.target.textContent)}
                            >
                                {getContent('gallery3Title', 'Environmental Impact')}
                            </h3>
                            <p 
                                className="text-gray-600 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('gallery3Desc', e.target.textContent)}
                            >
                                {getContent('gallery3Desc', 'By preventing food waste, we\'ve reduced over 1,200 tons of CO2 emissions and conserved resources equivalent to 30 million gallons of water.')}
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <button onClick={() => navigate('/stories')} 
                            className="bg-[#2CABE3] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            <span 
                                className="editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('galleryButtonText', e.target.textContent)}
                            >
                                {getContent('galleryButtonText', 'View All Stories')}
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-[#171366] py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 
                        className="text-4xl md:text-5xl font-bold text-white mb-6 editable"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => handleContentEdit('ctaTitle', e.target.textContent)}
                    >
                        {getContent('ctaTitle', 'Be Part of Our Story')}
                    </h2>
                    <p 
                        className="text-xl text-white/90 mb-8 editable"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => handleContentEdit('ctaSubtitle', e.target.textContent)}
                    >
                        {getContent('ctaSubtitle', 'Every meal shared, every pound of food saved, every life touched—it all starts with you.')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* TEMPORARILY DISABLED
                        <a href="/share" 
                            className="bg-[#2CABE3] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg">
                            <span 
                                className="editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('ctaButton1Text', e.target.textContent)}
                            >
                                {getContent('ctaButton1Text', 'Join the Platform')}
                            </span>
                        </a>
                        */}
                        <a href="https://allgoodlivingfoundation.org/donate/" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#2CABE3] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg">
                            <span 
                                className="editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('ctaButton2Text', e.target.textContent)}
                            >
                                {getContent('ctaButton2Text', 'Support Our Mission')}
                            </span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="bg-white py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 md:p-12 shadow-xl border border-green-100">
                        <div className="text-center mb-8">
                            <h2 
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('newsletterTitle', e.target.textContent)}
                            >
                                {getContent('newsletterTitle', 'Stay Updated on Our Impact')}
                            </h2>
                            <p 
                                className="text-lg text-gray-600 editable"
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('newsletterDesc', e.target.textContent)}
                            >
                                {getContent('newsletterDesc', 'Subscribe to our newsletter for inspiring stories, impact updates, and ways to get involved in fighting food waste.')}
                            </p>
                        </div>

                        <form onSubmit={handleNewsletterSubmit} className="max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span 
                                            className="editable"
                                            contentEditable={isEditMode}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleContentEdit('newsletterFirstNameLabel', e.target.textContent)}
                                        >
                                            {getContent('newsletterFirstNameLabel', 'First Name *')}
                                        </span>
                                    </label>
                                    <input type="text" name="firstName" required 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                        placeholder="John" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span 
                                            className="editable"
                                            contentEditable={isEditMode}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleContentEdit('newsletterLastNameLabel', e.target.textContent)}
                                        >
                                            {getContent('newsletterLastNameLabel', 'Last Name *')}
                                        </span>
                                    </label>
                                    <input type="text" name="lastName" required 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                        placeholder="Doe" />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span 
                                        className="editable"
                                        contentEditable={isEditMode}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleContentEdit('newsletterEmailLabel', e.target.textContent)}
                                    >
                                        {getContent('newsletterEmailLabel', 'Email Address *')}
                                    </span>
                                </label>
                                <input type="email" name="email" required 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                    placeholder="john@example.com" />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-start">
                                    <input type="checkbox" name="consent" required 
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1" />
                                    <span 
                                        className="ml-2 text-sm text-gray-600 editable"
                                        contentEditable={isEditMode}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleContentEdit('newsletterConsent', e.target.textContent)}
                                    >
                                        {getContent('newsletterConsent', 'I agree to receive updates and newsletters from DoGoods. You can unsubscribe at any time.')}
                                    </span>
                                </label>
                            </div>

                            {newsletterSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-center">
                                    <svg className="inline-block w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <strong>Success!</strong> You&apos;ve been subscribed to our newsletter.
                                </div>
                            )}

                            {newsletterError && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-center">
                                    <strong>Error!</strong> {newsletterError}
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting}
                                className="w-full bg-[#2CABE3] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                                {isSubmitting ? getContent('newsletterButtonSubmitting', 'Subscribing...') : getContent('newsletterButtonText', 'Subscribe to Newsletter')}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                We respect your privacy. Read our <a href="/privacy" className="text-green-600 hover:text-green-700 underline">Privacy Policy</a>.
                            </p>
                        </form>
                    </div>
                </div>
            </section>
            </div>
        </div>
    );
}

export default ImpactStory;
