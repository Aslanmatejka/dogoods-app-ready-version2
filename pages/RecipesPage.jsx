import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';
import { useAuthContext } from '../utils/AuthContext';

function RecipesPage() {
    const { isAdmin } = useAuthContext();
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('impact_recipes')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecipes(data || []);
        } catch (error) {
            console.error('Error loading recipes:', error);
            reportError(error);
        } finally {
            setLoading(false);
        }
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&/#]+)/);
        return match ? match[1] : null;
    };

    const getThumbnail = (recipe) => {
        if (recipe.thumbnail_url) return recipe.thumbnail_url;
        const id = getYouTubeId(recipe.youtube_url);
        return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                @keyframes riseUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .rise-up { opacity: 0; animation: riseUp 0.6s ease-out forwards; }
            `}</style>

            {/* Admin Button */}
            {isAdmin && (
                <button
                    onClick={() => navigate('/admin/impact-content')}
                    className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-2xl hover:shadow-xl transition-all transform hover:scale-105"
                >
                    ✏️ Manage Content
                </button>
            )}

            {/* Hero */}
            <section className="bg-gradient-to-br from-red-50 to-orange-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            🍳 Community Recipes
                        </h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                            Delicious recipes from our community — learn to cook with rescued food and reduce waste in your kitchen.
                        </p>
                    </div>
                </div>
            </section>

            {/* Recipes Grid */}
            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {recipes.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">No recipes yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recipes.map((recipe, index) => {
                                const videoId = getYouTubeId(recipe.youtube_url);
                                const isPlaying = playingId === recipe.id;

                                return (
                                    <div
                                        key={recipe.id}
                                        className="rise-up bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* Video / Thumbnail */}
                                        <div className="relative aspect-video bg-gray-900">
                                            {isPlaying && videoId ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title={recipe.title}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full cursor-pointer group relative"
                                                    onClick={() => setPlayingId(recipe.id)}
                                                >
                                                    <img
                                                        src={getThumbnail(recipe)}
                                                        alt={recipe.title}
                                                        className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop'; }}
                                                    />
                                                    {/* Play button overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                                            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{recipe.title}</h3>
                                            {recipe.description && (
                                                <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">{recipe.description}</p>
                                            )}
                                            {recipe.created_at && (
                                                <p className="text-xs text-gray-400 mt-3">
                                                    {new Date(recipe.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Have a Recipe to Share?</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Got a great recipe that uses rescued food? We&apos;d love to feature it!
                    </p>
                    <a
                        href="/contact"
                        className="inline-block bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                    >
                        Submit Your Recipe
                    </a>
                </div>
            </section>
        </div>
    );
}

export default RecipesPage;
