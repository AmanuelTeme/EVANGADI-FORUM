import { useEffect, useState, useContext } from "react";
import styles from "./questions.module.css";
import { axiosInstance } from "../../utility/axios.js";
import QuestionCard from "../../components/QuestionCard/QuestionCard.jsx";
import Loader from "../../components/Loader/Loader.jsx";
import { UserState } from "../../App.jsx";

function Question() {
  const [questions, setQuestions] = useState([]); // Store all questions
  const [loading, setLoading] = useState(false); // Loader state
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const questionsPerPage = 5; // Number of questions per page

  const { user } = useContext(UserState);

  // Fetch questions from API
  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/questions")
      .then((res) => {
        // --- DEBUG STEP 2.1: Log the raw API response ---
        console.log("Raw API Response:", res.data);
        setQuestions(res.data.message); // Set questions from API response
        // --- DEBUG STEP 2.2: Log the questions array after setting state ---
        console.log("Questions State after fetch:", res.data.message);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching questions:", error); // Debug: Log any fetch errors
        setLoading(false);
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter questions based on search query
  const filteredQuestions = questions.filter((question) => {
    // --- DEBUG STEP 3.1: Add a check for malformed question objects ---
    if (
      !question ||
      typeof question.title !== "string" ||
      typeof question.description !== "string"
    ) {
      console.warn("Skipping malformed question object in filter:", question);
      return false; // Don't include malformed objects in filter
    }

    const titleMatches = question.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const descriptionMatches = question.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // --- DEBUG STEP 3.2: Log match status for each question (uncomment if needed) ---
    // console.log(
    //   `Question: "${question.title}" | Search: "${searchQuery}" | Title Match: ${titleMatches} | Description Match: ${descriptionMatches}`
    // );

    return titleMatches || descriptionMatches;
  });

  // --- DEBUG STEP 4: Log filtered questions count and reset page on search change ---
  useEffect(() => {
    console.log("Number of Filtered Questions:", filteredQuestions.length);
    // Reset to first page whenever the search query changes to ensure results are visible
    setCurrentPage(1);
  }, [searchQuery, questions]); // Re-run when searchQuery or initial questions change

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage; // Index of the last question
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage; // Index of the first question
  const currentQuestions = filteredQuestions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  ); // Get the current page's questions

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage); // Total pages calculation

  // Handlers for "Previous" and "Next" buttons
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1); // Go to previous page
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1); // Go to next page
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.search_question}>
        {/* Search Input with Icon */}
        <div className={styles.search_input_wrapper}>
          {" "}
          {/* Using wrapper for icon positioning */}
          <input
            type="text"
            placeholder="Search for a question"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // --- DEBUG STEP 5: Log the search query as it changes ---
              console.log("Search Query (from input):", e.target.value);
            }}
          />
          {/* Search Icon (SVG) */}
          {/* <svg
            className={styles.search_icon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.313 0 6 2.687 6 6s-2.687 6-6 6-6-2.687-6-6 2.687-6 6-6z" />
          </svg> */}
        </div>
      </div>
      <hr />
      <h1 className={styles.title}>Questions</h1>

      {/* Display loader when loading */}
      {loading ? (
        <Loader />
      ) : filteredQuestions.length === 0 && searchQuery === "" ? ( // No results AND no search query
        <div
          style={{
            display: "flex",
            marginTop: "60px",
            fontSize: "25px",
            color: "var(--primary-color)",
            marginBottom: "200px",
            justifyContent: "center",
          }}
        >
          <p>No Questions Available</p>{" "}
          {/* Initial state when no questions fetched */}
        </div>
      ) : filteredQuestions.length === 0 && searchQuery !== "" ? ( // No results WITH a search query
        <div
          style={{
            display: "flex",
            marginTop: "60px",
            fontSize: "25px",
            color: "var(--primary-color)",
            marginBottom: "200px",
            justifyContent: "center",
          }}
        >
          <p>No Questions Found for "{searchQuery}"</p>{" "}
          {/* When search yields no results */}
        </div>
      ) : (
        <>
          {/* Display questions for the current page */}
          {currentQuestions.map((question) => (
            <QuestionCard
              key={question.questionid}
              id={question.questionid}
              userName={question.username}
              questionTitle={question.title} // Ensure this prop matches your data
              description={question.description} // Ensure this prop matches your data
              question_date={question.createdAt}
            />
          ))}

          {/* Pagination controls */}
          <div className={styles.pagination}>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1} // Disable if on first page
              style={{ marginRight: "10px", padding: "10px" }}
            >
              Previous
            </button>

            {/* Page information */}
            <span>
              Page {currentPage} of {totalPages}
            </span>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages} // Disable if on last page
              style={{ marginLeft: "10px", padding: "10px" }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Question;
