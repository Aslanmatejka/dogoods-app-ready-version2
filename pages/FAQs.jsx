import React from 'react';
import { useNavigate } from 'react-router-dom';

function FAQs() {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = React.useState(null);

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    question: "What is the Do Good Store?",
                    answer: "The Do Good Store is a community food sharing platform operated by All Good Living Foundation. It connects food donors with families and individuals in need, reducing food waste while helping our community members access fresh, nutritious food."
                },
                {
                    question: "How do I create an account?",
                    answer: "Click the 'Sign Up' button in the header or footer. Fill in your name, email, password, and select your account type (Individual, Business, or Nonprofit). You'll receive a confirmation email to activate your account."
                },
                {
                    question: "Is there a cost to use the platform?",
                    answer: "No! The Do Good Store is completely free for both donors and recipients. Our mission is to eliminate barriers to food access in our community."
                }
            ]
        },
        {
            category: "Sharing Food",
            questions: [
                {
                    question: "What types of food can I donate?",
                    answer: "You can donate fresh produce, bakery items, dairy products, pantry staples, prepared meals, and more. All food must be safe for consumption, properly stored, and not past its expiration date."
                },
                {
                    question: "How do I list food for donation?",
                    answer: "Log in to your account, click 'Share Food' in the navigation menu, fill out the listing form with details about your food donation (title, description, quantity, category, expiration date), upload a photo, and submit. Your listing will be reviewed by our team before approval."
                },
                {
                    question: "How long does it take for my listing to be approved?",
                    answer: "Most listings are reviewed and approved within 24 hours. You'll receive an email notification once your listing is approved and visible to the community."
                },
                {
                    question: "Can businesses and restaurants donate?",
                    answer: "Absolutely! We encourage businesses, restaurants, grocery stores, and food services to donate surplus food. Create a business account to get started."
                }
            ]
        },
        {
            category: "Finding Food",
            questions: [
                {
                    question: "How do I claim available food?",
                    answer: "Browse available listings on the 'Find Food' page, click on an item you're interested in, and click the 'Claim Food' button. Fill out the claim form with your contact information and pickup preferences."
                },
                {
                    question: "What happens after I claim food?",
                    answer: "The donor will be notified of your claim and will contact you to arrange pickup details. You'll receive confirmation and coordination messages through the platform."
                },
                {
                    question: "Can I claim multiple items?",
                    answer: "Yes! You can claim as many items as you need. We encourage taking only what you can use to ensure food reaches as many families as possible."
                },
                {
                    question: "What if I can't pick up the food after claiming it?",
                    answer: "Please cancel your claim as soon as possible so others can claim the food. Contact the donor through the platform to let them know."
                }
            ]
        },
        {
            category: "Food Safety",
            questions: [
                {
                    question: "How do you ensure food safety?",
                    answer: "All listings are reviewed by our team. We provide guidelines for proper food storage, handling, and labeling. Donors must indicate if food requires refrigeration, freezing, or has specific allergen information."
                },
                {
                    question: "What should I do if I receive food that seems unsafe?",
                    answer: "Do not consume the food. Contact us immediately through the 'Report Issue' button or email info@allgoodlivingfoundation.org. Your safety is our top priority."
                },
                {
                    question: "Are dietary restrictions and allergens labeled?",
                    answer: "Yes! Donors can tag listings with dietary information (vegetarian, vegan, gluten-free, etc.) and list known allergens. Always verify with the donor if you have specific concerns."
                }
            ]
        },
        {
            category: "Account & Profile",
            questions: [
                {
                    question: "How do I update my profile information?",
                    answer: "Log in to your account, click on your profile icon or name in the header, select 'Profile Settings,' and update your information. Don't forget to save your changes."
                },
                {
                    question: "Can I change my account type?",
                    answer: "Yes, you can update your account type in your profile settings. Contact us if you need assistance with the change."
                },
                {
                    question: "I forgot my password. What should I do?",
                    answer: "Click 'Forgot Password' on the login page, enter your email address, and you'll receive a password reset link. Follow the instructions in the email to create a new password."
                },
                {
                    question: "How do I delete my account?",
                    answer: "Contact us at info@allgoodlivingfoundation.org to request account deletion. We'll process your request within 7 business days."
                }
            ]
        },
        {
            category: "Community & Impact",
            questions: [
                {
                    question: "Which communities do you serve?",
                    answer: "We primarily serve Alameda, Oakland, and surrounding Bay Area communities. Check the 'Communities' section to see active community food programs in your area."
                },
                {
                    question: "How can I track my impact?",
                    answer: "Your user dashboard displays your donation history, pounds of food shared, families helped, and overall impact score. We also share community-wide impact metrics on the homepage."
                },
                {
                    question: "Can I volunteer with All Good Living Foundation?",
                    answer: "Yes! Visit our volunteer page or contact us at info@allgoodlivingfoundation.org to learn about volunteer opportunities including food distribution events, community closets, and more."
                }
            ]
        },
        {
            category: "Technical Support",
            questions: [
                {
                    question: "The website isn't working properly. What should I do?",
                    answer: "Try refreshing your browser, clearing your cache, or using a different browser. If the issue persists, click the 'Feedback' button or contact us with details about the problem."
                },
                {
                    question: "Can I use the platform on my mobile device?",
                    answer: "Yes! The Do Good Store is fully responsive and works on smartphones, tablets, and desktop computers."
                },
                {
                    question: "How do I report a bug or suggest a feature?",
                    answer: "Click the 'Feedback' button at the bottom right of any page, select 'Bug Report' or 'Feature Request,' and describe the issue or suggestion. Our team reviews all feedback."
                }
            ]
        },
        {
            category: "Contact & Support",
            questions: [
                {
                    question: "How can I contact All Good Living Foundation?",
                    answer: "Email: info@allgoodlivingfoundation.org\nPhone: 510-522-6288\nAddress: 1900 Thau Way, Alameda, CA 94501\nYou can also use the chat widget or contact form on the website."
                },
                {
                    question: "What are your operating hours?",
                    answer: "Our platform is available 24/7 for browsing and claiming food. Our support team responds to inquiries Monday-Friday, 9 AM - 5 PM PST. Emergency issues are addressed outside these hours."
                },
                {
                    question: "Do you accept donations of other items besides food?",
                    answer: "Currently, our platform focuses on food sharing. However, All Good Living Foundation operates Community Closets that accept clothing, school supplies, and other essentials. Contact us to learn more about those programs."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16">
                <div className="container mx-auto px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 text-white hover:text-green-100 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-green-100 max-w-3xl">
                        Find answers to common questions about the Do Good Store and All Good Living Foundation
                    </p>
                </div>
            </div>

            {/* FAQs Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {faqs.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-1 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded"></span>
                                {category.category}
                            </h2>
                            
                            <div className="space-y-4">
                                {category.questions.map((faq, questionIndex) => {
                                    const globalIndex = `${categoryIndex}-${questionIndex}`;
                                    const isOpen = openIndex === globalIndex;
                                    
                                    return (
                                        <div
                                            key={questionIndex}
                                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                            <button
                                                onClick={() => toggleAccordion(globalIndex)}
                                                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-semibold text-gray-900 flex-1">
                                                    {faq.question}
                                                </span>
                                                <i
                                                    className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-green-600 transition-transform`}
                                                ></i>
                                            </button>
                                            
                                            {isOpen && (
                                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Still Have Questions Section */}
                    <div className="mt-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white text-center">
                        <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
                        <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                            Can't find what you're looking for? Our team is here to help!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="mailto:info@allgoodlivingfoundation.org"
                                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-envelope"></i>
                                Email Us
                            </a>
                            <a
                                href="tel:510-522-6288"
                                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-phone"></i>
                                Call Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FAQs;
