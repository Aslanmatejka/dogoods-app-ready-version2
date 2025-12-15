import { useNavigate } from "react-router-dom";
import FoodCard from "../components/food/FoodCard";
import Button from "../components/common/Button";
import CategoryCard from "../components/food/CategoryCard";
import Card from "../components/common/Card";
import ErrorBoundary from "../components/common/ErrorBoundary";
import HeroSlideshow from "../components/common/HeroSlideshow";
import { useFoodListings } from "../utils/hooks/useSupabase";
import { formatDate, reportError } from "../utils/helpers";
import { DonateVolunteerButtons } from "./CommunityPage";
import communities from '../utils/communities';
import { useImpact } from "../utils/hooks/useImpact";

function HomePage() {
    const navigate = useNavigate();
    const { listings: featuredListings } = useFoodListings({ status: 'approved', limit: 6 });
    const { impact, loading: impactLoading } = useImpact();
    
    try {
        const foodCategories = [
            {
                id: 'produce',
                title: 'Fruits and vegetables',
                description: 'all fruits and vegetables',
                image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                itemCount: 67
            },
            {
                id: 'bakery',
                title: 'Bakery',
                description: 'Bread, pastries, and baked goods',
                image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                itemCount: 23
            },
            {
                id: 'dairy',
                title: 'Dairy & Eggs',
                description: 'Milk, cheese, eggs, and more',
                image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                itemCount: 19
            },
            {
                id: 'pantry',
                title: 'Pantry Items',
                description: 'Non-perishable food items',
                image: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                itemCount: 34
            },
        ];

    // communities loaded from utils/communities.js

        const handleNavigation = (path) => {
            navigate(path);
        };

        return (
            <ErrorBoundary>
                <div data-name="home-page" role="main">
                    {/* Hero Section with Slideshow Background */}
                    <HeroSlideshow>
                        <section 
                            className="py-24"
                            aria-labelledby="hero-heading"
                        >
                            <div className="container mx-auto px-4">
                                <div className="max-w-3xl">
                                    <h1 
                                        id="hero-heading"
                                        className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg"
                                    >
                                        Share Food, Reduce Waste, Build Community
                                    </h1>
                                    <p className="text-xl mb-8 text-white drop-shadow-md">
                                        Join our movement to combat food waste and hunger through community-driven food sharing.
                                    </p>
                                    <div className="flex space-x-4">
                                        <Button 
                                            variant="secondary"
                                            onClick={() => handleNavigation('/share')}
                                            aria-label="Share food with the community"
                                        >
                                            Share Food
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => handleNavigation('/find')}
                                            aria-label="Find food in your area"
                                            className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-gray-900"
                                        >
                                            Find Food
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </HeroSlideshow>

                    {/* How It Works Schematic */}
                    <section
                        className="py-16 bg-gray-50"
                        aria-labelledby="how-it-works-schematic-heading"
                    >
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2
                                    id="how-it-works-schematic-heading"
                                    className="text-3xl font-bold text-gray-900 mb-4"
                                >
                                    How It Works
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Join our community in three simple steps
                                </p>
                            </div>

                            <div className="max-w-5xl mx-auto">
                                <div className="relative">
                                    {/* Process Flow Diagram */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                        {/* Step 1 */}
                                        <div className="relative">
                                            <div className="bg-white rounded-lg shadow-lg p-8 text-center h-full flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fas fa-search text-3xl text-green-600"></i>
                                                </div>
                                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                                                    1
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-gray-900">Find Food</h3>
                                                <p className="text-gray-600 mb-4">Browse available food items in your area or search for specific items you need, claim and pick up</p>
                                                <div className="mt-auto pt-4">
                                                    <div className="inline-block bg-green-50 text-green-700 text-sm px-4 py-2 rounded-full font-medium">
                                                        Browse Listings
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Arrow for desktop */}
                                            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                                <i className="fas fa-arrow-right text-4xl text-green-600"></i>
                                            </div>
                                            {/* Arrow for mobile */}
                                            <div className="md:hidden flex justify-center my-4">
                                                <i className="fas fa-arrow-down text-4xl text-green-600"></i>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="relative">
                                            <div className="bg-white rounded-lg shadow-lg p-8 text-center h-full flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fas fa-comments text-3xl text-blue-600"></i>
                                                </div>
                                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                                                    2
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-gray-900">Connect</h3>
                                                <p className="text-gray-600 mb-4">share and claim food through active communities, contact according to active communities and arrange pickups with </p>
                                                <div className="mt-auto pt-4">
                                                    <div className="inline-block bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full font-medium">
                                                        Arrange Pickup
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Arrow for desktop */}
                                            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                                <i className="fas fa-arrow-right text-4xl text-blue-600"></i>
                                            </div>
                                            {/* Arrow for mobile */}
                                            <div className="md:hidden flex justify-center my-4">
                                                <i className="fas fa-arrow-down text-4xl text-blue-600"></i>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="relative">
                                            <div className="bg-white rounded-lg shadow-lg p-8 text-center h-full flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fas fa-handshake text-3xl text-orange-600"></i>
                                                </div>
                                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                                                    3
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-gray-900">Share & Save</h3>
                                                <p className="text-gray-600 mb-4">share food, and feel in information and wait for confirmation, for it to listed for claim</p>
                                                <div className="mt-auto pt-4">
                                                    <div className="inline-block bg-orange-50 text-orange-700 text-sm px-4 py-2 rounded-full font-medium">
                                                        Make Impact
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call to Action */}
                                    <div className="text-center mt-12">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => handleNavigation('/find')}
                                            aria-label="Start sharing food now"
                                        >
                                            Get Started Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Categories Section */}
                    <section 
                        className="py-16 bg-white"
                        aria-labelledby="categories-heading"
                    >
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 
                                    id="categories-heading"
                                    className="text-3xl font-bold text-gray-900 mb-4"
                                >
                                    Browse by Category
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Discover food available for sharing in your area
                                </p>
                            </div>

                            <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                                role="list"
                                aria-label="Food categories"
                            >
                                {foodCategories.map((category, index) => (
                                    <div key={index} role="listitem">
                                        <CategoryCard
                                            category={category}
                                            onClick={() => handleNavigation(`/find?category=${category.id}`)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-8">
                                <Button 
                                    variant="secondary"
                                    onClick={() => handleNavigation('/find')}
                                    className="text-green-600 font-semibold hover:text-green-700 flex items-center mx-auto"
                                    aria-label="View all food categories"
                                >
                                    View all categories
                                    <i className="fas fa-arrow-right ml-2" aria-hidden="true"></i>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Communities Section */}
                    <section 
                        className="py-16 bg-gray-50"
                        aria-labelledby="communities-heading"
                    >
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 
                                    id="communities-heading"
                                    className="text-3xl font-bold text-gray-900 mb-4"
                                >
                                    Active Communities
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Join local food sharing groups in your area
                                </p>
                            </div>

                            <div 
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto"
                                role="list"
                                aria-label="Active communities"
                            >
                                {communities.map((community) => (
                                    <Card
                                        key={community.id}
                                        className="overflow-hidden"
                                        role="listitem"
                                        hoverable={true}
                                        onClick={() => handleNavigation(`/community/${community.id}`)}
                                    >
                                        <img
                                            src={community.image}
                                            alt={`${community.name} community`}
                                            className="w-full h-64 object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="text-base font-semibold truncate mb-2">{community.name}</h3>
                                            <div className="flex items-start text-xs text-gray-700 mb-1.5">
                                                <i className="fas fa-map-marker-alt w-4 text-center mr-2 mt-0.5 text-gray-500"></i>
                                                <span>{community.location}</span>
                                            </div>
                                            <div className="flex items-start text-xs text-gray-700 mb-1.5">
                                                <i className="fas fa-user w-4 text-center mr-2 mt-0.5 text-gray-500"></i>
                                                <span>Contact: {community.contact}</span>
                                            </div>
                                            <div className="flex items-start text-xs text-gray-700 mb-2">
                                                <i className="fas fa-clock w-4 text-center mr-2 mt-0.5 text-gray-500"></i>
                                                <span>Hours: {community.hours}</span>
                                            </div>
                                            <div className="mt-3 pt-2 border-t">
                                                <a href={`tel:${community.phone}`} className="text-sm text-blue-600 hover:underline">
                                                    {community.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <div className="text-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleNavigation('/community')}
                                    aria-label="View all food sharing communities"
                                >
                                    View all communities
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Support the Community Section */}
                    <section className="mt-10">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold mb-4">Support the Community</h2>
                            <DonateVolunteerButtons />
                        </div>
                    </section>

                    {/* Impact Stats Section */}
                    <section
                        className="py-16 bg-white"
                        aria-labelledby="impact-heading"
                    >
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2
                                    id="impact-heading"
                                    className="text-3xl font-bold text-gray-900 mb-4"
                                >
                                    Our Community Impact
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Together, we're making a real difference
                                </p>
                            </div>

                            {impactLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-green-600 mb-2">
                                                {Math.round(impact.foodSavedKg * 2.20462).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Pounds of Food Saved from Waste</div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-green-600 mb-2">
                                                {Math.round(impact.foodSavedKg * 2.20462).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Pounds of Food Provided</div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-green-600 mb-2">
                                                {impact.peopleHelped.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">People Helped</div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                                {Math.round(impact.partnerOrganizations * 0.15).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Schools We Serve</div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                                {impact.partnerOrganizations.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Non-Profits We Help</div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-bold text-purple-600 mb-2">
                                                {impact.totalMeals.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Meals Provided</div>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Call to Action */}
                    <section
                        className="py-16 bg-green-600 text-white"
                        aria-labelledby="cta-heading"
                    >
                        <div className="container mx-auto px-4 text-center">
                            <h2 
                                id="cta-heading"
                                className="text-3xl font-bold mb-4"
                            >
                                Ready to start sharing?
                            </h2>
                            <p className="text-xl mb-8">Join our community today and make a difference</p>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => handleNavigation('/signup')}
                                aria-label="Sign up for food sharing community"
                            >
                                Sign Up Now
                            </Button>
                        </div>
                    </section>
                </div>
            </ErrorBoundary>
        );
    } catch (error) {
        console.error('HomePage error:', error);
        reportError(error);
        return (
            <div className="text-center py-12" role="alert">
                <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4" aria-hidden="true"></i>
                <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-4">We&apos;re sorry, but there was an error loading this page.</p>
                <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </Button>
            </div>
        );
    }
}

export default HomePage;
