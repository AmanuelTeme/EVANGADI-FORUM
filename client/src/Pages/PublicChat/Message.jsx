// import React, { useState, useRef, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faThumbsUp,
//   faHeart,
//   faLaughSquint,
//   faFire,
//   faHandsClapping,
//   faPlus,
//   faTrashAlt,
//   faPencilAlt,
//   faDownload,
//   faTimes,
//   faFileAlt,
//   faExclamationCircle, // Added for deleted messages
// } from "@fortawesome/free-solid-svg-icons";
// import EmojiPicker from "emoji-picker-react";
// import Swal from "sweetalert2"; // For confirmations/alerts
// import styles from "./PublicChat.module.css"; // IMPORTANT: Import the styles module

// // Define common reaction emojis (ensure these match your backend logic)
// const COMMON_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉"];

// const Message = ({
//   message,
//   user,
//   onEdit,
//   onDelete,
//   onReact,
//   openImageModal,
// }) => {
//   // State for showing the reaction menu (mini palette)
//   const [showReactionMenu, setShowReactionMenu] = useState(false);
//   // State for showing the full emoji picker
//   const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);

//   const messageBubbleRef = useRef(null); // Ref to the message bubble for positioning reaction menu

//   // Determine if the message belongs to the current logged-in user
//   const isMyMessage = message.user_id === user?.userid;

//   // Determine if the message contains a file (image or other)
//   const isFileMessage = message.file_data && message.file_name;
//   // Determine if the file is an image (for special rendering)
//   const isImage =
//     isFileMessage &&
//     message.file_type &&
//     message.file_type.startsWith("image/");

//   // Check if the message is marked as deleted
//   const isDeleted = message.is_deleted;

//   // Format timestamp for display
//   const formatTimestamp = (timestamp) => {
//     const date = new Date(timestamp);
//     // Use Intl.DateTimeFormat for better localization and options
//     return new Intl.DateTimeFormat(undefined, {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true, // Example: Use 12-hour format
//     }).format(date);
//   };

//   // Helper to get user initial for avatar placeholder
//   const getUserInitial = (username) => {
//     return username ? username.charAt(0).toUpperCase() : "?";
//   };

//   // Toggle reaction menu visibility
//   const toggleReactionMenu = (e) => {
//     e.stopPropagation(); // Prevent event bubbling
//     if (isDeleted) return; // Cannot react to deleted messages
//     setShowReactionMenu((prev) => !prev);
//     setShowFullEmojiPicker(false); // Close full picker if mini menu is toggled
//   };

//   // Handle a reaction from the mini palette
//   const handleEmojiReaction = (emoji) => {
//     if (isDeleted) {
//       Swal.fire({
//         icon: "warning",
//         title: "Cannot React",
//         text: "You cannot react to a deleted message.",
//         toast: true,
//         position: "top-end",
//         showConfirmButton: false,
//         timer: 3000,
//       });
//       return;
//     }
//     onReact(message.message_id, emoji);
//     setShowReactionMenu(false); // Close mini menu after reacting
//     setShowFullEmojiPicker(false); // Close full picker as well
//   };

//   // Open the full emoji picker
//   const openFullPicker = (e) => {
//     e.stopPropagation(); // Prevent event bubbling
//     if (isDeleted) return;
//     setShowReactionMenu(false); // Close mini menu
//     setShowFullEmojiPicker(true);
//   };

//   // Handle emoji selection from the full picker
//   const onFullEmojiClick = (emojiObject) => {
//     if (isDeleted) return;
//     onReact(message.message_id, emojiObject.emoji);
//     setShowFullEmojiPicker(false); // Close full picker after reacting
//   };

