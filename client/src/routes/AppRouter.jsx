import { Routes, Route } from "react-router-dom";
import Terms from "../components/Footer/Terms.jsx";
import QuestionAndAnswer from "../Pages/QuestionAndAnswer/QuestionAndAnswer.jsx";
import AskQuestion from "../Pages/Question/AskQuestion/AskQuestion.jsx";
import ForgotPassword from "../Pages/ForgotPassword/ForgotPassword.jsx";
import PageNotFound from "../Pages/PageNotFound/PageNotFound.jsx";
import PrivacyPolicy from "../Pages/PrivacyPolicy/PrivacyPolicy.jsx";
import Home from "../Pages/Home/Home.jsx";
import AuthLayout from "../Pages/AuthLayout/AuthLayout.jsx";
import HowItWorks from "../Pages/HowItWorks/HowItWorks.jsx";
import Chatbot from "../components/Chatbot/Chatbot.jsx";
import PrivateRoute from "./PrivateRoute.jsx"; // Import your PrivateRoute component
import PublicChatPage from "../Pages/PublicChatPage/PublicChatPage.jsx";
import UserProfile from "../Pages/UserProfile/UserProfile.jsx"; // Import UserProfile component
import ResetPassword from "../Pages/ForgotPassword/ResetPassword.jsx";
import VerifyEmail from "../Pages/SignUp/VerifyEmail.jsx";
function AppRouter() {
  return (
    <Routes>
      {/* Public Routes (accessible without login) */}
      <Route path="/auth" element={<AuthLayout />} />
      <Route path="/howitworks" element={<HowItWorks />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
      <Route path="*" element={<PageNotFound />} /> {/* Keep 404 last */}
      <Route path="/public-chat" element={<PublicChatPage />} />\
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      {/* Protected Routes (require login) */}
      {/* Wrap all routes that need authentication inside a PrivateRoute */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/ask" element={<AskQuestion />} />
        <Route path="/question/:questionId" element={<QuestionAndAnswer />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/profile/:userid" element={<UserProfile />} />
        {/* Add any other routes that should only be accessible when logged in here */}
      </Route>
    </Routes>
  );
}

export default AppRouter;
