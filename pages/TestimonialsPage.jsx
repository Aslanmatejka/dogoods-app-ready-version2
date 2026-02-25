import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';

function TestimonialsPage() {
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadTestimonials();
    }, []);

    const loadTestimonials = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('impact_stories')
                .select('*')
                .eq('type', 'testimonial')
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;
            setTestimonials(data || []);
        } catch (error) {
            console.error('Error loading testimonials:', error);
            reportError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-12">
                    <button 
                        onClick={() => navigate('/impact-story')}
                        className="mb-6 flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Impact Story
                    </button>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Community Testimonials
                    </h1>
                    <p className="text-xl text-gray-600">
                        Real testimonials from real people making a difference in our communities
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : testimonials.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No testimonials yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {testimonials.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                                    <div className="text-4xl text-[#2CABE3] mb-4">&ldquo;</div>
                                    <p className="text-gray-600 leading-relaxed text-lg italic mb-6">
                                        {item.quote}
                                    </p>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        <strong>&mdash; {item.attribution}{item.organization && `, ${item.organization}`}</strong>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TestimonialsPage;