//   // Close reaction menus if clicked outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       // Check if the click is outside the message bubble and the emoji picker itself
//       if (
//         messageBubbleRef.current &&
//         !messageBubbleRef.current.contains(event.target) &&
//         !event.target.closest(".EmojiPickerReact") // Check for the emoji picker's class name
//       ) {
//         setShowReactionMenu(false);
//         setShowFullEmojiPicker(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Function to download generic files
//   const downloadFile = (fileData, fileName) => {
//     try {
//       const link = document.createElement("a");
//       link.href = fileData;
//       link.download = fileName || "download";
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (error) {
//       console.error("Error during file download:", error);
//       Swal.fire({
//         icon: "error",
//         title: "Download Failed",
//         text: "Could not download the file.",
//         toast: true,
//         position: "top-end",
//         showConfirmButton: false,
//         timer: 3000,
//       });
//     }
//   };

//   return (
//     <article
//       className={`${styles.messageArticle} ${
//         isMyMessage ? styles.myMessageAlign : styles.otherMessageAlign
//       }`}
//     >
//       {/* Avatar */}
//       {message.avatar_url ? (
//         <img
//           src={message.avatar_url}
//           alt={`${message.username}'s avatar`}
//           className={styles.messageAvatar}
//           onError={(e) => {
//             e.target.onerror = null;
//             e.target.src = "https://placehold.co/44x44/ff6600/white?text=?"; // Adjusted placeholder size
//           }}
//         />
//       ) : (
//         <div className={styles.messageAvatarPlaceholder}>
//           {getUserInitial(message.username)}
//         </div>
//       )}

//       <div
//         className={`${styles.messageBubble} group ${
//           // Added group for hover effects in CSS
//           isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
//         } ${isDeleted ? styles.deletedMessage : ""}`}
//         ref={messageBubbleRef} // Attach ref to the message bubble
//       >
//         <span className={styles.messageUsername}>
//           {message.username || "Anonymous"}
//           {message.message_type === "private" && (
//             <span className={styles.privateTag}>Private</span>
//           )}
//         </span>

//         {/* Message Content (Text, Image, File) */}
//         {isDeleted ? (
//           <p className={styles.messageText}>
//             <FontAwesomeIcon icon={faExclamationCircle} /> Message deleted
//           </p>
//         ) : (
//           <>
//             {isImage && (
//               <img
//                 src={message.file_data}
//                 alt={message.file_name || "Sent image"}
//                 className={styles.messageImage}
//                 onClick={() =>
//                   openImageModal(
//                     message.file_data,
//                     message.file_name,
//                     message.file_type
//                   )
//                 }
//                 onError={(e) => {
//                   e.target.onerror = null;
//                   e.target.src =
//                     "https://placehold.co/200x150/eeeeee/gray?text=Image+Error";
//                 }}
//               />
//             )}
//             {!isImage && isFileMessage && (
//               <div className={styles.messageFile}>
//                 <FontAwesomeIcon icon={faFileAlt} className={styles.fileIcon} />
//                 <button
//                   onClick={() =>
//                     downloadFile(message.file_data, message.file_name)
//                   }
//                   className={styles.fileDownloadButton}
//                 >
//                   <span>{message.file_name}</span>
//                   <FontAwesomeIcon icon={faDownload} />
//                 </button>
//               </div>
//             )}
//             {message.message_text && (
//               <p className={styles.messageText}>{message.message_text}</p>
//             )}
//           </>
//         )}

//         <time className={styles.messageTimestamp} dateTime={message.created_at}>
//           {formatTimestamp(message.created_at)}
//           {message.edited_at && (
//             <span className={styles.editedTag}>(edited)</span>
//           )}
//         </time>

//         {/* Message Actions (React, Edit, Delete) - Visible on message bubble hover */}
//         {!isDeleted && ( // Actions are not available for deleted messages
//           <div className={styles.messageActions}>
//             {/* React Button */}
//             <button
//               onClick={toggleReactionMenu}
//               className={styles.reactButton}
//               title="React to message"
//             >
//               <FontAwesomeIcon icon={faPlus} />
//             </button>

//             {/* Edit Button (only for owner's text messages) */}
//             {isMyMessage && !isFileMessage && (
//               <button
//                 onClick={() => onEdit(message)}
//                 className={styles.editButton}
//                 title="Edit message"
//               >
//                 <FontAwesomeIcon icon={faPencilAlt} />
//               </button>
//             )}

//             {/* Delete Button (only for owner's messages) */}
//             {isMyMessage && (
//               <button
//                 onClick={() => onDelete(message.message_id)}
//                 className={styles.deleteButton}
//                 title="Delete message"
//               >
//                 <FontAwesomeIcon icon={faTrashAlt} />
//               </button>
//             )}
//           </div>
//         )}

//         {/* Reaction Mini Menu */}
//         {showReactionMenu && !isDeleted && (
//           <div className={styles.reactionMenu}>
//             {COMMON_REACTIONS.map((emoji) => (
//               <button
//                 key={emoji}
//                 onClick={(e) => handleEmojiReaction(emoji)}
//                 className={styles.reactionMenuItem}
//               >
//                 {emoji}
//               </button>
//             ))}
//             <button
//               onClick={openFullPicker}
//               className={`${styles.reactionMenuItem} ${styles.moreEmojisButton}`}
//               title="More emojis"
//             >
//               <FontAwesomeIcon icon={faPlus} />
//             </button>
//           </div>
//         )}

//         {/* Full Emoji Picker */}
//         {showFullEmojiPicker && !isDeleted && (
//           // Use a fixed position for the full picker with an overlay
//           <div
//             className={styles.reactionEmojiPickerOverlay}
//             onClick={() => setShowFullEmojiPicker(false)}
//           >
//             <div
//               className={styles.reactionEmojiPicker}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <EmojiPicker
//                 onEmojiClick={onFullEmojiClick}
//                 width="100%"
//                 height="100%"
//                 theme="light"
//                 emojiStyle="native"
//                 searchDisabled={false}
//                 skinTonesDisabled={false}
//               />
//             </div>
//           </div>
//         )}

//         {/* Display existing reactions */}
//         {message.reactions && message.reactions.length > 0 && !isDeleted && (
//           <div className={styles.reactionsContainer}>
//             {message.reactions.map((reaction, index) => (
//               <span
//                 key={index}
//                 className={`${styles.reactionBubble} ${
//                   reaction.userIds.includes(user?.userid)
//                     ? styles.userReacted
//                     : ""
//                 }`}
//                 onClick={() => handleEmojiReaction(reaction.emoji)}
//                 title={`Reacted by: ${reaction.usernames.join(", ")}`}
//               >
//                 <span className={styles.emoji}>{reaction.emoji}</span>{" "}
//                 <span className={styles.count}>{reaction.userIds.length}</span>
//               </span>
//             ))}
//           </div>
//         )}
//       </div>
//     </article>
//   );
// };

// export default Message;
