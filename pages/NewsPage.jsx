import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

function NewsPage() {
    const { isAdmin } = useAuthContext();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableContent, setEditableContent] = useState({});
    const [originalContent, setOriginalContent] = useState({});

    // Load saved content on mount
    useEffect(() => {
        const loadSavedContent = async () => {
            try {
                const { data, error } = await supabase
                    .from('page_content')
                    .select('content')
                    .eq('page_name', 'news')
                    .maybeSingle();

                if (data && !error) {
                    setEditableContent(data.content);
                } else {
                    const saved = localStorage.getItem('newsPageContent');
                    if (saved) {
                        setEditableContent(JSON.parse(saved));
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
                const saved = localStorage.getItem('newsPageContent');
                if (saved) {
                    setEditableContent(JSON.parse(saved));
                }
            }
        };

        loadSavedContent();
    }, []);

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const toggleEditMode = () => {
        if (!isAdmin) return;
        
        if (!isEditMode) {
            setOriginalContent({ ...editableContent });
        }
        setIsEditMode(!isEditMode);
    };

    const handleContentEdit = (key, value) => {
        setEditableContent(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleImageEdit = (key, currentUrl) => {
        if (!isEditMode) return;
        
        const newUrl = prompt('Enter new image URL:', currentUrl);
        if (newUrl && newUrl !== currentUrl) {
            setEditableContent(prev => ({
                ...prev,
                [key]: newUrl
            }));
        }
    };

    const saveChanges = async () => {
        try {
            const { error } = await supabase
                .from('page_content')
                .upsert({
                    page_name: 'news',
                    content: editableContent,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving to Supabase:', error);
                localStorage.setItem('newsPageContent', JSON.stringify(editableContent));
            }

            localStorage.setItem('newsPageContent', JSON.stringify(editableContent));
            
            alert('Changes saved successfully!');
            setIsEditMode(false);
        } catch (error) {
            console.error('Error saving changes:', error);
            reportError(error, { context: 'News page edit' });
            localStorage.setItem('newsPageContent', JSON.stringify(editableContent));
            alert('Saved to local storage. Changes may not persist across sessions.');
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
        <div className="min-h-screen bg-gray-50">
            {/* Admin Edit Controls */}
            {isAdmin && (
                <div className="fixed top-20 right-4 z-50">
                    <button
                        onClick={toggleEditMode}
                        className={`px-4 py-2 rounded-lg font-semibold shadow-lg transition-all ${
                            isEditMode 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {isEditMode ? '✕ Cancel Edit' : '✏️ Edit Page'}
                    </button>
                    {isEditMode && (
                        <button
                            onClick={saveChanges}
                            className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                        >
                            💾 Save Changes
                        </button>
                    )}
                </div>
            )}

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 
                        className={`text-5xl md:text-6xl font-bold text-gray-900 mb-6 ${isEditMode ? 'border-2 border-dashed border-blue-400 p-4 cursor-pointer' : ''}`}
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => handleContentEdit('heroTitle', e.target.textContent)}
                    >
                        {getContent('heroTitle', 'DoGoods News & Updates')}
                    </h1>
                    <p 
                        className={`text-xl text-gray-700 max-w-3xl mx-auto ${isEditMode ? 'border-2 border-dashed border-blue-400 p-4 cursor-pointer' : ''}`}
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => handleContentEdit('heroSubtitle', e.target.textContent)}
                    >
                        {getContent('heroSubtitle', 'Stay informed about our latest milestones, partnerships, and community impact in the fight against food waste.')}
                    </p>
                </div>
            </section>

            {/* Featured News Article */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div
                            className={`relative ${isEditMode ? 'border-2 border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                            onClick={() => isEditMode && handleImageEdit('featuredImage', getContent('featuredImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop'))}
                        >
                            <img 
                                src={getContent('featuredImage', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop')}
                                alt="Featured news" 
                                className="rounded-2xl shadow-2xl w-full h-auto" 
                            />
                        </div>
                        <div>
                            <span className="text-[#2CABE3] font-semibold text-sm uppercase tracking-wide">Featured Article</span>
                            <h2 
                                className={`text-4xl font-bold text-gray-900 mt-4 mb-6 ${isEditMode ? 'border-2 border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('featuredTitle', e.target.textContent)}
                            >
                                {getContent('featuredTitle', 'DoGoods Reaches 2 Million Pounds Milestone')}
                            </h2>
                            <p 
                                className={`text-gray-600 text-lg leading-relaxed mb-6 ${isEditMode ? 'border-2 border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit('featuredContent', e.target.textContent)}
                            >
                                {getContent('featuredContent', 'This month, we celebrated a major milestone: rescuing over 2 million pounds of food from waste while feeding thousands of families across the Bay Area. Through our AI-powered platform and the dedication of our community partners, we\'ve transformed potential waste into nourishment and hope.')}
                            </p>
                            <Link to="/impact" className="inline-flex items-center text-[#2CABE3] font-semibold hover:underline">
                                Read Full Story →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent News Grid */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Recent Updates</h2>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* News Item 1 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <div
                                className={`${isEditMode ? 'border-2 border-dashed border-blue-400 cursor-pointer' : ''}`}
                                onClick={() => isEditMode && handleImageEdit('news1Image', getContent('news1Image', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('news1Image', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop')}
                                    alt="News 1" 
                                    className="w-full h-48 object-cover" 
                                />
                            </div>
                            <div className="p-6">
                                <span className="text-sm text-gray-500">February 2026</span>
                                <h3 
                                    className={`text-xl font-bold text-gray-900 mt-2 mb-3 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news1Title', e.target.textContent)}
                                >
                                    {getContent('news1Title', 'Partnership with Bay Area Food Banks')}
                                </h3>
                                <p 
                                    className={`text-gray-600 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news1Content', e.target.textContent)}
                                >
                                    {getContent('news1Content', 'We\'ve expanded our network with 15 new food bank partnerships, increasing our distribution capacity by 40%.')}
                                </p>
                            </div>
                        </div>

                        {/* News Item 2 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <div
                                className={`${isEditMode ? 'border-2 border-dashed border-blue-400 cursor-pointer' : ''}`}
                                onClick={() => isEditMode && handleImageEdit('news2Image', getContent('news2Image', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('news2Image', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop')}
                                    alt="News 2" 
                                    className="w-full h-48 object-cover" 
                                />
                            </div>
                            <div className="p-6">
                                <span className="text-sm text-gray-500">January 2026</span>
                                <h3 
                                    className={`text-xl font-bold text-gray-900 mt-2 mb-3 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news2Title', e.target.textContent)}
                                >
                                    {getContent('news2Title', 'AI Routing Reduces Response Time')}
                                </h3>
                                <p 
                                    className={`text-gray-600 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news2Content', e.target.textContent)}
                                >
                                    {getContent('news2Content', 'Our upgraded AI system now connects donors to recipients in under 30 minutes, ensuring fresher food delivery.')}
                                </p>
                            </div>
                        </div>

                        {/* News Item 3 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <div
                                className={`${isEditMode ? 'border-2 border-dashed border-blue-400 cursor-pointer' : ''}`}
                                onClick={() => isEditMode && handleImageEdit('news3Image', getContent('news3Image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'))}
                            >
                                <img 
                                    src={getContent('news3Image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop')}
                                    alt="News 3" 
                                    className="w-full h-48 object-cover" 
                                />
                            </div>
                            <div className="p-6">
                                <span className="text-sm text-gray-500">December 2025</span>
                                <h3 
                                    className={`text-xl font-bold text-gray-900 mt-2 mb-3 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news3Title', e.target.textContent)}
                                >
                                    {getContent('news3Title', 'Holiday Drive Feeds 500+ Families')}
                                </h3>
                                <p 
                                    className={`text-gray-600 ${isEditMode ? 'border border-dashed border-blue-400 p-2 cursor-pointer' : ''}`}
                                    contentEditable={isEditMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleContentEdit('news3Content', e.target.textContent)}
                                >
                                    {getContent('news3Content', 'Our holiday campaign successfully provided fresh meals and groceries to over 500 families in need.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Press & Media Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">In The Media</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="border-l-4 border-[#2CABE3] pl-6">
                            <p className="text-gray-600 italic mb-2">"DoGoods is revolutionizing food rescue with innovative AI technology..."</p>
                            <p className="text-sm text-gray-500">- Bay Area Chronicle, February 2026</p>
                        </div>
                        <div className="border-l-4 border-[#2CABE3] pl-6">
                            <p className="text-gray-600 italic mb-2">"A game-changer in the fight against food waste and hunger..."</p>
                            <p className="text-sm text-gray-500">- Tech for Good Magazine, January 2026</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Stay Connected</h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Want to be the first to hear about our latest news and updates?
                    </p>
                    <Link 
                        to="/impact" 
                        className="inline-block bg-[#2CABE3] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                    >
                        Subscribe to Newsletter
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default NewsPage;
