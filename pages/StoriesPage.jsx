import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StoriesPage() {
    const navigate = useNavigate();

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">All Impact Stories</h1>
                    <p className="text-xl text-gray-600">
                        Real stories from real people making a difference in our communities
                    </p>
                </div>

                {/* Stories Grid */}
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Story 1 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop" 
                                alt="Community Impact" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Sarah's Story: From Volunteer to Champion</h3>
                                <p className="text-gray-600 mb-4">
                                    "I started as a volunteer driver, picking up surplus food from local restaurants. Now I coordinate our 
                                    entire network in the Bay Area. Seeing families receive fresh, nutritious meals—food that would have been 
                                    wasted—gives me purpose every single day. We're not just feeding people; we're building a community that cares."
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Sarah Martinez, Community Coordinator, Alameda</strong>
                                </p>
                            </div>
                        </div>

                        {/* Story 2 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop" 
                                alt="Food Distribution" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Restaurant Partnership: A Win-Win Solution</h3>
                                <p className="text-gray-600 mb-4">
                                    "As a restaurant owner, I used to feel terrible about food waste at the end of each day. DoGoods 
                                    transformed that guilt into impact. Now, instead of throwing away perfectly good food, I know it's helping 
                                    families in our neighborhood. The platform makes it effortless—I post what I have, and within an hour, it's 
                                    picked up and distributed."
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Michael Chen, Owner, Golden Wok Restaurant</strong>
                                </p>
                            </div>
                        </div>

                        {/* Story 3 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop" 
                                alt="Food Bank" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Feeding 500 Families During the Holidays</h3>
                                <p className="text-gray-600 mb-4">
                                    "DoGoods helped us feed over 500 families during the holidays. The AI routing meant we could distribute 
                                    fresh food within 2 hours of donation—something that was impossible before. Thanks to our network of 150+ 
                                    partners, we've prevented over 2 million pounds of food waste while providing nutritious meals to families who need them most."
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Director of Community Services, Alameda County Food Bank</strong>
                                </p>
                            </div>
                        </div>

                        {/* Story 4 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop" 
                                alt="Community" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Serving 10,000 People Monthly</h3>
                                <p className="text-gray-600 mb-4">
                                    Partnering with 45+ community centers across the Bay Area to provide fresh meals and groceries to families 
                                    in need. Our network ensures that nutritious food reaches those who need it most, creating lasting impact 
                                    in every neighborhood we serve.
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Community Centers Impact Report</strong>
                                </p>
                            </div>
                        </div>

                        {/* Story 5 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop" 
                                alt="Food Distribution" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">200+ Restaurant Partners</h3>
                                <p className="text-gray-600 mb-4">
                                    Working with restaurants and grocers across the region to rescue surplus food daily. Our AI routing 
                                    ensures food reaches recipients within 60 minutes of donation, maintaining freshness and quality while reducing waste.
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Restaurant Partnership Program</strong>
                                </p>
                            </div>
                        </div>

                        {/* Story 6 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop" 
                                alt="Impact" 
                                className="w-full h-64 object-cover" 
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Saving the Planet, One Meal at a Time</h3>
                                <p className="text-gray-600 mb-4">
                                    By preventing food waste, we've reduced over 1,200 tons of CO2 emissions and conserved resources 
                                    equivalent to 30 million gallons of water. Every meal saved is a step toward a more sustainable future for our communities.
                                </p>
                                <p className="text-sm text-gray-500 italic">
                                    <strong>— Environmental Impact Assessment</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center mt-12">
                        <button 
                            onClick={() => navigate('/share')} 
                            className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
                            Join Our Network
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StoriesPage;
