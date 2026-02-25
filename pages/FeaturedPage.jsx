import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

function FeaturedPage() {
    const { isAdmin } = useAuthContext();
    const navigate = useNavigate();
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadFeatured();
    }, []);

    const loadFeatured = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('impact_stories')
                .select('*')
                .eq('type', 'featured')
                .eq('is_active', true)
                .order('display_order');

            if (error) {
                console.error('Error loading featured stories:', error);
                reportError(error, { context: 'Featured page load' });
            }
            setFeatured(data || []);
        } catch (error) {
            console.error('Error loading featured stories:', error);
            reportError(error, { context: 'Featured page load' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = (image, title, description) => {
        setModalImage({ image, title, description });
    };

    const closeModal = () => {
        setModalImage(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                .clickable-image {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .clickable-image:hover {
                    transform: scale(1.02);
                }
                .clickable-image::before {
                    content: '🔍 Click to view details';
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

            {/* Image Modal */}
            {modalImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div
                        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
                        <img
                            src={modalImage.image}
                            alt={modalImage.title}
                            className="w-full h-auto rounded-t-2xl"
                        />
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">{modalImage.title}</h2>
                            <p className="text-lg text-gray-700 leading-relaxed">{modalImage.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Manage Button */}
            {isAdmin && (
                <button
                    onClick={() => navigate('/admin/impact-content')}
                    className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-2xl hover:shadow-xl transition-all transform hover:scale-105"
                >
                    ✏️ Manage Content
                </button>
            )}

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-50 to-blue-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/impact-story')}
                        className="mb-6 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2 font-semibold"
                    >
                        <span>←</span>
                        <span>Back to Impact Story</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Featured Stories
                        </h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                            Highlighting the most impactful stories from our community — milestones, achievements, and moments that inspire.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Stories */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {featured.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">No featured stories yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {featured.map((story, index) => (
                                <div key={story.id} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                    {story.image_url && (
                                        <div
                                            className={`clickable-image ${index % 2 === 1 ? 'md:order-2' : ''}`}
                                            onClick={() => handleImageClick(story.image_url, story.title, story.quote || story.description)}
                                        >
                                            <img
                                                src={story.image_url}
                                                alt={story.title}
                                                className="rounded-2xl shadow-2xl w-full h-auto"
                                            />
                                        </div>
                                    )}
                                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">{story.title}</h2>
                                        <p className="text-lg text-gray-600 leading-relaxed mb-4">{story.quote || story.description}</p>
                                        {story.attribution && (
                                            <p className="text-gray-500">— {story.attribution}{story.organization && `, ${story.organization}`}</p>
                                        )}
                                        {story.stats && (
                                            <p className="text-gray-600 mt-4 font-medium">{story.stats}</p>
                                        )}
                                        <span className="text-sm text-gray-400 mt-4 block">
                                            {new Date(story.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Be Part of Our Story</h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Every meal shared, every pound of food saved — it all starts with you.
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
        </div>
    );
}

export default FeaturedPage;
