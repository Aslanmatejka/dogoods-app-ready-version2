import React from 'react';
import { useImpact } from '../utils/hooks/useImpact';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

function ImpactStory() {
    const { impact, loading } = useImpact();
    const navigate = useNavigate();

    const impactStats = [
        {
            icon: '🍽️',
            label: 'Meals Provided',
            value: impact.totalMeals?.toLocaleString() || '0',
            description: 'Nutritious meals shared with those in need',
            color: 'from-green-400 to-green-600'
        },
        {
            icon: '🥗',
            label: 'Food Saved',
            value: `${(impact.foodSavedKg || 0).toLocaleString()} kg`,
            description: 'Fresh food rescued from going to waste',
            color: 'from-blue-400 to-blue-600'
        },
        {
            icon: '👥',
            label: 'People Helped',
            value: impact.peopleHelped?.toLocaleString() || '0',
            description: 'Community members received support',
            color: 'from-purple-400 to-purple-600'
        },
        {
            icon: '♻️',
            label: 'Waste Reduced',
            value: `${(impact.wasteReduced || 0).toLocaleString()} kg`,
            description: 'Food waste diverted from landfills',
            color: 'from-orange-400 to-orange-600'
        },
        {
            icon: '🌍',
            label: 'CO₂ Saved',
            value: `${(impact.co2Saved || 0).toLocaleString()} kg`,
            description: 'Carbon emissions prevented',
            color: 'from-teal-400 to-teal-600'
        },
        {
            icon: '🤝',
            label: 'Volunteer Hours',
            value: (impact.volunteerHours || 0).toLocaleString(),
            description: 'Hours donated by amazing volunteers',
            color: 'from-pink-400 to-pink-600'
        }
    ];

    const stories = [
        {
            title: 'Community Garden Harvest',
            date: 'November 2025',
            image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
            description: 'Local volunteers harvested over 200kg of fresh vegetables from our community garden, distributing them to 50 families in need.',
            impact: '200kg of fresh produce, 50 families served'
        },
        {
            title: 'Restaurant Partnership',
            date: 'October 2025',
            image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
            description: 'Partnered with 5 local restaurants to redistribute surplus food, preventing 150kg of quality meals from going to waste.',
            impact: '150kg saved, 300+ meals provided'
        },
        {
            title: 'Food Drive Success',
            date: 'September 2025',
            image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
            description: 'Community members donated non-perishable items, creating care packages for 100 households facing food insecurity.',
            impact: '100 households supported, 500kg collected'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading impact data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="impact-story-page">
            {/* Hero Section */}
            <section className="relative py-16 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-3xl mb-12 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Our Impact Story
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                        Together, we're building a community where no food goes to waste and no one goes hungry
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Button 
                            variant="secondary"
                            onClick={() => navigate('/share')}
                            className="bg-white text-green-700 hover:bg-gray-100"
                        >
                            Share Food
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => navigate('/community')}
                            className="border-white text-white hover:bg-white hover:text-green-700"
                        >
                            Join Community
                        </Button>
                    </div>
                </div>
            </section>

            {/* Impact Statistics */}
            <section className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Impact by the Numbers
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Real results from our community's commitment to reducing food waste and fighting hunger
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {impactStats.map((stat, index) => (
                        <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                            <div className="relative">
                                <div className="text-5xl mb-3">{stat.icon}</div>
                                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                                <div className="text-lg font-semibold text-gray-800 mb-1">{stat.label}</div>
                                <p className="text-sm text-gray-600">{stat.description}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Success Stories */}
            <section className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Community Success Stories
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Real stories from our community members making a difference
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stories.map((story, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div className="aspect-w-16 aspect-h-9 mb-4">
                                <img 
                                    src={story.image} 
                                    alt={story.title}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            </div>
                            <div>
                                <div className="text-sm text-green-600 font-semibold mb-2">{story.date}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{story.title}</h3>
                                <p className="text-gray-600 mb-4">{story.description}</p>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-sm font-semibold text-green-800">Impact:</div>
                                    <div className="text-sm text-green-700">{story.impact}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Be Part of the Story
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Every contribution matters. Join our community today and help us create more impact stories.
                </p>
                <div className="flex justify-center space-x-4">
                    <Button 
                        variant="primary"
                        onClick={() => navigate('/share')}
                    >
                        Share Food
                    </Button>
                    <Button 
                        variant="secondary"
                        onClick={() => navigate('/find')}
                    >
                        Find Food
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => navigate('/signup')}
                    >
                        Join Now
                    </Button>
                </div>
            </section>
        </div>
    );
}

export default ImpactStory;
