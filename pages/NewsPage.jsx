import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

function NewsPage() {
    const { isAdmin } = useAuthContext();
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('impact_stories')
                .select('*')
                .eq('type', 'news')
                .eq('is_active', true)
                .order('display_order');

            if (error) {
                console.error('Error loading news:', error);
                reportError(error, { context: 'News page load' });
            }
            setNews(data || []);
        } catch (error) {
            console.error('Error loading news:', error);
            reportError(error, { context: 'News page load' });
        } finally {
            setLoading(false);
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
        <div className="min-h-screen bg-gray-50">
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
            <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
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
                            DoGoods News &amp; Updates
                        </h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                            Stay informed about our latest milestones, partnerships, and community impact in the fight against food waste.
                        </p>
                    </div>
                </div>
            </section>

            {/* News Articles */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {news.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">No news articles yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {news.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <div className="p-6">
                                        <span className="text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{item.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{item.quote || item.description}</p>
                                        {item.attribution && (
                                            <p className="text-sm text-gray-500 mt-4">— {item.attribution}{item.organization && `, ${item.organization}`}</p>
                                        )}
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
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Stay Connected</h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Want to be the first to hear about our latest news and updates?
                    </p>
                    <Link
                        to="/impact-story"
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
