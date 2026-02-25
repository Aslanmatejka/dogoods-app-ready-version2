import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

function ImpactStory() {
    const { isAdmin } = useAuthContext();
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [modalImage, setModalImage] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Newsletter form state
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [newsletterError, setNewsletterError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContent();
        window.scrollTo(0, 0);
    }, []);

    const loadContent = async () => {
        setLoading(true);
        try {
            // Load testimonial stories
            const { data: storiesData } = await supabase
                .from('impact_stories')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            
            //Load gallery items
            const { data: galleryData } = await supabase
                .from('impact_gallery')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            
            setStories(storiesData || []);
            setGallery(galleryData || []);
        } catch (error) {
            console.error('Error loading content:', error);
            reportError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = (item) => {
        setModalImage(item);
    };

    const closeModal = () => {
        setModalImage(null);
    };

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
            const { data: existing } = await supabase
                .from('newsletter_subscriptions')
                .select('email, is_active')
                .eq('email', data.email)
                .maybeSingle();

            if (existing) {
                if (existing.is_active) {
                    setNewsletterError('This email is already subscribed!');
                    setIsSubmitting(false);
                    return;
                } else {
                    await supabase
                        .from('newsletter_subscriptions')
                        .update({ 
                            is_active: true, 
                            subscribed_at: new Date().toISOString(),
                            first_name: data.first_name,
                            last_name: data.last_name,
                            consent: data.consent 
                        })
                        .eq('email', data.email);
                }
            } else {
                await supabase
                    .from('newsletter_subscriptions')
                    .insert([data]);
            }

            setNewsletterSuccess(true);
            setTimeout(() => setNewsletterSuccess(false), 5000);
            e.target.reset();
        } catch (error) {
            console.error('Error submitting newsletter:', error);
            setNewsletterError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 -mx-6 md:-mx-10 -my-6 md:-my-10">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.8s ease-out forwards; }
                .clickable-image {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .clickable-image:hover {
                    transform: scale(1.02);
                }
                .clickable-image::before {
                    content: '� Click to read more';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(44, 171, 227, 0.95);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                    z-index: 10;
                }
                .clickable-image:hover::before {
                    opacity: 1;
                }
                .clickable-image img {
                    transition: filter 0.3s ease;
                }
                .clickable-image:hover img {
                    filter: brightness(0.9);
                }
            `}</style>

            {/* Detail Modal */}
            {modalImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div 
                        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-lg z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Header with image thumbnail */}
                        <div className="flex flex-col md:flex-row">
                            {modalImage.image_url && (
                                <div className="md:w-2/5 flex-shrink-0">
                                    <img 
                                        src={modalImage.image_url} 
                                        alt={modalImage.title}
                                        className="w-full h-64 md:h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'; }}
                                    />
                                </div>
                            )}
                            <div className={`p-8 flex flex-col justify-center ${modalImage.image_url ? 'md:w-3/5' : 'w-full'}`}>
                                {/* Category / Type badge */}
                                {(modalImage.type || modalImage.category) && (
                                    <span className="inline-block self-start px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3 uppercase tracking-wide">
                                        {modalImage.type === 'featured' ? 'Featured Story' : modalImage.type === 'testimonial' ? 'Testimonial' : modalImage.type === 'news' ? 'News' : modalImage.category || 'Gallery'}
                                    </span>
                                )}
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{modalImage.title}</h2>
                                {modalImage.attribution && (
                                    <p className="text-sm text-gray-500 mb-1">By <strong>{modalImage.attribution}</strong>{modalImage.organization && ` · ${modalImage.organization}`}</p>
                                )}
                                {modalImage.created_at && (
                                    <p className="text-xs text-gray-400 mb-4">
                                        {new Date(modalImage.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Full content body */}
                        <div className="px-8 pb-8">
                            <hr className="mb-6 border-gray-200" />
                            {/* Quote / Main content */}
                            {modalImage.quote && (
                                <div className="mb-6">
                                    <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#2CABE3]">
                                        <p className="text-lg text-gray-700 leading-relaxed italic">&ldquo;{modalImage.quote}&rdquo;</p>
                                    </div>
                                </div>
                            )}
                            {/* Description (for gallery items) */}
                            {modalImage.description && !modalImage.quote && (
                                <p className="text-lg text-gray-700 leading-relaxed mb-6">{modalImage.description}</p>
                            )}
                            {/* Additional description if both exist */}
                            {modalImage.description && modalImage.quote && (
                                <p className="text-gray-600 leading-relaxed mb-6">{modalImage.description}</p>
                            )}
                            {/* Stats */}
                            {modalImage.stats && (
                                <div className="bg-green-50 rounded-xl p-4 mb-6">
                                    <p className="text-green-800 font-medium">📊 {modalImage.stats}</p>
                                </div>
                            )}
                            {/* Meta info row */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                {modalImage.organization && (
                                    <span className="flex items-center gap-1">🏢 {modalImage.organization}</span>
                                )}
                                {modalImage.category && (
                                    <span className="flex items-center gap-1">🏷️ {modalImage.category}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Edit Button */}
            {isAdmin && (
                <button
                    onClick={() => navigate('/admin/impact-content')}
                    className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-2xl hover:shadow-xl transition-all transform hover:scale-105"
                >
                    ✏️ Manage Content
                </button>
            )}
            {/* Hero Section */}
            <section className="bg-[#D9E1F1] py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 fade-in">
                        Our Impact Story
                    </h1>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto fade-in mb-8">
                        Transforming food waste into community nourishment through AI-powered logistics and compassionate connections
                    </p>
                    <div className="flex justify-center gap-8 mt-8">
                        <Link to="/featured" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            Featured
                        </Link>
                        <Link to="/news" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            News
                        </Link>
                        <Link to="/testimonials" className="bg-[#2CABE3] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                            Testimonials
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Stories - First item type='featured' from database */}
            {stories.filter(s => s.type === 'featured').slice(0, 1).map((story) => (
                <section key={story.id} id="featured" className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div 
                                className="clickable-image"
                                onClick={() => handleImageClick(story)}
                            >
                                <img 
                                    src={story.image_url}
                                    alt={story.title} 
                                    className="rounded-2xl shadow-2xl w-full h-auto"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop'; }}
                                />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-6">{story.title}</h1>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">{story.quote || story.description}</p>
                                {story.stats && (
                                    <p className="text-gray-600 mb-6">{story.stats}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {/* Testimonial Stories */}
            {stories.filter(s => s.type === 'testimonial').length > 0 && (
                <section id="stories" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {stories.filter(s => s.type === 'testimonial').map((story) => (
                                <div key={story.id} className="bg-white rounded-2xl shadow-lg p-8">
                                    <div className="text-4xl text-[#2CABE3] mb-4">&ldquo;</div>
                                    <p className="text-gray-600 leading-relaxed text-lg italic mb-6">{story.quote}</p>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{story.title}</h3>
                                    <p className="text-gray-500">
                                        <strong>— {story.attribution}{story.organization && `, ${story.organization}`}</strong>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {gallery.length > 0 && (
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {gallery.map((item) => (
                                <div key={item.id}>
                                    <div 
                                        className="clickable-image"
                                        onClick={() => handleImageClick(item)}
                                    >
                                        <img 
                                            src={item.image_url}
                                            alt={item.title}
                                            className="rounded-2xl shadow-lg w-full h-64 object-cover mb-4" 
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Be Part of Our Story</h2>
                    <p className="text-xl text-gray-600 mb-10">
                        Every meal shared, every pound of food saved, every life touched—it all starts with you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup" className="bg-[#2CABE3] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg">
                            Join the Platform
                        </Link>
                        <Link to="/donate" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg">
                            Support Our Mission
                        </Link>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated on Our Impact</h2>
                        <p className="text-gray-600">
                            Subscribe to our newsletter for inspiring stories, impact updates, and ways to get involved in fighting food waste.
                        </p>
                    </div>
                    <form onSubmit={handleNewsletterSubmit} className="bg-gray-50 rounded-2xl p-8 shadow-lg">
                        {newsletterSuccess && (
                            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                ✓ Successfully subscribed! Check your email for confirmation.
                            </div>
                        )}
                        {newsletterError && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {newsletterError}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name *"
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name *"
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address *"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        />
                        <label className="flex items-start mb-4 text-sm text-gray-600">
                            <input type="checkbox" name="consent" required className="mt-1 mr-2" />
                            <span>I agree to receive updates and newsletters from DoGoods. You can unsubscribe at any time.</span>
                        </label>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#2CABE3] text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Subscribing...' : 'Subscribe to Newsletter'}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default ImpactStory;
