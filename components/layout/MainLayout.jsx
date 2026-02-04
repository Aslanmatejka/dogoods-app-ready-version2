import React from "react";
import Header from "../common/Header";
import Footer from "../common/Footer";
// import AssistantButton from "../assistant/AssistantButton";
// import AIAssistant from "../assistant/AIAssistant";
import UserChatWidget from "../common/UserChatWidget";


function MainLayout({ children }) {
    // const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);

    // const toggleAssistant = () => {
    //     setIsAssistantOpen(!isAssistantOpen);
    // };

    return (
        <div data-name="main-layout" className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-cyan-100">
            <Header/>
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md border border-cyan-100 p-6 md:p-10 transition-all duration-300">
                    {children}
                </div>
            </main>
            <Footer />

            {/* AI Assistant Button and Modal */}
            {/* <AssistantButton onClick={toggleAssistant} />
            {isAssistantOpen && (
                <AIAssistant
                    key="ai-assistant"
                    isOpen={isAssistantOpen}
                    onClose={() => setIsAssistantOpen(false)}
                />
            )} */}

            {/* User Chat Widget (for messaging admin) */}
            <UserChatWidget />
        </div>
    );
}


export default MainLayout;
