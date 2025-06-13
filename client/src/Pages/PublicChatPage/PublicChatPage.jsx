import React from "react";
import Layout from "../../Layout/Layout.jsx"; // Use your existing Layout
import PublicChat from "../PublicChat/PublicChat.jsx"; // Import the PublicChat component

function PublicChatPage() {
  return (
    <Layout>
      {/* You can add a div here for specific page-level styling if needed */}
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "auto" }}>
        {/* Potentially add a heading specific to this page if PublicChat's header is minimal */}
        <h1>Community Live Chat</h1>
        <PublicChat />
      </div>
    </Layout>
  );
}

export default PublicChatPage;
